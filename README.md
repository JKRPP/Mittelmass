# OPD Mittelmass — self-hosted judging app

Rooms with share links, per-judge scoresheets, and a chair view that surfaces
disagreement. FastAPI + SQLite on the server, one static HTML file on the client.

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
3. Wings open the link, enter their name, and are in.
4. Everyone judges on their own sheet. The chair judges too.
5. After the round the chair opens **Vorsitz** to run the discussion.

## The offline design

This is the part that matters at a real tournament, and it is why the client is
plain HTML rather than a server-rendered framework.

**Nothing in the input path touches the network.** Every tap writes to
`localStorage` and re-renders locally. Scores compute in the browser. A judge
with no signal at all has a fully working scoresheet.

**Writes go over HTTP POST, not the websocket.** A POST with retry survives a
half-dead socket; a socket send does not. The websocket only *delivers* other
people's changes.

**The outbound queue is keyed by cell, not by tap.** Editing the same criterion
twenty times while offline leaves one queued entry, so an hour disconnected
costs one entry per cell rather than one per tap.

**Recovery is a full refetch, never a replay.** `GET /snapshot` returns the whole
room. A client coming back from twenty minutes in a timing app does not try to
work out what it missed — it just asks for everything. The whole room is a few
kilobytes.

**Everything that suggests "we're back" triggers the same routine.**
`visibilitychange`, `online`, `pageshow`, `focus`, and a 20-second heartbeat all
call `resume()`: reconnect, flush the queue, refetch, re-acquire the wake lock.
iOS Safari kills websockets in backgrounded tabs, so the chair switching to a
timing app for seven minutes is the expected case, not an error case.

**`seq` is a per-judge counter.** The server drops any patch whose seq is not
greater than what it already stored, which kills duplicates from a reconnect.
Since no judge ever writes another judge's cells, last-write-wins per
`(judge, target, criterion)` is correct and no merge logic is needed.

## Identity

Judges are keyed on a client-generated UUID in `localStorage`, not on the name
they type. Same device rejoining gets its identity and scores back. Two judges
called Ben are two judges. The room code is the only access control — anyone
with the code is in the room. The chair can remove someone who joined the wrong
room.

## Data model

```
rooms   (code PK, motion, created_at, closed_at)
judges  (id PK, room_code, client_id, token, display_name, is_chair, hidden, joined_at)
scores  (judge_id, target, criterion, points, seq, updated_at,
         PRIMARY KEY (judge_id, target, criterion))
```

`target` is `s0`–`s8` for speakers and `t0`/`t1` for teams. `criterion` is a
rubric key (`spr`, `zfrag`, …) or `abz` for deductions. The chair view is a
`GROUP BY target, criterion` — nothing more.

## Rubric

Everything format-specific is in `RUBRIC`-style constants at the top of the
`<script>` in `static/index.html`: speakers, criteria, team categories, the
Notenskala, and the Umrechnungstabelle from Jurierbogen V15.1. A rubric revision
is an edit to those constants.

Points are stored; grades are derived. Team categories accept any value in their
full range, with the grade label recomputed from the number.

## Known limits

- **Round setup is manual.** No draw, no speaker assignment, no cross-room tab.
  Importing from tab software is the obvious later step.
- **SQLite calls run inline in async handlers.** Could become an issue if the
  app is too widely used.
