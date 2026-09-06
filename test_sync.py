import os, sys, tempfile, time

# A fresh DB per run, in a directory that gets cleaned up with it.
_tmpdir = tempfile.TemporaryDirectory()
os.environ["OPD_DB"] = os.path.join(_tmpdir.name, "test.sqlite3")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
import server

ok = True


def check(label, cond, extra=""):
    global ok
    print(
        ("  PASS  " if cond else "  FAIL  ")
        + label
        + (("  " + str(extra)) if extra else "")
    )
    if not cond:
        ok = False


with TestClient(server.app) as c:
    # Chair creates room
    r = c.post("/api/rooms", json={"name": "Anna", "client_id": "client-anna-0001"})
    chair = r.json()
    check(
        "room created",
        r.status_code == 200 and len(chair["code"]) == 4,
        chair.get("code"),
    )
    check("creator is chair", chair["is_chair"] is True)
    check(
        "code alphabet is unambiguous",
        not set(chair["code"]) & set("OI01L"),
        chair["code"],
    )
    code = chair["code"]

    # Wing joins
    w1 = c.post(
        f"/api/rooms/{code}/join", json={"name": "Ben", "client_id": "client-ben-0002"}
    ).json()
    w2 = c.post(
        f"/api/rooms/{code}/join", json={"name": "Cem", "client_id": "client-cem-0003"}
    ).json()
    check("wing joined as non-chair", w1["is_chair"] is False)
    check("wings get distinct tokens", w1["token"] != w2["token"])

    # Same device reenters
    again = c.post(
        f"/api/rooms/{code}/join", json={"name": "Ben", "client_id": "client-ben-0002"}
    ).json()
    check(
        "rejoin resumes identity",
        again["judge_id"] == w1["judge_id"] and again["resumed"],
    )

    # Duplicate name resolves
    dup = c.post(
        f"/api/rooms/{code}/join", json={"name": "Ben", "client_id": "client-ben-XXXX"}
    ).json()
    check(
        "same name, different device = different judge",
        dup["judge_id"] != w1["judge_id"],
    )

    # Test Patches
    def patch(tok, items):
        return c.post(
            f"/api/rooms/{code}/patches?token={tok}", json={"patches": items}
        ).json()

    res = patch(
        chair["token"],
        [
            {"target": "s0", "criterion": "spr", "points": 12, "seq": 1},
            {"target": "s0", "criterion": "auf", "points": 11, "seq": 2},
        ],
    )
    check("chair patches applied", res["applied"] == 2, res)

    patch(w1["token"], [{"target": "s0", "criterion": "spr", "points": 15, "seq": 1}])
    patch(w2["token"], [{"target": "s0", "criterion": "spr", "points": 9, "seq": 1}])

    # stale patch from before a reconnect must be dropped
    res = patch(
        w1["token"], [{"target": "s0", "criterion": "spr", "points": 3, "seq": 1}]
    )
    check("stale seq rejected", res["applied"] == 0 and res["stale"] == 1, res)

    res = patch(
        w1["token"], [{"target": "s0", "criterion": "spr", "points": 14, "seq": 2}]
    )
    check("newer seq accepted", res["applied"] == 1)

    # Undo of a first-ever entry clears the cell instead of writing a 0 that
    # every other judge would count as a real score.
    patch(w2["token"], [{"target": "s1", "criterion": "auf", "points": 7, "seq": 5}])
    res = patch(
        w2["token"], [{"target": "s1", "criterion": "auf", "points": None, "seq": 6}]
    )
    check("null points applied as a delete", res["applied"] == 1, res)
    snap = c.get(f"/api/rooms/{code}/snapshot?token={chair['token']}").json()
    check(
        "cleared cell is gone from the snapshot",
        not any(
            s["judge_id"] == w2["judge_id"]
            and s["target"] == "s1"
            and s["criterion"] == "auf"
            for s in snap["scores"]
        ),
    )
    w2_filled = next(j["filled"] for j in snap["judges"] if j["id"] == w2["judge_id"])
    check("cleared cell no longer counts as filled", w2_filled == 1, w2_filled)

    # Snapshot can be recovered
    snap = c.get(f"/api/rooms/{code}/snapshot?token={chair['token']}").json()
    vals = {
        s["judge_id"]: s["points"]
        for s in snap["scores"]
        if s["target"] == "s0" and s["criterion"] == "spr"
    }
    check("snapshot has the three judges who scored s0/spr", len(vals) == 3, vals)
    check("last write wins per judge", vals[w1["judge_id"]] == 14)
    check("judge list complete", len(snap["judges"]) == 4)
    check("filled counts present", snap["judges"][0]["filled"] == 2)

    # spread the chair would show: 12 (Anna), 14 (Ben), 9 (Cem)
    nums = sorted(vals.values())
    check("spread computable from snapshot", max(nums) - min(nums) == 14 - 9, nums)

    # Authorization
    r = c.get(f"/api/rooms/{code}/snapshot?token=nonsense")
    check("bad token rejected", r.status_code == 401)
    r = c.post(
        f"/api/rooms/{code}/judges/{w2['judge_id']}/hidden"
        f"?hidden=true&token={w1['token']}"
    )
    check("wing cannot remove a judge", r.status_code == 403)
    r = c.post(
        f"/api/rooms/{code}/judges/{w2['judge_id']}/hidden"
        f"?hidden=true&token={chair['token']}"
    )
    check("chair can remove a judge", r.status_code == 200)
    snap = c.get(f"/api/rooms/{code}/snapshot?token={chair['token']}").json()
    hidden_kept = any(s["judge_id"] == w2["judge_id"] for s in snap["scores"])
    check("hidden judge's scores still sent (client aggregates exclude them)", hidden_kept)
    hidden_flagged = any(
        j["id"] == w2["judge_id"] and j["hidden"] for j in snap["judges"]
    )
    check("hidden judge flagged in judges list", hidden_flagged)

    # cross-room token must not work
    other = c.post(
        "/api/rooms", json={"name": "Dora", "client_id": "client-dora-9"}
    ).json()
    r = c.get(f"/api/rooms/{other['code']}/snapshot?token={chair['token']}")
    check("token is room-scoped", r.status_code == 401)

    # Validation
    r = c.post(
        f"/api/rooms/{code}/patches?token={chair['token']}",
        json={
            "patches": [{"target": "s0", "criterion": "spr", "points": -5, "seq": 9}]
        },
    )
    check("negative points rejected", r.status_code == 422)
    r = c.post(
        f"/api/rooms/ZZZZ/join", json={"name": "X", "client_id": "client-x-00001"}
    )
    check("unknown room 404s", r.status_code == 404)

    # Websocket fan out
    with c.websocket_connect(f"/ws/{code}?token={w1['token']}") as sock:
        sock.receive_json()  # presence broadcast on connect
        patch(
            chair["token"],
            [{"target": "s3", "criterion": "urt", "points": 8, "seq": 20}],
        )
        msg = None
        for _ in range(5):
            m = sock.receive_json()
            if m.get("type") == "patches":
                msg = m
                break
        check(
            "wing receives chair's patch over ws",
            msg is not None and msg["patches"][0]["points"] == 8,
            msg,
        )

    from starlette.websockets import WebSocketDisconnect

    refused = False
    try:
        with c.websocket_connect(f"/ws/{code}?token=bogus"):
            pass
    except WebSocketDisconnect:
        refused = True
    check("websocket refuses a bogus token", refused)

    # Debate timer: any judge can start it, it broadcasts to everyone, and
    # pause/resume/reset behave server-side like the other room settings.
    def timer_action(tok, body):
        return c.post(f"/api/rooms/{code}/timer?token={tok}", json=body)

    with c.websocket_connect(f"/ws/{code}?token={w1['token']}") as sock:
        sock.receive_json()  # presence broadcast on connect
        r = timer_action(w1["token"], {"action": "start", "type": "ffr"})
        check("wing can start the timer", r.status_code == 200, r.text)
        started = r.json()["timer"]
        check(
            "start sets ffr duration (3:30)",
            started["duration_ms"] == 210_000,
            started,
        )
        check("start is running", started["status"] == "running")

        msg = None
        for _ in range(5):
            m = sock.receive_json()
            if m.get("type") == "timer":
                msg = m
                break
        check(
            "timer start is broadcast over ws",
            msg is not None and msg["timer"]["type"] == "ffr",
            msg,
        )

    r = timer_action(chair["token"], {"action": "pause"})
    check("chair can pause a wing-started timer", r.status_code == 200, r.text)
    paused = r.json()["timer"]
    check(
        "pause banks elapsed time and clears started_at",
        paused["status"] == "paused"
        and paused["elapsed_ms"] > 0
        and paused["started_at"] is None,
        paused,
    )
    r = timer_action(chair["token"], {"action": "pause"})
    check("pausing an already-paused timer is rejected", r.status_code == 400)

    r = timer_action(chair["token"], {"action": "adjust", "delta_ms": 5000})
    check(
        "adjust +5s while paused increases banked elapsed by 5s",
        r.status_code == 200 and r.json()["timer"]["elapsed_ms"] == paused["elapsed_ms"] + 5000,
        r.text,
    )
    r = timer_action(chair["token"], {"action": "adjust", "delta_ms": -60_000})
    check(
        "adjust clamps paused elapsed at 0, never negative",
        r.status_code == 200 and r.json()["timer"]["elapsed_ms"] == 0,
        r.text,
    )

    r = timer_action(chair["token"], {"action": "resume"})
    check("resume restarts the running clock", r.status_code == 200 and r.json()["timer"]["status"] == "running")
    running_before = r.json()["timer"]

    r = timer_action(chair["token"], {"action": "adjust", "delta_ms": 5000})
    running_after = r.json()["timer"]
    check(
        "adjust +5s while running moves started_at 5s earlier",
        running_after["status"] == "running"
        and abs((running_before["started_at"] - running_after["started_at"]) - 5.0) < 0.5,
        (running_before, running_after),
    )
    r = timer_action(chair["token"], {"action": "adjust", "delta_ms": -60_000})
    check(
        "adjust clamps a running timer instead of going negative",
        r.status_code == 200 and r.json()["timer"]["status"] == "running",
        r.text,
    )

    r = timer_action(chair["token"], {"action": "reset"})
    reset = r.json()["timer"]
    check(
        "reset zeroes elapsed but keeps the last type",
        reset["status"] == "idle" and reset["elapsed_ms"] == 0 and reset["type"] == "ffr",
        reset,
    )

    snap = c.get(f"/api/rooms/{code}/snapshot?token={chair['token']}").json()
    check("snapshot carries timer state for late joiners", snap["timer"]["type"] == "ffr", snap["timer"])

    # Jurierdiskussion is a room-level deliberation clock, not a speech.
    r = timer_action(chair["token"], {"action": "start", "type": "discussion"})
    check(
        "discussion timer starts with a 20-minute nominal duration",
        r.status_code == 200 and r.json()["timer"]["duration_ms"] == 20 * 60 * 1000,
        r.text,
    )

    # updated_at is what lets a client tell a stale snapshot from its own
    # newer (possibly offline) action - it has to move on every action.
    before = r.json()["timer"]["updated_at"]
    r = timer_action(chair["token"], {"action": "pause"})
    check(
        "each timer action advances updated_at",
        r.status_code == 200 and r.json()["timer"]["updated_at"] > before,
        (before, r.text),
    )

    # Rate limiter: enforces its cap, and prunes keys that have gone quiet
    # instead of keeping one entry per address ever seen.
    lim = server.SlidingWindowLimiter(max_hits=2, window_seconds=0.2)
    check(
        "limiter allows up to max_hits then blocks",
        lim.allow("a") and lim.allow("a") and not lim.allow("a"),
    )
    check("limiter is per key", lim.allow("b"))
    time.sleep(0.25)
    check("window expiry lets a blocked key through again", lim.allow("a"))
    check("sweep dropped the key that went quiet", "b" not in lim.hits, lim.hits)

print()
print("ALL PASS" if ok else "FAILURES ABOVE")
sys.exit(0 if ok else 1)
