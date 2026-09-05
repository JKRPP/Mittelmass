# OPD Mittelmass: An offline compatible OPD judging web app

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker&logoColor=white)
[![Android release](https://github.com/JKRPP/Mittelmass/actions/workflows/android-release.yml/badge.svg)](https://github.com/JKRPP/Mittelmass/actions/workflows/android-release.yml)
[![Latest release](https://img.shields.io/github/v/release/JKRPP/Mittelmass)](https://github.com/JKRPP/Mittelmass/releases/latest)

A judging app for OPD (Offene Parlamentarische Debatte) rounds: share links,
per-judge scoresheets, and a chair view that surfaces disagreement between
judges. FastAPI + SQLite on the server, one static HTML/JS/CSS client.

## User perspective

Debates are judged in accordance with the [OPD Rules](https://www.streitkultur.net/debattieren/opd-service/),
in which points are given by several adjudicators to all elements of a debate
across a large number of categories. One judge is designated chair and
moderates the discussion. In the end, scores from all judges are averaged
to obtain the debates result.

### Basic procedure

1. The chair opens the site, enters their name, taps **Raum erstellen**.
2. They get a four-character code and a link at `/r/CODE`.
3. Wings and trainees (same access, just excluded from the average) open
   the link, enter their name, and are in.
4. Everyone judges on their own sheet.
5. After the round the chair opens the **Chair** tab to run the discussion —
   wings see the same view, read-only, labeled **Spreads**, once the chair
   opts to share it.
6. Judges can adjust their points if the discussion brings them to reevaluate
7. After a final result is obtained, the chair sees the result and can export
  it to the tabbing software (only on desktop via the bookmarklet currently)

### Mobile version

Mobile users get a fast number-entry layout for rapid entry and comparisson
of scores, consisting of four tabs:

- **Reden**: Entry of individual speakers points using a school-grade layouted
number pad. Chairs can give deductions via buttons only available to them.

- **Team**: Entry of team points using the same layouted number pad. For fine
adjustment between grade levels, plus / minus buttons are available.

- **Übersicht**: A table giving the judge an overview over their individual
scores. Indicates if a speaker has recieved a deduction from a chair and
gives each teams total.

- **Chair**: A view for the chair to see the averaged result of the debate.
Speeches and team point categories are shown ordered by highest to lowest
spread. Tapping an individual speech or category shows its breakdown by
judge and category. Also includes controls to make judges trainees or
show / hide the spreads view.

- **Spreads**: Scaled down version of the chair view for wings and trainees,
does not show chair controls. View is disabled by default and can be enabled
by the chair.

### Desktop version

Desktop users use their keyboard to input data and get additional views and
functionality through their wider screen. Score and note entry can be done
entirely from the keyboard; a few secondary controls (deductions,
exclusions, the per-score +1/-1 nudge buttons) remain click-only.

The desktop app consists of four
screens that the user can switch through using the chrome bar on top, `alt`
+`1,2,3,4` to switch to a view directly or `pgup` / `pgdown` to cycle to the
previous/next tab:

- **Einzelreden**: One view for each individual speech, users can take notes
for each indivdual speaker category and give points. Notes are not synced to
the server and only saved in the users local storage. Users can switch to
notes for interactions from the opposing side quickly using `alt`+ `I`. Users
can switch between speeches by using either the arrow buttons on top or `alt` + `,` (previous) / `alt` + `.` (next speech).
- **Teampunkte**: A single view for both teams' team points with space for
notes. If a user swapped into interaction note-taking using `alt` + `I`, the
same shortcut can be used to switch back to the speech the user had just opened.
- **Komplette Wertung**: A table of all points accross the 59 categories. Users
can rapidly enter all their scores using the `tab` key on their keyboard. Chairs
can additionally click the dot labelled "Ab" to cycle between no deduction, small
deduction and big deduction for each speaker.
- **Dashboard**: An overview for the chair to moderate the adjudication discussion.
Shows a column of the average score and spread for each speech and team point category
on the left, a column of the highest individual category spreads on the right and a large
column in the middle in which any speech or team point category selected on either column
can be inspected, showing each score from every judge. On the bottom, the complete ballot
as to be filled out and submitted to the tournament organizers can be seen live. Chairs can
unlock the dashboard view (minus the right column) for all other judges using
a button in the top chrome.

The desktop version currently offers a bookmarklet to automatically export and
fill in the ballot in the Opentab software.

## Basic design

### Offline first-approach

The app is constructed to remain reliable, even if offline or connection is
unsteady (improving from Mittelmaß 1.0)

**No online requirement for single users.** Every tap writes to
`localStorage` and re-renders locally. Scores compute in the browser. A judge
with no signal at all has a fully working scoresheet. Rooms can be created
as "Offline rooms" for single judges if no connection is present.

**Stability on reconnection** `GET /snapshot` returns the whole
room. Makes connection stable when one client reconnects after being offline
(f.e. when using their device for Debatekeeper)

**Stability for raceing updates** Updates to any judges score are marked in
sequence, ensuring correct values even when single updates arrive late or
are dropped.


### Identity

Judges are keyed on a client-generated UUID in `localStorage`, ensuring
double names don't overwrite each others scores.

### Data model

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

### Rubric

Everything format-specific is in `RUBRIC`-style constants at the top of
`static/app.js`: speakers, criteria, team categories, the Notenskala, and the
Umrechnungstabelle from the OPD adjudication sheet. A rubric revision is an edit to
those constants. Points are stored, translation to grades is calculated locally.

## Running the app

```bash
./run.sh                       # http://localhost:8000
```

Or with Docker:

```bash
docker build -t opd .
docker run -p 8000:8000 -v opd-data:/data opd
```

Or with Docker Compose (recommended):

copy `.env.example` to `.env` and fill in the
Impressum fields (required by german law), then:

```bash
docker compose up -d
```

`docker-compose.yml` expects an external Docker network to publish to
(default name `proxy`, override with `PROXY_NETWORK` in `.env`. The app
listens on `OPD_PORT` (default `8000`) and keeps its SQLite database in
the `opd_data` volume, so it survives container recreation.

Tests:

```bash
pip install httpx
python3 test_sync.py
```

### Serving the app over HTTPS

Not optional. `navigator.wakeLock` requires a secure context, so on plain HTTP
judges' phones will sleep mid-speech. `localhost` counts as secure for dev.

For a venue box on the local network, put Caddy in front:

```
jurier.example.org {
    reverse_proxy localhost:8000
}
```

Caddy handles the certificate and proxies websockets without extra config.

## Known limits

- **Round setup is manual.** No draw, no speaker assignment, no cross-room tab.
  Future work could automatically generate these from Opentab.
- **Ballot export is one-way and manual.** The desktop Dashboard can copy a
  ballot to the clipboard, and a bookmarklet (dragged in once) fills the
  matching fields on the tabbing site's own entry page. This is not ideal as
  it does not work on mobile and requires extensive setup.
- **SQLite calls run inline in async handlers.** Could become an issue if the
  app is too widely used.
