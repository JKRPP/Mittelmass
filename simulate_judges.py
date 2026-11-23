#!/usr/bin/env python3
"""Dev tool, not deployed: fills a room with N fake judges submitting uniformly random scores over the HTTP API

Usage:
  python simulate_judges.py --judges 8
  python simulate_judges.py --judges 5 --code AB3D --url http://192.168.0.157:8000
  python simulate_judges.py --judges 10 --incomplete 0.3 --seed 42
"""

import argparse
import json
import random
import string
import sys
import urllib.error
import urllib.request

# Mirrors the rubric constants in static/app.js; keep in sync or this script posts keys the app never reads
CRITERIA = ["spr", "auf", "kon", "sac", "urt"]
# SPEAKERS has 16 fixed slots: 4 openings (0-3), 10 free-speaker slots (4-13), 2 Schlussreden (14-15)
FIRST_FREE_SLOT = 4
CLOSING_SLOTS = [14, 15]
TEAMCATS = [
    ("eroef", 25),
    ("ergae", 25),
    ("schlu", 25),
    ("zreden", 30),
    ("zfrag", 30),
    ("zrufe", 15),
    ("ueber", 50),
]
NUM_TEAMS = 2


def http(method, url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except json.JSONDecodeError:
            return e.code, {}


def client_id():
    return "sim_" + "".join(
        random.choices(string.ascii_lowercase + string.digits, k=16)
    )


def speech_slots(free_speakers):
    """SPEAKERS slots shown by a room with `free_speakers` free speeches"""
    return (
        list(range(FIRST_FREE_SLOT))
        + list(range(FIRST_FREE_SLOT, FIRST_FREE_SLOT + free_speakers))
        + CLOSING_SLOTS
    )


def make_patches(incomplete_frac, slots):
    """Random scores for every field of one judge, leaving an `incomplete_frac` fraction unscored"""
    fields = []
    for s in slots:
        for crit in CRITERIA:
            fields.append((f"s{s}", crit, random.randint(0, 20)))
    for t in range(NUM_TEAMS):
        for key, mx in TEAMCATS:
            fields.append((f"t{t}", key, random.randint(0, mx)))

    if incomplete_frac > 0:
        keep = max(0, round(len(fields) * (1 - incomplete_frac)))
        fields = random.sample(fields, keep)

    return [
        {"target": t, "criterion": c, "points": p, "seq": i + 1}
        for i, (t, c, p) in enumerate(fields)
    ]


def main():
    ap = argparse.ArgumentParser(
        description="Populate an OPD room with fake judges and random scores."
    )
    ap.add_argument("--url", default="http://127.0.0.1:8000", help="Server base URL")
    ap.add_argument(
        "--judges",
        type=int,
        default=2,
        help="Number of judges to simulate, including the chair when creating a new room",
    )
    ap.add_argument(
        "--code", help="Join an existing room instead of creating a new one"
    )
    ap.add_argument(
        "--motion",
        default="Dies ist eine Testrunde",
        help="Motion, only used when creating a room",
    )
    ap.add_argument(
        "--incomplete",
        type=float,
        default=0.0,
        metavar="FRACTION",
        help="Fraction (0-1) of each judge's fields to leave unscored, to simulate a round still in progress. Default: 0 (everyone fully scores).",
    )
    ap.add_argument("--seed", type=int, help="Random seed, for a reproducible run")
    ap.add_argument(
        "--batch-size",
        type=int,
        default=200,
        help="Patches per POST (the server caps a single request at 200)",
    )
    args = ap.parse_args()

    if args.seed is not None:
        random.seed(args.seed)
    if not 0.0 <= args.incomplete <= 1.0:
        sys.exit("--incomplete must be between 0 and 1")

    base = args.url.rstrip("/")
    code = args.code
    judges = []
    remaining = args.judges

    if not code:
        status, body = http(
            "POST",
            base + "/api/rooms",
            {"name": "Sim Chair", "client_id": client_id(), "motion": args.motion},
        )
        if status != 200:
            sys.exit(f"could not create room: {status} {body}")
        code = body["code"]
        judges.append(body)
        print(f"created room {code} (chair: {body['name']})")
        remaining -= 1  # The chair counts as one of --judges

    for i in range(remaining):
        status, body = http(
            "POST",
            f"{base}/api/rooms/{code}/join",
            {"name": f"Sim Judge {i + 1}", "client_id": client_id()},
        )
        if status != 200:
            print(f"  join failed for judge {i + 1}: {status} {body}", file=sys.stderr)
            continue
        judges.append(body)

    print(f"room {code}: {len(judges)} judges joined")
    if not judges:
        sys.exit("no judge could join - nothing to score")

    # Score exactly the speeches this room shows, since the chair may have changed its free-speaker count
    status, snap = http(
        "GET", f"{base}/api/rooms/{code}/snapshot?token={judges[0]['token']}"
    )
    if status != 200:
        sys.exit(f"could not read room {code}: {status} {snap}")
    slots = speech_slots(snap["free_speakers"])
    print(f"room has {snap['free_speakers']} free speeches -> scoring slots {slots}")

    for j in judges:
        patches = make_patches(args.incomplete, slots)
        for i in range(0, len(patches), args.batch_size):
            batch = patches[i : i + args.batch_size]
            status, res = http(
                "POST",
                f"{base}/api/rooms/{code}/patches?token={j['token']}",
                {"patches": batch},
            )
            if status != 200:
                print(
                    f"  patch batch failed for {j['name']}: {status} {res}",
                    file=sys.stderr,
                )
        print(f"  {j['name']}: submitted {len(patches)} scores")

    print()
    print(f"Room code:   {code}")
    print(f"Share link:  {base}/r/{code}")
    if judges and not args.code:
        print(f"Chair token: {judges[0]['token']}  (only needed for direct API calls)")


if __name__ == "__main__":
    main()
