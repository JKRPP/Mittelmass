# OPD Mittelmass: An offline compatible OPD judging web app

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker&logoColor=white)

A judging app for OPD (Offene Parlamentarische Debatte) rounds: share links,
per-judge scoresheets, and a chair view that surfaces disagreement between
judges. FastAPI + SQLite on the server, one static HTML/JS/CSS client — no
build step, no framework.

## Run it

```bash
./run.sh                       # http://localhost:8000
```

Or with Docker:

```bash
docker build -t opd .
docker run -p 8000:8000 -v opd-data:/data opd
```

Tests:

```bash
pip install httpx
python3 test_sync.py
```

## Serve it over HTTPS

Not optional. `navigator.wakeLock` requires a secure context, so on plain HTTP
judges' phones will sleep mid-speech. `localhost` counts as secure for dev.

For a venue box on the local network, put Caddy in front:

```
jurier.example.org {
    reverse_proxy localhost:8000
}
```

Caddy handles the certificate and proxies websockets without extra config.

## How a round runs

1. The chair opens the site, enters their name, taps **Raum erstellen**.
2. They get a four-character code and a link at `/r/CODE`.
3. Wings and trainees (same access, just excluded from the average) open
   the link, enter their name, and are in.
4. Everyone judges on their own sheet.
5. After the round the chair opens the **Chair** tab to run the discussion —
   wings see the same view, read-only, labeled **Spreads**, once the chair
   opts to share it.

On a desktop-width screen the same room gets a wider chrome instead of the
mobile tab bar: a chair-only **Dashboard** (spread overview, ballot
comparison, judge management), plus **Einzelreden**/**Teampunkte** (score
entry with per-criterion notes) and **Komplette Wertung** (a dense, all-in-
one editable grid) available to every judge. The
chair can also open the Dashboard itself to wings, minus the ballot-detail
column. All of it writes through the same `write()`/sync path as mobile.

## The offline design

The app is constructed to remain reliable, even if offline or connection is
unsteady (improving from Mittelmaß 1.0)

**No online requirement for single users.** Every tap writes to
`localStorage` and re-renders locally. Scores compute in the browser. A judge
with no signal at all has a fully working scoresheet.

**Stability on reconnection** `GET /snapshot` returns the whole
room. Makes connection stable when one client reconnects after being offline
(f.e. when using their device for Debatekeeper)

**Stability for raceing updates** Updates to any judges score are marked in
sequence, ensuring correct values even when single updates arrive late or
are dropped.

## Identity

Judges are keyed on a client-generated UUID in `localStorage`, ensuring
double names don't overwrite each others scores.

## Data model

```
rooms       (code PK, motion, spread_open, created_at, closed_at)
judges      (id PK, room_code, client_id, token, display_name, is_chair, hidden, joined_at)
scores      (judge_id, target, criterion, points, seq, updated_at,
             PRIMARY KEY (judge_id, target, criterion))
deductions  (room_code, speaker_idx, level, updated_at, PRIMARY KEY (room_code, speaker_idx))
exclusions  (judge_id, target, updated_at, PRIMARY KEY (judge_id, target))
```

`target` is `s0`–`s8` for speakers and `t0`/`t1` for teams. `criterion` is a
rubric key (`spr`, `zfrag`, …). Deductions and exclusions each have their
own table. The chair view is a `GROUP BY target, criterion`.

## Rubric

Everything format-specific is in `RUBRIC`-style constants at the top of
`static/app.js`: speakers, criteria, team categories, the Notenskala, and the
Umrechnungstabelle from the OPD adjudication sheet. A rubric revision is an edit to
those constants. Points are stored, translation to grades is calculated locally.

## Known limits

- **Round setup is manual.** No draw, no speaker assignment, no cross-room tab.
  Future work could automatically generate these from Opentab.
- **Ballot export is one-way and manual.** The desktop Dashboard can copy a
  ballot to the clipboard, and a bookmarklet (dragged in once) fills the
  matching fields on the tabbing site's own entry page. This is not ideal as
  it does not work on mobile.
- **SQLite calls run inline in async handlers.** Could become an issue if the
  app is too widely used.
