var MAX_FREE_SPEAKERS = 10;
var FREE_START = 4;
var SPEAKERS = (function () {
  var arr = [
    { label: "Eröffnungsrede Regierung", team: 0 },
    { label: "Eröffnungsrede Opposition", team: 1 },
    { label: "Ergänzungsrede Regierung", team: 0 },
    { label: "Ergänzungsrede Opposition", team: 1 },
  ];
  for (var i = 1; i <= MAX_FREE_SPEAKERS; i++) {
    arr.push({ label: i + ". Fraktionsfreie Rede", team: null });
  }
  arr.push({ label: "Schlussrede Opposition", team: 1 });
  arr.push({ label: "Schlussrede Regierung", team: 0 });
  return arr;
})();
// Chair-settable room setting (default 3, the normal OPD case) - how many
// of the reserved free-speaker slots above are currently active.
var freeSpeakerCount = 3;
function isActiveSpeaker(s) {
  if (s < FREE_START || s >= FREE_START + MAX_FREE_SPEAKERS) return true;
  return s - FREE_START < freeSpeakerCount;
}
function activeSpeakerIndices() {
  var out = [];
  for (var s = 0; s < SPEAKERS.length; s++) if (isActiveSpeaker(s)) out.push(s);
  return out;
}
function activeSpeakerCount() {
  return activeSpeakerIndices().length;
}
function activeOrdinal(s) {
  return activeSpeakerIndices().indexOf(s) + 1;
}
function nextActiveSpeaker(s) {
  for (var i = s + 1; i < SPEAKERS.length; i++)
    if (isActiveSpeaker(i)) return i;
  return -1;
}
function prevActiveSpeaker(s) {
  for (var i = s - 1; i >= 0; i--) if (isActiveSpeaker(i)) return i;
  return -1;
}
// Snaps cs onto the nearest active speaker after freeSpeakerCount changes.
function snapToActiveSpeaker() {
  if (isActiveSpeaker(cs)) return;
  var p = prevActiveSpeaker(cs);
  cs = p !== -1 ? p : nextActiveSpeaker(cs);
}

// Timer rubric: nominal duration + protected (no-interjection) windows, in
// ms from the start of the speech. "protected" ranges are [from, to) pairs;
// everything outside them is the open/non-protected window judges can ask
// questions or interject in. The server is authoritative for durationMs
// (TIMER_DURATIONS_MS in server.py) - this table only needs to match it so
// the client can compute signal instants locally, without a round trip.
var TIMER_TYPES = {
  team: {
    label: "Teamrede",
    durationMs: 7 * 60 * 1000,
    protected: [
      [0, 60 * 1000],
      [6 * 60 * 1000, 7 * 60 * 1000],
    ],
  },
  ffr: {
    label: "Fraktionsfreie Rede",
    durationMs: 3 * 60 * 1000 + 30 * 1000,
    protected: [
      [0, 60 * 1000],
      [3 * 60 * 1000, 3 * 60 * 1000 + 30 * 1000],
    ],
  },
  reply: {
    label: "Zwischenrede",
    durationMs: 60 * 1000,
    protected: [[0, 60 * 1000]],
  },
  // Judges' deliberation, not a speech - no protected/open windows or
  // overdraw grace, just two flat cues: 1x as a wrap-up notice, 2x once
  // discussion has run long. `signals` overrides the protected-window-
  // derived pattern the speech types use (see timerSignalPoints below).
  discussion: {
    label: "Jurierdiskussion",
    durationMs: 20 * 60 * 1000,
    protected: [],
    signals: [
      { ms: 15 * 60 * 1000, times: 1 },
      { ms: 20 * 60 * 1000, times: 2 },
    ],
  },
};
var OVERDRAW_GRACE_MS = 15 * 1000;
function teamOf(s) {
  return SPEAKERS[s].team;
}
// The accent class for a team index - null (a free speaker) included.
function teamClass(team) {
  return team === 0 ? "team-gov" : team === 1 ? "team-opp" : "team-free";
}
function setTeamAccent(card, team) {
  card.classList.remove("team-gov", "team-opp", "team-free");
  card.classList.add(teamClass(team));
}
var CRITERIA = [
  { key: "spr", label: "Sprachkraft", short: "Spr" },
  { key: "auf", label: "Auftreten", short: "Auf" },
  { key: "kon", label: "Kontaktfähigkeit", short: "Kon" },
  { key: "sac", label: "Sachverstand", short: "Sac" },
  { key: "urt", label: "Urteilskraft", short: "Urt" },
];
var TEAMS = ["Regierung", "Opposition"];
var TEAMCATS = [
  { key: "eroef", label: "Eröffnungsrede", max: 25, grp: "Strategie" },
  { key: "ergae", label: "Ergänzungsrede", max: 25, grp: "Strategie" },
  { key: "schlu", label: "Schlussrede", max: 25, grp: "Strategie" },
  { key: "zreden", label: "Zwischenreden", max: 30, grp: "Interaktion" },
  { key: "zfrag", label: "Zwischenfragen", max: 30, grp: "Interaktion" },
  { key: "zrufe", label: "Zwischenrufe", max: 15, grp: "Interaktion" },
  {
    key: "ueber",
    label: "Überzeugungskraft",
    max: 50,
    grp: "Überzeugungskraft",
  },
];
// TEAMCATS grouped by .grp - used by Schnelleingabe's Teampunkte header.
var TEAMGROUPS_INFO = (function () {
  var groups = [];
  TEAMCATS.forEach(function (c, i) {
    var g = groups.filter(function (g) {
      return g.label === c.grp;
    })[0];
    if (!g) {
      g = { label: c.grp, cats: [] };
      groups.push(g);
    }
    g.cats.push(i);
  });
  return groups;
})();

var UMR = {
  20: [
    [15, 15],
    [25, 25],
    [30, 30],
    [50, 50],
  ],
  19: [
    [14, 14],
    [24, 24],
    [28, 29],
    [47, 49],
  ],
  18: [
    [14, 14],
    [22, 23],
    [27, 27],
    [44, 46],
  ],
  17: [
    [13, 13],
    [21, 21],
    [25, 26],
    [42, 43],
  ],
  16: [
    [12, 12],
    [20, 20],
    [24, 24],
    [39, 41],
  ],
  15: [
    [11, 11],
    [19, 19],
    [22, 23],
    [37, 38],
  ],
  14: [
    [11, 11],
    [17, 18],
    [21, 21],
    [34, 36],
  ],
  13: [
    [10, 10],
    [16, 16],
    [19, 20],
    [32, 33],
  ],
  12: [
    [9, 9],
    [15, 15],
    [18, 18],
    [29, 31],
  ],
  11: [
    [8, 8],
    [14, 14],
    [16, 17],
    [27, 28],
  ],
  10: [
    [8, 8],
    [12, 13],
    [15, 15],
    [24, 26],
  ],
  9: [
    [7, 7],
    [11, 11],
    [13, 14],
    [22, 23],
  ],
  8: [
    [6, 6],
    [10, 10],
    [12, 12],
    [19, 21],
  ],
  7: [
    [5, 5],
    [9, 9],
    [10, 11],
    [17, 18],
  ],
  6: [
    [5, 5],
    [7, 8],
    [9, 9],
    [14, 16],
  ],
  5: [
    [4, 4],
    [6, 6],
    [7, 8],
    [12, 13],
  ],
  4: [
    [3, 3],
    [5, 5],
    [6, 6],
    [9, 11],
  ],
  3: [
    [2, 2],
    [4, 4],
    [4, 5],
    [7, 8],
  ],
  2: [
    [2, 2],
    [2, 3],
    [3, 3],
    [4, 6],
  ],
  1: [
    [1, 1],
    [1, 1],
    [1, 2],
    [1, 3],
  ],
  0: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
};
var SCALEIDX = { 15: 0, 25: 1, 30: 2, 50: 3 };
var NOTEN = [
  {
    a: "Perfekt",
    b: "Internationale Spitzenleistung",
    cells: [19, 20],
    marks: [" ", " "],
  },
  {
    a: "Exzellent",
    b: "Nationale Spitzenleistung",
    cells: [16, 17, 18],
    marks: [" ", " ", " "],
  },
  {
    a: "Sehr gut",
    b: "Schwächen kaum erkennbar",
    cells: [13, 14, 15],
    marks: ["1-", "1", "1+"],
  },
  {
    a: "Gut",
    b: "Stärken überwiegen",
    cells: [10, 11, 12],
    marks: ["2-", "2", "2+"],
  },
  {
    a: "Solide",
    b: "ausgewogen",
    cells: [7, 8, 9],
    marks: ["3-", "3", "3+"],
  },
  {
    a: "Ausreichend",
    b: "Schwächen überwiegen",
    cells: [4, 5, 6],
    marks: ["4-", "4", "4+"],
  },
  {
    a: "Mangelhaft",
    b: "deutliche Schwächen",
    cells: [1, 2, 3],
    marks: ["5-", "5", "5+"],
  },
  { a: "Keine Leistung", b: "", cells: [0], marks: ["6"] },
];
var TOPROWS = 2;
var BOTTOMROWS = 1;

function markOf(v) {
  for (var i = 0; i < NOTEN.length; i++) {
    var n = NOTEN[i],
      j = n.cells.indexOf(v);
    if (j >= 0) return { name: n.a, mark: n.marks[j] };
  }
  return { name: "", mark: "" };
}
function convert(v, max) {
  return max === 20 ? [v, v] : UMR[v][SCALEIDX[max]];
}
function mid(r) {
  return Math.floor((r[0] + r[1]) / 2);
}
function katOf(pts, max) {
  if (max === 20) return pts;
  var si = SCALEIDX[max];
  for (var v = 20; v >= 0; v--) {
    var r = UMR[v][si];
    if (pts >= r[0] && pts <= r[1]) return v;
  }
  return null;
}
// Reverse of markOf() - grade mark (e.g. "2+") -> its 0-20 value, for the
// optional grade-typing input mode on Blatt/Teampunkte.
var GRADE_TO_POINTS = (function () {
  var map = {};
  NOTEN.forEach(function (n) {
    n.cells.forEach(function (v, j) {
      var mark = n.marks[j];
      if (mark && mark.trim()) map[mark] = v;
    });
  });
  return map;
})();
// Grade mark to show in a grade-mode input. max=20 (Blatt) uses v
// directly; a team category (max!=20) goes through katOf first, same as
// its existing read-only hint does. Falls back to the raw number for the
// ungraded top bands (blank mark).
function gradeMarkFor(v, max) {
  if (v === null) return "";
  var kat = max && max !== 20 ? katOf(v, max) : v;
  var mk = markOf(kat).mark;
  return mk && mk.trim() ? mk : String(v);
}
// Typed grade mark -> raw points to write. undefined = not a recognized
// mark (caller reverts the field, same as an unparsable number today).
function pointsFromGrade(mark, max) {
  var v = GRADE_TO_POINTS[mark];
  if (v === undefined) return undefined;
  return max && max !== 20 ? mid(convert(v, max)) : v;
}
function gradeHintText(v) {
  return v === null ? "–" : v + " Punkte";
}
// Speaker names are free text a judge types in, and the two result tables
// below are built as HTML strings (the one place this codebase does that) -
// so anything user-typed has to go through here on the way in.
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
// How many cells a complete Wertung has for the room's current shape: every
// active speech's criteria plus both teams' categories. Follows the chair's
// FFR count, so it is never the fixed 59 of a default 3-FFR round.
function expectedCellCount() {
  return (
    activeSpeakerCount() * CRITERIA.length + TEAMS.length * TEAMCATS.length
  );
}
// Highest reachable team score - the sum of every category's own max.
var TEAM_MAX = TEAMCATS.reduce(function (a, c) {
  return a + c.max;
}, 0);
function labelOf(target, criterion) {
  if (target[0] === "s") {
    var s = speakerLabel(+target.slice(1));
    if (criterion === "abz") return s + " · Abzüge";
    for (var i = 0; i < CRITERIA.length; i++)
      if (CRITERIA[i].key === criterion) return s + " · " + CRITERIA[i].label;
  } else {
    var t = TEAMS[+target.slice(1)];
    if (criterion === "abz") return t + " · Abzüge";
    for (var j = 0; j < TEAMCATS.length; j++)
      if (TEAMCATS[j].key === criterion) return t + " · " + TEAMCATS[j].label;
  }
  return target + "/" + criterion;
}

// Storage and sync
var LS = {
  get: function (k, d) {
    try {
      var v = localStorage.getItem(k);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set: function (k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
  del: function (k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  },
};
function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return (
    "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
  );
}
var CLIENT_ID = LS.get("opd.client_id", null);
if (!CLIENT_ID) {
  CLIENT_ID = uuid();
  LS.set("opd.client_id", CLIENT_ID);
}

// pushState/replaceState throw a SecurityError when the page is running
// from a file:// URL - a browser's "Seite speichern unter" copy opened
// straight off disk - because the target path isn't same-origin there.
// Feature-detecting the method isn't enough: it exists, it just throws.
// The URL is a nicety (a shareable /r/CODE link, a back-button escape
// hatch out of "Verlassen"), so it must never take the caller down with
// it - startSession() calls this immediately before its render().
function setHistoryUrl(method, state, url) {
  if (!history[method]) return;
  try {
    history[method](state, "", url);
  } catch (e) {}
}

// Server room codes (server.py's new_code()) are always 4 chars drawn from
// ACDEFGHJKMNPQRTUVWXY34679 - i.e. they never contain B/I/L/O/S/Z or
// 0/1/2/5/8. Offline (not-yet-created) rooms draw only from that excluded
// set, so an offline code can never collide with a real one, while still
// matching urlCode()'s 4-char alphanumeric shape - no routing changes needed.
var OFFLINE_CODE_ALPHABET = "BILOSZ01258";
function genOfflineCode() {
  var code;
  do {
    code = "";
    for (var i = 0; i < 4; i++) {
      code += OFFLINE_CODE_ALPHABET.charAt(
        Math.floor(Math.random() * OFFLINE_CODE_ALPHABET.length),
      );
    }
  } while (LS.get("opd.session." + code, null));
  return code;
}

var ME = null; // {code, token, judge_id, name, is_chair}
var mine = {}; // "target|criterion" -> points   (my own, authoritative locally)
var peers = {}; // judge_id -> {name,is_chair,hidden,filled,online}
var remote = {}; // judge_id -> {"target|criterion": points}
var queue = {}; // "target|criterion" -> {target,criterion,points,seq}
var seq = 0;
// Blatt's free-text notes - local-only, keyed "s{s}|{groupKey}" (Sac+Urt share one).
var notes = {};
var notesSaveTimer = null;
// Speaker names - local-only like notes, keyed "s{s}", one name per speaker
// slot. Named speakerNames (not "names") since a couple of chair-summary
// functions already use a local `names` array for judge-name lists.
var speakerNames = {};
var namesSaveTimer = null;
var ws = null,
  wsTries = 0,
  wsTimer = null,
  flushTimer = null;
var online = false,
  pending = 0;

// Debate timer - room-wide, server-anchored (like spreadOpen/freeSpeakerCount
// above): every judge sees the same clock. startedAt is a server epoch-
// seconds timestamp (or null while paused/idle); serverTimeOffsetMs lets the
// client compute "now" on the server's clock without trusting its own.
var timer = {
  type: null, // null | "team" | "ffr" | "reply" | "discussion"
  status: "idle", // idle | running | paused
  durationMs: 0,
  elapsedMs: 0,
  startedAt: null,
  updatedAt: 0, // server clock; see applyTimerState's snapshot guard
};
var serverTimeOffsetMs = 0;
// Server-clock time of the last timer action taken on this device that the
// server has not confirmed yet (0 once any broadcast arrives). Guards a
// reconnect's snapshot from winding back a timer started while offline.
var timerLocalAt = 0;
// Which signal thresholds (ms into the current speech) have already rung,
// so a repaint or a pause/resume doesn't re-fire a bell. Cleared whenever
// the banked elapsed time returns to 0 (a fresh start or a reset).
var timerFired = {};
var timerAudioCtx = null;
// Cached .bar widget children, so the 250ms repaint only rewrites text.
var timerWidgetParts = null;

function kk(t, c) {
  return t + "|" + c;
}
function saveLocal() {
  if (!ME) return;
  LS.set("opd.scores." + ME.code, mine);
  LS.set("opd.queue." + ME.code, queue);
  LS.set("opd.seq", seq);
}
function loadLocal() {
  mine = LS.get("opd.scores." + ME.code, {}) || {};
  queue = LS.get("opd.queue." + ME.code, {}) || {};
  seq = LS.get("opd.seq", 0) || 0;
  notes = LS.get("opd.notes." + ME.code, {}) || {};
  speakerNames = LS.get("opd.names." + ME.code, {}) || {};
}
function getName(s) {
  return speakerNames["s" + s] || "";
}
function setName(s, text) {
  speakerNames["s" + s] = text;
  clearTimeout(namesSaveTimer);
  namesSaveTimer = setTimeout(function () {
    if (ME) LS.set("opd.names." + ME.code, speakerNames);
  }, 300);
}
// SPEAKERS[s].label suffixed with "(name)" wherever a judge has typed one in
function speakerLabel(s) {
  var nm = getName(s);
  return SPEAKERS[s].label + (nm ? " (" + nm + ")" : "");
}
function noteKey(s, groupKey) {
  return "s" + s + "|" + groupKey;
}
function getNote(s, groupKey) {
  return notes[noteKey(s, groupKey)] || "";
}
function setNote(s, groupKey, text) {
  notes[noteKey(s, groupKey)] = text;
  clearTimeout(notesSaveTimer);
  notesSaveTimer = setTimeout(function () {
    if (ME) LS.set("opd.notes." + ME.code, notes);
  }, 300);
}
function teamNoteKey(t, groupKey) {
  return "t" + t + "|" + groupKey;
}
function getTeamNote(t, groupKey) {
  return notes[teamNoteKey(t, groupKey)] || "";
}
function setTeamNote(t, groupKey, text) {
  notes[teamNoteKey(t, groupKey)] = text;
  clearTimeout(notesSaveTimer);
  notesSaveTimer = setTimeout(function () {
    if (ME) LS.set("opd.notes." + ME.code, notes);
  }, 300);
}

// Save locally first, then push to db. points === null clears the cell
// (Undo of a first-ever entry) - the server deletes the row rather than
// storing a 0 every other judge would count as a real score.
function write(target, criterion, points) {
  var k = kk(target, criterion);
  if (!remote[ME.judge_id]) remote[ME.judge_id] = {};
  if (points === null) {
    delete mine[k];
    delete remote[ME.judge_id][k];
  } else {
    mine[k] = points;
    remote[ME.judge_id][k] = points;
  }
  seq += 1;
  // Collapsing by key caps an hour offline at one queued entry per cell.
  queue[k] = {
    target: target,
    criterion: criterion,
    points: points,
    seq: seq,
  };
  saveLocal();
  scheduleFlush(150);
}

function scheduleFlush(ms) {
  if (flushTimer) return;
  flushTimer = setTimeout(function () {
    flushTimer = null;
    flush();
  }, ms);
}

function flush() {
  if (!ME) return;
  var keys = Object.keys(queue);
  if (!keys.length) {
    pending = 0;
    paintBar();
    return;
  }
  pending = keys.length;
  paintBar();
  if (ME.pendingCreate) return; // offline room - nothing to push to yet
  var batch = keys.slice(0, 200).map(function (k) {
    return queue[k];
  });
  fetch(
    "/api/rooms/" + ME.code + "/patches?token=" + encodeURIComponent(ME.token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patches: batch }),
    },
  )
    .then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    })
    .then(function () {
      batch.forEach(function (p) {
        var k = kk(p.target, p.criterion);
        // only clear if it has not been edited again since we sent it
        if (queue[k] && queue[k].seq === p.seq) delete queue[k];
      });
      saveLocal();
      pending = Object.keys(queue).length;
      paintBar();
      if (pending) scheduleFlush(200);
    })
    .catch(function () {
      pending = Object.keys(queue).length;
      paintBar();
      scheduleFlush(3000); // If sync failed try again
    });
}

// --- Debate timer -----------------------------------------------------

// Personal, per-device preference (like gradeInputMode above) - only one
// device in the room should actually sound the bell, so this is never sent
// to the server.
function timerMuted() {
  return !!LS.get("opd.timerMuted", false);
}
function toggleTimerMuted() {
  LS.set("opd.timerMuted", !timerMuted());
  paintTimer();
}

// Also per-device: whether the displayed clock counts up from 0 (default)
// or down from the nominal duration. Purely a display choice - the shared
// elapsed/duration state and the bell signals are unaffected either way.
function timerCountUp() {
  return LS.get("opd.timerCountUp", true) !== false;
}
// The ms value to actually render, given the display-mode preference above.
function timerDisplayMs(elapsedMs, durationMs) {
  return timerCountUp() ? elapsedMs : durationMs - elapsedMs;
}

// And per-device again: which BELL_VOICES entry this device rings. Whoever
// holds the bell picks whichever carries better in their room, so it can't
// be a room-wide setting.
function bellVoice() {
  return LS.get("opd.bellVoice", "hoch") === "tief" ? "tief" : "hoch";
}

// Lazily created (and resumed) from inside a user gesture - start/resume
// button handlers call this - so autoplay policies don't block the bell.
function timerAudioCtx_() {
  if (!timerAudioCtx) {
    try {
      timerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (timerAudioCtx.state === "suspended") {
    timerAudioCtx.resume().catch(function () {});
  }
  return timerAudioCtx;
}
// The two Zeitsignal voices, both tuned in the Bell Tuner and both the
// same struck-idiophone approximation: sine partials over a fast-attack /
// exponential-decay envelope, plus a short noise burst for the strike
// transient, so they read as a bell rather than a beep. "hoch" is bright
// and short, and cuts through a talking room; "tief" rings much longer
// and carries better in a big hall. Which one a device uses is a personal
// per-device choice (bellVoice() below), like mute - not a room setting.
var BELL_VOICES = {
  hoch: {
    label: "Hoch",
    fundamental: 1630,
    partials: [
      { ratio: 1, gain: 1 },
      { ratio: 2, gain: 0.37 },
      { ratio: 3, gain: 0.24 },
    ],
    gapSec: 0.38, // between successive rings of a 2x/3x signal
    attackSec: 0.005,
    decaySec: 0.9,
    gain: 0.9,
    bite: 0, // square-wave blend at the fundamental; 0 = none
    noiseSec: 0.012,
    noiseGain: 0.19,
  },
  tief: {
    label: "Tief",
    fundamental: 420,
    partials: [
      { ratio: 1, gain: 1 },
      { ratio: 2, gain: 0.21 },
    ],
    gapSec: 0.31,
    attackSec: 0.004,
    decaySec: 2.12,
    gain: 0.85,
    bite: 0.02,
    noiseSec: 0.03,
    noiseGain: 0.19,
  },
};
function playBellTones(times) {
  var ctx = timerAudioCtx_();
  if (!ctx) return;
  var v = BELL_VOICES[bellVoice()];
  for (var i = 0; i < times; i++) {
    var t0 = ctx.currentTime + i * v.gapSec;
    var end = t0 + v.attackSec + v.decaySec + 0.05;

    var master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(v.gain, t0 + v.attackSec);
    master.gain.exponentialRampToValueAtTime(
      0.0001,
      t0 + v.attackSec + v.decaySec,
    );
    master.connect(ctx.destination);

    v.partials.forEach(function (p) {
      var osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = v.fundamental * p.ratio;
      var g = ctx.createGain();
      g.gain.value = p.gain;
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(end);
    });

    if (v.bite > 0) {
      var bite = ctx.createOscillator();
      bite.type = "square";
      bite.frequency.value = v.fundamental;
      var biteGain = ctx.createGain();
      biteGain.gain.value = v.bite;
      bite.connect(biteGain);
      biteGain.connect(master);
      bite.start(t0);
      bite.stop(end);
    }

    var bufferSize = Math.round(ctx.sampleRate * v.noiseSec);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var n = 0; n < bufferSize; n++) data[n] = Math.random() * 2 - 1;
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(v.noiseGain, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + v.noiseSec);
    noise.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(t0);
  }
}
// Rings `times` short bell tones in a row. Muted devices stay silent so a
// room with several judges' phones open doesn't sound the bell N times.
function ringBell(times) {
  if (timerMuted()) return;
  playBellTones(times);
}
function testBell() {
  playBellTones(1);
}

// Elapsed time (ms) into the current speech, computed from the last
// server-broadcast state plus the server-clock offset - never from a local
// "remaining time" that would drift across reconnects.
function timerElapsedMs() {
  if (!timer.type) return 0;
  var e = timer.elapsedMs || 0;
  if (timer.status === "running" && timer.startedAt) {
    e += Date.now() + serverTimeOffsetMs - timer.startedAt * 1000;
  }
  return e;
}
// Signal instants (ms into the speech) and how many times the bell rings at
// each, derived from TIMER_TYPES/OVERDRAW_GRACE_MS. Zwischenrede has no
// non-protected window, so it only gets the 2x/3x signals.
function timerSignalPoints(type) {
  var t = TIMER_TYPES[type];
  if (!t) return [];
  // An explicit `signals` list (Jurierdiskussion) overrides the speech
  // pattern below entirely - it has no protected/open windows or overdraw.
  if (t.signals) return t.signals;
  var pts = [];
  if (t.protected.length === 2) {
    pts.push({ ms: t.protected[0][1], times: 1 }); // open window starts
    pts.push({ ms: t.protected[1][0], times: 1 }); // open window ends
  }
  pts.push({ ms: t.durationMs, times: 2 }); // nominal time ends
  pts.push({ ms: t.durationMs + OVERDRAW_GRACE_MS, times: 3 }); // grace ends
  return pts;
}
function timerStateClass(type, elapsedMs) {
  var d = TIMER_TYPES[type].durationMs;
  if (elapsedMs >= d + OVERDRAW_GRACE_MS) return "danger";
  if (elapsedMs >= d - 30000) return "warn";
  return "live";
}
function fmtTimerClock(ms) {
  var neg = ms < 0;
  var s = Math.floor(Math.abs(ms) / 1000);
  var m = Math.floor(s / 60);
  s = s % 60;
  return (neg ? "+" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}
// The signal rail in the expanded modal spans 0 up to the end of the
// overdraw grace, so every mark (including the final 3x signal) is visible.
function timerBarMax(type) {
  var t = TIMER_TYPES[type];
  var max = t.durationMs + OVERDRAW_GRACE_MS;
  timerSignalPoints(type).forEach(function (sig) {
    if (sig.ms > max) max = sig.ms;
  });
  return max;
}

// Applies a {type,status,duration_ms,elapsed_ms,started_at} payload from
// the server (snapshot or a "timer" ws broadcast) as the new shared state.
// The widget only ever shows the speech kind (Teamrede/FFR/Zwischenrede),
// never a speaker name or ordinal - which speech is being timed is picked
// by the judge each time via the type buttons below, not carried
// automatically.
//
// This also rebuilds the fired-signals bookkeeping - from the actual elapsed
// time, never just cleared, since this runs on every resync() (tab focus,
// visibility change, ws reconnect), not only on a real start/reset, and the
// server's *banked* elapsed_ms stays 0 for a running timer until its first
// pause.
function applyTimerState(t, fromSnapshot) {
  // A snapshot is a point-in-time read that can be *older* than what this
  // device just did - most obviously after acting while offline, which the
  // server never heard about. Applying it then would wind the clock back,
  // so a pending local action wins. Live broadcasts are always current (and
  // prove the server has our state), so they always win and clear the flag.
  if (fromSnapshot) {
    if (timerLocalAt && (t.updated_at || 0) < timerLocalAt) return;
  } else {
    timerLocalAt = 0;
  }
  timer = {
    type: t.type || null,
    status: t.status || "idle",
    durationMs: t.duration_ms || 0,
    elapsedMs: t.elapsed_ms || 0,
    startedAt: t.started_at || null,
    updatedAt: t.updated_at || 0,
  };
  rebuildTimerFired();
  paintTimer();
  refreshTimerModalControls();
}
// Marks every signal instant already in the past as rung, so a state change
// never re-rings a bell the speech is past - and, conversely, a threshold
// nudged back into the future by -5s correctly rings again when reached.
function rebuildTimerFired() {
  timerFired = {};
  if (!timer.type) return;
  var elapsed = timerElapsedMs();
  timerSignalPoints(timer.type).forEach(function (sig) {
    if (elapsed >= sig.ms) timerFired[sig.ms] = true;
  });
}
// Mirrors server.py's set_timer branches so an action takes effect without
// waiting on a round trip - and keeps working with no connection at all.
// Deliberately kept in step with that function: change one, change both.
function applyTimerActionLocally(action, extra) {
  var nowServer = (Date.now() + serverTimeOffsetMs) / 1000;
  if (action === "start") {
    if (!TIMER_TYPES[extra.type]) return;
    timer = {
      type: extra.type,
      status: "running",
      durationMs: TIMER_TYPES[extra.type].durationMs,
      elapsedMs: 0,
      startedAt: nowServer,
      updatedAt: nowServer,
    };
  } else if (action === "pause") {
    if (timer.status !== "running") return;
    timer.elapsedMs = timerElapsedMs(); // before startedAt is cleared
    timer.startedAt = null;
    timer.status = "paused";
  } else if (action === "resume") {
    if (timer.status !== "paused") return;
    timer.startedAt = nowServer;
    timer.status = "running";
  } else if (action === "reset") {
    timer.elapsedMs = 0;
    timer.startedAt = null;
    timer.status = "idle";
  } else if (action === "adjust") {
    if (!timer.type) return;
    if (timer.status === "running") {
      // Moving startedAt earlier adds to the live elapsed, later subtracts
      // from it; the cap keeps a -5s tap from pushing it below zero.
      timer.startedAt = Math.min(
        timer.startedAt - extra.delta_ms / 1000,
        nowServer + timer.elapsedMs / 1000,
      );
    } else {
      timer.elapsedMs = Math.max(0, timer.elapsedMs + extra.delta_ms);
    }
  } else {
    return;
  }
  timer.updatedAt = nowServer;
  timerLocalAt = nowServer;
  rebuildTimerFired();
  paintTimer();
  refreshTimerModalControls();
}
// Local-first, like write() for scores: apply now, push after. The server's
// broadcast (carrying a newer updated_at) then replaces this with the
// authoritative state, which also re-converges every other judge.
function timerActionRequest(action, extra) {
  if (!ME) return;
  applyTimerActionLocally(action, extra);
  if (ME.pendingCreate) return; // offline room - no server room to push to yet
  var body = { action: action };
  if (extra) for (var k in extra) body[k] = extra[k];
  fetch(
    "/api/rooms/" + ME.code + "/timer?token=" + encodeURIComponent(ME.token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  ).catch(function () {});
}
function startTimer(type) {
  timerAudioCtx_();
  timerActionRequest("start", { type: type });
}
function pauseTimer() {
  timerActionRequest("pause");
}
function resumeTimer() {
  timerAudioCtx_();
  timerActionRequest("resume");
}
function resetTimer() {
  timerActionRequest("reset");
}
function adjustTimer(deltaMs) {
  timerActionRequest("adjust", { delta_ms: deltaMs });
}

// Everything below repaints four times a second, so it only ever touches
// the DOM when a value actually changed - rewriting identical text/classes
// on every tick makes the digits visibly stutter.
function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}
function setCls(node, cls) {
  if (node && node.className !== cls) node.className = cls;
}

// Live-updates the expanded modal's big clock and signal bar, if it's open
// (the modal's static parts - label, marks, buttons - only get built once
// in openTimerModal(); only the clock text and fill width move).
function refreshTimerModal() {
  var clock = document.getElementById("timerBigClock");
  if (!clock || !timer.type) return;
  var elapsed = timerElapsedMs();
  var cls = timerStateClass(timer.type, elapsed);
  setCls(clock, "timerbigclock " + cls);
  setText(clock, fmtTimerClock(timerDisplayMs(elapsed, timer.durationMs)));
  var fill = document.getElementById("timerBarFill");
  if (fill) {
    setCls(fill, "timerbarfill " + cls);
    var w =
      Math.max(0, Math.min(100, (elapsed / timerBarMax(timer.type)) * 100)) +
      "%";
    if (fill.style.width !== w) fill.style.width = w;
  }
}

// The modal's *structure* only depends on these two things; everything else
// (button labels, the clock, the bar, whether the Zwischenrede button is
// showing) is updated in place below, so that a -5s/+5s tap doesn't tear
// down and recreate every button under the judge's finger.
function timerModalShape() {
  return (
    (!timer.type || timer.status === "idle" ? "pick" : "run") + "|" + timer.type
  );
}
function refreshTimerModalControls() {
  var m = document.getElementById("timerModal");
  if (!m) return;
  if (m.dataset.shape !== timerModalShape()) {
    openTimerModal(true); // genuinely different controls - rebuild once
    return;
  }
  var pr = document.getElementById("timerPauseResume");
  setText(pr, timer.status === "running" ? "Pause" : "Weiter");
  var nb = document.getElementById("timerNextReply");
  if (nb) {
    nb.classList.toggle(
      "hide",
      !(timer.type === "ffr" && timerElapsedMs() >= TIMER_TYPES.ffr.durationMs),
    );
  }
  refreshTimerModal();
}

// Ticks every 250ms (started at app init, below) - repaints the widget and
// rings the bell at any signal instant crossed since the last tick.
function tickTimer() {
  if (!ME || !timer.type) return;
  paintTimer();
  refreshTimerModalControls();
  if (timer.status !== "running") return;
  var elapsed = timerElapsedMs();
  timerSignalPoints(timer.type).forEach(function (sig) {
    if (elapsed >= sig.ms && !timerFired[sig.ms]) {
      timerFired[sig.ms] = true;
      ringBell(sig.times);
    }
  });
}
setInterval(tickTimer, 250);

// Every modal in the app is the same shape: a .modalbackdrop that closes on
// an outside click or Escape, wrapping one .modalbox the caller fills. These
// two hold that pattern once; the named open/close pairs below are thin
// wrappers so call sites (and the Esc/Tab handlers) keep reading as before.
var modalEscHandlers = {};
function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.remove();
  if (modalEscHandlers[id]) {
    document.removeEventListener("keydown", modalEscHandlers[id]);
    delete modalEscHandlers[id];
  }
}
// build(box) fills the box; the finished backdrop is returned so a caller
// can stash state on it (openTimerModal's dataset.shape) or focus into it.
function openModal(id, build) {
  closeModal(id);
  var backdrop = el("div", "modalbackdrop");
  backdrop.id = id;
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeModal(id);
  });
  var box = el("div", "modalbox");
  build(box);
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  var esc = function (e) {
    if (e.key === "Escape") closeModal(id);
  };
  modalEscHandlers[id] = esc;
  document.addEventListener("keydown", esc);
  return backdrop;
}
// One-button notice in the app's modal style, replacing alert().
function openInfoModal(title, text) {
  openModal("infoModal", function (box) {
    if (title) box.appendChild(el("h2", null, title));
    box.appendChild(el("p", "note", text));
    var actions = el("div", "modalactions");
    var okBtn = el("button", "btn", "OK");
    okBtn.type = "button";
    okBtn.addEventListener("click", function () {
      closeModal("infoModal");
    });
    actions.appendChild(okBtn);
    box.appendChild(actions);
  });
}
// Abbrechen/confirm pair instead of confirm().
// opts: {title, text, confirmLabel, cancelLabel, onConfirm}.
function openConfirmModal(opts) {
  openModal("confirmModal", function (box) {
    if (opts.title) box.appendChild(el("h2", null, opts.title));
    box.appendChild(el("p", "note", opts.text));
    var actions = el("div", "modalactions");
    var cancelBtn = el("button", "btn ghost", opts.cancelLabel || "Abbrechen");
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", function () {
      closeModal("confirmModal");
    });
    var confirmBtn = el("button", "btn", opts.confirmLabel);
    confirmBtn.type = "button";
    confirmBtn.addEventListener("click", function () {
      closeModal("confirmModal");
      opts.onConfirm();
    });
    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    box.appendChild(actions);
  });
}
// A "Schließen"/"OK"-style single action row, the tail of most modals here.
function modalCloseRow(id, label) {
  var row = el("div", "modalactions");
  var btn = el("button", "btn ghost", label);
  btn.type = "button";
  btn.addEventListener("click", function () {
    closeModal(id);
  });
  row.appendChild(btn);
  return row;
}

function closeTimerModal() {
  closeModal("timerModal");
}
// Every visible, non-disabled focusable element in the modal - used both to
// trap Tab inside it and to focus the first control when it opens.
function timerModalFocusables() {
  var m = document.getElementById("timerModal");
  if (!m) return [];
  return [].slice
    .call(
      m.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    )
    .filter(function (e) {
      return !e.disabled && e.offsetParent !== null;
    });
}
// Tap target for the .bar widget - lets a judge pick a speech type and
// start/pause/resume/reset the shared clock, or mute their own device.
// `isRefresh` is set only when applyTimerState() rebuilds an already-open
// modal in place after a server-confirmed change - that must not steal
// focus back to the first button every time, unlike a genuine fresh open
// (a click, or the Alt+T shortcut).
function openTimerModal(isRefresh) {
  var backdrop = openModal("timerModal", function (box) {
    buildTimerModalBox(box);
  });
  backdrop.dataset.shape = timerModalShape();
  if (!isRefresh) {
    var focusables = timerModalFocusables();
    if (focusables.length) focusables[0].focus();
  }
}
function buildTimerModalBox(box) {
  box.appendChild(el("h2", null, "Timer"));

  if (!timer.type || timer.status === "idle") {
    box.appendChild(el("p", "note", "Redeart wählen, um die Uhr zu starten."));
    var typeRow = el("div", "timertypes");
    ["team", "ffr", "reply", "discussion"].forEach(function (ty) {
      var b = el("button", "btn ghost", TIMER_TYPES[ty].label);
      b.type = "button";
      b.addEventListener("click", function () {
        closeTimerModal();
        startTimer(ty);
      });
      typeRow.appendChild(b);
    });
    box.appendChild(typeRow);
  } else {
    box.appendChild(el("p", "note", TIMER_TYPES[timer.type].label));

    var bigClock = el("div", "timerbigclock");
    bigClock.id = "timerBigClock";
    box.appendChild(bigClock);

    var bar = el("div", "timerbar");
    var fill = el("div", "timerbarfill");
    fill.id = "timerBarFill";
    bar.appendChild(fill);
    timerSignalPoints(timer.type).forEach(function (sig) {
      var mark = el("div", "timerbarmark");
      mark.style.left = (sig.ms / timerBarMax(timer.type)) * 100 + "%";
      bar.appendChild(mark);
    });
    box.appendChild(bar);
    refreshTimerModal();

    // For a speech timed a bit too early or too late - nudges the shared
    // clock without closing the modal, so a judge can tap it a few times
    // while watching the big clock/bar update. Doesn't touch the bell's
    // fired-signals bookkeeping directly - applyTimerState() recomputes
    // that from the corrected elapsed time on the broadcast this triggers,
    // so a signal moved back into the future correctly rings again later.
    var adjustRow = el("div", "modalactions");
    var minusBtn = el("button", "btn ghost", "−5s");
    minusBtn.type = "button";
    minusBtn.addEventListener("click", function () {
      adjustTimer(-5000);
    });
    adjustRow.appendChild(minusBtn);
    var plusBtn = el("button", "btn ghost", "+5s");
    plusBtn.type = "button";
    plusBtn.addEventListener("click", function () {
      adjustTimer(5000);
    });
    adjustRow.appendChild(plusBtn);
    box.appendChild(adjustRow);

    // Pause/Weiter/Reset stay on the modal instead of closing it - the
    // point of watching the big clock/bar is to correct a mistimed start,
    // which usually takes a few taps. One handler dispatching on the current
    // status keeps pause<->resume a label change, not a structural rebuild.
    var actions = el("div", "modalactions");
    var pb = el(
      "button",
      "btn",
      timer.status === "running" ? "Pause" : "Weiter",
    );
    pb.id = "timerPauseResume";
    pb.type = "button";
    pb.addEventListener("click", function () {
      if (timer.status === "running") pauseTimer();
      else resumeTimer();
    });
    actions.appendChild(pb);
    var xb = el("button", "btn ghost", "Zurücksetzen");
    xb.type = "button";
    xb.addEventListener("click", function () {
      resetTimer();
    });
    actions.appendChild(xb);
    box.appendChild(actions);

    // Every Fraktionsfreie Rede is always followed by a Zwischenrede - not
    // a suggestion, so this is always offered once the FFR is up. Built
    // once and shown/hidden by refreshTimerModalControls(), so crossing
    // that threshold mid-speech doesn't rebuild the modal under the judge.
    var nb = el("button", "btn", "Zwischenrede starten");
    nb.id = "timerNextReply";
    nb.type = "button";
    nb.classList.toggle(
      "hide",
      !(timer.type === "ffr" && timerElapsedMs() >= TIMER_TYPES.ffr.durationMs),
    );
    nb.addEventListener("click", function () {
      closeTimerModal();
      startTimer("reply");
    });
    box.appendChild(nb);
  }

  var soundRow = el("div", "modalactions");
  var muteBtn = el(
    "button",
    "btn ghost timermute" + (timerMuted() ? "" : " on"),
    timerMuted() ? "Ton: stumm" : "Ton: an (Glocke)",
  );
  muteBtn.type = "button";
  muteBtn.addEventListener("click", function () {
    toggleTimerMuted();
    muteBtn.textContent = timerMuted() ? "Ton: stumm" : "Ton: an (Glocke)";
    muteBtn.classList.toggle("on", !timerMuted());
  });
  soundRow.appendChild(muteBtn);
  var testBtn = el("button", "btn ghost", "Testton");
  testBtn.type = "button";
  testBtn.title =
    "Spielt einen Ton ab, um zu prüfen, ob dieses Gerät hörbar ist.";
  testBtn.addEventListener("click", testBell);
  soundRow.appendChild(testBtn);
  box.appendChild(soundRow);

  box.appendChild(modalCloseRow("timerModal", "Schließen"));
}

// Repaints the compact .bar widget (shared markup for mobile top bar and
// the desktop docked header - see index.html's .bar).
function paintTimer() {
  var host = document.getElementById("timerWidget");
  if (!host) return;
  if (!ME) {
    host.classList.add("hide");
    return;
  }
  host.classList.remove("hide");

  // Built once, then only its text and classes change - this runs on every
  // 250ms tick, and rebuilding the children each time would both stutter the
  // digits and throw away an in-progress tap on → Zwischenrede.
  if (!timerWidgetParts || timerWidgetParts.host !== host) {
    host.textContent = "";
    var clock = el("span", "timerclock");
    var label = el("span", "timerlabel");
    var next = el("button", "timernext", "→ Zwischenrede");
    next.type = "button";
    next.addEventListener("click", function (e) {
      e.stopPropagation();
      startTimer("reply");
    });
    host.appendChild(clock);
    host.appendChild(label);
    host.appendChild(next);
    host.onclick = function () {
      openTimerModal();
    };
    timerWidgetParts = { host: host, clock: clock, label: label, next: next };
  }
  var p = timerWidgetParts;

  if (!timer.type) {
    setCls(host, "timerwidget idle");
    setText(p.clock, "Timer");
    p.label.classList.add("hide");
    p.next.classList.add("hide");
    return;
  }

  var elapsed = timerElapsedMs();
  setCls(
    host,
    "timerwidget " +
      timerStateClass(timer.type, elapsed) +
      (timer.status !== "running" ? " paused" : ""),
  );
  setText(
    p.clock,
    fmtTimerClock(timerDisplayMs(elapsed, TIMER_TYPES[timer.type].durationMs)),
  );
  setText(p.label, TIMER_TYPES[timer.type].label);
  p.label.classList.remove("hide");
  p.next.classList.toggle(
    "hide",
    !(timer.type === "ffr" && elapsed >= TIMER_TYPES.ffr.durationMs),
  );
}

function connect() {
  if (!ME) return;
  if (ME.pendingCreate) return; // offline room - no server room to connect to yet
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
  var proto = location.protocol === "https:" ? "wss" : "ws";
  try {
    ws = new WebSocket(
      proto +
        "://" +
        location.host +
        "/ws/" +
        ME.code +
        "?token=" +
        encodeURIComponent(ME.token),
    );
  } catch (e) {
    scheduleReconnect();
    return;
  }

  ws.onopen = function () {
    wsTries = 0;
    online = true;
    paintBar();
    resync();
    flush();
  };
  ws.onmessage = function (ev) {
    var m;
    try {
      m = JSON.parse(ev.data);
    } catch (e) {
      return;
    }
    if (m.type === "patches") {
      if (!remote[m.judge_id]) remote[m.judge_id] = {};
      m.patches.forEach(function (p) {
        var k = kk(p.target, p.criterion);
        if (p.points === null) delete remote[m.judge_id][k];
        else remote[m.judge_id][k] = p.points;
      });
      if (view === "chair" || isDesktopChair()) render();
    } else if (m.type === "judges") {
      peers = {};
      m.judges.forEach(function (j) {
        peers[j.id] = j;
      });
      if (view === "chair" || isDesktopChair()) render();
    } else if (m.type === "deductions") {
      deductions[m.speaker_idx] = m.level;
      render();
    } else if (m.type === "exclusions") {
      if (m.judge_id === ME.judge_id) {
        if (m.excluded) myExclusions[m.target] = true;
        else delete myExclusions[m.target];
      }
      if (!remoteExclusions[m.judge_id]) remoteExclusions[m.judge_id] = {};
      if (m.excluded) remoteExclusions[m.judge_id][m.target] = true;
      else delete remoteExclusions[m.judge_id][m.target];
      render();
    } else if (m.type === "offline_judges") {
      offlineJudges[m.id] = { name: m.name, hidden: !!m.hidden };
      render();
    } else if (m.type === "offline_judges_removed") {
      delete offlineJudges[m.id];
      delete offlineScores[m.id];
      render();
    } else if (m.type === "offline_scores") {
      if (!offlineScores[m.offline_id]) offlineScores[m.offline_id] = {};
      if (m.points === null) delete offlineScores[m.offline_id][m.target];
      else offlineScores[m.offline_id][m.target] = m.points;
      render();
    } else if (m.type === "removed") {
      handleRemoved();
    } else if (m.type === "restored") {
      handleRestored();
    } else if (m.type === "spread_open") {
      spreadOpen = m.open;
      updateChairTab();
      if (view === "chair" || isDesktopWidth()) render();
    } else if (m.type === "free_speakers") {
      freeSpeakerCount = m.count;
      snapToActiveSpeaker();
      render();
    } else if (m.type === "timer") {
      applyTimerState(m.timer);
    }
  };
  ws.onclose = function () {
    online = false;
    paintBar();
    scheduleReconnect();
  };
  ws.onerror = function () {
    try {
      ws.close();
    } catch (e) {}
  };
}

function scheduleReconnect() {
  if (wsTimer) return;
  var wait = Math.min(30000, 1000 * Math.pow(2, Math.min(wsTries, 5)));
  wsTries++;
  wsTimer = setTimeout(function () {
    wsTimer = null;
    connect();
  }, wait);
}

function resync() {
  if (!ME) return;
  if (ME.pendingCreate) return; // offline room - no server room to sync with yet
  fetch(
    "/api/rooms/" + ME.code + "/snapshot?token=" + encodeURIComponent(ME.token),
  )
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (s) {
      peers = {};
      s.judges.forEach(function (j) {
        peers[j.id] = j;
      });
      remote = {};
      s.scores.forEach(function (r) {
        if (!remote[r.judge_id]) remote[r.judge_id] = {};
        remote[r.judge_id][kk(r.target, r.criterion)] = r.points;
      });
      // Always take local state over server state
      remote[ME.judge_id] = Object.assign({}, remote[ME.judge_id] || {}, mine);
      ME.is_chair = s.me.is_chair;
      spreadOpen = !!s.spread_open;
      freeSpeakerCount = s.free_speakers || 3;
      snapToActiveSpeaker();
      updateChairTab();
      serverTimeOffsetMs = s.server_time * 1000 - Date.now();
      applyTimerState(s.timer || {}, true);

      deductions = {};
      (s.deductions || []).forEach(function (d) {
        deductions[d.speaker_idx] = d.level;
      });

      remoteExclusions = {};
      myExclusions = {};
      (s.exclusions || []).forEach(function (x) {
        if (!remoteExclusions[x.judge_id]) remoteExclusions[x.judge_id] = {};
        remoteExclusions[x.judge_id][x.target] = true;
        if (x.judge_id === ME.judge_id) myExclusions[x.target] = true;
      });

      offlineJudges = {};
      (s.offline_judges || []).forEach(function (j) {
        offlineJudges[j.id] = { name: j.name, hidden: !!j.hidden };
      });
      offlineScores = {};
      (s.offline_scores || []).forEach(function (r) {
        if (!offlineScores[r.offline_id]) offlineScores[r.offline_id] = {};
        offlineScores[r.offline_id][r.target] = r.points;
      });

      render();
      paintBar();
    })
    .catch(function () {});
}

function setDeduction(speakerIdx, level) {
  if (!ME || !ME.is_chair) return;
  deductions[speakerIdx] = level;
  render();
  fetch(
    "/api/rooms/" +
      ME.code +
      "/deductions?token=" +
      encodeURIComponent(ME.token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speaker_idx: speakerIdx, level: level }),
    },
  ).catch(function () {});
}

function setExclusion(target, excluded) {
  if (!ME) return;
  if (excluded) myExclusions[target] = true;
  else delete myExclusions[target];
  render();
  fetch(
    "/api/rooms/" +
      ME.code +
      "/exclusions?token=" +
      encodeURIComponent(ME.token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: target, excluded: excluded }),
    },
  ).catch(function () {});
}

// Offline judges: added/renamed/removed and scored only by the chair, via
// the desktop "Offline-Jurierende" tab or the mobile Chair panel.
function randomOfflineId() {
  return "off" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function addOfflineJudge(name) {
  if (!ME || !ME.is_chair) return;
  var id = randomOfflineId();
  offlineJudges[id] = { name: name, hidden: false };
  render();
  fetch(
    "/api/rooms/" +
      ME.code +
      "/offline-judges?token=" +
      encodeURIComponent(ME.token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, name: name }),
    },
  ).catch(function () {});
  return id;
}
// The only way to create an offline judge on desktop (from the Namen jury
// list or the Dashboard's Ballot panel) - the "Offline-Jurierende" tab itself
// stays hidden until one exists (see renderDashChrome()), so adding one
// also has to be what reveals and opens it.
function addOfflineJudgeAndOpenPanel() {
  addOfflineJudge("");
  setDashboardView("offline");
  render();
}
function renameOfflineJudge(id, name) {
  if (!ME || !ME.is_chair || !offlineJudges[id]) return;
  offlineJudges[id].name = name;
  // No render() here: this fires on a name field's blur, often while Tab is
  // moving focus into the first score field of the same column - rebuilding
  // the table mid-transition would strand focus (see setOfflineScore).
  fetch(
    "/api/rooms/" +
      ME.code +
      "/offline-judges?token=" +
      encodeURIComponent(ME.token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, name: name }),
    },
  ).catch(function () {});
}
function removeOfflineJudge(id) {
  if (!ME || !ME.is_chair) return;
  delete offlineJudges[id];
  delete offlineScores[id];
  render();
  fetch(
    "/api/rooms/" +
      ME.code +
      "/offline-judges/" +
      encodeURIComponent(id) +
      "?token=" +
      encodeURIComponent(ME.token),
    { method: "DELETE" },
  ).catch(function () {});
}
function setOfflineHidden(offlineId, hidden) {
  if (!ME || !ME.is_chair || !offlineJudges[offlineId]) return;
  offlineJudges[offlineId].hidden = hidden;
  render();
  fetch(
    "/api/rooms/" +
      ME.code +
      "/offline-judges/" +
      encodeURIComponent(offlineId) +
      "/hidden?hidden=" +
      hidden +
      "&token=" +
      encodeURIComponent(ME.token),
    { method: "POST" },
  ).catch(function () {});
}
function setOfflineScore(offlineId, target, points) {
  if (!ME || !ME.is_chair) return;
  if (!offlineScores[offlineId]) offlineScores[offlineId] = {};
  if (points === null) delete offlineScores[offlineId][target];
  else offlineScores[offlineId][target] = points;
  fetch(
    "/api/rooms/" +
      ME.code +
      "/offline-scores?token=" +
      encodeURIComponent(ME.token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offline_id: offlineId,
        target: target,
        points: points,
      }),
    },
  ).catch(function () {});
}

function handleRemoved() {
  if (!ME) return;
  openInfoModal(
    null,
    "Du wurdest aus der Wertung genommen. Du kannst weiter " +
      "bewerten, deine Punkte zählen aber vorerst nicht mit.",
  );
}
function handleRestored() {
  if (!ME) return;
  openInfoModal(null, "Du wurdest wieder in die Wertung aufgenommen.");
}

function resetRoomState() {
  if (ws) {
    try {
      ws.close();
    } catch (e) {}
    ws = null;
  }
  if (wsTimer) {
    clearTimeout(wsTimer);
    wsTimer = null;
  }
  ME = null;
  peers = {};
  remote = {};
  mine = {};
  queue = {};
  notes = {};
  speakerNames = {};
  deductions = {};
  myExclusions = {};
  remoteExclusions = {};
  offlineJudges = {};
  offlineScores = {};
  offlineJudgesOpen = false;
  hist = [];
  thist = [];
  cs = 0;
  cc = 0;
  ct = 0;
  ctc = 0;
  timer = {
    type: null,
    status: "idle",
    durationMs: 0,
    elapsedMs: 0,
    startedAt: null,
    updatedAt: 0,
  };
  timerFired = {};
  timerLocalAt = 0;
  timerWidgetParts = null;
  serverTimeOffsetMs = 0;
  online = false;
  pending = 0;
  // Room settings the server owns: back to their defaults, so the next room
  // isn't briefly rendered with this one's until its first snapshot lands.
  spreadOpen = false;
  freeSpeakerCount = 3;
  // Per-room view state. Without this the next room opens with this one's
  // expanded spread rows, dashboard selection and open ballot.
  openSpread = {};
  ballotOpen = false;
  dashboardSelected = { kind: "speaker", s: 0 };
  dashIncludeTrainees = false;
  lastFocusByView = {};
  promotingOffline = false;
  paintTimer();
  showView("namen");
}
function leaveRoom() {
  if (!ME) return;
  recordRecentRoom(ME.code, ME.name, ME.is_chair); // capture the final filled count
  resetRoomState();
  // history.pushState keeps a back-button escape hatch: a stray tap on
  // "Verlassen" is recoverable since opd.session.<code> stays around.
  setHistoryUrl("pushState", { left: true }, "/");
  showLobby();
}

// Always defaults to light, regardless of the device's system setting.
// Only an explicit tap on the theme button ever switches to dark.
var THEME_CYCLE = ["light", "dark"];
var THEME_LABEL = { light: "Heller Modus", dark: "Dunkler Modus" };
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t || "light");
  var b = document.getElementById("themeBtn");
  if (b) b.textContent = THEME_LABEL[t] || "Light";
}
function cycleTheme() {
  var cur = LS.get("opd.theme", "light");
  var next = THEME_CYCLE[(THEME_CYCLE.indexOf(cur) + 1) % THEME_CYCLE.length];
  LS.set("opd.theme", next);
  applyTheme(next);
}

// Personal, per-device preference: type a school grade (e.g. "2+") instead
// of raw points on Blatt/Teampunkte, seeing the resulting points below
// instead of the usual points->grade hint.
function gradeInputMode() {
  return !!LS.get("opd.gradeInput", false);
}
function applyGradeInputLabel() {
  var b = document.getElementById("menuGradeInput");
  if (b)
    b.textContent = "Eingabemodus: " + (gradeInputMode() ? "Noten" : "Punkte");
}

function applyTimerDisplayLabel() {
  var b = document.getElementById("menuTimerDisplay");
  if (b)
    b.textContent =
      "Timeranzeige: " + (timerCountUp() ? "hochzählen" : "herunterzählen");
}
function toggleTimerCountUp() {
  LS.set("opd.timerCountUp", !timerCountUp());
  applyTimerDisplayLabel();
  paintTimer();
  refreshTimerModal();
}

function applyBellVoiceLabel() {
  var b = document.getElementById("menuBellVoice");
  if (b) b.textContent = "Zeitsignal: " + BELL_VOICES[bellVoice()].label;
}
// Rings the newly picked voice straight away - this is a choice about a
// sound, so hearing it beats reading a label. Deliberately uses testBell(),
// which ignores mute, since the tap itself is the request to hear it.
function toggleBellVoice() {
  LS.set("opd.bellVoice", bellVoice() === "hoch" ? "tief" : "hoch");
  applyBellVoiceLabel();
  testBell();
}
function toggleGradeInput() {
  LS.set("opd.gradeInput", !gradeInputMode());
  applyGradeInputLabel();
  render();
}

// Resumes a session if a judge reconnects
function resume() {
  if (!ME) return;
  if (ME.pendingCreate) {
    promoteOfflineRoom();
    return;
  }
  wsTries = 0;
  if (wsTimer) {
    clearTimeout(wsTimer);
    wsTimer = null;
  }
  connect();
  flush();
  if (ws && ws.readyState === 1) resync();
  acquireWakeLock();
}
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") resume();
});
window.addEventListener("online", resume);
window.addEventListener("pageshow", resume);
window.addEventListener("focus", resume);
var resizeTimer = null;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 150);
});
setInterval(function () {
  if (!ME) return;
  if (ME.pendingCreate) {
    promoteOfflineRoom();
    return;
  }
  if (ws && ws.readyState === 1) {
    try {
      ws.send("ping");
    } catch (e) {}
  } else connect();
  if (Object.keys(queue).length) flush();
}, 20000);

var wakeLock = null;
function acquireWakeLock() {
  if (!("wakeLock" in navigator)) return;
  navigator.wakeLock
    .request("screen")
    .then(function (l) {
      wakeLock = l;
      l.addEventListener("release", function () {
        wakeLock = null;
      });
    })
    .catch(function () {});
}

function paintBar() {
  var d = document.getElementById("cdot"),
    s = document.getElementById("cstate");
  if (!d) return;
  d.className = "dot " + (online ? "on" : "off");
  s.textContent =
    ME && ME.pendingCreate
      ? "Offline-Raum · wird erstellt, sobald Verbindung besteht"
      : online
        ? pending
          ? pending + " ausstehend"
          : "Synchronisiert"
        : pending
          ? "offline · " + pending + " gespeichert"
          : "offline";
  document.getElementById("whoami").textContent = ME
    ? ME.name + (ME.is_chair ? " · Chair" : "") + " · " + ME.code
    : "";
  document
    .getElementById("menuFreeSpeakers")
    .classList.toggle("hide", !ME || !ME.is_chair);
  document
    .getElementById("menuGradeInput")
    .classList.toggle("hide", !isDesktopWidth());
  document
    .getElementById("shortcutsBtn")
    .classList.toggle("hide", !isDesktopWidth());
  paintTimer();
}

// Scoring state for local judge
var NC = CRITERIA.length,
  NT = TEAMCATS.length;
var view = "namen",
  cs = 0,
  cc = 0,
  ct = 0,
  ctc = 0,
  topOpen = false;
var hist = [];
var thist = [];

// Deductions
var deductions = {};
var DED_POINTS = { "": 0, small: 3, big: 15 };
function deductionLevel(s) {
  return deductions[s] || "";
}
function deductionPoints(s) {
  return DED_POINTS[deductionLevel(s)] || 0;
}

// Judge exclusions
var myExclusions = {}; // target -> true
var remoteExclusions = {}; // judge_id -> {target: true}

// Offline judges: chair-entered sums for judges not using the app.
var offlineJudges = {}; // id -> {name}
var offlineScores = {}; // id -> {target: points}

function sget(s, c) {
  var v = mine[kk("s" + s, CRITERIA[c].key)];
  return v === undefined ? null : v;
}
function tget(t, c) {
  var v = mine[kk("t" + t, TEAMCATS[c].key)];
  return v === undefined ? null : v;
}
function zwischensumme(s) {
  var t = 0,
    any = false;
  for (var c = 0; c < NC; c++) {
    var v = sget(s, c);
    if (v !== null) {
      t += v;
      any = true;
    }
  }
  return any ? t : null;
}
function personPunkte(s) {
  var z = zwischensumme(s);
  return z === null ? 0 : Math.max(0, z - deductionPoints(s));
}
function teamPunkte(t) {
  var sum = 0;
  for (var c = 0; c < NT; c++) {
    var v = tget(t, c);
    if (v !== null) sum += v;
  }
  return Math.max(0, sum);
}
// Speaker indices belonging to a team, in speaking order. Indices, not
// SPEAKERS entries: "s"+s is the key every score/note/exclusion is stored
// under, so callers always need the index anyway.
function speakersOfTeam(t) {
  var out = [];
  SPEAKERS.forEach(function (sp, s) {
    if (sp.team === t) out.push(s);
  });
  return out;
}
function firstEmptyS(s) {
  for (var c = 0; c < NC; c++) if (sget(s, c) === null) return c;
  return -1;
}
// Own team points + own speakers' totals - shared by Übersicht and Schnelleingabe's Teampunkte row.
function myTeamGrand(t) {
  var teamSpeakers = speakersOfTeam(t);
  var speakerSum = 0,
    scoredCount = 0;
  teamSpeakers.forEach(function (s) {
    if (firstEmptyS(s) !== -1) return; // not fully scored yet
    speakerSum += personPunkte(s);
    scoredCount++;
  });
  return {
    speakerSum: speakerSum,
    scoredCount: scoredCount,
    total: teamSpeakers.length,
    partial: scoredCount < teamSpeakers.length,
    grand: teamPunkte(t) + speakerSum,
  };
}
function firstEmptyT(t) {
  for (var c = 0; c < NT; c++) if (tget(t, c) === null) return c;
  return -1;
}
function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}
function judgeChips(judges) {
  var host = el("div", "bkjudges");
  judges.forEach(function (j) {
    var chip = el("span", "chip");
    chip.appendChild(document.createTextNode(j.name + " "));
    chip.appendChild(el("b", null, String(j.v)));
    host.appendChild(chip);
  });
  return host;
}

function buildPad(host, scaleMax, onPick) {
  host.innerHTML = "";
  (topOpen ? NOTEN : NOTEN.slice(TOPROWS, NOTEN.length - BOTTOMROWS)).forEach(
    function (n) {
      var row = el("div", "noterow"),
        lbl = el("div", "notelbl");
      lbl.appendChild(el("div", "a", n.a));
      if (n.b) lbl.appendChild(el("div", "b", n.b));
      row.appendChild(lbl);
      // Fewer than 3 cells (top/bottom rows) - stretch them to fill the
      // row's width instead of leaving blank filler columns.
      var keys = el(
        "div",
        "notekeys" + (n.cells.length < 3 ? " notekeys-fill" : ""),
      );
      n.cells.forEach(function (v, j) {
        var b = el("button", "key");
        b.appendChild(el("div", "n", String(mid(convert(v, scaleMax)))));
        b.appendChild(el("div", "m", n.marks[j] || "Kat. " + v));
        b.addEventListener("click", function () {
          onPick(v);
        });
        keys.appendChild(b);
      });
      row.appendChild(keys);
      host.appendChild(row);
    },
  );
  var t = el(
    "button",
    "wide",
    topOpen ? "Randwerte ausblenden" : "Weitere Werte",
  );
  t.addEventListener("click", function () {
    topOpen = !topOpen;
    render();
  });
  host.appendChild(t);
}

function pickSpeaker(v) {
  var prev = sget(cs, cc);
  var wasEmpty = prev === null;
  hist.push({ s: cs, c: cc, prev: prev });
  write("s" + cs, CRITERIA[cc].key, v);
  if (wasEmpty) {
    var nx = firstEmptyS(cs);
    if (nx === -1) {
      var na = nextActiveSpeaker(cs);
      if (na !== -1) {
        cs = na;
        cc = Math.max(0, firstEmptyS(cs));
      }
    } else cc = nx;
  }
  render();
}
function renderSheet() {
  document.getElementById("spkName").textContent = speakerLabel(cs);
  setTeamAccent(document.querySelector("#v-sheet .card"), teamOf(cs));
  var z = zwischensumme(cs);
  document.getElementById("spkSub").textContent =
    "Rede " +
    activeOrdinal(cs) +
    " von " +
    activeSpeakerCount() +
    (z !== null ? " · Zwischensumme " + z : "");
  document.getElementById("prev").disabled = prevActiveSpeaker(cs) === -1;
  document.getElementById("next").disabled = nextActiveSpeaker(cs) === -1;

  var host = document.getElementById("crits");
  host.innerHTML = "";
  CRITERIA.forEach(function (cr, i) {
    var v = sget(cs, i),
      m = v === null ? null : markOf(v);
    var row = el(
      "div",
      "crit" + (v === null ? " empty" : "") + (i === cc ? " live" : ""),
    );
    row.tabIndex = 0;
    row.appendChild(el("span", "nm", cr.label));
    var rt = el("span", "rt");
    rt.appendChild(el("span", "mk", m ? m.name : ""));
    rt.appendChild(el("span", "vl", v === null ? "—" : String(v)));
    row.appendChild(rt);
    row.addEventListener("click", function () {
      cc = i;
      render();
    });
    host.appendChild(row);
  });
  var deduRow = document.getElementById("deduRow");
  deduRow.classList.toggle("hide", !ME.is_chair);
  var lvl = deductionLevel(cs);
  [].forEach.call(deduRow.querySelectorAll(".dedopt"), function (b) {
    b.classList.toggle("on", b.dataset.lvl === lvl);
  });
  document.getElementById("spkTot").textContent = String(personPunkte(cs));
  var spkDed = document.getElementById("spkDed");
  spkDed.textContent = lvl ? "(−" + deductionPoints(cs) + ")" : "";
  spkDed.classList.toggle("hide", !lvl);

  var excluded = !!myExclusions["s" + cs];
  var eb = document.getElementById("exclBtn");
  eb.textContent = excluded ? "In Wertung eingehen" : "Aus Wertung nehmen";
  eb.classList.toggle("on", excluded);
  document
    .querySelector("#v-sheet .card")
    .classList.toggle("excluded", excluded);

  buildPad(document.getElementById("padHost"), 20, pickSpeaker);

  document
    .getElementById("undoBtn")
    .classList.toggle("hide", hist.length === 0);
}

function pickTeam(v) {
  var prev = tget(ct, ctc);
  var wasEmpty = prev === null;
  thist.push({ t: ct, c: ctc, prev: prev });
  write("t" + ct, TEAMCATS[ctc].key, mid(convert(v, TEAMCATS[ctc].max)));
  if (wasEmpty) {
    var nx = firstEmptyT(ct);
    ctc = nx === -1 ? ctc : nx;
  }
  render();
}
function nudgeTeam(i, d) {
  var v = tget(ct, i);
  if (v === null) return;
  thist.push({ t: ct, c: i, prev: v });
  write(
    "t" + ct,
    TEAMCATS[i].key,
    Math.max(0, Math.min(TEAMCATS[i].max, v + d)),
  );
  render();
}
function renderTeam() {
  document.getElementById("tmName").textContent = TEAMS[ct];
  setTeamAccent(document.querySelector("#v-team .card"), ct);
  document.getElementById("tmSub").textContent = "Team " + (ct + 1) + " von 2";
  document.getElementById("tprev").disabled = ct === 0;
  document.getElementById("tnext").disabled = ct === 1;

  var host = document.getElementById("tcrits");
  host.innerHTML = "";
  var grp = null;
  TEAMCATS.forEach(function (cat, i) {
    if (cat.grp !== grp) {
      grp = cat.grp;
      host.appendChild(el("div", "grp", grp));
    }
    var v = tget(ct, i);
    var row = el(
      "div",
      "crit" + (v === null ? " empty" : "") + (i === ctc ? " live" : ""),
    );
    row.appendChild(el("span", "nm", cat.label));
    var rt = el("span", "rt");
    if (v === null) {
      rt.appendChild(el("span", "mk", ""));
      rt.appendChild(el("span", "vl", "—"));
    } else {
      rt.appendChild(el("span", "mk", markOf(katOf(v, cat.max)).name));
      var m = el("button", "adj", "−"),
        p = el("button", "adj", "+");
      m.disabled = v <= 0;
      p.disabled = v >= cat.max;
      m.addEventListener("click", function (e) {
        e.stopPropagation();
        nudgeTeam(i, -1);
      });
      p.addEventListener("click", function (e) {
        e.stopPropagation();
        nudgeTeam(i, 1);
      });
      rt.appendChild(m);
      rt.appendChild(el("span", "vl", String(v)));
      rt.appendChild(p);
    }
    row.appendChild(rt);
    row.addEventListener("click", function () {
      ctc = i;
      render();
    });
    host.appendChild(row);
  });
  document.getElementById("tmTot").textContent = String(teamPunkte(ct));
  document.getElementById("tmMax").textContent = String(TEAM_MAX);

  var texcluded = !!myExclusions["t" + ct];
  var teb = document.getElementById("texclBtn");
  teb.textContent = texcluded
    ? "In die Wertung eingehen"
    : "Aus der Wertung herausnehmen";
  teb.classList.toggle("on", texcluded);
  document
    .querySelector("#v-team .card")
    .classList.toggle("excluded", texcluded);

  buildPad(document.getElementById("tpadHost"), TEAMCATS[ctc].max, pickTeam);

  document
    .getElementById("tundoBtn")
    .classList.toggle("hide", thist.length === 0);
}

function renderMatrix() {
  var h = ['<table><tr><th class="l">Rede</th>'];
  CRITERIA.forEach(function (c) {
    h.push("<th>" + c.short + "</th>");
  });
  h.push("<th>Σ</th><th>Ab</th><th>P</th></tr>");
  activeSpeakerIndices().forEach(function (s) {
    var sp = SPEAKERS[s];
    var lbl = sp.label
      .replace("Eröffnungsrede", "Eröff.")
      .replace("Ergänzungsrede", "Ergän.")
      .replace("Schlussrede", "Schluss")
      .replace("Fraktionsfreie Rede", "FFR")
      .replace("Regierung", "Reg")
      .replace("Opposition", "Opp");
    var nm = getName(s);
    if (nm) lbl += " (" + nm + ")";
    h.push(
      '<tr class="' +
        (deductionPoints(s) ? "deducted" : "") +
        '"><td class="l">' +
        esc(lbl) +
        "</td>",
    );
    for (var c = 0; c < NC; c++) {
      var v = sget(s, c);
      h.push(
        '<td class="' +
          (v === null ? "mt" : "") +
          '">' +
          (v === null ? "·" : v) +
          "</td>",
      );
    }
    var z = zwischensumme(s);
    h.push(
      '<td class="' +
        (z === null ? "mt" : "tot") +
        '">' +
        (z === null ? "·" : z) +
        "</td>",
    );
    h.push('<td class="mt">' + (deductionPoints(s) || "·") + "</td>");
    h.push(
      '<td class="' +
        (z === null ? "mt" : "tot") +
        '">' +
        (z === null ? "·" : personPunkte(s)) +
        "</td></tr>",
    );
  });
  h.push(
    '</table><div style="margin-top:14px"><table><tr><th class="l">Team</th><th>Teampunkte</th><th>Gesamt</th></tr>',
  );
  var anyPartial = false;
  TEAMS.forEach(function (t, i) {
    var g = myTeamGrand(i);
    var grand = g.grand;
    var partial = g.partial;
    if (partial) anyPartial = true;
    h.push(
      '<tr><td class="l">' +
        t +
        '</td><td class="tot">' +
        teamPunkte(i) +
        "/ " +
        TEAM_MAX +
        " </td>" +
        '<td class="tot">' +
        grand +
        (partial ? " *" : "") +
        "</td></tr>",
    );
  });
  h.push("</table>");
  if (anyPartial)
    h.push(
      '<p class="note">* vorläufig — noch nicht alle Reden dieses Teams bewertet.</p>',
    );
  h.push("</div>");
  document.getElementById("matrix").innerHTML = h.join("");
}

// Chair
var openSpread = {};
var ballotOpen = false;
var offlineJudgesOpen = false;
var spreadOpen = false;
function updateChairTab() {
  var tab = document.getElementById("tabChair");
  var show = ME.is_chair || spreadOpen;
  tab.classList.toggle("hide", !show);
  tab.textContent = ME.is_chair ? "Chair" : "Spreads";
}
function hiddenToggleMessage(name, goingHidden) {
  return goingHidden
    ? name + " wirklich aus der Wertung nehmen?"
    : name + " wieder als Wing zur Wertung hinzufügen?";
}
// Shared by the mobile chair view and the desktop dashboard's judge chips -
// also handles an offline judge (id prefixed OFFLINE_ID_PREFIX), which has
// no row in the real judges table and so needs its own endpoint/state.
function confirmHiddenToggle(id, name, goingHidden) {
  openConfirmModal({
    text: hiddenToggleMessage(name, goingHidden),
    confirmLabel: goingHidden ? "Zu Trainee" : "Zu Wing",
    onConfirm: function () {
      if (isOfflineId(id)) {
        setOfflineHidden(offlineRealId(id), goingHidden);
        return;
      }
      fetch(
        "/api/rooms/" +
          ME.code +
          "/judges/" +
          id +
          "/hidden?hidden=" +
          goingHidden +
          "&token=" +
          encodeURIComponent(ME.token),
        { method: "POST" },
      );
    },
  });
}
function activeJudges() {
  return Object.keys(peers).filter(function (id) {
    return !peers[id].hidden;
  });
}
// Chair's column always comes first in a ballot comparison table.
function chairFirstIds(ids) {
  return ids.slice().sort(function (a, b) {
    return (
      (peers[b] && peers[b].is_chair ? 1 : 0) -
      (peers[a] && peers[a].is_chair ? 1 : 0)
    );
  });
}
// Mean of a list of numbers; null for an empty list, so callers can render
// "·" without a separate check. avgRound() is the display variant - the
// tables that print a raw mean format it themselves (toFixed(1)).
function mean(vals) {
  if (!vals.length) return null;
  var sum = vals.reduce(function (a, b) {
    return a + b;
  }, 0);
  return sum / vals.length;
}
function avgRound(vals) {
  var m = mean(vals);
  return m === null ? null : Math.round(m * 100) / 100;
}
// Shared chair math, used by both mobile chair view and desktop dashboard.
// includeHidden: local-only override for the Redner:innen/Teampunkte spread
// toggle - every other caller leaves it off and gets the usual
// trainees-excluded math untouched.
// Offline ids are prefixed so they can never collide with a real judge id
// and are trivially recognized by every helper below.
var OFFLINE_ID_PREFIX = "off:";
function isOfflineId(id) {
  return id.indexOf(OFFLINE_ID_PREFIX) === 0;
}
function offlineRealId(id) {
  return id.slice(OFFLINE_ID_PREFIX.length);
}
function computeChairSummary(includeHidden) {
  var offlineIds = Object.keys(offlineJudges)
    .filter(function (id) {
      return includeHidden || !offlineJudges[id].hidden;
    })
    .map(function (id) {
      return OFFLINE_ID_PREFIX + id;
    });
  var ids = (includeHidden ? Object.keys(peers) : activeJudges()).concat(
    offlineIds,
  );
  // Only sums exist for an offline judge, so they never have per-criterion
  // detail (scan()/scanGroup() below stay real-judges-only for that reason)
  // and can't be individually excluded the way a real judge's target can.
  function includedFor(id, target) {
    if (isOfflineId(id)) return true;
    return !(remoteExclusions[id] && remoteExclusions[id][target]);
  }
  function nameOf(id) {
    if (isOfflineId(id)) {
      var oj = offlineJudges[offlineRealId(id)];
      return (oj && oj.name) || "Offline-Juror";
    }
    return peers[id] ? peers[id].name : id;
  }
  function remoteTotal(id, s) {
    if (isOfflineId(id)) {
      var v = (offlineScores[offlineRealId(id)] || {})["s" + s];
      return v === undefined ? null : v;
    }
    var sum = 0;
    for (var c = 0; c < NC; c++) {
      var v = (remote[id] || {})[kk("s" + s, CRITERIA[c].key)];
      if (v === undefined) return null;
      sum += v;
    }
    return sum - deductionPoints(s);
  }
  function remoteTeamTotal(id, t) {
    if (isOfflineId(id)) {
      var v = (offlineScores[offlineRealId(id)] || {})["t" + t];
      return v === undefined ? 0 : v;
    }
    var sum = 0;
    for (var c = 0; c < NT; c++) {
      var v = (remote[id] || {})[kk("t" + t, TEAMCATS[c].key)];
      if (v !== undefined) sum += v;
    }
    return sum;
  }

  var cells = [];
  function scan(target, criterion, label) {
    var vals = [],
      names = [],
      judges = [];
    ids.forEach(function (id) {
      if (!includedFor(id, target)) return;
      var v = (remote[id] || {})[kk(target, criterion)];
      if (v !== undefined) {
        vals.push(v);
        names.push(peers[id].name + " " + v);
        judges.push({ name: peers[id].name, v: v });
      }
    });
    if (vals.length < 2) return;
    var mx = Math.max.apply(null, vals),
      mn = Math.min.apply(null, vals);
    cells.push({
      label: label,
      spread: mx - mn,
      avg: mean(vals),
      n: vals.length,
      detail: names.join(" · "),
      judges: judges,
      key: target + "/" + criterion,
    });
  }
  activeSpeakerIndices().forEach(function (s) {
    CRITERIA.forEach(function (c) {
      scan("s" + s, c.key, labelOf("s" + s, c.key));
    });
  });
  TEAMS.forEach(function (_, t) {
    TEAMCATS.forEach(function (c) {
      scan("t" + t, c.key, labelOf("t" + t, c.key));
    });
  });
  cells.sort(function (a, b) {
    return b.spread - a.spread;
  });

  function scanGroup(target, keys, label) {
    var vals = [],
      judges = [];
    ids.forEach(function (id) {
      if (!includedFor(id, target)) return;
      var sum = 0,
        complete = true;
      keys.forEach(function (k) {
        var v = (remote[id] || {})[kk(target, k)];
        if (v === undefined) {
          complete = false;
          return;
        }
        sum += v;
      });
      if (!complete) return;
      vals.push(sum);
      judges.push({ name: peers[id].name, v: sum });
    });
    if (vals.length < 2) return null;
    return {
      label: label,
      spread: Math.max.apply(null, vals) - Math.min.apply(null, vals),
      avg: mean(vals),
      n: vals.length,
      judges: judges,
      key: target + "/grp-" + label,
      catKeys: keys.map(function (k) {
        return target + "/" + k;
      }),
    };
  }
  var TEAMGROUPS = TEAMGROUPS_INFO.map(function (g) {
    return g.label;
  });
  var groupCells = [];
  TEAMS.forEach(function (tm, t) {
    TEAMGROUPS.forEach(function (g) {
      var keys = TEAMCATS.filter(function (c) {
        return c.grp === g;
      }).map(function (c) {
        return c.key;
      });
      var gc = scanGroup("t" + t, keys, tm + " · " + g);
      if (gc) groupCells.push(gc);
    });
  });
  groupCells.sort(function (a, b) {
    return b.spread - a.spread;
  });

  // Display by total score
  var totals = [];
  activeSpeakerIndices().forEach(function (s) {
    var vals = [],
      names = [],
      judges = [];
    ids.forEach(function (id) {
      if (!includedFor(id, "s" + s)) return;
      var v = remoteTotal(id, s);
      if (v !== null) {
        vals.push(v);
        names.push(nameOf(id) + " " + v);
        judges.push({ name: nameOf(id), v: v });
      }
    });
    if (vals.length < 2) return;
    var mx = Math.max.apply(null, vals),
      mn = Math.min.apply(null, vals);
    totals.push({
      label: speakerLabel(s),
      spread: mx - mn,
      avg: mean(vals),
      n: vals.length,
      detail: names.join(" · "),
      judges: judges,
      key: "s" + s,
    });
  });
  totals.sort(function (a, b) {
    return b.spread - a.spread;
  });

  // Full result overview, in speaking order
  var speakerRows = SPEAKERS.map(function (_, s) {
    var vals = [];
    ids.forEach(function (id) {
      if (!includedFor(id, "s" + s)) return;
      var v = remoteTotal(id, s);
      if (v !== null) vals.push(v);
    });
    return { label: speakerLabel(s), avg: mean(vals), n: vals.length };
  });
  // speakerRows stays positional (summary.speakerRows[s] is looked up by
  // raw index elsewhere) - but a hidden free speaker's stale avg must not
  // win "best speech" while their slot is inactive.
  var bestSpeakerAvg = speakerRows.reduce(function (m, r, s) {
    return isActiveSpeaker(s) && r.avg !== null && r.avg > m ? r.avg : m;
  }, -Infinity);

  var teamRows = TEAMS.map(function (tm, t) {
    var vals = [];
    ids.forEach(function (id) {
      if (!includedFor(id, "t" + t)) return;
      vals.push(remoteTeamTotal(id, t));
    });
    var teamAvg = mean(vals);
    var teamSpeakers = speakersOfTeam(t);
    var speakerSum = 0,
      scoredCount = 0;
    teamSpeakers.forEach(function (s) {
      var svals = [];
      ids.forEach(function (id) {
        if (!includedFor(id, "s" + s)) return;
        var v = remoteTotal(id, s);
        if (v !== null) svals.push(v);
      });
      var avg = mean(svals);
      if (avg === null) return;
      speakerSum += avg;
      scoredCount++;
    });
    var grand =
      teamAvg !== null && scoredCount > 0 ? teamAvg + speakerSum : null;
    var partial = grand !== null && scoredCount < teamSpeakers.length;
    return {
      label: tm,
      teamAvg: teamAvg,
      grand: grand,
      partial: partial,
    };
  });
  var bestGrand = teamRows.reduce(function (m, r) {
    return r.grand !== null && r.grand > m ? r.grand : m;
  }, -Infinity);
  var teamsComparable = teamRows.every(function (r) {
    return r.grand !== null;
  });

  return {
    ids: ids,
    includedFor: includedFor,
    nameOf: nameOf,
    remoteTotal: remoteTotal,
    remoteTeamTotal: remoteTeamTotal,
    cells: cells,
    groupCells: groupCells,
    teamGroups: TEAMGROUPS,
    totals: totals,
    speakerRows: speakerRows,
    bestSpeakerAvg: bestSpeakerAvg,
    teamRows: teamRows,
    bestGrand: bestGrand,
    teamsComparable: teamsComparable,
  };
}

// Speaker/team result tables - shared markup for the mobile "Endergebnis"
// card and the desktop dashboard's final-result panel.
function finalResultHTML(summary) {
  var fh = [
    '<table class="finalTbl"><tr><th class="l">Redner:in</th><th>Ø Punkte</th><th>n</th></tr>',
  ];
  summary.speakerRows.forEach(function (r, s) {
    if (!isActiveSpeaker(s)) return;
    var isBest = r.avg !== null && r.avg === summary.bestSpeakerAvg;
    fh.push(
      '<tr class="' +
        (deductionPoints(s) ? "deducted" : "") +
        '"><td class="l' +
        (isBest ? " best" : "") +
        '">' +
        esc(r.label) +
        '</td><td class="' +
        (r.avg === null ? "mt" : "tot") +
        (isBest ? " best" : "") +
        '">' +
        (r.avg === null ? "·" : r.avg.toFixed(1)) +
        '</td><td class="mt">' +
        r.n +
        "</td></tr>",
    );
  });

  fh.push(
    '</table><table class="finalTbl" style="margin-top:14px"><tr><th class="l">Team</th><th>Ø Team</th><th>Gesamt</th></tr>',
  );
  summary.teamRows.forEach(function (r) {
    var isBest =
      summary.teamsComparable &&
      r.grand !== null &&
      r.grand === summary.bestGrand;
    var grandLabel =
      r.grand === null ? "·" : r.grand.toFixed(1) + (r.partial ? " *" : "");
    fh.push(
      '<tr><td class="l' +
        (isBest ? " best" : "") +
        '">' +
        esc(r.label) +
        '</td><td class="' +
        (r.teamAvg === null ? "mt" : "") +
        '">' +
        (r.teamAvg === null ? "·" : r.teamAvg.toFixed(1)) +
        '</td><td class="' +
        (r.grand === null ? "mt" : "tot") +
        (isBest ? " best" : "") +
        '">' +
        grandLabel +
        "</td></tr>",
    );
  });
  fh.push("</table>");
  var anyTeamPartial = summary.teamRows.some(function (r) {
    return r.partial;
  });
  if (anyTeamPartial)
    fh.push(
      '<p class="note">* vorläufig — noch nicht alle Reden dieses Teams bewertet.</p>',
    );
  return fh.join("");
}

// One column per adjudicator (chair first), one row per speaker + a team-total row - shared by mobile "Ballot anzeigen" and the dashboard.
function ballotSepRow(ncols) {
  var tr = el("tr", "tsep");
  var td = el("td");
  td.setAttribute("colspan", String(ncols));
  tr.appendChild(td);
  return tr;
}

function fullBallotTable(summary) {
  var chairFirst = chairFirstIds(summary.ids);
  var ncols = chairFirst.length + 2;
  var table = el("table", "ballottable");
  var head = el("tr");
  head.appendChild(el("th", "l", "Redner:in"));
  chairFirst.forEach(function (id) {
    head.appendChild(el("th", null, summary.nameOf(id)));
  });
  head.appendChild(el("th", null, "Ø"));
  table.appendChild(head);

  // {vals, avg, tds, avgTd} per row, so best-speech/best-team can be marked once every row is built.
  var speakerMeta = [];
  activeSpeakerIndices().forEach(function (s) {
    var tr = el("tr", deductionLevel(s) ? "deducted" : null);
    tr.appendChild(el("td", "l", speakerLabel(s)));
    var vals = [],
      tds = [];
    chairFirst.forEach(function (id) {
      var v = summary.remoteTotal(id, s);
      var td = el("td", null, v === null ? "·" : String(v));
      tr.appendChild(td);
      vals.push(summary.includedFor(id, "s" + s) ? v : null);
      tds.push(td);
    });
    var scored = vals.filter(function (v) {
      return v !== null;
    });
    var avg = avgRound(scored);
    var avgTd = el("td", "tot", avg === null ? "·" : String(avg));
    tr.appendChild(avgTd);
    table.appendChild(tr);
    speakerMeta.push({ vals: vals, avg: avg, tds: tds, avgTd: avgTd, tr: tr });
  });
  markColumnBest(speakerMeta, chairFirst.length);

  table.appendChild(ballotSepRow(ncols));

  TEAMS.forEach(function (tm, t) {
    var tr = el("tr");
    var teamAbbr = tm.replace("Regierung", "Reg").replace("Opposition", "Opp");
    tr.appendChild(el("td", "l tot", "Teampunkte " + teamAbbr));
    var vals = [];
    chairFirst.forEach(function (id) {
      var v = summary.remoteTeamTotal(id, t);
      tr.appendChild(el("td", "tot", String(v)));
      if (summary.includedFor(id, "t" + t)) vals.push(v);
    });
    var avg = avgRound(vals);
    tr.appendChild(el("td", "tot", avg === null ? "·" : String(avg)));
    table.appendChild(tr);
  });

  table.appendChild(ballotSepRow(ncols));

  // Each team's grand total per judge (team pts + own speakers) - the higher team per judge gets the "best" mark.
  var teamMeta = [];
  TEAMS.forEach(function (tm, t) {
    var teamSpeakers = speakersOfTeam(t);
    var tr = el("tr", "grandtot");
    var teamAbbr = tm.replace("Regierung", "Reg").replace("Opposition", "Opp");
    tr.appendChild(el("td", "l tot", "Gesamt " + teamAbbr));
    var vals = [],
      tds = [];
    chairFirst.forEach(function (id) {
      var teamPts = summary.remoteTeamTotal(id, t);
      var speakerSum = 0,
        complete = true;
      teamSpeakers.forEach(function (s) {
        var v = summary.remoteTotal(id, s);
        if (v === null) {
          complete = false;
          return;
        }
        speakerSum += v;
      });
      var grand = complete ? teamPts + speakerSum : null;
      var td = el("td", "tot", grand === null ? "·" : String(grand));
      tr.appendChild(td);
      vals.push(summary.includedFor(id, "t" + t) ? grand : null);
      tds.push(td);
    });
    var scored = vals.filter(function (v) {
      return v !== null;
    });
    var avg = avgRound(scored);
    var avgTd = el("td", "tot", avg === null ? "·" : String(avg));
    tr.appendChild(avgTd);
    table.appendChild(tr);
    teamMeta.push({ vals: vals, avg: avg, tds: tds, avgTd: avgTd, tr: tr });
  });
  markColumnBest(teamMeta, chairFirst.length);

  return table;
}

// Marks the strictly-highest row per column; a tie gets no mark.
function markColumnBest(rows, ncols) {
  for (var col = 0; col < ncols; col++) {
    var best = null,
      bestRow = null,
      tie = false;
    rows.forEach(function (r) {
      var v = r.vals[col];
      if (v === null) return;
      if (best === null || v > best) {
        best = v;
        bestRow = r;
        tie = false;
      } else if (v === best) {
        tie = true;
      }
    });
    if (bestRow && !tie) bestRow.tds[col].classList.add("best");
  }
  var bestAvg = null,
    bestAvgRow = null,
    avgTie = false;
  rows.forEach(function (r) {
    if (r.avg === null) return;
    if (bestAvg === null || r.avg > bestAvg) {
      bestAvg = r.avg;
      bestAvgRow = r;
      avgTie = false;
    } else if (r.avg === bestAvg) {
      avgTie = true;
    }
  });
  if (bestAvgRow && !avgTie) {
    bestAvgRow.avgTd.classList.add("best");
    bestAvgRow.tr.classList.add("rowbest");
  }
}

function renderChair() {
  document
    .getElementById("chairRoomCard")
    .classList.toggle("hide", !ME.is_chair);
  document
    .getElementById("chairFinalCard")
    .classList.toggle("hide", !ME.is_chair);

  if (ME.is_chair) {
    document.getElementById("chCode").textContent = ME.code;
    var url = location.origin + "/r/" + ME.code;
    document.getElementById("shareUrl").value = url;

    var spb = document.getElementById("btnSpreadOpen");
    spb.textContent = spreadOpen ? "Spreads sperren" : "Spreads freigeben";
    spb.classList.toggle("on", spreadOpen);

    var jh = document.getElementById("judges");
    jh.innerHTML = "";
    Object.keys(peers).forEach(function (id) {
      var j = peers[id];
      var row = el("div", "jrow");
      var dot = el("span", "dot " + (j.online ? "on" : "off"));
      row.appendChild(dot);
      row.appendChild(
        el(
          "span",
          "n",
          j.name +
            (j.is_chair ? " · Chair" : "") +
            (j.hidden ? " · (Trainee)" : ""),
        ),
      );
      row.appendChild(el("span", "p", j.filled + " / " + expectedCellCount()));
      if (!j.is_chair) {
        var x = el("button", "x", j.hidden ? "Zu Wing" : "Zu Trainee");
        x.addEventListener("click", function () {
          confirmHiddenToggle(id, j.name, !j.hidden);
        });
        row.appendChild(x);
      }
      jh.appendChild(row);
    });
    Object.keys(offlineJudges).forEach(function (id) {
      var j = offlineJudges[id];
      var row = el("div", "jrow");
      row.appendChild(el("span", "dot off"));
      row.appendChild(
        el(
          "span",
          "n",
          j.name + " · Offline" + (j.hidden ? " · (Trainee)" : ""),
        ),
      );
      row.appendChild(
        el(
          "span",
          "p",
          offlineFilledCount(id) + " / " + offlineExpectedCellCount(),
        ),
      );
      var x = el("button", "x", j.hidden ? "Zu Wing" : "Zu Trainee");
      x.addEventListener("click", function () {
        confirmHiddenToggle(OFFLINE_ID_PREFIX + id, j.name, !j.hidden);
      });
      row.appendChild(x);
      jh.appendChild(row);
    });

    var ojb = document.getElementById("btnOfflineJudges");
    ojb.textContent = offlineJudgesOpen
      ? "Offline-Jurierende ausblenden"
      : "Offline-Jurierende";
    var ojWrap = document.getElementById("offlineJudgesWrap");
    ojWrap.classList.toggle("hide", !offlineJudgesOpen);
    // Guard against a remote score/judges update rebuilding this list
    if (offlineJudgesOpen && !dashEditGuard(ojWrap))
      buildOfflineJuryTable(ojWrap);
  }

  var summary = computeChairSummary();
  var cells = summary.cells,
    groupCells = summary.groupCells,
    totals = summary.totals;

  var th = document.getElementById("totspread");
  th.innerHTML = "";
  if (!totals.length) {
    th.appendChild(
      el("p", "note", "Noch keine zwei vollständig bewerteten Reden."),
    );
  } else {
    totals.forEach(function (c) {
      var grp = el("div", "totgrp");
      var row = el("div", "totrow" + (c.spread >= 5 ? " hot" : ""));
      row.appendChild(el("span", "lb", c.label));
      row.appendChild(
        el("span", "sv", "ø " + c.avg.toFixed(1) + " · n " + c.n),
      );
      row.appendChild(el("span", "big", "±" + c.spread));
      grp.appendChild(row);
      var wrap = el("div", "bkwrap");
      wrap.style.display = openSpread[c.key] ? "block" : "none";
      wrap.appendChild(judgeChips(c.judges));
      cells
        .filter(function (x) {
          return x.key.indexOf(c.key + "/") === 0;
        })
        .forEach(function (x) {
          var cat = el("div", "bkcat");
          cat.appendChild(
            el(
              "div",
              "bklbl",
              x.label.split(" · ").pop() +
                ": ø " +
                x.avg.toFixed(1) +
                " (±" +
                x.spread +
                ")",
            ),
          );
          cat.appendChild(judgeChips(x.judges));
          wrap.appendChild(cat);
        });
      grp.appendChild(wrap);
      th.appendChild(grp);
      row.addEventListener("click", function () {
        openSpread[c.key] = !openSpread[c.key];
        renderChair();
      });
    });
  }

  // Team-side spread rows, one per category group - tap to drill in, same pattern as a speech row.
  var sh = document.getElementById("spread");
  sh.innerHTML = "";
  if (!groupCells.length) {
    sh.appendChild(
      el("p", "note", "Noch keine zwei Vollständigen Teampunkte."),
    );
  } else {
    groupCells.forEach(function (c) {
      var grp = el("div", "totgrp");
      var row = el("div", "totrow" + (c.spread >= 5 ? " hot" : ""));
      row.appendChild(el("span", "lb", c.label));
      row.appendChild(
        el("span", "sv", "ø " + c.avg.toFixed(1) + " · n " + c.n),
      );
      row.appendChild(el("span", "big", "±" + c.spread));
      grp.appendChild(row);

      var wrap = el("div", "bkwrap");
      wrap.style.display = openSpread[c.key] ? "block" : "none";
      wrap.appendChild(judgeChips(c.judges));
      c.catKeys.forEach(function (ck) {
        var x = cells.filter(function (x) {
          return x.key === ck;
        })[0];
        if (!x) return; // that category doesn't have 2+ judges yet
        var cat = el("div", "bkcat");
        cat.appendChild(
          el(
            "div",
            "bklbl",
            x.label.split(" · ").pop() +
              ": ø " +
              x.avg.toFixed(1) +
              " (±" +
              x.spread +
              ")",
          ),
        );
        cat.appendChild(judgeChips(x.judges));
        wrap.appendChild(cat);
      });
      grp.appendChild(wrap);
      sh.appendChild(grp);

      row.addEventListener("click", function () {
        openSpread[c.key] = !openSpread[c.key];
        renderChair();
      });
    });
  }

  // Full result overview
  document.getElementById("finalResult").innerHTML = finalResultHTML(summary);

  // Ballot: one column per adjudicator (chair first), in speaking order.
  var btnBallot = document.getElementById("btnBallot");
  btnBallot.textContent = ballotOpen ? "Ballot ausblenden" : "Ballot anzeigen";
  var ballotWrap = document.getElementById("ballotWrap");
  ballotWrap.classList.toggle("hide", !ballotOpen);
  if (ballotOpen) {
    var scrollHost = el("div");
    scrollHost.style.overflowX = "auto";
    scrollHost.appendChild(fullBallotTable(summary));
    ballotWrap.innerHTML = "";
    ballotWrap.appendChild(scrollHost);
  }
}

// Desktop layout - a wide-screen chrome (top nav + room/judges bar) shown
// to any judge, chair or wing, above the isDesktopWidth() threshold. Only
// the "Dashboard" view (chair spread/ballot overview, computeChairSummary())
// is chair-only; Reden/Team/Schnelleingabe are every desktop judge's own
// entry pages, same as on mobile. Übersicht has no desktop nav entry, since
// Schnelleingabe is a superset of what it shows (same totals, editable);
// "matrix"/renderMatrix() itself still stays for mobile's own use. The
// connection dot/state and the ⋮ menu (link copy, theme, Impressum, leave
// room) are the existing mobile `.bar`, extended in place with room/judges/
// nav. dashboardView tracks which of these pages shows; "sheet"/"team"
// reuse the existing mobile pages, just re-centered; "dashboard", "schnell"
// and "blatt" are wide, desktop-only views with no mobile equivalent.
var dashboardSelected = { kind: "speaker", s: 0 };
var dashboardView = "namen";
// Remembers the last-focused field id per view ("blatt"/"teampoints"), so
// Alt+Space can swap between the two and land back where you were.
var lastFocusByView = {};
// Persists the desktop nav tab across a reload, per room - so refreshing
// mid-Blatt doesn't bounce back to Namen. Mirrors showView()'s LS write below.
function setDashboardView(v) {
  dashboardView = v;
  if (ME) LS.set("opd.dashboardView." + ME.code, v);
}

function isDesktopWidth() {
  return !!(ME && window.matchMedia("(min-width: 1024px)").matches);
}
function isDesktopChair() {
  return isDesktopWidth() && ME.is_chair;
}
// Falls back to "schnell" when dashboardView points somewhere unreachable
// now - "dashboard" for a wing the chair hasn't opened it to, or a
// matrix/sheet/team value still cached in localStorage from a version that
// had those desktop views (they are mobile-only again).
function effectiveDashboardView() {
  if (dashboardView === "dashboard" && !ME.is_chair && !spreadOpen)
    return "schnell";
  if (
    dashboardView === "offline" &&
    (!ME.is_chair || !Object.keys(offlineJudges).length)
  )
    return "schnell";
  if (
    dashboardView === "matrix" ||
    dashboardView === "sheet" ||
    dashboardView === "team"
  )
    return "schnell";
  return dashboardView;
}
// Mirrors effectiveDashboardView() for the mobile tab bar: a restored
// view="chair" falls back to "namen" if it's no longer reachable (chair
// status lost, or the chair since locked spreadOpen again).
function effectiveMobileView() {
  if (view === "chair" && !ME.is_chair && !spreadOpen) return "namen";
  return view;
}

// Every view effectiveDashboardView() can return is a wide, desktop-only
// page, so on a desktop width the mobile views and dock are simply all
// hidden - there is no narrow-column desktop mode any more.
function applyLayoutMode() {
  var dash = isDesktopWidth();
  var app = document.getElementById("app");
  app.classList.toggle("dashboard-mode", dash);
  document.getElementById("dashNav").classList.toggle("hide", !dash);
  document.getElementById("dashJury").classList.toggle("hide", !dash);

  var ev = effectiveDashboardView();
  document
    .getElementById("v-namenroom")
    .classList.toggle("hide", !dash || ev !== "namen");
  document
    .getElementById("v-dashboard")
    .classList.toggle("hide", !dash || ev !== "dashboard");
  document
    .getElementById("v-schnell")
    .classList.toggle("hide", !dash || ev !== "schnell");
  document
    .getElementById("v-blatt")
    .classList.toggle("hide", !dash || ev !== "blatt");
  document
    .getElementById("v-teampoints")
    .classList.toggle("hide", !dash || ev !== "teampoints");
  document
    .getElementById("v-offline")
    .classList.toggle("hide", !dash || ev !== "offline");

  if (dash) {
    ["v-namen", "v-sheet", "v-team", "v-matrix", "v-chair"].forEach(
      function (id) {
        document.getElementById(id).classList.add("hide");
      },
    );
    document.getElementById("dock").classList.add("hide");
    document.getElementById("dockSheet").classList.add("hide");
    document.getElementById("dockTeam").classList.add("hide");
  } else {
    document.getElementById("tabs").classList.remove("hide");
    // Restore dock (hidden by the desktop branch) on plain mobile - otherwise
    // shrinking down from desktop leaves no way to score.
    document.getElementById("dock").classList.remove("hide");
    showView(effectiveMobileView());
    syncDockSpacer();
  }
}

// .tabs is fixed to the screen bottom on mobile (see style.css) and so sits
// outside document flow, on top of whatever the page happens to be
// scrolled to - without this, it would cover the last row of .dockpad (or
// of the current view's last card, on views with no dockpad). Re-run
// whenever .tabs's height or visibility can have changed (view switch,
// resize, etc.).
function syncDockSpacer() {
  var vp = document.getElementById("viewport");
  var tabs = document.getElementById("tabs");
  if (!vp || !tabs) return;
  vp.style.paddingBottom =
    isDesktopWidth() || tabs.classList.contains("hide")
      ? ""
      : tabs.offsetHeight + 14 + "px";
}

function renderDashChrome() {
  [].forEach.call(
    document.querySelectorAll('#dashNav button[data-dv="dashboard"]'),
    function (b) {
      b.classList.toggle("hide", !ME.is_chair && !spreadOpen);
    },
  );
  [].forEach.call(
    document.querySelectorAll('#dashNav button[data-dv="offline"]'),
    function (b) {
      // Stays hidden until at least one offline judge exists, so the tab
      // doesn't sit there unexplained for chairs who never need it - see
      // addOfflineJudgeAndOpenPanel(), the only way in.
      b.classList.toggle(
        "hide",
        !ME.is_chair || !Object.keys(offlineJudges).length,
      );
    },
  );

  var jury = document.getElementById("dashJury");
  jury.innerHTML = "";
  var roomSpan = el("span", "dashroom", "Raum " + ME.code);
  roomSpan.title = "Link kopieren";
  roomSpan.setAttribute("role", "button");
  roomSpan.tabIndex = 0;
  roomSpan.addEventListener("click", function () {
    copyRoomLink(roomSpan, location.origin + "/r/" + ME.code);
  });
  roomSpan.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      roomSpan.click();
    }
  });
  jury.appendChild(roomSpan);
  var chips = el("div", "dashjurychips");
  jury.appendChild(chips);

  // Highlights the active tab for every judge, not just the chair - the
  // rest of this function (jury chips, trainee controls) is chair-only.
  var ev = effectiveDashboardView();
  [].forEach.call(
    document.querySelectorAll("#dashNav button[data-dv]"),
    function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.dv === ev));
    },
  );

  if (!ME.is_chair) return;

  var ids = Object.keys(peers);
  var judgeIds = ids.filter(function (id) {
    return !peers[id].hidden;
  });
  var offlineIds = Object.keys(offlineJudges);
  var offlineVisibleIds = offlineIds.filter(function (id) {
    return !offlineJudges[id].hidden;
  });
  var traineeCount =
    ids.length -
    judgeIds.length +
    (offlineIds.length - offlineVisibleIds.length);
  // Offline judges are never "online" - that count stays real-judges-only.
  var onlineCount = judgeIds.filter(function (id) {
    return peers[id].online;
  }).length;
  var completeCount =
    judgeIds.filter(function (id) {
      return peers[id].filled >= expectedCellCount();
    }).length +
    offlineVisibleIds.filter(function (id) {
      return offlineFilledCount(id) >= offlineExpectedCellCount();
    }).length;
  var summary =
    judgeIds.length +
    offlineVisibleIds.length +
    " Judges" +
    (traineeCount ? " · " + traineeCount + " Trainees" : "") +
    " · " +
    onlineCount +
    " Online · " +
    completeCount +
    " Vollständig";
  var summarySpan = el("span", "dashjsummary", summary);
  summarySpan.setAttribute("role", "button");
  summarySpan.setAttribute("aria-haspopup", "true");
  summarySpan.tabIndex = 0;
  summarySpan.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleJuryPanel(summarySpan);
  });
  summarySpan.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleJuryPanel(summarySpan);
    }
  });
  chips.appendChild(summarySpan);

  // Keep an already-open panel's judge list live as peers change, since
  // chips (and summarySpan with it) get rebuilt on every render() here.
  var openPanel = document.getElementById("juryPanel");
  if (openPanel && !openPanel.classList.contains("hide")) renderJuryPanel();
}

// Judge-list popover for the dashboard header's summary chip - the styled
// replacement for a native title="" tooltip, built from the same .jrow
// rows the Chair tab's own judge list uses (style.css: .jrow).
function ensureJuryPanel() {
  var p = document.getElementById("juryPanel");
  if (p) return p;
  p = el("div", "jurypanel hide");
  p.id = "juryPanel";
  document.body.appendChild(p);
  return p;
}
function renderJuryPanel() {
  var p = ensureJuryPanel();
  p.textContent = "";
  var ids = Object.keys(peers);
  var offlineIds = Object.keys(offlineJudges);
  if (!ids.length && !offlineIds.length) {
    p.appendChild(el("p", "note", "Noch keine Jurierenden."));
    return;
  }
  ids.forEach(function (id) {
    var j = peers[id];
    var row = el("div", "jrow");
    row.appendChild(el("span", "dot " + (j.online ? "on" : "off")));
    row.appendChild(
      el(
        "span",
        "n",
        j.name +
          (j.is_chair ? " · Chair" : "") +
          (j.hidden ? " · Trainee" : ""),
      ),
    );
    row.appendChild(el("span", "p", j.filled + " / " + expectedCellCount()));
    p.appendChild(row);
  });
  offlineIds.forEach(function (id) {
    var j = offlineJudges[id];
    var row = el("div", "jrow");
    row.appendChild(el("span", "dot off"));
    row.appendChild(
      el("span", "n", j.name + " · Offline" + (j.hidden ? " · Trainee" : "")),
    );
    row.appendChild(
      el(
        "span",
        "p",
        offlineFilledCount(id) + " / " + offlineExpectedCellCount(),
      ),
    );
    p.appendChild(row);
  });
}
function closeJuryPanel() {
  var p = document.getElementById("juryPanel");
  if (p) p.classList.add("hide");
}
function toggleJuryPanel(anchor) {
  var p = ensureJuryPanel();
  if (!p.classList.contains("hide")) {
    closeJuryPanel();
    return;
  }
  renderJuryPanel();
  var r = anchor.getBoundingClientRect();
  p.style.top = r.bottom + 6 + "px";
  p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 308)) + "px";
  p.classList.remove("hide");
}
document.addEventListener("click", function (e) {
  var p = document.getElementById("juryPanel");
  if (!p || p.classList.contains("hide")) return;
  if (e.target.closest("#juryPanel") || e.target.closest(".dashjsummary"))
    return;
  closeJuryPanel();
});
document.getElementById("dashNav").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-dv]");
  if (!b) return;
  if (b.dataset.dv === "dashboard" && !ME.is_chair && !spreadOpen) return;
  if (b.dataset.dv === "offline" && !ME.is_chair) return;
  setDashboardView(b.dataset.dv);
  render();
});
// PageUp/PageDown cycle nav views - the keyboard route now that tab order skips the chrome.
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (e.key !== "PageUp" && e.key !== "PageDown") return;
  var btns = [].slice.call(
    document.querySelectorAll("#dashNav button[data-dv]:not(.hide)"),
  );
  if (btns.length < 2) return;
  var ev = effectiveDashboardView();
  var idx = 0;
  for (var i = 0; i < btns.length; i++) {
    if (btns[i].dataset.dv === ev) {
      idx = i;
      break;
    }
  }
  var dir = e.key === "PageDown" ? 1 : -1;
  var nextIdx = (idx + dir + btns.length) % btns.length;
  e.preventDefault();
  setDashboardView(btns[nextIdx].dataset.dv);
  render();
});

// Commits an in-flight score edit (schnellinput only fires its write() on
// change/blur, unlike notes which save on every keystroke) before a
// keyboard shortcut jumps away from it, and blurs a focused notes textarea
// too - otherwise it stays the activeElement across the render() call
// below and dashEditGuard() (meant to protect an in-progress edit from a
// remote update) mistakes our own deliberate navigation for that and
// skips the rebuild.
function commitActiveInput() {
  var ae = document.activeElement;
  if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) ae.blur();
}

// Alt+1..9 jump straight to a chrome tab, by position among the visible
// #dashNav buttons - laptop-friendly alternative to PageUp/PageDown that
// doesn't need cycling through intermediate tabs.
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (!e.altKey || !/^[1-9]$/.test(e.key)) return;
  var btns = [].slice.call(
    document.querySelectorAll("#dashNav button[data-dv]:not(.hide)"),
  );
  var idx = Number(e.key) - 1;
  if (idx >= btns.length) return;
  e.preventDefault();
  commitActiveInput();
  setDashboardView(btns[idx].dataset.dv);
  render();
});

// Alt+T opens/closes the timer, matching the other Alt+ shortcuts above -
// grouped here mostly for hardware-keyboard desktop use, like them.
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (!e.altKey || e.key.toLowerCase() !== "t") return;
  e.preventDefault();
  if (document.getElementById("timerModal")) closeTimerModal();
  else openTimerModal();
});
// Traps Tab/Shift+Tab inside the timer modal while it's open, instead of
// letting focus wander into the (still-live) view underneath it - the
// modal has no real backdrop-dimming to make that boundary obvious
// otherwise.
document.addEventListener("keydown", function (e) {
  if (e.key !== "Tab") return;
  var m = document.getElementById("timerModal");
  if (!m) return;
  var f = timerModalFocusables();
  if (!f.length) {
    e.preventDefault();
    return;
  }
  var first = f[0],
    last = f[f.length - 1],
    active = document.activeElement;
  if (e.shiftKey) {
    if (active === first || !m.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else if (active === last || !m.contains(active)) {
    e.preventDefault();
    first.focus();
  }
});

// Alt+, / Alt+. step to the previous/next speech on Blatt, mirroring the
// header's mouse-only ‹/› buttons. Refocuses the same *kind* of field
// (note vs. score) the user was in, so the keyboard flow isn't interrupted.
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (!e.altKey || (e.key !== "," && e.key !== ".")) return;
  if (effectiveDashboardView() !== "blatt") return;
  var wasNote =
    document.activeElement &&
    document.activeElement.classList.contains("blattnotes");
  var n = e.key === "." ? nextActiveSpeaker(cs) : prevActiveSpeaker(cs);
  if (n === -1) return;
  e.preventDefault();
  commitActiveInput();
  cs = n;
  render();
  var first = document.querySelector(
    "#v-blatt " + (wasNote ? ".blattnotes" : ".blattinput"),
  );
  if (first) first.focus();
});

// Alt+I swaps between Blatt and Teampunkte ("I" for Interaktion, the
// TEAMGROUPS_INFO group covering Zwischenreden/-fragen/-rufe) - the fast
// path for jotting an interjection note mid-speech and returning to
// exactly the speech note field you left, without touching the mouse.
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (!e.altKey || e.key.toLowerCase() !== "i") return;
  var ev = effectiveDashboardView();
  if (ev !== "blatt" && ev !== "teampoints") return;
  e.preventDefault();
  commitActiveInput();
  var ae = document.activeElement;
  if (ae && ae.id) lastFocusByView[ev] = ae.id;
  var target = ev === "blatt" ? "teampoints" : "blatt";
  setDashboardView(target);
  render();
  var restoreId = lastFocusByView[target];
  // Jumping into Teampunkte mid-speech snaps straight to the *opposing*
  // team's Zwischenfragen note - that's almost always what an interjection
  // during a team speech needs to be logged against - instead of wherever
  // was last focused there. Free speakers (team null) have no opposing side,
  // so they fall through to the normal remembered/first-field behavior.
  if (ev === "blatt" && target === "teampoints") {
    var spTeam = SPEAKERS[cs].team;
    if (spTeam === 0 || spTeam === 1) {
      var oppId = "teampoints-note-t" + (1 - spTeam) + "-zfrag";
      if (document.getElementById(oppId)) {
        restoreId = oppId;
        lastFocusByView.teampoints = oppId;
      }
    }
  }
  var restored = restoreId && document.getElementById(restoreId);
  var first =
    restored || document.querySelector("#v-" + target + " .blattnotes");
  if (first) first.focus();
});

function dashSpreadBadge(spread) {
  if (spread === null || spread === undefined)
    return el("span", "dashbadge", "·");
  return el("span", "dashbadge" + (spread >= 5 ? " hot" : ""), "±" + spread);
}

function dashJudgeChips(judges) {
  var wrap = el("div", "dashchips");
  judges.forEach(function (j) {
    wrap.appendChild(el("span", "chip", j.name + " " + j.v));
  });
  return wrap;
}

// spreadSummary is a separate computeChairSummary() call (potentially with
// includeHidden) used only for the spread badge - avg always stays on the
// regular, trainees-excluded summary.
function dashSpeakerGroup(label, teamVal, summary, spreadSummary) {
  var wrap = el("div");
  var rows = activeSpeakerIndices().filter(function (s) {
    return SPEAKERS[s].team === teamVal;
  });
  if (!rows.length) return wrap;
  wrap.appendChild(el("div", "dashgrp", label));
  rows.forEach(function (s) {
    var teamCls = teamClass(teamVal);
    var sel = dashboardSelected.kind === "speaker" && dashboardSelected.s === s;
    var row = el("div", "dashspk " + teamCls + (sel ? " sel" : ""));
    row.appendChild(el("span", "lb", speakerLabel(s)));
    var avg = summary.speakerRows[s].avg;
    row.appendChild(el("span", "vl", avg === null ? "·" : avg.toFixed(1)));
    var tot = spreadSummary.totals.filter(function (t) {
      return t.key === "s" + s;
    })[0];
    row.appendChild(dashSpreadBadge(tot ? tot.spread : null));
    row.addEventListener("click", function () {
      dashboardSelected = { kind: "speaker", s: s };
      renderDashboard();
    });
    wrap.appendChild(row);
  });
  return wrap;
}

// Local-only (not synced, not persisted) override for the Redner:innen/
// Teampunkte spread: purely a display choice for whoever is looking at this
// dashboard right now, so it stays a plain var rather than going through
// LS like gradeInputMode does.
var dashIncludeTrainees = false;
function dashTraineeToggle() {
  var lbl = el("label", "dashtraineetoggle");
  var cb = el("input");
  cb.type = "checkbox";
  cb.checked = dashIncludeTrainees;
  cb.addEventListener("change", function () {
    dashIncludeTrainees = cb.checked;
    renderDashboard();
  });
  lbl.appendChild(cb);
  lbl.appendChild(document.createTextNode(" Spread inkl. Trainees"));
  return lbl;
}

function dashSpeakerPanel(summary, spreadSummary) {
  var panel = el("div", "dashpanel dashpanel-grow3");
  var head = el("div", "dashpanelhead dashpanelhead-row");
  head.appendChild(el("h2", null, "Redner:innen"));
  head.appendChild(dashTraineeToggle());
  panel.appendChild(head);
  var body = el("div", "dashpanelbody");
  body.appendChild(dashSpeakerGroup("Regierung", 0, summary, spreadSummary));
  body.appendChild(dashSpeakerGroup("Opposition", 1, summary, spreadSummary));
  body.appendChild(
    dashSpeakerGroup("Fraktionsfrei", null, summary, spreadSummary),
  );
  panel.appendChild(body);
  return panel;
}

function dashTeamGroupRows(summary, spreadSummary) {
  var wrap = el("div");
  TEAMS.forEach(function (tm, t) {
    wrap.appendChild(el("div", "dashgrp", tm));
    summary.teamGroups.forEach(function (g) {
      var teamCls = teamClass(t);
      var gc = summary.groupCells.filter(function (x) {
        return x.key === "t" + t + "/grp-" + tm + " · " + g;
      })[0];
      var spreadGc = spreadSummary.groupCells.filter(function (x) {
        return x.key === "t" + t + "/grp-" + tm + " · " + g;
      })[0];
      var sel =
        dashboardSelected.kind === "team" &&
        dashboardSelected.t === t &&
        dashboardSelected.grp === g;
      var row = el("div", "dashspk " + teamCls + (sel ? " sel" : ""));
      row.appendChild(el("span", "lb", g));
      row.appendChild(el("span", "vl", gc ? gc.avg.toFixed(1) : "·"));
      row.appendChild(dashSpreadBadge(spreadGc ? spreadGc.spread : null));
      row.addEventListener("click", function () {
        dashboardSelected = { kind: "team", t: t, grp: g };
        renderDashboard();
      });
      wrap.appendChild(row);
    });
  });
  return wrap;
}

function dashTeamPanel(summary, spreadSummary) {
  var panel = el("div", "dashpanel dashpanel-grow2");
  var head = el("div", "dashpanelhead dashpanelhead-row");
  head.appendChild(el("h2", null, "Teampunkte"));
  head.appendChild(dashTraineeToggle());
  panel.appendChild(head);
  var body = el("div", "dashpanelbody");
  body.appendChild(dashTeamGroupRows(summary, spreadSummary));
  panel.appendChild(body);
  return panel;
}

// summary stays the trainees-excluded math used everywhere else (ballot
// tables, exports, mobile chair view) and still feeds the averages here;
// only the spread badge in these two panels can switch to an alternate,
// includeHidden summary via the local/unsynced dashIncludeTrainees toggle.
function dashColA(summary) {
  var col = el("div", "dashcol dashcol-a");
  var spreadSummary = dashIncludeTrainees ? computeChairSummary(true) : summary;
  col.appendChild(dashSpeakerPanel(summary, spreadSummary));
  col.appendChild(dashTeamPanel(summary, spreadSummary));
  return col;
}

// A cell's key is "s{s}/{critKey}" or "t{t}/{catKey}" - resolve it back to
// the speaker or team-category the dashboard can select and focus.
function dashRowTarget(key) {
  var sm = /^s(\d+)\//.exec(key);
  if (sm) return { kind: "speaker", s: parseInt(sm[1], 10) };
  var tm = /^t(\d+)\/(.+)$/.exec(key);
  if (tm) {
    var cat = TEAMCATS.filter(function (c) {
      return c.key === tm[2];
    })[0];
    if (cat) return { kind: "team", t: parseInt(tm[1], 10), grp: cat.grp };
  }
  return null;
}
function dashSameTarget(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  return a.kind === "speaker" ? a.s === b.s : a.t === b.t && a.grp === b.grp;
}

function dashSpreadPanel(title, list) {
  var panel = el("div", "dashpanel dashpanel-grow");
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, title));
  panel.appendChild(head);
  var body = el("div", "dashpanelbody");
  if (!list.length) {
    body.appendChild(
      el("p", "note", "Noch keine zwei vollständigen Wertungen."),
    );
  } else {
    list.forEach(function (c) {
      var target = dashRowTarget(c.key);
      var sel = dashSameTarget(target, dashboardSelected);
      var row = el(
        "div",
        "dashrow" + (c.spread >= 5 ? " hot" : "") + (sel ? " sel" : ""),
      );
      row.appendChild(dashSpreadBadge(c.spread));
      var parts = c.label.split(" · ");
      var mid = el("div", "dashrowlbl");
      mid.appendChild(el("div", "dashrowmain", parts[0]));
      mid.appendChild(el("div", "dashrowsub", parts.slice(1).join(" · ")));
      row.appendChild(mid);
      row.appendChild(dashJudgeChips(c.judges));
      if (target) {
        row.addEventListener("click", function () {
          dashboardSelected = target;
          renderDashboard();
        });
      }
      body.appendChild(row);
    });
  }
  panel.appendChild(body);
  return panel;
}

// Reuses spreadOpen - opening it also gives wings the stripped dashboard (minus the right column).
function dashFreigebenButton() {
  var dob = el(
    "button",
    "btn ghost dashjbtn" + (spreadOpen ? " on" : ""),
    spreadOpen
      ? "Dashboard für Wings / Trainees freigegeben"
      : "Dashboard für Wings / Trainees gesperrt",
  );
  dob.tabIndex = -1;
  dob.title = spreadOpen
    ? "Wings verlieren wieder den Zugriff auf das Dashboard"
    : "Wings erhalten Lesezugriff auf eine reduzierte Ansicht des Dashboards (Spreads)";
  dob.addEventListener("click", function () {
    var next = !spreadOpen;
    fetch(
      "/api/rooms/" +
        ME.code +
        "/spread_open?open=" +
        next +
        "&token=" +
        encodeURIComponent(ME.token),
      { method: "POST" },
    ).then(function () {
      spreadOpen = next;
      updateChairTab();
      render();
    });
  });
  return dob;
}

function dashColB(summary) {
  var col = el("div", "dashcol dashcol-b");
  col.appendChild(dashFreigebenButton());
  col.appendChild(
    dashSpreadPanel(
      "Abweichungen · Reden",
      summary.cells.filter(function (c) {
        return c.key.charAt(0) === "s";
      }),
    ),
  );
  col.appendChild(
    dashSpreadPanel(
      "Abweichungen · Teampunkte",
      summary.cells.filter(function (c) {
        return c.key.charAt(0) === "t";
      }),
    ),
  );
  return col;
}

function dashSpreadCell(spread) {
  return el(
    "td",
    "tot" + (spread !== null && spread >= 5 ? " spreadhot" : ""),
    spread === null ? "·" : "±" + spread,
  );
}

// The dashboard's "Wertungsvergleich" table, in both the shapes it takes:
// one row per speaker criterion (below) or per category of a team group,
// each with every adjudicator's value, an average and a spread, closed by a
// total row. Trainees are shown for context but greyed out (.trainee) -
// never counted into any average, which stays gated on the active
// (non-hidden) judges summary.ids already resolves to.
// spec: {target, rowHead, rows:[{label, key}], totalLabel,
//        totalFor(id) -> number|null, totalSpread, extraRow(ncols) -> tr?}
function dashComparisonTable(summary, spec) {
  // Offline judges only ever have a Gesamt total (no per-criterion
  // breakdown), so they're appended after the real, chair-first columns
  // rather than sorted in among them. A hidden (trainee) one still gets a
  // column here, same as a real trainee - shown for context, greyed via
  // isHiddenId()/counts() below, just excluded from Ø/Spread.
  var offlineIds = Object.keys(offlineJudges).map(function (id) {
    return OFFLINE_ID_PREFIX + id;
  });
  var chairFirst = chairFirstIds(Object.keys(peers)).concat(offlineIds);
  function isHiddenId(id) {
    return isOfflineId(id)
      ? offlineJudges[offlineRealId(id)].hidden
      : peers[id].hidden;
  }
  var table = el("table", "ballottable");
  var head = el("tr");
  head.appendChild(el("th", "l", spec.rowHead));
  chairFirst.forEach(function (id) {
    head.appendChild(
      el("th", isHiddenId(id) ? "trainee" : null, summary.nameOf(id)),
    );
  });
  head.appendChild(el("th", null, "Ø"));
  head.appendChild(el("th", null, "Spread"));
  table.appendChild(head);

  function counts(id) {
    return !isHiddenId(id) && summary.includedFor(id, spec.target);
  }

  spec.rows.forEach(function (r) {
    var cell = summary.cells.filter(function (x) {
      return x.key === spec.target + "/" + r.key;
    })[0];
    var tr = el("tr", cell && cell.spread >= 5 ? "hot" : null);
    tr.appendChild(el("td", "l", r.label));
    var vals = [];
    chairFirst.forEach(function (id) {
      // Offline judges never have per-criterion data - "n.a.", not "·"
      // (which means "not yet scored" for a real judge).
      var v = isOfflineId(id)
        ? undefined
        : (remote[id] || {})[kk(spec.target, r.key)];
      tr.appendChild(
        el(
          "td",
          isHiddenId(id) ? "trainee" : null,
          v === undefined ? (isOfflineId(id) ? "n.a." : "·") : String(v),
        ),
      );
      if (counts(id) && v !== undefined) vals.push(v);
    });
    var avg = avgRound(vals);
    tr.appendChild(el("td", "tot", avg === null ? "·" : String(avg)));
    tr.appendChild(dashSpreadCell(cell ? cell.spread : null));
    table.appendChild(tr);
  });

  var totTr = el("tr");
  totTr.appendChild(el("td", "l tot", spec.totalLabel));
  var totVals = [];
  chairFirst.forEach(function (id) {
    var v = spec.totalFor(id);
    totTr.appendChild(
      el(
        "td",
        "tot" + (isHiddenId(id) ? " trainee" : ""),
        v === null ? (isOfflineId(id) ? "n.a." : "·") : String(v),
      ),
    );
    if (counts(id) && v !== null) totVals.push(v);
  });
  var totAvg = avgRound(totVals);
  totTr.appendChild(el("td", "tot", totAvg === null ? "·" : String(totAvg)));
  totTr.appendChild(dashSpreadCell(spec.totalSpread));

  // Anything that belongs between the rows and the total (the speaker
  // table's Abzug line).
  var extra = spec.extraRow && spec.extraRow(chairFirst.length);
  if (extra) table.appendChild(extra);
  table.appendChild(totTr);
  return table;
}

// Spread of one summary row (speech total or team group), or null while
// fewer than two judges have scored it.
function spreadOfKey(list, key) {
  var hit = list.filter(function (x) {
    return x.key === key;
  })[0];
  return hit ? hit.spread : null;
}

function dashBallotTable(summary, s) {
  return dashComparisonTable(summary, {
    target: "s" + s,
    rowHead: "Kriterium",
    rows: CRITERIA,
    totalLabel: "Gesamt",
    totalFor: function (id) {
      return summary.remoteTotal(id, s);
    },
    totalSpread: spreadOfKey(summary.totals, "s" + s),
    extraRow: function (ncols) {
      if (deductionPoints(s) <= 0) return null;
      var dedTr = el("tr", "deducted");
      dedTr.appendChild(el("td", "l", "Abzug"));
      var dedFiller = el("td", null, "");
      dedFiller.setAttribute("colspan", String(ncols));
      dedTr.appendChild(dedFiller);
      dedTr.appendChild(el("td", "tot", "−" + deductionPoints(s)));
      dedTr.appendChild(el("td", null, ""));
      return dedTr;
    },
  });
}

function dashTeamBallotTable(summary, t, grp) {
  var cats = TEAMCATS.filter(function (c) {
    return c.grp === grp;
  });
  return dashComparisonTable(summary, {
    target: "t" + t,
    rowHead: "Kategorie",
    rows: cats,
    totalLabel: "Summe " + grp,
    // A group's sum only means something once every category in it is scored.
    totalFor: function (id) {
      var sum = 0,
        complete = true;
      cats.forEach(function (c) {
        var v = (remote[id] || {})[kk("t" + t, c.key)];
        if (v === undefined) complete = false;
        else sum += v;
      });
      return complete ? sum : null;
    },
    totalSpread: spreadOfKey(
      summary.groupCells,
      "t" + t + "/grp-" + TEAMS[t] + " · " + grp,
    ),
  });
}

function dashSpeakerBallotPanel(summary, s) {
  var sp = SPEAKERS[s];
  var panel = el("div", "dashpanel");
  panel.classList.add(teamClass(sp.team));
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, speakerLabel(s)));
  head.appendChild(el("div", "sub", "Wertungsvergleich"));
  panel.appendChild(head);
  var body = el("div", "dashpanelbody dashpanelbody-table");
  body.appendChild(dashBallotTable(summary, s));
  panel.appendChild(body);
  return panel;
}

function dashTeamBallotPanel(summary, t, grp) {
  var panel = el("div", "dashpanel");
  panel.classList.add(teamClass(t));
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, TEAMS[t] + " · " + grp));
  head.appendChild(el("div", "sub", "Wertungsvergleich"));
  panel.appendChild(head);
  var body = el("div", "dashpanelbody dashpanelbody-table");
  body.appendChild(dashTeamBallotTable(summary, t, grp));
  panel.appendChild(body);
  return panel;
}

function dashFinalPanel(summary) {
  var panel = el("div", "dashpanel dashpanel-grow");
  var head = el("div", "dashpanelhead dashpanelhead-row");
  head.appendChild(el("h2", null, "Ballot"));
  if (ME.is_chair) {
    var addOfflineBtn = el("button", "exclbtn", "+ Offline-Juror:in");
    addOfflineBtn.type = "button";
    addOfflineBtn.tabIndex = -1;
    addOfflineBtn.addEventListener("click", addOfflineJudgeAndOpenPanel);
    head.appendChild(addOfflineBtn);
    var exportBtn = el("button", "exclbtn", "Ballot exportieren");
    exportBtn.type = "button";
    exportBtn.tabIndex = -1;
    exportBtn.addEventListener("click", function () {
      openBallotExportModal(summary);
    });
    head.appendChild(exportBtn);
  }
  panel.appendChild(head);
  var body = el("div", "dashpanelbody dashpanelbody-table");
  var scrollHost = el("div");
  scrollHost.style.overflowX = "auto";
  scrollHost.appendChild(fullBallotTable(summary));
  body.appendChild(scrollHost);
  panel.appendChild(body);
  return panel;
}

// Speech role/position in the OPD sense (government/opposition/non_aligned,
// 0-indexed within that role) - derived purely from SPEAKERS' order and
// team, so it survives SPEAKERS being reordered/relabeled rather than
// depending on fixed array indices. This is the same role+position scheme
// debateresult.com's ballot-entry form uses on its hidden speeches.N.role/
// speeches.N.position fields, so a consumer (the bookmarklet) can match a
// speech without caring what order our own SPEAKERS array happens to use.
function speechRolePosition(s) {
  var team = SPEAKERS[s].team;
  var role =
    team === 0 ? "government" : team === 1 ? "opposition" : "non_aligned";
  var position = 0;
  for (var i = 0; i < s; i++) {
    if (SPEAKERS[i].team === team) position++;
  }
  return { role: role, position: position };
}

// Ballot-export payload: judgeIds is the chair-chosen column order; scores
// are deduction-adjusted totals, null when missing/excluded so the
// bookmarklet skips that field.
function buildBallotExport(summary, judgeIds) {
  var speeches = activeSpeakerIndices().map(function (s) {
    var sp = SPEAKERS[s];
    var rp = speechRolePosition(s);
    return {
      role: rp.role,
      position: rp.position,
      label: sp.label,
      scores: judgeIds.map(function (id) {
        var v = summary.remoteTotal(id, s);
        return v !== null && summary.includedFor(id, "s" + s) ? v : null;
      }),
    };
  });
  var teams = {};
  TEAMS.forEach(function (_, t) {
    var key = t === 0 ? "government" : "opposition";
    teams[key] = judgeIds.map(function (id) {
      var v = summary.remoteTeamTotal(id, t);
      return v !== null && summary.includedFor(id, "t" + t) ? v : null;
    });
  });
  return {
    app: "mittelmass",
    version: 1,
    judges: judgeIds.map(function (id) {
      return summary.nameOf(id);
    }),
    speeches: speeches,
    teams: teams,
  };
}

// The bookmarklet's source, meant to run on the tabbing site's own
// ballot-entry page - dragged to the bookmarks bar once, then clicked while
// that page is open. It reads the clipboard payload buildBallotExport()
// produced, matches each speech by role+position (the tabbing site's own
// hidden speeches.N.role/speeches.N.position fields), and fills the number
// inputs for the chosen judge order, leaving review and submission to a human.
var BALLOT_BOOKMARKLET_SRC = [
  "(function(){",
  'function fail(m){alert("Ballot-Import: "+m);}',
  "navigator.clipboard.readText().then(function(t){",
  "var data;",
  'try{data=JSON.parse(t);}catch(e){fail("Zwischenablage enthält kein gültiges Ballot-Export.");return;}',
  'if(!data||data.app!=="mittelmass"||!data.speeches){fail("Zwischenablage enthält kein gültiges Ballot-Export.");return;}',
  "var bySpeech={};",
  '[].forEach.call(document.querySelectorAll(\'input[type="hidden"][name^="speeches."][name$=".role"]\'),function(r){',
  "var m=/^speeches\\.(\\d+)\\.role$/.exec(r.name);",
  "if(!m)return;",
  "var p=document.querySelector('input[name=\"speeches.'+m[1]+'.position\"]');",
  "if(!p)return;",
  'bySpeech[r.value+"|"+p.value]=m[1];',
  "});",
  "var filled=0,missing=[];",
  "function setVal(inp,v){",
  "if(!inp||v===null||v===undefined)return;",
  "inp.value=String(v);",
  'inp.dispatchEvent(new Event("input",{bubbles:true}));',
  'inp.dispatchEvent(new Event("change",{bubbles:true}));',
  "filled++;",
  "}",
  "data.speeches.forEach(function(sp){",
  'var n=bySpeech[sp.role+"|"+sp.position];',
  "if(n===undefined){missing.push(sp.label);return;}",
  "(sp.scores||[]).forEach(function(v,j){",
  "setVal(document.querySelector('input[name=\"speeches.'+n+\".scores.\"+j+'\"]'),v);",
  "});",
  "});",
  '["government","opposition"].forEach(function(key){',
  "var arr=data.teams&&data.teams[key];",
  "if(!arr)return;",
  "arr.forEach(function(v,j){",
  "setVal(document.querySelector('input[name=\"'+key+\".scores.\"+j+'\"]'),v);",
  "});",
  "});",
  'var msg="Ballot eingetragen: "+filled+" Felder ausgefüllt.";',
  'if(missing.length)msg+="\\nNicht gefunden: "+missing.join(", ");',
  "alert(msg);",
  "},function(){",
  'fail("Zwischenablage konnte nicht gelesen werden (Berechtigung erteilt?).");',
  "});",
  "})();",
].join("");

function ballotBookmarkletHref() {
  return "javascript:" + encodeURIComponent(BALLOT_BOOKMARKLET_SRC);
}

// Desktop-only cheat sheet for the Alt/Page keyboard shortcuts wired up
// further down (dashNav cycling, Blatt speech stepping, Blatt<->Teampunkte
// swap). Reuses the info-modal look but lists rows instead of one paragraph.
var SHORTCUTS = [
  ["Bild ↑ / Bild ↓", "Nächsten / vorherigen Tab auswählen"],
  ["Alt + 1 – 5", "Tabs direkt anzeigen"],
  ["Alt + , / Alt + .", "Vorherige / nächste Rede (Einzelreden)"],
  ["Alt + I", "Wechsel von Einzelrede zu Interaktionen der Gegenseite"],
  ["Alt + T", "Timer öffnen/schließen"],
];
// Features that exist but aren't announced by a visible label - a plain "·"
// in a table cell, a menu entry easy to skim past, etc. Same audience as
// SHORTCUTS: someone who knows OPD but not this particular tool.
var MORE_FEATURES = [
  [
    "Eingabemodus: Noten/Punkte",
    "Im Menü (oben Rechts) kannst du den Eingabe Modus von Punkten (9,12,15 etc.) auf Noten (3+, 1-, 1+ etc.) umschalten. Bereits eingegebene Werte werden automatisch umgerechnet.",
  ],
  [
    "Abzüge",
    "Chairs können durch die Knöpfe bei Einzelreden oder das Anklicken der 'Abz.' Spalte im 'Komplette Wertung' Tab zwischen Keinen, Kleinen (-3) und Großen (-15) Abzügen hin- und herschalten.",
  ],
  [
    "Aus Wertung nehmen",
    "Der Knopf 'aus Wertung nehmen' in Einzelreden / Teamkategorien lässt eure Punkte nicht mit in die Finalwertung einfließen.",
  ],
  [
    "Zu Trainee",
    "Chairs können auf dem Namen-Tab Wings zu Trainees machen. Sie können dann Punkte wie alle Jurierenden vergeben, fließen aber nicht in den Durchschnitt ein.",
  ],
  [
    "Dashboard freigeben",
    "Der Button 'Dashboard Freigeben' erlaubt es Chairs, Wings und Trainees die Ansicht der Abweichungen freizugeben",
  ],
  [
    "Anzahl FFRs",
    "Chairs können im Menü oben Rechts mehr freie Reden einstellen (min. 3, max. 10)",
  ],
  [
    "Link kopieren",
    "Menü: Einladungslink für diesen Raum in die Zwischenablage kopieren",
  ],
];
function openShortcutsModal() {
  openModal("shortcutsModal", function (box) {
    box.appendChild(el("h2", null, "Tastenkürzel"));
    var list = el("div", "shortcutlist");
    SHORTCUTS.forEach(function (sc) {
      var row = el("div", "shortcutrow");
      row.appendChild(el("kbd", null, sc[0]));
      row.appendChild(el("span", null, sc[1]));
      list.appendChild(row);
    });
    box.appendChild(list);

    box.appendChild(el("h2", "shortcutsub", "Weitere Funktionen"));
    var more = el("div", "shortcutlist");
    MORE_FEATURES.forEach(function (f) {
      var mrow = el("div", "shortcutrow featurerow");
      mrow.appendChild(el("span", "featurename", f[0]));
      mrow.appendChild(el("span", null, f[1]));
      more.appendChild(mrow);
    });
    box.appendChild(more);

    box.appendChild(modalCloseRow("shortcutsModal", "OK"));
  });
}
document
  .getElementById("shortcutsBtn")
  .addEventListener("click", openShortcutsModal);
// "?" opens the shortcuts cheat sheet too - standard convention, alongside
// the always-visible icon button above for anyone who doesn't know it.
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (e.key !== "?") return;
  var ae = document.activeElement;
  if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
  e.preventDefault();
  openShortcutsModal();
});

// Appended to <body>, since #v-dashboard gets torn down on every render().
function openBallotExportModal(summary) {
  var order = chairFirstIds(summary.ids);
  openModal("ballotExportModal", function (box) {
    buildBallotExportBox(box, summary, order);
  });
}
function buildBallotExportBox(box, summary, order) {
  box.appendChild(el("h2", null, "Ballot exportieren"));
  box.appendChild(
    el(
      "p",
      "note",
      "Die Ordnung der Juror:innen muss der in Opentab entsprechen.",
    ),
  );

  var list = el("div", "ballotexportjudges");
  function renderList() {
    list.innerHTML = "";
    order.forEach(function (id, i) {
      var row = el("div", "ballotexportjrow");
      row.appendChild(el("span", "n", String(i + 1) + "."));
      row.appendChild(el("span", "nm", summary.nameOf(id)));
      var up = el("button", "adj", "▲");
      up.type = "button";
      up.disabled = i === 0;
      up.addEventListener("click", function () {
        var tmp = order[i - 1];
        order[i - 1] = order[i];
        order[i] = tmp;
        renderList();
      });
      var down = el("button", "adj", "▼");
      down.type = "button";
      down.disabled = i === order.length - 1;
      down.addEventListener("click", function () {
        var tmp = order[i + 1];
        order[i + 1] = order[i];
        order[i] = tmp;
        renderList();
      });
      row.appendChild(up);
      row.appendChild(down);
      list.appendChild(row);
    });
  }
  renderList();
  box.appendChild(list);

  box.appendChild(
    el(
      "p",
      "note",
      "Automatisches einfügen benötigt das Opentab bookmarklet. Einmalig einrichten: den Link in die Lesezeichenleiste ziehen. Danach auf der Ballot-Seite des Tabbing-Programms anklicken, um das Ballot einzufügen.",
    ),
  );
  var bmLink = el("a", "bookmarklet", "📋 Ballot einfügen");
  bmLink.href = ballotBookmarkletHref();
  bmLink.title = "In die Lesezeichenleiste ziehen";
  bmLink.addEventListener("click", function (e) {
    // A direct click (vs. dragging) does nothing useful here - the notice
    // explains why nothing happened.
    e.preventDefault();
    openInfoModal(
      null,
      "Den Link in die Lesezeichenleiste ziehen, nicht anklicken — er muss später auf der Ballot-Seite des Tabbing-Programms ausgeführt werden.",
    );
  });
  box.appendChild(bmLink);

  var actions = el("div", "modalactions");
  var copyBtn = el("button", "btn", "In Zwischenablage kopieren");
  copyBtn.type = "button";
  copyBtn.addEventListener("click", function () {
    var payload = buildBallotExport(summary, order);
    copyText(JSON.stringify(payload))
      .then(function () {
        copyBtn.textContent = "Kopiert ✓";
        setTimeout(function () {
          copyBtn.textContent = "In Zwischenablage kopieren";
        }, 1500);
      })
      .catch(function () {
        copyBtn.textContent = "Kopieren fehlgeschlagen";
      });
  });
  var closeBtn = el("button", "btn ghost", "Schließen");
  closeBtn.type = "button";
  closeBtn.addEventListener("click", function () {
    closeModal("ballotExportModal");
  });
  actions.appendChild(copyBtn);
  actions.appendChild(closeBtn);
  box.appendChild(actions);
}

// Chair-only: how many reserved free-speaker slots are active. Lowering
// never deletes scores; raising brings them back.
function openFreeSpeakersModal() {
  var input;
  openModal("freeSpeakersModal", function (box) {
    input = buildFreeSpeakersBox(box);
  });
  input.focus();
  input.select();
}
function buildFreeSpeakersBox(box) {
  box.appendChild(el("h2", null, "Fraktionsfreie Reden"));
  box.appendChild(
    el(
      "p",
      "note",
      "Standardwert 3. Entfernte FFRs werden versteckt, Punktzahlen bleiben erhalten.",
    ),
  );

  var input = el("input", "modalinput");
  input.type = "number";
  input.inputMode = "numeric";
  input.min = "3";
  input.max = String(MAX_FREE_SPEAKERS);
  input.step = "1";
  input.value = String(freeSpeakerCount);
  box.appendChild(input);

  var err = el("p", "err");
  box.appendChild(err);

  var actions = el("div", "modalactions");
  var saveBtn = el("button", "btn", "Speichern");
  saveBtn.type = "button";
  saveBtn.addEventListener("click", function () {
    var n = Math.round(Number(input.value));
    if (!isFinite(n) || n < 3 || n > MAX_FREE_SPEAKERS) {
      err.textContent =
        "Bitte eine Zahl zwischen 3 und " + MAX_FREE_SPEAKERS + " eingeben.";
      return;
    }
    freeSpeakerCount = n;
    snapToActiveSpeaker();
    render();
    closeModal("freeSpeakersModal");
    fetch(
      "/api/rooms/" +
        ME.code +
        "/free_speakers?count=" +
        n +
        "&token=" +
        encodeURIComponent(ME.token),
      { method: "POST" },
    ).catch(function () {});
  });
  var cancelBtn = el("button", "btn ghost", "Abbrechen");
  cancelBtn.type = "button";
  cancelBtn.addEventListener("click", function () {
    closeModal("freeSpeakersModal");
  });
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  box.appendChild(actions);
  return input;
}
document
  .getElementById("menuFreeSpeakers")
  .addEventListener("click", function () {
    openFreeSpeakersModal();
  });

function dashColC(summary) {
  var col = el("div", "dashcol dashcol-c");
  if (dashboardSelected.kind === "team") {
    col.appendChild(
      dashTeamBallotPanel(summary, dashboardSelected.t, dashboardSelected.grp),
    );
  } else {
    col.appendChild(dashSpeakerBallotPanel(summary, dashboardSelected.s));
  }
  col.appendChild(dashFinalPanel(summary));
  return col;
}

function renderDashboard() {
  var root = document.getElementById("v-dashboard");
  if (!root) return;
  var validSpeaker =
    dashboardSelected.kind === "speaker" &&
    SPEAKERS[dashboardSelected.s] &&
    isActiveSpeaker(dashboardSelected.s);
  var validTeam =
    dashboardSelected.kind === "team" &&
    TEAMS[dashboardSelected.t] !== undefined &&
    dashboardSelected.grp;
  if (!validSpeaker && !validTeam)
    dashboardSelected = { kind: "speaker", s: 0 };
  var summary = computeChairSummary();
  root.innerHTML = "";
  var body = el("div", "dashbody");
  body.appendChild(dashColA(summary));
  body.appendChild(dashColC(summary));
  // Right column stays chair-only even when the dashboard itself is opened to wings.
  if (ME.is_chair) body.appendChild(dashColB(summary));
  root.appendChild(body);
}

// Schnelleingabe: editable grid over the judge's own scores for fast
// keyboard entry, open to any desktop judge. Enter advances like Tab.
// Scopes to whichever "v-*" view the input lives in, so one helper serves every grid.
function focusNextNumberInput(inp) {
  var root = inp.closest('[id^="v-"]');
  if (!root) return;
  var inputs = [].slice.call(root.querySelectorAll("input.schnellinput"));
  var next = inputs[inputs.indexOf(inp) + 1];
  if (next) next.focus();
}

// Shared digit-filter/select-on-focus/Enter-to-next for every desktop number field.
// opts: {width, extraClass} - width:false skips inline width (Blatt/Teampunkte size via CSS).
function schnellNumberInput(opts) {
  opts = opts || {};
  var inp = el(
    "input",
    "schnellinput" + (opts.extraClass ? " " + opts.extraClass : ""),
  );
  // type=text, not number: a native number input reports .value as "" for
  // anything it can't parse (pasted text, a trailing space, "1 2"), so the
  // field can show stray text while the value committed on change is empty -
  // a cell that looks filled in but contributes nothing. inputMode keeps the
  // numeric keypad on mobile/tablet; the filter below restricts to digits.
  inp.type = "text";
  inp.inputMode = "numeric";
  if (opts.width !== false) inp.style.width = opts.width || "95px";
  // Selects the whole value on focus, so typing overwrites instead of inserting.
  inp.addEventListener("focus", function () {
    inp.select();
  });
  inp.addEventListener("input", function () {
    var digits = inp.value.replace(/[^0-9]/g, "");
    if (digits !== inp.value) inp.value = digits;
  });
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inp.blur(); // commits the value (fires "change") before moving on
      if (opts.onEnter) opts.onEnter(inp);
      else focusNextNumberInput(inp);
    }
  });
  return inp;
}

// Grade-mode counterpart to schnellNumberInput - same opts shape
// ({width, extraClass, onEnter}) and select-on-focus/Enter-to-next
// behavior, but a free-text field restricted to grade characters instead
// of a number spinner. Used wherever schnellNumberInput is, whenever
// gradeInputMode() is on.
function gradeTextInput(opts) {
  opts = opts || {};
  var inp = el(
    "input",
    "schnellinput" + (opts.extraClass ? " " + opts.extraClass : ""),
  );
  inp.type = "text";
  inp.inputMode = "text";
  inp.autocomplete = "off";
  if (opts.width !== false) inp.style.width = opts.width || "95px";
  inp.addEventListener("focus", function () {
    inp.select();
  });
  inp.addEventListener("input", function () {
    var clean = inp.value.replace(/[^1-6+-]/g, "").slice(0, 2);
    if (clean !== inp.value) inp.value = clean;
  });
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inp.blur();
      if (opts.onEnter) opts.onEnter(inp);
      else focusNextNumberInput(inp);
    }
  });
  return inp;
}

// The commit path every desktop score field shares (Schnelleingabe's two
// grids, Blatt, Teampunkte). In points mode a typed number is rounded and
// clamped to the field's scale; in grade mode the typed mark goes through
// pointsFromGrade, which for a team category snaps to the same band midpoint
// the mobile keypad writes (pickTeam(), via katOf()/convert()/mid()), so
// free typing can never produce an invalid team score. Unparsable input is
// reverted. refresh() repaints the field (and, where there is one, its hint
// and nudge buttons) from the stored value - it runs after a successful
// write too, so what ends up on screen is always the normalised value.
// max is the field's own scale: 20 for the speaker criteria's Notenskala,
// the category's max for a team category.
function commitScoreField(inp, max, target, criterion, refresh) {
  var raw = inp.value.trim();
  if (raw === "") return;
  var n;
  if (gradeInputMode()) {
    n = pointsFromGrade(raw, max);
  } else {
    n = Math.round(Number(raw));
    if (!isFinite(n)) n = undefined;
    else n = Math.max(0, Math.min(max, n));
  }
  if (n === undefined) {
    refresh(); // not a value we can parse - put the stored one back
    return;
  }
  write(target, criterion, n);
  refresh();
}

// Speaker criteria (Spr/Auf/Kon/Sac/Urt) sit on the raw 0-20 Notenskala. In
// grade mode the cell itself holds the grade mark rather than the point
// number (there's no separate hint slot in this grid, unlike Blatt) -
// fine-tuning a value happens on Blatt/Teampunkte, or by switching back to
// points mode here.
function schnellSpeakerInput(s, c) {
  var inp = gradeInputMode() ? gradeTextInput() : schnellNumberInput();
  function refresh() {
    var v = sget(s, c);
    inp.value =
      v === null ? "" : gradeInputMode() ? gradeMarkFor(v) : String(v);
    updateSchnellSpeakerRow(s);
  }
  refresh();
  inp.addEventListener("change", function () {
    commitScoreField(inp, 20, "s" + s, CRITERIA[c].key, refresh);
  });
  return inp;
}

// Team categories are stored in their own point scale (e.g. 0-25).
function schnellTeamInput(t, catIdx) {
  var cat = TEAMCATS[catIdx];
  var inp = gradeInputMode() ? gradeTextInput() : schnellNumberInput();
  function refresh() {
    var v = tget(t, catIdx);
    inp.value =
      v === null ? "" : gradeInputMode() ? gradeMarkFor(v, cat.max) : String(v);
    updateSchnellTeamRow(t);
  }
  refresh();
  inp.addEventListener("change", function () {
    commitScoreField(inp, cat.max, "t" + t, cat.key, refresh);
  });
  return inp;
}

function updateSchnellSpeakerRow(s) {
  var z = zwischensumme(s);
  var sumCell = document.getElementById("schnell-sum-" + s);
  var abCell = document.getElementById("schnell-ab-" + s);
  var pCell = document.getElementById("schnell-p-" + s);
  if (sumCell) sumCell.textContent = z === null ? "·" : String(z);
  if (abCell) {
    var abVal = deductionPoints(s) || "·";
    var abBtn = abCell.querySelector(".schnellab");
    if (abBtn) {
      abBtn.textContent = abVal;
      abBtn.classList.toggle("on", !!deductionLevel(s));
    } else {
      abCell.textContent = abVal;
    }
  }
  if (pCell) pCell.textContent = z === null ? "·" : String(personPunkte(s));
  // The speaker's own total feeds that team's Reden/Gesamt columns too.
  var team = SPEAKERS[s].team;
  if (team !== null) updateSchnellTeamRow(team);
}

function updateSchnellTeamRow(t) {
  var sumCell = document.getElementById("schnell-tsum-" + t);
  if (sumCell) sumCell.textContent = String(teamPunkte(t));
  var g = myTeamGrand(t);
  var spkCell = document.getElementById("schnell-tspk-" + t);
  if (spkCell) spkCell.textContent = g.speakerSum + (g.partial ? " *" : "");
  var grandCell = document.getElementById("schnell-tgrand-" + t);
  if (grandCell) grandCell.textContent = g.grand + (g.partial ? " *" : "");
}

function schnellSpeakerRow(s, teamCls) {
  var tr = el("tr", deductionLevel(s) ? "deducted" : null);
  var lbl = el("td", "l", speakerLabel(s));
  if (teamCls) lbl.classList.add(teamCls);
  tr.appendChild(lbl);
  tr.appendChild(el("td", "schnellspacer"));
  for (var c = 0; c < NC; c++) {
    var td = el("td");
    td.appendChild(schnellSpeakerInput(s, c));
    tr.appendChild(td);
  }
  var z = zwischensumme(s);
  var sumTd = el("td", "tot", z === null ? "·" : String(z));
  sumTd.id = "schnell-sum-" + s;
  tr.appendChild(sumTd);
  var abTd = el("td", "mt");
  abTd.id = "schnell-ab-" + s;
  if (ME.is_chair) {
    var abBtn = el(
      "button",
      "schnellab" + (deductionLevel(s) ? " on" : ""),
      deductionPoints(s) || "·",
    );
    abBtn.type = "button";
    abBtn.tabIndex = -1;
    abBtn.title = "Abzüge ändern";
    abBtn.addEventListener("click", function () {
      var lvl = deductionLevel(s);
      setDeduction(s, lvl === "" ? "small" : lvl === "small" ? "big" : "");
    });
    abTd.appendChild(abBtn);
  } else {
    abTd.textContent = deductionPoints(s) || "·";
  }
  tr.appendChild(abTd);
  var pTd = el("td", "tot", z === null ? "·" : String(personPunkte(s)));
  pTd.id = "schnell-p-" + s;
  tr.appendChild(pTd);
  return tr;
}

// Groups by speaking-order phase - matches SPEAKERS' own order, so one linear pass suffices.
function schnellSpeakerPhase(label) {
  if (label.indexOf("Eröffnungsrede") !== -1) return "Eröffnungsreden";
  if (label.indexOf("Ergänzungsrede") !== -1) return "Ergänzungsreden";
  if (label.indexOf("Fraktionsfreie Rede") !== -1)
    return "Fraktionsfreie Reden";
  if (label.indexOf("Schlussrede") !== -1) return "Schlussreden";
  return label;
}

function schnellSpeakerGroupRows(label, speakers, teamCls) {
  var rows = [];
  var grpTr = el("tr");
  var grpTd = el("td", "schnellgrp", label);
  grpTd.setAttribute("colspan", String(NC + 5));
  grpTr.appendChild(grpTd);
  rows.push(grpTr);
  speakers.forEach(function (s) {
    rows.push(schnellSpeakerRow(s, teamCls(s)));
  });
  return rows;
}

function schnellSpeakerTable() {
  var table = el("table", "schnelltable schnelltable-speaker");
  var head = el("tr");
  head.appendChild(el("th", "l", "Rede"));
  head.appendChild(el("th", "schnellspacer"));
  CRITERIA.forEach(function (c) {
    head.appendChild(el("th", null, c.label));
  });
  head.appendChild(el("th", null, "Σ"));
  head.appendChild(el("th", null, "Ab"));
  head.appendChild(el("th", null, "P"));
  table.appendChild(head);

  function teamClsOf(s) {
    return teamClass(SPEAKERS[s].team);
  }

  var active = activeSpeakerIndices();
  var i = 0;
  while (i < active.length) {
    var phase = schnellSpeakerPhase(SPEAKERS[active[i]].label);
    var speakers = [];
    while (
      i < active.length &&
      schnellSpeakerPhase(SPEAKERS[active[i]].label) === phase
    ) {
      speakers.push(active[i]);
      i++;
    }
    schnellSpeakerGroupRows(phase, speakers, teamClsOf).forEach(function (row) {
      table.appendChild(row);
    });
  }

  return table;
}

function schnellTeamTable() {
  var table = el("table", "schnelltable");
  var head1 = el("tr");
  var teamTh = el("th", "l", "Team");
  teamTh.setAttribute("rowspan", "2");
  head1.appendChild(teamTh);
  TEAMGROUPS_INFO.forEach(function (g) {
    var th = el("th", "schnellgstart", g.label);
    th.setAttribute("colspan", String(g.cats.length));
    head1.appendChild(th);
  });
  var summeTh = el("th", "schnellgstart", "Summe");
  summeTh.setAttribute("colspan", "3");
  head1.appendChild(summeTh);
  table.appendChild(head1);

  var head2 = el("tr");
  TEAMGROUPS_INFO.forEach(function (g) {
    g.cats.forEach(function (catIdx, i) {
      var cat = TEAMCATS[catIdx];
      var th = el("th", "schnellsub" + (i === 0 ? " schnellgstart" : ""));
      th.appendChild(document.createTextNode(cat.label));
      th.appendChild(el("br"));
      th.appendChild(document.createTextNode("(max " + cat.max + ")"));
      head2.appendChild(th);
    });
  });
  head2.appendChild(el("th", "schnellsub schnellgstart", "Team"));
  head2.appendChild(el("th", "schnellsub", "Reden"));
  head2.appendChild(el("th", "schnellsub", "Gesamt"));
  table.appendChild(head2);

  TEAMS.forEach(function (tm, t) {
    var tr = el("tr");
    var lbl = el("td", "l " + teamClass(t), tm);
    tr.appendChild(lbl);
    TEAMGROUPS_INFO.forEach(function (g) {
      g.cats.forEach(function (catIdx, i) {
        var td = el("td", i === 0 ? "schnellgstart" : null);
        td.appendChild(schnellTeamInput(t, catIdx));
        tr.appendChild(td);
      });
    });
    var sumTd = el("td", "tot schnellgstart", String(teamPunkte(t)));
    sumTd.id = "schnell-tsum-" + t;
    tr.appendChild(sumTd);
    var g = myTeamGrand(t);
    var speakersTd = el("td", "tot", g.speakerSum + (g.partial ? " *" : ""));
    speakersTd.id = "schnell-tspk-" + t;
    tr.appendChild(speakersTd);
    var grandTd = el("td", "tot", g.grand + (g.partial ? " *" : ""));
    grandTd.id = "schnell-tgrand-" + t;
    tr.appendChild(grandTd);
    table.appendChild(tr);
  });

  return table;
}

function schnellPanel(title, table) {
  var panel = el("div", "dashpanel");
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, title));
  panel.appendChild(head);
  var body = el("div", "dashpanelbody-table");
  body.appendChild(table);
  panel.appendChild(body);
  return panel;
}

// A remote websocket event (someone else's score, judges list, ...) can
// trigger render() while this judge is mid-edit in a desktop grid/sheet;
// don't tear down the DOM under their cursor. Only blocks on an actual
// input/textarea having focus - a button (e.g. Blatt's prev/next) should
// still get its full rebuild on click even though it's inside `root`.
function dashEditGuard(root) {
  if (!root.firstChild) return false;
  var ae = document.activeElement;
  return !!(
    ae &&
    root.contains(ae) &&
    (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")
  );
}

function renderSchnell() {
  var root = document.getElementById("v-schnell");
  if (!root) return;
  // Each input already patches its own row directly - skipping the rebuild
  // just risks a moment's staleness, cleared up by the next render().
  if (dashEditGuard(root)) return;
  root.innerHTML = "";
  var wrap = el("div", "dashcol");
  wrap.appendChild(schnellPanel("Reden", schnellSpeakerTable()));
  wrap.appendChild(schnellPanel("Teampunkte", schnellTeamTable()));
  root.appendChild(wrap);
}

function commitOfflineScoreField(inp, max, offlineId, target, refresh) {
  var raw = inp.value.trim();
  if (raw === "") {
    setOfflineScore(offlineId, target, null);
    refresh();
    return;
  }
  var n = Math.round(Number(raw));
  if (!isFinite(n)) {
    refresh(); // not a value we can parse - put the stored one back
    return;
  }
  n = Math.max(0, Math.min(max, n));
  setOfflineScore(offlineId, target, n);
  refresh();
}
function offlineScoreInput(offlineId, target, max, tabIdx) {
  var inp = schnellNumberInput();
  inp.tabIndex = tabIdx;
  function refresh() {
    var v = (offlineScores[offlineId] || {})[target];
    inp.value = v === undefined ? "" : String(v);
  }
  refresh();
  inp.addEventListener("change", function () {
    commitOfflineScoreField(inp, max, offlineId, target, refresh);
  });
  return inp;
}
// Max sum of a speaker's criteria (NC criteria on the 0-20 Notenskala) /
// a team's categories (TEAMCATS' own maxes) - offline totals are clamped
// to the same ceilings a fully-maxed real ballot could reach.
function offlineSpeakerMax() {
  return NC * 20;
}
function offlineTeamMax() {
  return TEAMCATS.reduce(function (sum, c) {
    return sum + c.max;
  }, 0);
}
// Offline-judge counterpart to expectedCellCount()/j.filled - one cell per
// active speech plus one per team, since that's the whole ballot the chair
// enters for them (no per-criterion breakdown).
function offlineExpectedCellCount() {
  return activeSpeakerIndices().length + TEAMS.length;
}
function offlineFilledCount(id) {
  return Object.keys(offlineScores[id] || {}).length;
}
function buildOfflineJuryTable(container) {
  container.innerHTML = "";
  var ids = Object.keys(offlineJudges);
  function addBtn() {
    var b = el("button", "offlinejudgeadd", "+");
    b.type = "button";
    b.tabIndex = -1;
    b.addEventListener("click", function () {
      addOfflineJudge("");
    });
    return b;
  }
  if (!ids.length) {
    container.appendChild(
      el("p", "note", "Noch keine Offline-Jurorinnen/Juroren hinzugefügt."),
    );
    container.appendChild(addBtn());
    return;
  }

  var speakers = activeSpeakerIndices();
  // Rows per judge column: the name field, then one row per speech, then
  // one per team - fixes the column-major tabIndex stride below.
  var rowsPerCol = 1 + speakers.length + TEAMS.length;

  var table = el("table", "schnelltable offlinejurytable");

  var head = el("tr");
  head.appendChild(el("th", "l", "Offline-Jurierende"));
  ids.forEach(function (id, col) {
    var th = el("th");
    var nameInp = el("input", "offlinejudgename");
    nameInp.type = "text";
    nameInp.placeholder = "Name";
    nameInp.value = (offlineJudges[id] || {}).name || "";
    nameInp.tabIndex = col * rowsPerCol + 1;
    nameInp.addEventListener("change", function () {
      renameOfflineJudge(id, nameInp.value.trim());
    });
    th.appendChild(nameInp);
    head.appendChild(th);
  });
  // The "add" column stays to the right of the last judge, so the table
  // itself never has to stretch to make room for it.
  var addTh = el("th", "offlinejudgeaddcell");
  addTh.appendChild(addBtn());
  head.appendChild(addTh);
  table.appendChild(head);

  speakers.forEach(function (s, r) {
    var tr = el("tr", deductionLevel(s) ? "deducted" : null);
    var lbl = el("td", "l", speakerLabel(s));
    var teamCls = teamClass(SPEAKERS[s].team);
    if (teamCls) lbl.classList.add(teamCls);
    tr.appendChild(lbl);
    ids.forEach(function (id, col) {
      var td = el("td");
      td.appendChild(
        offlineScoreInput(
          id,
          "s" + s,
          offlineSpeakerMax(),
          col * rowsPerCol + 1 + r + 1,
        ),
      );
      tr.appendChild(td);
    });
    tr.appendChild(el("td"));
    table.appendChild(tr);
  });

  table.appendChild(ballotSepRow(ids.length + 2));

  TEAMS.forEach(function (tm, t) {
    var tr = el("tr");
    tr.appendChild(el("td", "l " + teamClass(t), "Teampunkte " + tm));
    ids.forEach(function (id, col) {
      var td = el("td");
      var r = speakers.length + t;
      td.appendChild(
        offlineScoreInput(
          id,
          "t" + t,
          offlineTeamMax(),
          col * rowsPerCol + 1 + r + 1,
        ),
      );
      tr.appendChild(td);
    });
    tr.appendChild(el("td"));
    table.appendChild(tr);
  });

  var delTr = el("tr");
  delTr.appendChild(el("td", "l"));
  ids.forEach(function (id) {
    var td = el("td");
    var del = el("button", "offlinejudgedel", "Entfernen");
    del.type = "button";
    del.tabIndex = -1;
    del.addEventListener("click", function () {
      var name = (offlineJudges[id] || {}).name;
      openConfirmModal({
        text:
          (name ? name : "Offline-Juror:in") +
          " wirklich entfernen? Die eingegebenen Punkte gehen dabei verloren.",
        confirmLabel: "Entfernen",
        onConfirm: function () {
          removeOfflineJudge(id);
        },
      });
    });
    td.appendChild(del);
    delTr.appendChild(td);
  });
  delTr.appendChild(el("td"));
  table.appendChild(delTr);

  container.appendChild(table);
}
function renderOfflineJudges() {
  var root = document.getElementById("v-offline");
  if (!root) return;
  if (dashEditGuard(root)) return;
  root.innerHTML = "";
  var wrap = el("div", "dashcol");
  var container = el("div", "offlinejurywrap");
  buildOfflineJuryTable(container);
  wrap.appendChild(schnellPanel("Offline-Jurierende", container));
  root.appendChild(wrap);
}

// Adjudikationsblatt: one speech at a time, 4 columns (Sac+Urt merged).
// Shares cs with mobile Reden, so switching views keeps the same speaker.
var BLATT_GROUPS = [
  { key: "spr", critIdx: [0], label: "Sprachkraft" },
  { key: "auf", critIdx: [1], label: "Auftreten" },
  { key: "kon", critIdx: [2], label: "Kontaktfähigkeit" },
  { key: "sacurt", critIdx: [3, 4], label: "Sachverstand & Urteilskraft" },
];

function blattHintText(v) {
  if (v === null) return "–";
  var m = markOf(v);
  return m.name ? m.name + " · " + m.mark : "–";
}

function updateBlattScore(s, c) {
  var v = sget(s, c);
  var grade = gradeInputMode();
  var valEl = document.getElementById("blatt-val-" + s + "-" + c);
  var hintEl = document.getElementById("blatt-hint-" + s + "-" + c);
  var minusEl = document.getElementById("blatt-minus-" + s + "-" + c);
  var plusEl = document.getElementById("blatt-plus-" + s + "-" + c);
  if (valEl)
    valEl.value = v === null ? "" : grade ? gradeMarkFor(v) : String(v);
  if (hintEl) hintEl.textContent = grade ? gradeHintText(v) : blattHintText(v);
  if (minusEl) minusEl.disabled = v === null || v <= 0;
  if (plusEl) plusEl.disabled = v === null || v >= 20;
  var totEl = document.getElementById("blattTot");
  if (totEl) totEl.textContent = String(personPunkte(s));
}

function nudgeSpeakerCriterion(s, c, d) {
  var v = sget(s, c);
  var base = v === null ? 0 : v;
  write("s" + s, CRITERIA[c].key, Math.max(0, Math.min(20, base + d)));
  updateBlattScore(s, c);
}

// True once every speaker criterion has a score - used to jump straight to
// the next speech on Enter instead of stopping at the last score field.
function allSpeakerScoresFilled(s) {
  return CRITERIA.every(function (_, c) {
    return sget(s, c) !== null;
  });
}

// Moves the room to the next active speech and refocuses its first score
// field, so Enter can keep going without the hands leaving the keyboard.
function advanceToNextSpeech() {
  var n = nextActiveSpeaker(cs);
  if (n === -1) return;
  cs = n;
  render();
  var first = document.querySelector("#v-blatt .blattinput");
  if (first) first.focus();
}

function blattScoreField(s, c, tabIdx) {
  var wrap = el("div", "blattscore");
  wrap.appendChild(el("div", "blattlbl", CRITERIA[c].label));

  var grade = gradeInputMode();
  var onEnter = function (inp) {
    if (allSpeakerScoresFilled(s)) advanceToNextSpeech();
    else focusNextNumberInput(inp);
  };
  var fieldOpts = { extraClass: "blattinput", width: false, onEnter: onEnter };
  var inp = grade ? gradeTextInput(fieldOpts) : schnellNumberInput(fieldOpts);
  inp.id = "blatt-val-" + s + "-" + c;
  inp.tabIndex = tabIdx;
  var v = sget(s, c);
  if (v !== null) inp.value = grade ? gradeMarkFor(v) : String(v);
  inp.addEventListener("change", function () {
    commitScoreField(inp, 20, "s" + s, CRITERIA[c].key, function () {
      updateBlattScore(s, c);
    });
  });
  wrap.appendChild(inp);

  var hintRow = el("div", "blatthintrow");
  var minus = el("button", "blattnudge", "−1");
  minus.type = "button";
  minus.tabIndex = -1;
  minus.id = "blatt-minus-" + s + "-" + c;
  minus.addEventListener("click", function () {
    nudgeSpeakerCriterion(s, c, -1);
  });
  hintRow.appendChild(minus);

  var hint = el(
    "div",
    "blatthint",
    grade ? gradeHintText(v) : blattHintText(v),
  );
  hint.id = "blatt-hint-" + s + "-" + c;
  hintRow.appendChild(hint);

  var plus = el("button", "blattnudge", "+1");
  plus.type = "button";
  plus.tabIndex = -1;
  plus.id = "blatt-plus-" + s + "-" + c;
  plus.addEventListener("click", function () {
    nudgeSpeakerCriterion(s, c, 1);
  });
  hintRow.appendChild(plus);
  wrap.appendChild(hintRow);

  minus.disabled = v === null || v <= 0;
  plus.disabled = v === null || v >= 20;

  return wrap;
}

function blattNotesField(s, group, tabIdx) {
  var ta = el("textarea", "blattnotes");
  ta.placeholder = "Notizen zu " + group.label + " …";
  ta.value = getNote(s, group.key);
  ta.tabIndex = tabIdx;
  ta.id = "blatt-note-" + s + "-" + group.key;
  ta.addEventListener("input", function () {
    setNote(s, group.key, ta.value);
  });
  return ta;
}

// Notes come before scores in tab order. tabIndex alone isn't enough:
// focus resting on a tabindex=-1 chrome button (nav switch, prev/next)
// makes the browser fall back to plain DOM order for "next focusable", so
// notes must also come first in the DOM - CSS `order` restores the usual
// scores-on-top-notes-below layout.
function blattColumn(s, group, scoreTabStart, noteTabIdx) {
  var col = el("div", "blattcol");
  if (group.critIdx.length > 1) col.classList.add("blattcol-wide");
  col.appendChild(blattNotesField(s, group, noteTabIdx));
  var scores = el("div", "blattscores");
  group.critIdx.forEach(function (c, i) {
    scores.appendChild(blattScoreField(s, c, scoreTabStart + i));
  });
  col.appendChild(scores);
  return col;
}

function renderBlatt() {
  var root = document.getElementById("v-blatt");
  if (!root) return;
  if (dashEditGuard(root)) return;
  root.innerHTML = "";

  var sp = SPEAKERS[cs];
  var teamCls = teamClass(sp.team);

  var head = el("div", "blatthead " + teamCls);
  var prev = el("button", "navbtn", "‹");
  prev.tabIndex = -1;
  prev.disabled = prevActiveSpeaker(cs) === -1;
  prev.addEventListener("click", function () {
    var p = prevActiveSpeaker(cs);
    if (p !== -1) {
      cs = p;
      render();
    }
  });
  head.appendChild(prev);

  var mid = el("div", "blattheadmid");
  mid.appendChild(el("h1", "blatttitle", speakerLabel(cs)));
  mid.appendChild(
    el(
      "div",
      "sub",
      "Rede " + activeOrdinal(cs) + " von " + activeSpeakerCount(),
    ),
  );
  head.appendChild(mid);

  var next = el("button", "navbtn", "›");
  next.tabIndex = -1;
  next.disabled = nextActiveSpeaker(cs) === -1;
  next.addEventListener("click", function () {
    var n = nextActiveSpeaker(cs);
    if (n !== -1) {
      cs = n;
      render();
    }
  });
  head.appendChild(next);

  var stat = el("div", "blattstat");
  var totWrap = el("div", "blatttotwrap");
  totWrap.appendChild(el("span", "blatttotlbl", "Gesamtpunkte"));
  var totVal = el("span", "blatttotval", String(personPunkte(cs)));
  totVal.id = "blattTot";
  totWrap.appendChild(totVal);
  var dedLvl = deductionLevel(cs);
  if (dedLvl)
    totWrap.appendChild(
      el("span", "dedbadge", "(−" + deductionPoints(cs) + ")"),
    );
  stat.appendChild(totWrap);

  var excluded = !!myExclusions["s" + cs];
  var exclBtn = el(
    "button",
    "exclbtn" + (excluded ? " on" : ""),
    excluded ? "In Wertung eingehen" : "Aus Wertung nehmen",
  );
  exclBtn.type = "button";
  exclBtn.tabIndex = -1;
  exclBtn.addEventListener("click", function () {
    setExclusion("s" + cs, !excluded);
  });
  stat.appendChild(exclBtn);
  head.appendChild(stat);
  root.classList.toggle("excluded", excluded);
  root.appendChild(head);

  var body = el("div", "blattbody");
  // Notes get the first BLATT_GROUPS.length tab stops, scores follow.
  var noteTab = 1;
  var scoreTab = 1 + BLATT_GROUPS.length;
  BLATT_GROUPS.forEach(function (group) {
    var scoreTabStart = scoreTab;
    scoreTab += group.critIdx.length;
    body.appendChild(blattColumn(cs, group, scoreTabStart, noteTab));
    noteTab++;
  });
  root.appendChild(body);

  if (ME.is_chair) {
    var dedu = el("div", "dedu");
    dedu.appendChild(el("span", "l", "Abzüge"));
    var lvl = deductionLevel(cs);
    [
      { l: "", t: "Keiner" },
      { l: "small", t: "Klein (−3)" },
      { l: "big", t: "Groß (−15)" },
    ].forEach(function (o) {
      var b = el("button", "dedopt" + (o.l === lvl ? " on" : ""), o.t);
      b.tabIndex = -1;
      b.addEventListener("click", function () {
        setDeduction(cs, o.l); // calls render() itself
      });
      dedu.appendChild(b);
    });
    root.appendChild(dedu);
  }
}

// Team-first sibling to Blatt - both teams' 7 categories + notes on one screen, no paging.
function teamPointsHintText(v, max) {
  if (v === null) return "–";
  var m = markOf(katOf(v, max));
  return m.name ? m.name + " · " + m.mark : "–";
}

function updateTeamPointsScore(t, catIdx) {
  var cat = TEAMCATS[catIdx];
  var v = tget(t, catIdx);
  var grade = gradeInputMode();
  var valEl = document.getElementById("teampoints-val-t" + t + "-c" + catIdx);
  var hintEl = document.getElementById("teampoints-hint-t" + t + "-c" + catIdx);
  var minusEl = document.getElementById(
    "teampoints-minus-t" + t + "-c" + catIdx,
  );
  var plusEl = document.getElementById("teampoints-plus-t" + t + "-c" + catIdx);
  if (valEl)
    valEl.value =
      v === null ? "" : grade ? gradeMarkFor(v, cat.max) : String(v);
  if (hintEl)
    hintEl.textContent = grade
      ? gradeHintText(v)
      : teamPointsHintText(v, cat.max);
  if (minusEl) minusEl.disabled = v === null || v <= 0;
  if (plusEl) plusEl.disabled = v === null || v >= cat.max;
  var totEl = document.getElementById("teampointsTot-t" + t);
  if (totEl) totEl.textContent = String(teamPunkte(t));
}

function nudgeTeamCategory(t, catIdx, d) {
  var cat = TEAMCATS[catIdx];
  var v = tget(t, catIdx);
  var base = v === null ? 0 : v;
  write("t" + t, cat.key, Math.max(0, Math.min(cat.max, base + d)));
  updateTeamPointsScore(t, catIdx);
}

function teamPointsScoreField(t, catIdx, tabIdx) {
  var cat = TEAMCATS[catIdx];
  var wrap = el("div", "blattscore");
  wrap.appendChild(el("div", "blattlbl", cat.label + " (max " + cat.max + ")"));

  var grade = gradeInputMode();
  var fieldOpts = { extraClass: "blattinput", width: false };
  var inp = grade ? gradeTextInput(fieldOpts) : schnellNumberInput(fieldOpts);
  inp.id = "teampoints-val-t" + t + "-c" + catIdx;
  inp.tabIndex = tabIdx;
  var v = tget(t, catIdx);
  if (v !== null) inp.value = grade ? gradeMarkFor(v, cat.max) : String(v);
  inp.addEventListener("change", function () {
    commitScoreField(inp, cat.max, "t" + t, cat.key, function () {
      updateTeamPointsScore(t, catIdx);
    });
  });
  wrap.appendChild(inp);

  var hintRow = el("div", "blatthintrow");
  var minus = el("button", "blattnudge", "−1");
  minus.type = "button";
  minus.tabIndex = -1;
  minus.id = "teampoints-minus-t" + t + "-c" + catIdx;
  minus.addEventListener("click", function () {
    nudgeTeamCategory(t, catIdx, -1);
  });
  hintRow.appendChild(minus);

  var hint = el(
    "div",
    "blatthint",
    grade ? gradeHintText(v) : teamPointsHintText(v, cat.max),
  );
  hint.id = "teampoints-hint-t" + t + "-c" + catIdx;
  hintRow.appendChild(hint);

  var plus = el("button", "blattnudge", "+1");
  plus.type = "button";
  plus.tabIndex = -1;
  plus.id = "teampoints-plus-t" + t + "-c" + catIdx;
  plus.addEventListener("click", function () {
    nudgeTeamCategory(t, catIdx, 1);
  });
  hintRow.appendChild(plus);
  wrap.appendChild(hintRow);

  minus.disabled = v === null || v <= 0;
  plus.disabled = v === null || v >= cat.max;

  return wrap;
}

function teamPointsNotesField(t, cat, tabIdx) {
  var ta = el("textarea", "blattnotes");
  ta.placeholder = "Notizen zu " + cat.label + " …";
  ta.value = getTeamNote(t, cat.key);
  ta.tabIndex = tabIdx;
  ta.id = "teampoints-note-t" + t + "-" + cat.key;
  ta.addEventListener("input", function () {
    setTeamNote(t, cat.key, ta.value);
  });
  return ta;
}

// Notes precede the score in the DOM (see blattColumn's comment for why);
// .teampointscatscore{order:1} / .blattnotes{order:2} keep the score
// visually on top.
function teamPointsCategoryBlock(t, catIdx, tabIdx, noteTabIdx) {
  var cat = TEAMCATS[catIdx];
  var block = el("div", "teampointscatblock");
  block.appendChild(teamPointsNotesField(t, cat, noteTabIdx));
  var scoreWrap = el("div", "teampointscatscore");
  scoreWrap.appendChild(teamPointsScoreField(t, catIdx, tabIdx));
  block.appendChild(scoreWrap);
  return block;
}

// Notes come before scores in tab order, same as Blatt.
function teamPointsColumn(t, group, scoreTabStart, noteTabStart) {
  var col = el("div", "blattcol teampointscol-" + group.cats.length);
  var row = el("div", "teampointscatrow");
  group.cats.forEach(function (catIdx, i) {
    row.appendChild(
      teamPointsCategoryBlock(t, catIdx, scoreTabStart + i, noteTabStart + i),
    );
  });
  col.appendChild(row);
  return col;
}

// noteTabStart/scoreTabStart are shared counters across both team sections,
// so tab order goes through every note field (both teams) before any score
// field - see renderTeamPoints.
function teamPointsSection(t, noteTabStart, scoreTabStart) {
  var teamCls = teamClass(t);
  var sec = el("div", "teampointssec " + teamCls);

  var head = el("div", "teampointssechead");
  head.appendChild(el("div", "teampointssecname", TEAMS[t]));

  var right = el("div", "teampointssecright");
  var totWrap = el("div", "teampointstotwrap");
  totWrap.appendChild(el("span", "teampointstotlbl", "Teampunkte"));
  var totVal = el("span", "teampointstotval", String(teamPunkte(t)));
  totVal.id = "teampointsTot-t" + t;
  totWrap.appendChild(totVal);
  right.appendChild(totWrap);

  var excluded = !!myExclusions["t" + t];
  var exclBtn = el(
    "button",
    "exclbtn" + (excluded ? " on" : ""),
    excluded ? "In Wertung eingehen" : "Aus Wertung nehmen",
  );
  exclBtn.type = "button";
  exclBtn.tabIndex = -1;
  exclBtn.addEventListener("click", function () {
    setExclusion("t" + t, !excluded);
  });
  right.appendChild(exclBtn);
  head.appendChild(right);

  sec.classList.toggle("excluded", excluded);
  sec.appendChild(head);

  var body = el("div", "blattbody teampointsbody");
  var noteTab = noteTabStart;
  var scoreTab = scoreTabStart;
  TEAMGROUPS_INFO.forEach(function (group) {
    var scoreTabStartForGroup = scoreTab;
    scoreTab += group.cats.length;
    var noteTabStartForGroup = noteTab;
    noteTab += group.cats.length;
    body.appendChild(
      teamPointsColumn(t, group, scoreTabStartForGroup, noteTabStartForGroup),
    );
  });
  sec.appendChild(body);

  return { el: sec, nextNoteTab: noteTab, nextScoreTab: scoreTab, body: body };
}

function renderTeamPoints() {
  var root = document.getElementById("v-teampoints");
  if (!root) return;
  if (dashEditGuard(root)) return;
  root.innerHTML = "";

  var wrap = el("div", "teampointswrap");
  // Both teams' notes (1..2*TEAMCATS.length) come before either team's
  // scores, same idea as Blatt's notes-before-scores tab order.
  var noteTab = 1;
  var scoreTab = 1 + 2 * TEAMCATS.length;
  for (var t = 0; t < 2; t++) {
    var sec = teamPointsSection(t, noteTab, scoreTab);
    noteTab = sec.nextNoteTab;
    scoreTab = sec.nextScoreTab;
    wrap.appendChild(sec.el);
  }
  root.appendChild(wrap);
}

// Mobile "Namen" tab - a stacked list of name inputs in speaking order.
function renderNamen() {
  var list = document.getElementById("namenList");
  if (!list) return;
  var title = document.getElementById("namenTitle");
  if (title && ME) title.textContent = "Raum " + ME.code;
  if (dashEditGuard(list)) return;
  list.innerHTML = "";
  activeSpeakerIndices().forEach(function (s) {
    var seat = namenSeat(s, SPEAKERS[s].label);
    setTeamAccent(seat.querySelector(".slbl"), teamOf(s));
    list.appendChild(seat);
  });
}

// Builds one seat: a label plus a name input bound to getName/setName.
// tabIndex follows speaking order (activeOrdinal)
function namenSeat(s, label) {
  var seat = el("div", "seat");
  seat.appendChild(el("div", "slbl", label));
  var input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Name eingeben";
  input.value = getName(s);
  input.tabIndex = activeOrdinal(s);
  input.addEventListener("input", function () {
    setName(s, input.value);
  });
  seat.appendChild(input);
  return seat;
}

// Desktop "Namen" view - the room shape (Gov/Opp facing tables, Fraktionsfrei
// and Jury below), matching where each role actually sits during a debate.
function renderNamenRoom() {
  var root = document.getElementById("v-namenroom");
  if (!root) return;
  if (dashEditGuard(root)) return;
  root.innerHTML = "";

  var wrap = el("div", "roomview");
  wrap.appendChild(el("h1", "roomtitle", "Raum " + ME.code));
  wrap.appendChild(
    el(
      "p",
      "sub",
      "Namen sind optional, werden nur lokal gespeichert und nicht synchronisiert.",
    ),
  );

  var stage = el("div", "roomstage");
  var facing = el("div", "facingrow");
  var gov = el("div", "roomtable team-gov");
  gov.appendChild(el("div", "tname", "Regierung"));
  gov.appendChild(namenSeat(0, "Eröffnungsrede"));
  gov.appendChild(namenSeat(2, "Ergänzungsrede"));
  gov.appendChild(namenSeat(15, "Schlussrede"));
  facing.appendChild(gov);
  var opp = el("div", "roomtable team-opp");
  opp.appendChild(el("div", "tname", "Opposition"));
  opp.appendChild(namenSeat(1, "Eröffnungsrede"));
  opp.appendChild(namenSeat(3, "Ergänzungsrede"));
  opp.appendChild(namenSeat(14, "Schlussrede"));
  facing.appendChild(opp);
  stage.appendChild(facing);

  var lower = el("div", "lowerrow");
  var free = el("div", "roomtable team-free");
  free.appendChild(el("div", "tname", "Fraktionsfrei"));
  var freeIdx = activeSpeakerIndices().filter(function (s) {
    return teamOf(s) === null;
  });
  if (freeIdx.length === 0) {
    free.appendChild(
      el("div", "slbl", "Keine fraktionsfreien Reden in dieser Runde"),
    );
  } else {
    freeIdx.forEach(function (s, i) {
      free.appendChild(namenSeat(s, i + 1 + ". Rede"));
    });
  }
  lower.appendChild(free);

  var jury = el("div", "roomtable jury");
  jury.appendChild(el("div", "tname", "Jury"));
  Object.keys(peers).forEach(function (id) {
    var j = peers[id];
    var row = el("div", "juryrow");
    row.appendChild(el("span", "dot " + (j.online ? "on" : "off")));
    row.appendChild(
      el(
        "span",
        "juryname",
        j.name + (j.is_chair ? " · Chair" : j.hidden ? " · Trainee" : ""),
      ),
    );
    // Only the chair can flip a wing to trainee (and back) - the server
    // enforces this too, this just avoids showing a button that 403s.
    if (ME.is_chair && !j.is_chair) {
      var btn = el("button", "juryab", j.hidden ? "Zu Wing" : "Zu Trainee");
      btn.type = "button";
      btn.tabIndex = -1;
      btn.title = j.hidden
        ? "Wertung wieder in den Schnitt einbeziehen"
        : "Aus der Wertung nehmen (Punkte bleiben gespeichert, zählen aber nicht mehr in den Schnitt)";
      btn.addEventListener("click", function () {
        confirmHiddenToggle(id, j.name, !j.hidden);
      });
      row.appendChild(btn);
    }
    jury.appendChild(row);
  });
  Object.keys(offlineJudges).forEach(function (id) {
    var j = offlineJudges[id];
    var row = el("div", "juryrow");
    row.appendChild(el("span", "dot off"));
    row.appendChild(
      el(
        "span",
        "juryname",
        j.name + " · Offline" + (j.hidden ? " · Trainee" : ""),
      ),
    );
    if (ME.is_chair) {
      var btn = el("button", "juryab", j.hidden ? "Zu Wing" : "Zu Trainee");
      btn.type = "button";
      btn.tabIndex = -1;
      btn.title = j.hidden
        ? "Wertung wieder in den Schnitt einbeziehen"
        : "Aus der Wertung nehmen (Punkte bleiben gespeichert, zählen aber nicht mehr in den Schnitt)";
      btn.addEventListener("click", function () {
        confirmHiddenToggle(OFFLINE_ID_PREFIX + id, j.name, !j.hidden);
      });
      row.appendChild(btn);
    }
    jury.appendChild(row);
  });
  if (ME.is_chair) {
    var addOfflineBtn = el(
      "button",
      "offlinejudgeadd",
      "+ Offline-Juror:in hinzufügen",
    );
    addOfflineBtn.type = "button";
    addOfflineBtn.tabIndex = -1;
    addOfflineBtn.addEventListener("click", addOfflineJudgeAndOpenPanel);
    jury.appendChild(addOfflineBtn);
  }
  lower.appendChild(jury);
  stage.appendChild(lower);

  wrap.appendChild(stage);
  root.appendChild(wrap);
}

function render() {
  if (!ME) return;
  applyLayoutMode();
  if (isDesktopWidth()) {
    renderDashChrome();
    var ev = effectiveDashboardView();
    if (ev === "namen") renderNamenRoom();
    else if (ev === "schnell") renderSchnell();
    else if (ev === "blatt") renderBlatt();
    else if (ev === "teampoints") renderTeamPoints();
    else if (ev === "offline") renderOfflineJudges();
    else renderDashboard();
  } else {
    var mv = effectiveMobileView();
    if (mv === "namen") renderNamen();
    if (mv === "sheet") renderSheet();
    if (mv === "team") renderTeam();
    if (mv === "matrix") renderMatrix();
    if (mv === "chair") renderChair();
  }
  paintBar();
}

// Lobby session
function urlCode() {
  var m = location.pathname.match(/^\/r\/([A-Za-z0-9]{4})$/);
  return m ? m[1].toUpperCase() : null;
}
// A small most-recent-first index of past rooms (code/name/filled count/
// timestamp), separate from the per-room opd.session.<code> blob each one
// still keeps (leaveRoom() never deletes those) - lets the lobby list
// rejoinable rooms without scanning all of localStorage. Called both on
// join (so the room shows up even if the tab closes without an explicit
// "Verlassen") and again on leave (to capture the final filled count), so
// it always reads whatever `mine` currently holds rather than the target
// room's own cache - correct at both call sites, since both run only while
// `mine` actually belongs to that room.
function recordRecentRoom(code, name, isChair) {
  var list = LS.get("opd.recent", []) || [];
  list = list.filter(function (r) {
    return r.code !== code;
  });
  list.unshift({
    code: code,
    name: name,
    is_chair: isChair,
    filled: Object.keys(mine).length,
    judges: Object.keys(peers).length,
    ts: Date.now(),
  });
  LS.set("opd.recent", list.slice(0, 8));
}
function renderRecentRooms() {
  var wrap = document.getElementById("lobbyRecent");
  var list = document.getElementById("lobbyRecentList");
  var here = urlCode();
  var rooms = (LS.get("opd.recent", []) || []).filter(function (r) {
    return r.code !== here;
  });
  wrap.classList.toggle("hide", rooms.length === 0);
  list.innerHTML = "";
  rooms.forEach(function (r) {
    var btn = el("button", "recentroom");
    btn.type = "button";
    btn.appendChild(el("span", "code", r.code));
    var who = el("div", "info");
    who.appendChild(el("div", "who", r.name));
    who.appendChild(el("div", "who", r.is_chair ? "Chair" : "Wing"));
    btn.appendChild(who);
    var meta = el("div", "info");
    meta.appendChild(
      el(
        "div",
        "meta",
        (r.filled || 0) +
          " Punkte eingetragen" +
          (r.judges ? " · " + r.judges + " Judges" : ""),
      ),
    );
    meta.appendChild(
      el("div", "meta", new Date(r.ts).toLocaleDateString("de-DE")),
    );
    btn.appendChild(meta);
    btn.addEventListener("click", function () {
      rejoinRecentRoom(r.code);
    });
    list.appendChild(btn);
  });
}
function rejoinRecentRoom(code) {
  var sess = LS.get("opd.session." + code, null);
  if (!sess || !sess.token) {
    document.getElementById("rc").value = code;
    lobbyErr(
      "Sitzung für diesen Raum ist abgelaufen — bitte erneut beitreten.",
    );
    return;
  }
  startSession(sess);
  resync();
}
function showLobby() {
  var code = urlCode();
  document.getElementById("v-lobby").classList.remove("hide");
  document.getElementById("main").classList.add("hide");
  document.getElementById("dock").classList.add("hide");
  // render()/applyLayoutMode() never run again once ME is null (leaveRoom's
  // resetRoomState clears it), so the desktop chrome classes from before
  // leaving would otherwise stay stuck on #app, stretching the lobby card.
  document.getElementById("app").classList.remove("dashboard-mode");
  if (code) {
    document.getElementById("lobbyCode").textContent = code;
    document.getElementById("lobbyJoin").classList.remove("hide");
    document.getElementById("lobbyCreate").classList.add("hide");
    document.getElementById("btnJoin").classList.remove("hide");
  }
  var last = LS.get("opd.lastname", "");
  if (last) document.getElementById("nm").value = last;
  renderRecentRooms();
  setTimeout(function () {
    document.getElementById("nm").focus();
  }, 100);
}
function startSession(s) {
  ME = {
    code: s.code,
    token: s.token,
    judge_id: s.judge_id,
    name: s.name,
    is_chair: s.is_chair,
  };
  LS.set("opd.session." + s.code, ME);
  LS.set("opd.lastname", s.name);
  // Land back on whatever tab/dashboard view was open before a reload,
  // instead of always resetting to Namen.
  view = LS.get("opd.view." + s.code, "namen") || "namen";
  dashboardView = LS.get("opd.dashboardView." + s.code, "namen") || "namen";
  loadLocal();
  recordRecentRoom(s.code, s.name, s.is_chair);
  if (!remote[ME.judge_id]) remote[ME.judge_id] = {};
  Object.assign(remote[ME.judge_id], mine);
  document.getElementById("v-lobby").classList.add("hide");
  document.getElementById("main").classList.remove("hide");
  document.getElementById("dock").classList.remove("hide");
  updateChairTab();
  setHistoryUrl("replaceState", { room: ME.code }, "/r/" + ME.code);
  connect();
  acquireWakeLock();
  render();
}

// Wings can't join an offline room (joining needs the server too), so once
// promotion gets it a real code the chair needs to know, in order to
// (re-)share the link - the status-bar text alone is too easy to miss.
function showPromotionNotice(code) {
  openInfoModal(
    "Raum wurde online geschaltet",
    "Neuer Code: " +
      code +
      ". Bitte den Link erneut teilen, damit Beisitzer:innen beitreten können.",
  );
}

// Tries to turn a pending offline room into a real server one, migrating
// all locally-queued scores/notes across. Called from the same signals
// that already drive reconnection (resume(), the 20s heartbeat) rather
// than a dedicated poller.
var promotingOffline = false;
function promoteOfflineRoom() {
  if (!ME || !ME.pendingCreate || promotingOffline) return;
  promotingOffline = true;
  var forCode = ME.code;
  fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: ME.name, client_id: CLIENT_ID }),
  })
    .then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    })
    .then(function (s) {
      // The judge can have left (or swapped rooms) while this was in flight -
      // the new server room is then simply abandoned, rather than having this
      // room's local scores migrated into it.
      if (!ME || !ME.pendingCreate || ME.code !== forCode) {
        promotingOffline = false;
        return;
      }
      var oldCode = ME.code;
      var oldJudgeId = ME.judge_id;

      LS.del("opd.session." + oldCode);
      LS.del("opd.scores." + oldCode);
      LS.del("opd.queue." + oldCode);
      LS.del("opd.notes." + oldCode);
      LS.del("opd.names." + oldCode);

      remote[s.judge_id] = Object.assign({}, remote[oldJudgeId] || {}, mine);
      delete remote[oldJudgeId];

      ME = {
        code: s.code,
        token: s.token,
        judge_id: s.judge_id,
        name: s.name,
        is_chair: s.is_chair,
      };
      LS.set("opd.session." + ME.code, ME);
      saveLocal(); // re-persists mine/queue under the new code
      LS.set("opd.notes." + ME.code, notes);
      LS.set("opd.names." + ME.code, speakerNames);
      recordRecentRoom(ME.code, ME.name, ME.is_chair);

      setHistoryUrl("replaceState", { room: ME.code }, "/r/" + ME.code);

      promotingOffline = false;
      connect();
      flush();
      resync();
      paintBar();
      showPromotionNotice(ME.code);
    })
    .catch(function () {
      promotingOffline = false; // still offline - retried on the next resume()/heartbeat
    });
}
function lobbyErr(msg) {
  document.getElementById("lobbyErr").textContent = msg || "";
}

// Offered when POST /api/rooms fails at the network level (no connectivity) -
// a reachable server that merely rejected the request should not offer this.
function openOfflineRoomModal(name) {
  openConfirmModal({
    title: "Server nicht erreichbar",
    text:
      "Der Server kann aktuell nicht erreicht werden. Du kannst einen " +
      "Offline-Raum erstellen, der automatisch zu einem Standard-Raum " +
      "wird, wenn der Server wieder erreicht wird.",
    confirmLabel: "Offline-Raum erstellen",
    onConfirm: function () {
      createOfflineRoom(name);
    },
  });
}

// Fabricates a room/judge identity in the same shape POST /api/rooms
// returns, so startSession() needs no special-casing. The code is drawn
// only from characters the server's own code alphabet never uses (see
// genOfflineCode()), so it can never collide with a real server code.
function createOfflineRoom(name) {
  startSession({
    code: genOfflineCode(),
    token: "offline:" + uuid(),
    judge_id: "offline:" + uuid(),
    name: name,
    is_chair: true,
  });
  ME.pendingCreate = true;
  LS.set("opd.session." + ME.code, ME);
  // startSession() already called connect() before pendingCreate was set -
  // stop that one attempt rather than let it dangle until it times out.
  if (ws) {
    try {
      ws.close();
    } catch (e) {}
    ws = null;
  }
  if (wsTimer) {
    clearTimeout(wsTimer);
    wsTimer = null;
  }
  paintBar();
}

document.getElementById("btnCreate").addEventListener("click", function () {
  var name = document.getElementById("nm").value.trim();
  if (!name) {
    lobbyErr("Bitte gib deinen Namen ein.");
    return;
  }
  lobbyErr("");
  var btn = document.getElementById("btnCreate");
  var label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Verbinde …";
  function restore() {
    btn.disabled = false;
    btn.textContent = label;
  }
  fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, client_id: CLIENT_ID }),
  })
    .then(function (r) {
      if (!r.ok) {
        restore();
        lobbyErr("Raum konnte nicht erstellt werden (" + r.status + ").");
        return null;
      }
      return r.json();
    })
    .then(function (data) {
      if (data) startSession(data); // navigates away - no need to restore the button
    })
    .catch(function () {
      // fetch() itself rejected - no connectivity, not a server-side error.
      restore();
      openOfflineRoomModal(name);
    });
});
function doJoin(code) {
  var name = document.getElementById("nm").value.trim();
  if (!name) {
    lobbyErr("Bitte gib deinen Namen ein.");
    return;
  }
  if (!code) {
    lobbyErr("Bitte gib einen Raumcode ein.");
    return;
  }
  lobbyErr("");
  fetch("/api/rooms/" + code + "/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, client_id: CLIENT_ID }),
  })
    .then(function (r) {
      if (r.status === 404) throw new Error("Raum " + code + " gibt es nicht.");
      if (!r.ok) throw new Error("Beitritt fehlgeschlagen.");
      return r.json();
    })
    .then(startSession)
    .catch(function (e) {
      lobbyErr(e.message || "Beitritt fehlgeschlagen.");
    });
}
document.getElementById("btnJoin").addEventListener("click", function () {
  doJoin(urlCode());
});
document.getElementById("btnJoinCode").addEventListener("click", function () {
  doJoin(document.getElementById("rc").value.trim().toUpperCase());
});
document.getElementById("rc").addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});
document.getElementById("nm").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    var c = urlCode();
    if (c) doJoin(c);
    else document.getElementById("btnCreate").click();
  }
});
// navigator.clipboard needs https/localhost; this app usually runs on plain
// http (see run.sh), so execCommand("copy") is the fallback every caller needs.
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    var tmp = document.createElement("input");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.select();
    tmp.setSelectionRange(0, 99999);
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(tmp);
    if (ok) resolve();
    else reject(new Error("copy failed"));
  });
}
function copyRoomLink(btn, url) {
  var label = btn.textContent;
  copyText(url).then(
    function () {
      btn.textContent = "Kopiert";
      setTimeout(function () {
        btn.textContent = label;
      }, 1500);
    },
    function () {},
  );
}
document.getElementById("btnCopy").addEventListener("click", function () {
  copyRoomLink(this, document.getElementById("shareUrl").value);
});
document.getElementById("menuCopyLink").addEventListener("click", function () {
  copyRoomLink(this, location.origin + "/r/" + ME.code);
});
document.getElementById("btnSpreadOpen").addEventListener("click", function () {
  var next = !spreadOpen;
  fetch(
    "/api/rooms/" +
      ME.code +
      "/spread_open?open=" +
      next +
      "&token=" +
      encodeURIComponent(ME.token),
    { method: "POST" },
  ).then(function () {
    spreadOpen = next;
    render();
  });
});

function showView(v) {
  view = v;
  if (ME) LS.set("opd.view." + ME.code, v);
  [].forEach.call(
    document.querySelectorAll("#tabs button[data-t]"),
    function (x) {
      x.setAttribute("aria-pressed", String(x.dataset.t === view));
    },
  );
  ["namen", "sheet", "team", "matrix", "chair"].forEach(function (vv) {
    document.getElementById("v-" + vv).classList.toggle("hide", vv !== view);
  });
  document
    .getElementById("dockSheet")
    .classList.toggle("hide", view !== "sheet");
  document.getElementById("dockTeam").classList.toggle("hide", view !== "team");
}
document.getElementById("tabs").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-t]");
  if (!b) return;
  showView(b.dataset.t);
  render();
});
document.getElementById("prev").addEventListener("click", function () {
  var p = prevActiveSpeaker(cs);
  if (p !== -1) {
    cs = p;
    cc = Math.max(0, firstEmptyS(cs));
    render();
  }
});
document.getElementById("next").addEventListener("click", function () {
  var n = nextActiveSpeaker(cs);
  if (n !== -1) {
    cs = n;
    cc = Math.max(0, firstEmptyS(cs));
    render();
  }
});
document.getElementById("tprev").addEventListener("click", function () {
  if (ct > 0) {
    ct--;
    ctc = Math.max(0, firstEmptyT(ct));
    render();
  }
});

// Enable swipe navigation
function addSwipe(el, onLeft, onRight) {
  var sx = 0,
    sy = 0,
    tracking = false;
  el.addEventListener(
    "touchstart",
    function (e) {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      tracking = true;
    },
    { passive: true },
  );
  el.addEventListener(
    "touchend",
    function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx,
        dy = t.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onLeft();
        else onRight();
      }
    },
    { passive: true },
  );
}
addSwipe(
  document.getElementById("v-sheet"),
  function () {
    document.getElementById("next").click();
  },
  function () {
    document.getElementById("prev").click();
  },
);
addSwipe(
  document.getElementById("v-team"),
  function () {
    document.getElementById("tnext").click();
  },
  function () {
    document.getElementById("tprev").click();
  },
);
document.getElementById("tnext").addEventListener("click", function () {
  if (ct < 1) {
    ct++;
    ctc = Math.max(0, firstEmptyT(ct));
    render();
  }
});
document.getElementById("deduRow").addEventListener("click", function (e) {
  var b = e.target.closest(".dedopt");
  if (!b) return;
  setDeduction(cs, b.dataset.lvl);
});
document.getElementById("exclBtn").addEventListener("click", function () {
  setExclusion("s" + cs, !myExclusions["s" + cs]);
});
document.getElementById("texclBtn").addEventListener("click", function () {
  setExclusion("t" + ct, !myExclusions["t" + ct]);
});
document.getElementById("leaveBtn").addEventListener("click", leaveRoom);

function closeMenu() {
  document.getElementById("menuPanel").classList.add("hide");
  document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
}
document.getElementById("menuBtn").addEventListener("click", function (e) {
  e.stopPropagation();
  var panel = document.getElementById("menuPanel");
  var open = panel.classList.toggle("hide") === false;
  this.setAttribute("aria-expanded", String(open));
});
document.getElementById("menuPanel").addEventListener("click", function (e) {
  var item = e.target.closest(".menuitem");
  // Two exceptions stay open: copying, to show the "Kopiert" confirmation
  // instead of vanishing the instant it's tapped, and the Zeitsignal
  // switch, so the two voices can be tapped back and forth and compared.
  if (item && item.id !== "menuCopyLink" && item.id !== "menuBellVoice")
    closeMenu();
});
document.addEventListener("click", function (e) {
  var panel = document.getElementById("menuPanel");
  if (panel.classList.contains("hide")) return;
  if (e.target.closest("#menuPanel") || e.target.closest("#menuBtn")) return;
  closeMenu();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeMenu();
    closeJuryPanel();
  }
});
window.addEventListener("popstate", function () {
  var code = urlCode();
  if (code && !ME) {
    // Back-navigated from the post-leave "/" entry to the room's URL:
    // rejoin using the session kept in localStorage.
    var sess = LS.get("opd.session." + code, null);
    if (sess && sess.token) {
      startSession(sess);
      resync();
      return;
    }
  }
  if (!code && ME) {
    // Forward-navigated back to the post-leave "/" entry: mirror leaveRoom
    // without touching history again (the URL already matches).
    resetRoomState();
    showLobby();
  }
});
document.getElementById("btnBallot").addEventListener("click", function () {
  ballotOpen = !ballotOpen;
  render();
});
document
  .getElementById("btnOfflineJudges")
  .addEventListener("click", function () {
    offlineJudgesOpen = !offlineJudgesOpen;
    render();
  });
document.getElementById("themeBtn").addEventListener("click", cycleTheme);
document
  .getElementById("menuGradeInput")
  .addEventListener("click", toggleGradeInput);
document
  .getElementById("menuTimerDisplay")
  .addEventListener("click", toggleTimerCountUp);
document
  .getElementById("menuBellVoice")
  .addEventListener("click", toggleBellVoice);
document.getElementById("undoBtn").addEventListener("click", function () {
  var h = hist.pop();
  if (!h) return;
  write("s" + h.s, CRITERIA[h.c].key, h.prev); // prev === null clears the cell
  cs = h.s;
  cc = h.c;
  render();
});
document.getElementById("tundoBtn").addEventListener("click", function () {
  var h = thist.pop();
  if (!h) return;
  write("t" + h.t, TEAMCATS[h.c].key, h.prev); // prev === null clears the cell
  ct = h.t;
  ctc = h.c;
  render();
});

// Install button - shown on any phone-width screen, browser support for an
// automatic prompt or not. Chromium browsers fire beforeinstallprompt, so
// there the button triggers the native install dialog directly; everywhere
// else (Firefox Android, iOS Safari) it falls back to a note pointing at the
// browser's own "Add to Home screen" menu item, since those browsers don't
// expose an installability API to trigger it from the page.
var deferredInstallPrompt = null;
function isMobileViewport() {
  return window.matchMedia("(max-width: 1023px)").matches;
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  deferredInstallPrompt = e;
});
document.getElementById("btnInstall").addEventListener("click", function () {
  if (deferredInstallPrompt) {
    var e = deferredInstallPrompt;
    deferredInstallPrompt = null;
    document.getElementById("btnInstall").classList.add("hide");
    e.prompt();
  } else {
    document.getElementById("installNote").classList.remove("hide");
  }
});
window.addEventListener("appinstalled", function () {
  document.getElementById("btnInstall").classList.add("hide");
  document.getElementById("installNote").classList.add("hide");
});

// boot function
(function () {
  if ("serviceWorker" in navigator) {
    // Rejects for a copy of the app served from anywhere it can't scope a
    // worker (a saved-to-disk file:// copy being the obvious one) - that's
    // just no offline caching, not a reason to leave a rejection dangling.
    navigator.serviceWorker.register("/static/sw.js").catch(function () {});
  }
  if (isMobileViewport() && !isStandalone()) {
    document.getElementById("btnInstall").classList.remove("hide");
  }
  applyTheme(LS.get("opd.theme", "light"));
  applyGradeInputLabel();
  applyTimerDisplayLabel();
  applyBellVoiceLabel();
  // Only an explicit /r/CODE link auto-resumes a session - landing on the
  // bare app URL always shows the lobby (with the recent-rooms list to
  // rejoin from), even if a session for some room is still cached.
  var code = urlCode();
  var sess = code ? LS.get("opd.session." + code, null) : null;
  if (sess && sess.token) {
    startSession(sess);
    resync();
  } else {
    showLobby();
  }
})();
