import asyncio, json, os, sys, tempfile

os.environ["OPD_DB"] = tempfile.mktemp(suffix=".sqlite3")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import httpx
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
    hidden_gone = all(s["judge_id"] != w2["judge_id"] for s in snap["scores"])
    check("removed judge drops out of scores", hidden_gone)

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

print()
print("ALL PASS" if ok else "FAILURES ABOVE")
sys.exit(0 if ok else 1)
