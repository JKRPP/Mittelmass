"""
OPD Jurierbogen — sync backend.

Design notes that matter:

* Scores are written over plain HTTP POST, not over the websocket. A POST with
  retry survives a dead socket; a socket send does not. The websocket is used
  only to *receive* other people's changes.
* /snapshot is the recovery primitive. A client that has been away — backgrounded,
  offline, asleep — never tries to replay missed messages. It refetches the whole
  room. At this data size that is a few kilobytes and it cannot drift.
* Every judge owns their own cells, so last-write-wins per (judge, target,
  criterion) is correct. `seq` is a per-judge counter that lets the server drop
  patches that arrive out of order after a reconnect.
"""

import json
import os
import secrets
import sqlite3
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

DB_PATH = os.environ.get("OPD_DB", "opd.sqlite3")
ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(ROOT, "static")

# No O/0, no I/1/L. Room codes get read aloud across a lecture hall.
ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679"

# Rooms are never deleted otherwise, so the db would grow forever. Judges/scores/
# deductions/exclusions cascade off `rooms`, so evicting a room cleans up everything.
MAX_ROOMS = 5000

SCHEMA = """
CREATE TABLE IF NOT EXISTS rooms (
  code       TEXT PRIMARY KEY,
  motion     TEXT NOT NULL DEFAULT '',
  created_at REAL NOT NULL,
  closed_at  REAL
);
CREATE TABLE IF NOT EXISTS judges (
  id           TEXT PRIMARY KEY,
  room_code    TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  client_id    TEXT NOT NULL,
  token        TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_chair     INTEGER NOT NULL DEFAULT 0,
  hidden       INTEGER NOT NULL DEFAULT 0,
  joined_at    REAL NOT NULL,
  UNIQUE (room_code, client_id)
);
CREATE TABLE IF NOT EXISTS scores (
  judge_id   TEXT NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  target     TEXT NOT NULL,
  criterion  TEXT NOT NULL,
  points     INTEGER NOT NULL,
  seq        INTEGER NOT NULL,
  updated_at REAL NOT NULL,
  PRIMARY KEY (judge_id, target, criterion)
);
CREATE TABLE IF NOT EXISTS deductions (
  room_code   TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  speaker_idx INTEGER NOT NULL,
  level       TEXT NOT NULL DEFAULT '',
  updated_at  REAL NOT NULL,
  PRIMARY KEY (room_code, speaker_idx)
);
CREATE TABLE IF NOT EXISTS exclusions (
  judge_id   TEXT NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  target     TEXT NOT NULL,
  updated_at REAL NOT NULL,
  PRIMARY KEY (judge_id, target)
);
CREATE INDEX IF NOT EXISTS idx_judges_room ON judges(room_code);
"""


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=5.0)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA foreign_keys=ON")
    return con


@asynccontextmanager
async def lifespan(app: FastAPI):
    con = db()
    con.executescript(SCHEMA)
    con.commit()
    con.close()
    yield


app = FastAPI(title="OPD Jurierbogen", lifespan=lifespan)


# Websockets


class Hub:
    """Room code -> live sockets. Presence is derived from this, not stored."""

    def __init__(self) -> None:
        self.rooms: dict[str, dict[WebSocket, str]] = {}

    def add(self, code: str, ws: WebSocket, judge_id: str) -> None:
        self.rooms.setdefault(code, {})[ws] = judge_id

    def remove(self, code: str, ws: WebSocket) -> None:
        room = self.rooms.get(code)
        if room:
            room.pop(ws, None)
            if not room:
                self.rooms.pop(code, None)

    def present(self, code: str) -> set[str]:
        return set(self.rooms.get(code, {}).values())

    async def broadcast(
        self, code: str, msg: dict, skip: Optional[WebSocket] = None
    ) -> None:
        payload = json.dumps(msg)
        dead = []
        for ws in list(self.rooms.get(code, {})):
            if ws is skip:
                continue
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove(code, ws)


hub = Hub()


# Helper functions


def new_code(con: sqlite3.Connection) -> str:
    for _ in range(50):
        code = "".join(secrets.choice(ALPHABET) for _ in range(4))
        if not con.execute("SELECT 1 FROM rooms WHERE code=?", (code,)).fetchone():
            return code
    raise HTTPException(500, "could not allocate a room code")


def evict_oldest_rooms(con: sqlite3.Connection) -> None:
    """Keep at most MAX_ROOMS around; the oldest ones age out first. Cheap: this
    only runs when a room is created, never on a timer."""
    (count,) = con.execute("SELECT COUNT(*) FROM rooms").fetchone()
    if count <= MAX_ROOMS:
        return
    con.execute(
        """DELETE FROM rooms WHERE code IN (
             SELECT code FROM rooms ORDER BY created_at ASC LIMIT ?
           )""",
        (count - MAX_ROOMS,),
    )


def auth(con: sqlite3.Connection, code: str, token: str) -> sqlite3.Row:
    row = con.execute(
        "SELECT * FROM judges WHERE token=? AND room_code=?", (token, code)
    ).fetchone()
    if not row:
        raise HTTPException(401, "unknown token for this room")
    return row


def judge_list(con: sqlite3.Connection, code: str) -> list[dict]:
    online = hub.present(code)
    rows = con.execute(
        """SELECT j.id, j.display_name, j.is_chair, j.hidden, j.joined_at,
                  (SELECT COUNT(*) FROM scores s WHERE s.judge_id = j.id) AS filled
           FROM judges j WHERE j.room_code=? ORDER BY j.joined_at""",
        (code,),
    ).fetchall()
    return [
        {
            "id": r["id"],
            "name": r["display_name"],
            "is_chair": bool(r["is_chair"]),
            "hidden": bool(r["hidden"]),
            "filled": r["filled"],
            "online": r["id"] in online,
        }
        for r in rows
    ]


# Models


class CreateRoom(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    client_id: str = Field(min_length=8, max_length=64)
    motion: str = Field(default="", max_length=400)


class JoinRoom(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    client_id: str = Field(min_length=8, max_length=64)


class Patch(BaseModel):
    target: str = Field(min_length=1, max_length=32)
    criterion: str = Field(min_length=1, max_length=32)
    points: int = Field(ge=0, le=500)
    seq: int = Field(ge=0)


class PatchBatch(BaseModel):
    patches: list[Patch] = Field(default_factory=list, max_length=200)


class DeductionSet(BaseModel):
    speaker_idx: int = Field(ge=0, le=63)
    level: str = Field(default="", max_length=8)


class ExclusionSet(BaseModel):
    target: str = Field(min_length=1, max_length=32)
    excluded: bool = True


# Routes


@app.post("/api/rooms")
async def create_room(body: CreateRoom):
    con = db()
    try:
        code = new_code(con)
        now = time.time()
        con.execute(
            "INSERT INTO rooms (code, motion, created_at) VALUES (?,?,?)",
            (code, body.motion.strip(), now),
        )
        jid, token = secrets.token_urlsafe(9), secrets.token_urlsafe(24)
        con.execute(
            """INSERT INTO judges (id, room_code, client_id, token, display_name,
                                   is_chair, joined_at) VALUES (?,?,?,?,?,1,?)""",
            (jid, code, body.client_id, token, body.name.strip(), now),
        )
        evict_oldest_rooms(con)
        con.commit()
        return {
            "code": code,
            "token": token,
            "judge_id": jid,
            "name": body.name.strip(),
            "is_chair": True,
            "motion": body.motion.strip(),
        }
    finally:
        con.close()


@app.post("/api/rooms/{code}/join")
async def join_room(code: str, body: JoinRoom):
    code = code.upper()
    con = db()
    try:
        room = con.execute("SELECT * FROM rooms WHERE code=?", (code,)).fetchone()
        if not room:
            raise HTTPException(404, "room not found")
        if room["closed_at"]:
            raise HTTPException(410, "room closed")

        # Same device rejoining: hand back the existing identity rather than
        # creating a duplicate judge. This is what makes a browser crash cheap.
        existing = con.execute(
            "SELECT * FROM judges WHERE room_code=? AND client_id=?",
            (code, body.client_id),
        ).fetchone()
        if existing:
            con.execute(
                "UPDATE judges SET display_name=?, hidden=0 WHERE id=?",
                (body.name.strip(), existing["id"]),
            )
            con.commit()
            out = {
                "code": code,
                "token": existing["token"],
                "judge_id": existing["id"],
                "name": body.name.strip(),
                "is_chair": bool(existing["is_chair"]),
                "motion": room["motion"],
                "resumed": True,
            }
        else:
            jid, token = secrets.token_urlsafe(9), secrets.token_urlsafe(24)
            con.execute(
                """INSERT INTO judges (id, room_code, client_id, token, display_name,
                                       is_chair, joined_at) VALUES (?,?,?,?,?,0,?)""",
                (jid, code, body.client_id, token, body.name.strip(), time.time()),
            )
            con.commit()
            out = {
                "code": code,
                "token": token,
                "judge_id": jid,
                "name": body.name.strip(),
                "is_chair": False,
                "motion": room["motion"],
                "resumed": False,
            }
        await hub.broadcast(code, {"type": "judges", "judges": judge_list(con, code)})
        return out
    finally:
        con.close()


@app.get("/api/rooms/{code}/snapshot")
async def snapshot(code: str, token: str = Query(...)):
    code = code.upper()
    con = db()
    try:
        me = auth(con, code, token)
        room = con.execute("SELECT * FROM rooms WHERE code=?", (code,)).fetchone()
        rows = con.execute(
            """SELECT s.judge_id, s.target, s.criterion, s.points, s.seq
               FROM scores s JOIN judges j ON j.id = s.judge_id
               WHERE j.room_code=? AND j.hidden=0""",
            (code,),
        ).fetchall()
        deds = con.execute(
            "SELECT speaker_idx, level FROM deductions WHERE room_code=?", (code,)
        ).fetchall()
        excl = con.execute(
            """SELECT e.judge_id, e.target FROM exclusions e
               JOIN judges j ON j.id = e.judge_id WHERE j.room_code=?""",
            (code,),
        ).fetchall()
        return {
            "code": code,
            "motion": room["motion"],
            "closed": bool(room["closed_at"]),
            "me": {
                "judge_id": me["id"],
                "name": me["display_name"],
                "is_chair": bool(me["is_chair"]),
            },
            "judges": judge_list(con, code),
            "scores": [dict(r) for r in rows],
            "deductions": [dict(r) for r in deds],
            "exclusions": [dict(r) for r in excl],
            "server_time": time.time(),
        }
    finally:
        con.close()


@app.post("/api/rooms/{code}/patches")
async def apply_patches(code: str, body: PatchBatch, token: str = Query(...)):
    code = code.upper()
    con = db()
    try:
        me = auth(con, code, token)
        now = time.time()
        applied, stale = [], 0
        for p in body.patches:
            cur = con.execute(
                "SELECT seq FROM scores WHERE judge_id=? AND target=? AND criterion=?",
                (me["id"], p.target, p.criterion),
            ).fetchone()
            if cur and cur["seq"] >= p.seq:
                stale += 1  # a late arrival from before a reconnect
                continue
            con.execute(
                """INSERT INTO scores (judge_id, target, criterion, points, seq, updated_at)
                   VALUES (?,?,?,?,?,?)
                   ON CONFLICT(judge_id, target, criterion)
                   DO UPDATE SET points=excluded.points, seq=excluded.seq,
                                 updated_at=excluded.updated_at""",
                (me["id"], p.target, p.criterion, p.points, p.seq, now),
            )
            applied.append(p)
        con.commit()

        if applied:
            await hub.broadcast(
                code,
                {
                    "type": "patches",
                    "judge_id": me["id"],
                    "patches": [p.model_dump() for p in applied],
                },
            )
        return {"applied": len(applied), "stale": stale, "server_time": now}
    finally:
        con.close()


@app.post("/api/rooms/{code}/judges/{judge_id}/hidden")
async def set_hidden(
    code: str, judge_id: str, hidden: bool = Query(True), token: str = Query(...)
):
    code = code.upper()
    con = db()
    try:
        me = auth(con, code, token)
        if not me["is_chair"]:
            raise HTTPException(403, "only the chair can do that")
        if judge_id == me["id"]:
            raise HTTPException(400, "the chair cannot hide themselves")
        con.execute(
            "UPDATE judges SET hidden=? WHERE id=? AND room_code=?",
            (1 if hidden else 0, judge_id, code),
        )
        con.commit()
        await hub.broadcast(code, {"type": "judges", "judges": judge_list(con, code)})
        return {"ok": True}
    finally:
        con.close()


@app.post("/api/rooms/{code}/deductions")
async def set_deduction(code: str, body: DeductionSet, token: str = Query(...)):
    code = code.upper()
    if body.level not in ("", "small", "big"):
        raise HTTPException(400, "level must be '', 'small' or 'big'")
    con = db()
    try:
        me = auth(con, code, token)
        if not me["is_chair"]:
            raise HTTPException(403, "only the chair can set deductions")
        now = time.time()
        con.execute(
            """INSERT INTO deductions (room_code, speaker_idx, level, updated_at)
               VALUES (?,?,?,?)
               ON CONFLICT(room_code, speaker_idx)
               DO UPDATE SET level=excluded.level, updated_at=excluded.updated_at""",
            (code, body.speaker_idx, body.level, now),
        )
        con.commit()
        await hub.broadcast(
            code,
            {
                "type": "deductions",
                "speaker_idx": body.speaker_idx,
                "level": body.level,
            },
        )
        return {"ok": True}
    finally:
        con.close()


@app.post("/api/rooms/{code}/exclusions")
async def set_exclusion(code: str, body: ExclusionSet, token: str = Query(...)):
    code = code.upper()
    con = db()
    try:
        me = auth(con, code, token)
        now = time.time()
        if body.excluded:
            con.execute(
                """INSERT INTO exclusions (judge_id, target, updated_at) VALUES (?,?,?)
                   ON CONFLICT(judge_id, target) DO UPDATE SET updated_at=excluded.updated_at""",
                (me["id"], body.target, now),
            )
        else:
            con.execute(
                "DELETE FROM exclusions WHERE judge_id=? AND target=?",
                (me["id"], body.target),
            )
        con.commit()
        await hub.broadcast(
            code,
            {
                "type": "exclusions",
                "judge_id": me["id"],
                "target": body.target,
                "excluded": body.excluded,
            },
        )
        return {"ok": True}
    finally:
        con.close()


@app.post("/api/rooms/{code}/close")
async def close_room(code: str, token: str = Query(...)):
    code = code.upper()
    con = db()
    try:
        me = auth(con, code, token)
        if not me["is_chair"]:
            raise HTTPException(403, "only the chair can close the room")
        con.execute("UPDATE rooms SET closed_at=? WHERE code=?", (time.time(), code))
        con.commit()
        await hub.broadcast(code, {"type": "closed"})
        return {"ok": True}
    finally:
        con.close()


@app.websocket("/ws/{code}")
async def ws_endpoint(ws: WebSocket, code: str, token: str = Query(...)):
    code = code.upper()
    con = db()
    try:
        row = con.execute(
            "SELECT * FROM judges WHERE token=? AND room_code=?", (token, code)
        ).fetchone()
    finally:
        con.close()
    if not row:
        await ws.close(code=4401)
        return

    await ws.accept()
    hub.add(code, ws, row["id"])
    con = db()
    try:
        await hub.broadcast(code, {"type": "judges", "judges": judge_list(con, code)})
    finally:
        con.close()

    try:
        while True:
            # Inbound is only keepalive. All writes go through POST /patches so
            # that a half-dead socket can never silently swallow a score.
            msg = await ws.receive_text()
            if msg == "ping":
                await ws.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        hub.remove(code, ws)
        con = db()
        try:
            await hub.broadcast(
                code, {"type": "judges", "judges": judge_list(con, code)}
            )
        finally:
            con.close()


@app.get("/healthz")
async def healthz():
    return {"ok": True}


app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
@app.get("/r/{code}")
async def index(code: str = ""):
    return FileResponse(os.path.join(STATIC, "index.html"))
