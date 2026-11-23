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
// Active free-speaker slots, set by the chair (default 3)
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
// Snaps cs onto the nearest active speaker after freeSpeakerCount changes
function snapToActiveSpeaker() {
  if (isActiveSpeaker(cs)) return;
  var p = prevActiveSpeaker(cs);
  cs = p !== -1 ? p : nextActiveSpeaker(cs);
}

// Timer rubric: duration and protected (no-interjection) [from, to) windows in ms;
// durationMs must match TIMER_DURATIONS_MS in server.py
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
  // Judges' deliberation: no protected windows or grace, just explicit 1x and 2x cues
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
// Accent class for a team index, including null (free speaker)
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
// .short is a compact name for tight spots, like CRITERIA's .short
var TEAMCATS = [
  {
    key: "eroef",
    label: "Eröffnungsrede",
    short: "Eröff.",
    max: 25,
    grp: "Strategie",
  },
  {
    key: "ergae",
    label: "Ergänzungsrede",
    short: "Ergän.",
    max: 25,
    grp: "Strategie",
  },
  {
    key: "schlu",
    label: "Schlussrede",
    short: "Schluss",
    max: 25,
    grp: "Strategie",
  },
  {
    key: "zreden",
    label: "Zwischenreden",
    short: "Zw.-Red.",
    max: 30,
    grp: "Interaktion",
  },
  {
    key: "zfrag",
    label: "Zwischenfragen",
    short: "Zw.-Fr.",
    max: 30,
    grp: "Interaktion",
  },
  {
    key: "zrufe",
    label: "Zwischenrufe",
    short: "Zw.-Ruf",
    max: 15,
    grp: "Interaktion",
  },
  {
    key: "ueber",
    label: "Überzeugungskraft",
    short: "Überz.",
    max: 50,
    grp: "Überzeugungskraft",
  },
];
// TEAMCATS grouped by .grp, used by Schnelleingabe's Teampunkte header
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
    b: "Ausgewogen",
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
    b: "Deutliche Schwächen",
    cells: [1, 2, 3],
    marks: ["5-", "5", "5+"],
  },
  { a: "Keine Leistung", b: "", cells: [0], marks: ["6"] },
];
var TOPROWS = 2;
var BOTTOMROWS = 1;

// Grade band name and mark for a 0-20 Notenskala value
function markOf(v) {
  for (var i = 0; i < NOTEN.length; i++) {
    var n = NOTEN[i],
      j = n.cells.indexOf(v);
    if (j >= 0) return { name: n.a, mark: n.marks[j] };
  }
  return { name: "", mark: "" };
}
// Point range [lo, hi] on a team category's scale for a 0-20 Notenskala value
function convert(v, max) {
  return max === 20 ? [v, v] : UMR[v][SCALEIDX[max]];
}
// Midpoint of a [lo, hi] range
function mid(r) {
  return Math.floor((r[0] + r[1]) / 2);
}
// 0-20 Notenskala value for points on a team category's scale, the reverse of convert()
function katOf(pts, max) {
  if (max === 20) return pts;
  var si = SCALEIDX[max];
  for (var v = 20; v >= 0; v--) {
    var r = UMR[v][si];
    if (pts >= r[0] && pts <= r[1]) return v;
  }
  return null;
}
// Grade mark (e.g. "2+") to 0-20 points, the reverse of markOf()
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
// Grade mark shown in a grade-mode input; team categories go through katOf, ungraded bands show the number
function gradeMarkFor(v, max) {
  if (v === null) return "";
  var kat = max && max !== 20 ? katOf(v, max) : v;
  var mk = markOf(kat).mark;
  return mk && mk.trim() ? mk : String(v);
}
// Typed grade mark to points, or undefined if it isn't a recognized mark
function pointsFromGrade(mark, max) {
  var v = GRADE_TO_POINTS[mark];
  if (v === undefined) return undefined;
  return max && max !== 20 ? mid(convert(v, max)) : v;
}
function gradeHintText(v) {
  return v === null ? "–" : v + " Punkte";
}
// Suggests an average grade and points from the grades written in a team category's notes
var NOTE_GRADE_TOKEN_RE = /[1-6][+-]?/g;
function noteGradeTokens(text) {
  var tokens = [];
  NOTE_GRADE_TOKEN_RE.lastIndex = 0;
  var m;
  while ((m = NOTE_GRADE_TOKEN_RE.exec(text))) {
    var tok = m[0];
    var before = text.charAt(m.index - 1);
    var after = text.charAt(m.index + tok.length);
    if (/[0-9]/.test(before)) continue; // Part of a bigger number, e.g. "20"
    if (tok.length === 1 && /[0-9]/.test(after)) continue; // Also part of a bigger number
    if (after === "." || after === ":") continue; // List marker, e.g. "1."
    tokens.push(tok);
  }
  return tokens;
}
function noteGradeAverageHint(text, max) {
  var tokens = noteGradeTokens(text);
  if (!tokens.length) return "";
  var sum = 0;
  tokens.forEach(function (tok) {
    sum += GRADE_TO_POINTS[tok];
  });
  var avg = Math.round(sum / tokens.length);
  var mark = markOf(avg).mark;
  var pts = mid(convert(avg, max));
  return (
    "Schnitt der Noten in Notizen: " +
    (mark && mark.trim() ? mark : avg) +
    " (" +
    pts +
    " Pkt.)"
  );
}
// Escapes user-typed text for the result tables built as HTML strings
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
// Number of cells in a complete Wertung for the room's current FFR count
function expectedCellCount() {
  return (
    activeSpeakerCount() * CRITERIA.length + TEAMS.length * TEAMCATS.length
  );
}
// Highest reachable team score
var TEAM_MAX = TEAMCATS.reduce(function (a, c) {
  return a + c.max;
}, 0);
function labelOf(target, criterion) {
  if (target[0] === "s") {
    var s = speakerLabel(+target.slice(1));
    if (criterion === "abz") return s + " - Abzüge";
    for (var i = 0; i < CRITERIA.length; i++)
      if (CRITERIA[i].key === criterion) return s + " - " + CRITERIA[i].label;
  } else {
    var t = TEAMS[+target.slice(1)];
    if (criterion === "abz") return t + " - Abzüge";
    for (var j = 0; j < TEAMCATS.length; j++)
      if (TEAMCATS[j].key === criterion) return t + " - " + TEAMCATS[j].label;
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

// pushState throws a SecurityError on file:// pages (a saved copy), and the URL is only a nicety, so never let it fail the caller
function setHistoryUrl(method, state, url) {
  if (!history[method]) return;
  try {
    history[method](state, "", url);
  } catch (e) {}
}

// Offline room codes only use characters server codes never contain (see new_code() in server.py), so they can't collide
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
var mine = {}; // "target|criterion" -> points (own scores, authoritative locally)
var peers = {}; // judge_id -> {name,is_chair,hidden,filled,online}
var remote = {}; // judge_id -> {"target|criterion": points}
var queue = {}; // "target|criterion" -> {target,criterion,points,seq}
var seq = 0;
// Blatt's local-only notes, keyed "s{s}|{groupKey}" (Sac and Urt share one)
var notes = {};
var notesSaveTimer = null;
// Local-only speaker names, keyed "s{s}"
var speakerNames = {};
var namesSaveTimer = null;
// Chair-only OpenTab state, browser-local and per room; judgeMap maps adjudicator uuids to room judge ids ("off:<id>" if offline)
var otState = {
  debateId: "",
  tournamentId: "",
  ballot: null,
  judgeMap: {},
  // OpenTab member uuid per team-speech slot (0-3), sent as speeches[].speaker on submission
  teamSpeakerUuid: {},
};
var otSaveTimer = null;
function saveOtState() {
  clearTimeout(otSaveTimer);
  otSaveTimer = setTimeout(function () {
    if (ME) LS.set("opd.opentab." + ME.code, otState);
  }, 150);
}
// OpenTab registration tokens by tournament_id, shared across rooms so later rounds reuse them
function otLoadTokens() {
  return LS.get("opd.opentab.tokens", {}) || {};
}
function otSaveToken(tournamentId, token) {
  var all = otLoadTokens();
  all[tournamentId] = token;
  LS.set("opd.opentab.tokens", all);
}
function otForgetToken(tournamentId) {
  var all = otLoadTokens();
  delete all[tournamentId];
  LS.set("opd.opentab.tokens", all);
}
// Tournament of a pasted ballot URL without a saved token, so the view shows the registration step (never persisted)
var otPendingTournamentId = null;
var otPendingDebateId = null;
// API base of the OpenTab server the pending ballot URL came from
var otPendingApiBase = null;
var ws = null,
  wsTries = 0,
  wsTimer = null,
  flushTimer = null;
var online = false,
  pending = 0;

// Room-wide debate timer anchored to the server clock; startedAt is in server epoch seconds, null unless running
var timer = {
  type: null, // null | "team" | "ffr" | "reply" | "discussion"
  status: "idle", // idle | running | paused
  durationMs: 0,
  elapsedMs: 0,
  startedAt: null,
  updatedAt: 0, // Server clock; see applyTimerState's snapshot guard
};
var serverTimeOffsetMs = 0;
// Server time of an unconfirmed local timer action, so a reconnect snapshot can't wind the timer back
var timerLocalAt = 0;
// Signal thresholds (ms into the speech) that already rang, so repaints and pause/resume don't ring again
var timerFired = {};
var timerAudioCtx = null;
// Cached .bar widget children, so the 250ms repaint only rewrites text
var timerWidgetParts = null;

// Score map key for a target and criterion
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
  otState = LS.get("opd.opentab." + ME.code, null) || {};
  otState.debateId = otState.debateId || "";
  otState.tournamentId = otState.tournamentId || "";
  otState.ballot = otState.ballot || null;
  otState.judgeMap = otState.judgeMap || {};
  otState.teamSpeakerUuid = otState.teamSpeakerUuid || {};
  // Connections saved before multi-server support were all to debateresult.com
  otState.apiBase = otState.apiBase || OPENTAB_DEFAULT_API;
  // Don't let a pending registration step leak in from a previously open room
  otPendingTournamentId = null;
  otPendingDebateId = null;
  otPendingApiBase = null;
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
// SPEAKERS[s].label with the typed speaker name appended in parentheses
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

// OpenTab judge-ballot API (see JUDGE_BALLOT_API.md)

// Judge-facing OpenTab host to API base; must match OPENTAB_ALLOWED_HOSTS in server.py, which keeps the proxy from being an open relay
var OPENTAB_SERVERS = {
  "tabs.debateresult.com": "https://api.debateresult.com",
  "tabs.opentab2.limperg.de": "https://api.opentab2.limperg.de",
};
var OPENTAB_DEFAULT_API = "https://api.debateresult.com";
// API base for a pasted OpenTab URL, or null for an unknown host
function otApiBaseFor(url) {
  try {
    var host = new URL(url).hostname.toLowerCase();
    return Object.prototype.hasOwnProperty.call(OPENTAB_SERVERS, host)
      ? OPENTAB_SERVERS[host]
      : null;
  } catch (e) {
    return null;
  }
}
function otUnknownServerMsg(url) {
  var host = "";
  try {
    host = new URL(url).hostname;
  } catch (e) {}
  return (
    "Unbekannter OpenTab-Server" +
    (host ? " (" + host + ")" : "") +
    ". Unterstützt: " +
    Object.keys(OPENTAB_SERVERS).join(", ") +
    "."
  );
}
// The registration secret is the last path segment of the judge's private ballot URL
function otExtractSecret(url) {
  try {
    var parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  } catch (e) {
    return "";
  }
}
function otExtractDebateId(url) {
  var m = String(url).match(
    /\/debate\/([0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12})/,
  );
  return m ? m[1] : "";
}
function otExtractTournamentId(url) {
  var m = String(url).match(
    /\/tournament\/([0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12})/,
  );
  return m ? m[1] : "";
}
// OpenTab requests go through our /opentab/proxy, since OpenTab's CORS disallows the Authorization header;
// non-2xx responses and missing fields throw instead of being guessed at
function otRequest(method, url, body, token) {
  return fetch("/api/rooms/" + ME.code + "/opentab/proxy?token=" + ME.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: method,
      url: url,
      body: body === undefined ? null : body,
      bearer: token || null,
    }),
  }).then(function (resp) {
    if (!resp.ok) {
      return resp.text().then(function (text) {
        throw new Error("OpenTab-Proxy (" + resp.status + "): " + text);
      });
    }
    return resp.json().then(function (envelope) {
      var status = envelope.status;
      var data = envelope.data;
      if (status < 200 || status >= 300) {
        var msg = (data && data.message) || JSON.stringify(data) || status;
        var err = new Error("OpenTab-API (" + status + "): " + msg);
        err.otStatus = status;
        throw err;
      }
      return data;
    });
  });
}
function otRegister(apiBase, secret) {
  return otRequest("POST", apiBase + "/api/register", {
    secret: secret,
    link_current_user: false,
  }).then(function (data) {
    if (!data || !data.token || !data.tournament_id) {
      throw new Error(
        "OpenTab-API: unerwartete Antwort auf /api/register (API evtl. geändert)",
      );
    }
    return data;
  });
}
function otGetDebate(apiBase, token, debateId) {
  return otRequest(
    "GET",
    apiBase + "/api/debate/" + debateId,
    undefined,
    token,
  ).then(function (data) {
    if (!data || !data.ballot) {
      throw new Error(
        "OpenTab-API: unerwartete Antwort auf /api/debate/:id (API evtl. geändert)",
      );
    }
    return data.ballot;
  });
}
function otSubmit(apiBase, token, debateId, ballot) {
  return otRequest(
    "POST",
    apiBase + "/api/debate/" + debateId + "/submissions",
    { ballot: ballot },
    token,
  ).then(function (data) {
    if (!data || !data.submission_id) {
      throw new Error(
        "OpenTab-API: unerwartete Antwort auf /submissions (API evtl. geändert)",
      );
    }
    return data;
  });
}

// Saves locally first, then pushes; null clears the cell instead of storing a 0 that others would count
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
  // Keyed by cell, so a long offline period queues at most one entry per cell
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

// Pushes queued score writes to the server
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
  if (ME.pendingCreate) return; // Offline room, nothing to push to yet
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
        // Only clear if the cell hasn't been edited again since sending
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
      scheduleFlush(3000); // Retry after a failed sync
    });
}

// Debate timer

// Per-device mute, never synced, so only one device in the room rings the bell
function timerMuted() {
  return !!LS.get("opd.timerMuted", false);
}
function toggleTimerMuted() {
  LS.set("opd.timerMuted", !timerMuted());
  paintTimer();
}

// Per-device display choice: count up from 0 (default) or down from the duration
function timerCountUp() {
  return LS.get("opd.timerCountUp", true) !== false;
}
// The ms value to render, given the count direction
function timerDisplayMs(elapsedMs, durationMs) {
  return timerCountUp() ? elapsedMs : durationMs - elapsedMs;
}

// Per-device bell voice, since whoever holds the bell picks what carries best in their room
function bellVoice() {
  return LS.get("opd.bellVoice", "hoch") === "tief" ? "tief" : "hoch";
}

// Created and resumed inside a user gesture so autoplay policies don't block the bell
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
// The two bell voices: sine partials with fast attack and exponential decay plus a noise strike;
// "hoch" is short and bright, "tief" rings longer for big halls
var BELL_VOICES = {
  hoch: {
    label: "Hoch",
    fundamental: 1630,
    partials: [
      { ratio: 1, gain: 1 },
      { ratio: 2, gain: 0.37 },
      { ratio: 3, gain: 0.24 },
    ],
    gapSec: 0.38, // Between successive rings of a 2x/3x signal
    attackSec: 0.005,
    decaySec: 0.9,
    gain: 0.9,
    bite: 0, // Square-wave blend at the fundamental; 0 = none
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
// Rings `times` bell tones in a row; muted devices stay silent
function ringBell(times) {
  if (timerMuted()) return;
  playBellTones(times);
}
function testBell() {
  playBellTones(1);
}

// Elapsed ms in the current speech from the last server state and clock offset, so it never drifts
function timerElapsedMs() {
  if (!timer.type) return 0;
  var e = timer.elapsedMs || 0;
  if (timer.status === "running" && timer.startedAt) {
    e += Date.now() + serverTimeOffsetMs - timer.startedAt * 1000;
  }
  return e;
}
// Signal instants (ms) and ring counts for a timer type; Zwischenrede only gets the 2x/3x signals
function timerSignalPoints(type) {
  var t = TIMER_TYPES[type];
  if (!t) return [];
  // An explicit signals list (Jurierdiskussion) replaces the speech pattern
  if (t.signals) return t.signals;
  var pts = [];
  if (t.protected.length === 2) {
    pts.push({ ms: t.protected[0][1], times: 1 }); // Open window starts
    pts.push({ ms: t.protected[1][0], times: 1 }); // Open window ends
  }
  pts.push({ ms: t.durationMs, times: 2 }); // Nominal time ends
  pts.push({ ms: t.durationMs + OVERDRAW_GRACE_MS, times: 3 }); // Grace ends
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
// The modal's signal rail runs to the end of the overdraw grace so every mark is visible
function timerBarMax(type) {
  var t = TIMER_TYPES[type];
  var max = t.durationMs + OVERDRAW_GRACE_MS;
  timerSignalPoints(type).forEach(function (sig) {
    if (sig.ms > max) max = sig.ms;
  });
  return max;
}

// Applies a server timer payload (snapshot or broadcast) and rebuilds fired signals from the actual elapsed time,
// since this also runs on every resync
function applyTimerState(t, fromSnapshot) {
  // A snapshot may predate an unconfirmed local action (e.g. one taken offline), so the local action wins;
  // live broadcasts are always current and clear the flag
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
// Index of the 3x repeat after the overdraw grace (one every OVERDRAW_GRACE_MS), or -1 before the first;
// discussion never repeats
function overtimeIntervalIndex(type, elapsedMs) {
  var t = TIMER_TYPES[type];
  if (!t || t.signals) return -1;
  var sinceGraceEnd = elapsedMs - (t.durationMs + OVERDRAW_GRACE_MS);
  if (sinceGraceEnd < OVERDRAW_GRACE_MS) return -1;
  return Math.floor(sinceGraceEnd / OVERDRAW_GRACE_MS) - 1;
}
// Marks every past signal as rung; a threshold moved back into the future rings again
function rebuildTimerFired() {
  timerFired = {};
  if (!timer.type) return;
  var elapsed = timerElapsedMs();
  timerSignalPoints(timer.type).forEach(function (sig) {
    if (elapsed >= sig.ms) timerFired[sig.ms] = true;
  });
  timerFired.overtimeIdx = overtimeIntervalIndex(timer.type, elapsed);
}
// Mirrors set_timer in server.py so actions apply instantly and offline; change both together
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
    timer.elapsedMs = timerElapsedMs(); // Before startedAt is cleared
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
      // Moving startedAt earlier adds elapsed time; capped so it never goes below zero
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
// Local-first like write(): apply now, push after; the server broadcast then makes it authoritative
function timerActionRequest(action, extra) {
  if (!ME) return;
  applyTimerActionLocally(action, extra);
  if (ME.pendingCreate) return; // Offline room, nothing to push to yet
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

// Only touches the DOM when a value changed, since rewriting on every tick makes the digits stutter
function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}
function setCls(node, cls) {
  if (node && node.className !== cls) node.className = cls;
}

// Updates the open modal's clock and signal bar; the rest is built once in openTimerModal()
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

// The modal is only rebuilt when this shape changes, so ±5s taps don't recreate buttons under the finger
function timerModalShape() {
  return (
    (!timer.type || timer.status === "idle" ? "pick" : "run") + "|" + timer.type
  );
}
function refreshTimerModalControls() {
  var m = document.getElementById("timerModal");
  if (!m) return;
  if (m.dataset.shape !== timerModalShape()) {
    openTimerModal(true); // Controls changed, so rebuild once
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

// Runs every 250ms: repaints the widget and rings any signal crossed since the last tick
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
  var overtimeIdx = overtimeIntervalIndex(timer.type, elapsed);
  // Not "|| -1", since a stored 0 is a valid index and would otherwise ring every tick
  var lastOvertimeIdx =
    typeof timerFired.overtimeIdx === "number" ? timerFired.overtimeIdx : -1;
  if (overtimeIdx > lastOvertimeIdx) {
    timerFired.overtimeIdx = overtimeIdx;
    ringBell(3);
  }
}
setInterval(tickTimer, 250);

// Shared modal pattern: a backdrop that closes on outside click or Escape around one .modalbox
var modalEscHandlers = {};
function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.remove();
  if (modalEscHandlers[id]) {
    document.removeEventListener("keydown", modalEscHandlers[id]);
    delete modalEscHandlers[id];
  }
}
// build(box) fills the box; returns the backdrop so callers can store state on it or focus into it
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
// One-button notice in the app's modal style, replacing alert()
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
// Abbrechen/confirm modal replacing confirm(); opts: {title, text, confirmLabel, cancelLabel, onConfirm}
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
// Single "Schließen"/"OK" action row ending most modals
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
// Visible, enabled focusables in the timer modal, for Tab trapping and initial focus
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
// Timer modal: pick a speech type, control the shared clock or mute this device;
// isRefresh rebuilds in place without stealing focus
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

    // Nudges a mistimed clock without closing the modal; fired signals are recomputed from the resulting broadcast
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

    // Pause/resume/reset keep the modal open, since correcting a start usually takes several taps
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

    // Every FFR is followed by a Zwischenrede, so this is built once and toggled by refreshTimerModalControls()
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

// Repaints the compact .bar widget (mobile top bar and desktop header)
function paintTimer() {
  var host = document.getElementById("timerWidget");
  if (!host) return;
  if (!ME) {
    host.classList.add("hide");
    return;
  }
  host.classList.remove("hide");

  // Built once and then only updated, since rebuilding every tick stutters the digits and drops in-progress taps
  if (!timerWidgetParts || timerWidgetParts.host !== host) {
    host.textContent = "";
    host.appendChild(tabIcon("timer"));
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

  // Without a type, or after a reset, the widget collapses to its idle tab; a reset clock nudged with +5s stays expanded
  if (!timer.type || (timer.status === "idle" && !timer.elapsedMs)) {
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
  if (ME.pendingCreate) return; // Offline room, nothing to connect to yet
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

// Reloads the full room snapshot from the server
function resync() {
  if (!ME) return;
  if (ME.pendingCreate) return; // Offline room, nothing to sync with yet
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
      // Local state always wins over server state
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

// Offline judges are managed and scored only by the chair
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
// Creates an offline judge and opens the Offline-Jurierende tab, which stays hidden until one exists
function addOfflineJudgeAndOpenPanel() {
  addOfflineJudge("");
  setDashboardView("offline");
  render();
}
function renameOfflineJudge(id, name) {
  if (!ME || !ME.is_chair || !offlineJudges[id]) return;
  offlineJudges[id].name = name;
  // No render() here: this fires on blur while Tab moves into a score field, and rebuilding would strand focus
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
  // Reset server-owned room settings so the next room doesn't briefly show this one's
  spreadOpen = false;
  freeSpeakerCount = 3;
  // Reset per-room view state (expanded spreads, dashboard selection, open ballot)
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
  recordRecentRoom(ME.code, ME.name, ME.is_chair); // Capture the final filled count
  resetRoomState();
  // Keeps a back-button escape hatch, since opd.session.<code> survives leaving
  setHistoryUrl("pushState", { left: true }, "/");
  showLobby();
}

// Always starts light regardless of system setting; only the theme button switches to dark
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

// Per-device preference to type school grades (e.g. "2+") instead of points, set separately for Redepunkte and Teampunkte
var GRADE_INPUT_LS_KEY = {
  speaker: "opd.gradeInputSpeaker",
  team: "opd.gradeInputTeam",
};
function gradeInputMode(kind) {
  return !!LS.get(GRADE_INPUT_LS_KEY[kind], false);
}
function setGradeInputMode(kind, on) {
  LS.set(GRADE_INPUT_LS_KEY[kind], !!on);
}
function applyGradeInputLabel() {
  var b = document.getElementById("menuGradeInput");
  if (b) b.textContent = "Eingabemodus";
}

// Per-device preference for the mobile Notenskala keypad
function keyGradeFirst() {
  return !!LS.get("opd.keyGradeFirst", false);
}
function applyKeyLabelLabel() {
  var b = document.getElementById("menuKeyLabel");
  if (b)
    b.textContent =
      "Tasten: " + (keyGradeFirst() ? "Noten zuerst" : "Punkte zuerst");
}
function toggleKeyGradeFirst() {
  LS.set("opd.keyGradeFirst", !keyGradeFirst());
  applyKeyLabelLabel();
  render();
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
// Rings the newly picked voice right away via testBell(), which ignores mute
function toggleBellVoice() {
  LS.set("opd.bellVoice", bellVoice() === "hoch" ? "tief" : "hoch");
  applyBellVoiceLabel();
  testBell();
}
function openGradeInputModal() {
  openModal("gradeInputModal", function (box) {
    box.appendChild(el("h2", null, "Eingabemodus"));
    box.appendChild(gradeInputModeRow("Redepunkte", "speaker"));
    box.appendChild(gradeInputModeRow("Teampunkte", "team"));
    box.appendChild(modalCloseRow("gradeInputModal", "Schließen"));
  });
}
function gradeInputModeRow(label, kind) {
  var row = el("div", "gradeinputrow");
  row.appendChild(el("div", "gradeinputlbl", label));
  var opts = el("div", "gradeinputopts");
  ["Punkte", "Noten"].forEach(function (optLabel, i) {
    var on = i === 1;
    var btn = el("button", "btn ghost", optLabel);
    btn.type = "button";
    btn.classList.toggle("on", gradeInputMode(kind) === on);
    btn.addEventListener("click", function () {
      setGradeInputMode(kind, on);
      applyGradeInputLabel();
      render();
      [].forEach.call(opts.querySelectorAll("button"), function (b) {
        b.classList.remove("on");
      });
      btn.classList.add("on");
    });
    opts.appendChild(btn);
  });
  row.appendChild(opts);
  return row;
}

// Resumes a session when a judge reconnects
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
// Keeps the screen on during a round where supported
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

// "x ausstehend" only shows once writes have been unconfirmed for this long
var PENDING_TEXT_DELAY_MS = 100;
var pendingSince = 0,
  pendingTextTimer = null;
function pendingTextDue() {
  if (!pending) {
    pendingSince = 0;
    clearTimeout(pendingTextTimer);
    pendingTextTimer = null;
    return false;
  }
  if (!pendingSince) {
    pendingSince = Date.now();
    pendingTextTimer = setTimeout(function () {
      pendingTextTimer = null;
      paintBar();
    }, PENDING_TEXT_DELAY_MS);
  }
  return Date.now() - pendingSince >= PENDING_TEXT_DELAY_MS;
}
function paintBar() {
  var d = document.getElementById("cdot"),
    s = document.getElementById("cstate");
  if (!d) return;
  d.className = "dot " + (online ? "on" : "off");
  var showPending = pendingTextDue();
  // Fully synced shows no text (the green dot says it); text only appears for slow pending writes or a lost connection
  s.textContent =
    ME && ME.pendingCreate
      ? "Offline-Raum - wird erstellt, sobald Verbindung besteht"
      : online
        ? showPending
          ? pending + " ausstehend"
          : ""
        : pending
          ? "offline - " + pending + " gespeichert"
          : "offline";
  document.getElementById("whoami").textContent = ME
    ? ME.name + (ME.is_chair ? " - Chair" : "") + " - " + ME.code
    : "";
  document
    .getElementById("menuGradeInput")
    .classList.toggle("hide", !isDesktopWidth());
  document
    .getElementById("menuKeyLabel")
    .classList.toggle("hide", isDesktopWidth());
  document
    .getElementById("shortcutsBtn")
    .classList.toggle("hide", !isDesktopWidth());
  document
    .getElementById("menuBlattDivider")
    .classList.toggle("hide", !isDesktopWidth());
  document
    .getElementById("menuResetBlattCols")
    .classList.toggle("hide", !isDesktopWidth());
  document
    .getElementById("menuPrintNotes")
    .classList.toggle("hide", !isDesktopWidth());
  paintTimer();
}

// Scoring state for the local judge
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
// Whether the mobile Reden card's Abzüge options are expanded (UI only)
var deduOpen = false;

// Judge exclusions
var myExclusions = {}; // target -> true
var remoteExclusions = {}; // judge_id -> {target: true}

// Offline judges: chair-entered sums for judges not using the app
var offlineJudges = {}; // id -> {name}
var offlineScores = {}; // id -> {target: points}

// Own score for speaker s, criterion index c, or null
function sget(s, c) {
  var v = mine[kk("s" + s, CRITERIA[c].key)];
  return v === undefined ? null : v;
}
// Own score for team t, category index c, or null
function tget(t, c) {
  var v = mine[kk("t" + t, TEAMCATS[c].key)];
  return v === undefined ? null : v;
}
// Sum of the criteria scored so far for speaker s
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
// Totals for any room judge id (including offline ones), for OpenTab ballots built on other judges' behalf;
// null until fully scored, to tell "not done" from zero
function personPunkteFor(judgeId, s) {
  if (isOfflineId(judgeId)) {
    var v = (offlineScores[offlineRealId(judgeId)] || {})["s" + s];
    return v === undefined ? null : v;
  }
  var sum = 0;
  for (var c = 0; c < NC; c++) {
    var cv = (remote[judgeId] || {})[kk("s" + s, CRITERIA[c].key)];
    if (cv === undefined) return null;
    sum += cv;
  }
  return Math.max(0, sum - deductionPoints(s));
}
function teamPunkteFor(judgeId, t) {
  if (isOfflineId(judgeId)) {
    var v = (offlineScores[offlineRealId(judgeId)] || {})["t" + t];
    return v === undefined ? null : v;
  }
  var sum = 0;
  for (var c = 0; c < NT; c++) {
    var tv = (remote[judgeId] || {})[kk("t" + t, TEAMCATS[c].key)];
    if (tv === undefined) return null;
    sum += tv;
  }
  return Math.max(0, sum);
}
// Display name for any room judge id, including offline judges
function roomJudgeName(id) {
  if (isOfflineId(id)) {
    var oj = offlineJudges[offlineRealId(id)];
    return (oj && oj.name) || "Offline-Juror:in";
  }
  return peers[id] ? peers[id].name : id;
}
// Speaker indices of a team in speaking order
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
// Own team points plus own speakers' totals, shared by Übersicht and Schnelleingabe
function myTeamGrand(t) {
  var teamSpeakers = speakersOfTeam(t);
  var speakerSum = 0,
    scoredCount = 0;
  teamSpeakers.forEach(function (s) {
    if (firstEmptyS(s) !== -1) return; // Not fully scored yet
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
// Creates an element with an optional class and text
function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}
function spreadDetailTable(total, catCells) {
  var names = total.judges.map(function (j) {
    return j.name;
  });
  catCells.forEach(function (x) {
    x.judges.forEach(function (j) {
      if (names.indexOf(j.name) === -1) names.push(j.name);
    });
  });
  var tbl = el("table", "dtbl");
  var head = el("tr");
  head.appendChild(el("th", "l", ""));
  names.forEach(function (n) {
    head.appendChild(el("th", null, n));
  });
  head.appendChild(el("th", null, "±"));
  tbl.appendChild(head);
  function addRow(label, x, cls) {
    var byName = {},
      vals = [];
    x.judges.forEach(function (j) {
      byName[j.name] = j.v;
      vals.push(j.v);
    });
    var hi = Math.max.apply(null, vals),
      lo = Math.min.apply(null, vals);
    var tr = el("tr", cls);
    tr.appendChild(el("td", "l", label));
    names.forEach(function (n) {
      var v = byName[n];
      var mark =
        v === undefined || !x.spread
          ? null
          : v === hi
            ? "hi"
            : v === lo
              ? "lo"
              : null;
      tr.appendChild(el("td", mark, v === undefined ? "–" : String(v)));
    });
    tr.appendChild(el("td", "mt", String(x.spread)));
    tbl.appendChild(tr);
  }
  catCells.forEach(function (x) {
    addRow(x.label.split(" - ").pop(), x);
  });
  addRow("Gesamt", total, "dsum");
  var scroll = el("div");
  scroll.style.overflowX = "auto";
  scroll.appendChild(tbl);
  return scroll;
}

function buildPad(host, scaleMax, onPick) {
  host.innerHTML = "";
  (topOpen ? NOTEN : NOTEN.slice(TOPROWS, NOTEN.length - BOTTOMROWS)).forEach(
    function (n) {
      var row = el("div", "noterow"),
        lbl = el("div", "notelbl");
      lbl.appendChild(el("div", "a", n.b || n.a));
      row.appendChild(lbl);
      // Rows with fewer than 3 keys stretch them to fill the width
      var keys = el(
        "div",
        "notekeys" + (n.cells.length < 3 ? " notekeys-fill" : ""),
      );
      var gradeFirst = keyGradeFirst();
      n.cells.forEach(function (v, j) {
        var b = el("button", "key");
        var pts = String(mid(convert(v, scaleMax)));
        var mark = (n.marks[j] || "").trim();
        if (gradeFirst && mark) {
          b.appendChild(el("div", "n", mark));
          b.appendChild(el("div", "m", pts + " P."));
        } else {
          b.appendChild(el("div", "n", pts));
          b.appendChild(el("div", "m", n.marks[j] || "Kat. " + v));
        }
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
    (z !== null ? " - Zwischensumme " + z : "");
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
  var lvlLabel = "";
  [].forEach.call(deduRow.querySelectorAll(".dedopt"), function (b) {
    b.classList.toggle("on", b.dataset.lvl === lvl);
    if (lvl && b.dataset.lvl === lvl) lvlLabel = b.textContent;
  });
  document.getElementById("deduState").textContent = lvlLabel;
  document.getElementById("deduOpts").classList.toggle("hide", !deduOpen);
  document
    .getElementById("deduToggle")
    .setAttribute("aria-expanded", String(deduOpen));
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
  h.push("<th>Ab</th><th>Σ</th></tr>");
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
          (v === null ? "-" : v) +
          "</td>",
      );
    }
    var z = zwischensumme(s);
    h.push('<td class="mt">' + (deductionPoints(s) || "-") + "</td>");
    h.push(
      '<td class="' +
        (z === null ? "mt" : "tot") +
        '">' +
        (z === null ? "-" : personPunkte(s)) +
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
// The mobile chair room card starts collapsed so the spreads come first
var chairRoomOpen = false;
var spreadOpen = false;
function updateChairTab() {
  var tab = document.getElementById("tabChair");
  var show = ME.is_chair || spreadOpen;
  tab.classList.toggle("hide", !show);
  document.getElementById("tabChairLabel").textContent = ME.is_chair
    ? "Chair"
    : "Spreads";
}
function hiddenToggleMessage(name, goingHidden) {
  return goingHidden
    ? name + " wirklich aus der Wertung nehmen?"
    : name + " wieder als Wing zur Wertung hinzufügen?";
}
// Shared by the mobile chair view and the dashboard's judge chips; handles offline judges via their own endpoint
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
// The chair's column always comes first in a ballot comparison table
function chairFirstIds(ids) {
  return ids.slice().sort(function (a, b) {
    return (
      (peers[b] && peers[b].is_chair ? 1 : 0) -
      (peers[a] && peers[a].is_chair ? 1 : 0)
    );
  });
}
// Mean of a list, or null when empty so callers can render "-" directly
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
// Offline ids are prefixed so they never collide with real judge ids
var OFFLINE_ID_PREFIX = "off:";
function isOfflineId(id) {
  return id.indexOf(OFFLINE_ID_PREFIX) === 0;
}
function offlineRealId(id) {
  return id.slice(OFFLINE_ID_PREFIX.length);
}
// Shared chair math for the mobile chair view and the desktop dashboard; includeHidden also counts trainees
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
  // Offline judges only have sums, so they have no per-criterion detail and can't be excluded per target
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
  // Averages skip judges who haven't entered any team points for team t, rather than counting them as 0
  function teamEntered(id, t) {
    if (isOfflineId(id))
      return (offlineScores[offlineRealId(id)] || {})["t" + t] !== undefined;
    var r = remote[id] || {};
    return TEAMCATS.some(function (c) {
      return r[kk("t" + t, c.key)] !== undefined;
    });
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
      detail: names.join(" - "),
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
      var gc = scanGroup("t" + t, keys, tm + " - " + g);
      if (gc) groupCells.push(gc);
    });
  });
  groupCells.sort(function (a, b) {
    return b.spread - a.spread;
  });

  // Sorted by total score
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
      detail: names.join(" - "),
      judges: judges,
      key: "s" + s,
    });
  });
  totals.sort(function (a, b) {
    return b.spread - a.spread;
  });

  // Full result overview in speaking order
  var speakerRows = SPEAKERS.map(function (_, s) {
    var vals = [];
    ids.forEach(function (id) {
      if (!includedFor(id, "s" + s)) return;
      var v = remoteTotal(id, s);
      if (v !== null) vals.push(v);
    });
    return { label: speakerLabel(s), avg: mean(vals), n: vals.length };
  });
  // An inactive free speaker's stale average must not win best speech
  var bestSpeakerAvg = speakerRows.reduce(function (m, r, s) {
    return isActiveSpeaker(s) && r.avg !== null && r.avg > m ? r.avg : m;
  }, -Infinity);

  // A team's Ø total is the sum of averages (team points plus each speech), used by every result view
  var teamRows = TEAMS.map(function (tm, t) {
    var vals = [];
    ids.forEach(function (id) {
      if (!includedFor(id, "t" + t) || !teamEntered(id, t)) return;
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
    teamEntered: teamEntered,
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

// Speaker and team result tables for the mobile Endergebnis and the desktop result panel
function finalResultHTML(summary) {
  var fh = [
    '<table class="finalTbl"><tr><th class="l">Redner:in</th><th>Ø Punkte</th></tr>',
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
        (r.avg === null ? "-" : r.avg.toFixed(1)) +
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
      r.grand === null ? "-" : r.grand.toFixed(1) + (r.partial ? " *" : "");
    fh.push(
      '<tr><td class="l' +
        (isBest ? " best" : "") +
        '">' +
        esc(r.label) +
        '</td><td class="' +
        (r.teamAvg === null ? "mt" : "") +
        '">' +
        (r.teamAvg === null ? "-" : r.teamAvg.toFixed(1)) +
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

// Ballot: one column per adjudicator (chair first), one row per speaker plus team totals
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

  // Row metadata, so best speech and best team can be marked once every row exists
  var speakerMeta = [];
  activeSpeakerIndices().forEach(function (s) {
    var tr = el("tr", deductionLevel(s) ? "deducted" : null);
    tr.appendChild(el("td", "l", speakerLabel(s)));
    var vals = [],
      tds = [];
    chairFirst.forEach(function (id) {
      var v = summary.remoteTotal(id, s);
      var td = el("td", null, v === null ? "-" : String(v));
      tr.appendChild(td);
      vals.push(summary.includedFor(id, "s" + s) ? v : null);
      tds.push(td);
    });
    var scored = vals.filter(function (v) {
      return v !== null;
    });
    var avg = avgRound(scored);
    var avgTd = el("td", "tot", avg === null ? "-" : String(avg));
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
      var entered = summary.teamEntered(id, t);
      var v = summary.remoteTeamTotal(id, t);
      tr.appendChild(el("td", "tot", entered ? String(v) : "-"));
      if (entered && summary.includedFor(id, "t" + t)) vals.push(v);
    });
    var avg = avgRound(vals);
    tr.appendChild(el("td", "tot", avg === null ? "-" : String(avg)));
    table.appendChild(tr);
  });

  table.appendChild(ballotSepRow(ncols));

  // Each team's grand total per judge (team points plus own speakers), to mark the better team
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
      var td = el("td", "tot", grand === null ? "-" : String(grand));
      tr.appendChild(td);
      vals.push(summary.includedFor(id, "t" + t) ? grand : null);
      tds.push(td);
    });
    // Ø is the sum of averages, so unfinished judges still count for what they scored; "*" while a speech is unscored
    var row = summary.teamRows[t];
    var avg = row.grand === null ? null : Math.round(row.grand * 100) / 100;
    var avgTd = el(
      "td",
      "tot",
      avg === null ? "-" : String(avg) + (row.partial ? " *" : ""),
    );
    if (row.partial)
      avgTd.title = "Vorläufig - noch nicht alle Reden dieses Teams bewertet";
    tr.appendChild(avgTd);
    table.appendChild(tr);
    teamMeta.push({ vals: vals, avg: avg, tds: tds, avgTd: avgTd, tr: tr });
  });
  markColumnBest(teamMeta, chairFirst.length);

  return table;
}

// Marks the strictly highest row per column; ties get no mark
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
    var peerIds = Object.keys(peers);
    var onlineCount = peerIds.filter(function (id) {
      return peers[id].online;
    }).length;
    document.getElementById("chairRoomSum").textContent =
      peerIds.length +
      Object.keys(offlineJudges).length +
      " Jurierende · " +
      onlineCount +
      " online";
    document
      .getElementById("chairRoomBody")
      .classList.toggle("hide", !chairRoomOpen);
    document
      .getElementById("chairRoomToggle")
      .setAttribute("aria-expanded", String(chairRoomOpen));
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
            (j.is_chair ? " - Chair" : "") +
            (j.hidden ? " - (Trainee)" : ""),
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
          j.name + " - Offline" + (j.hidden ? " - (Trainee)" : ""),
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
    // Don't rebuild this list mid-edit on a remote update
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
        el("span", "sv", "ø " + c.avg.toFixed(1) + " - n " + c.n),
      );
      row.appendChild(el("span", "big", "±" + c.spread));
      grp.appendChild(row);
      var wrap = el("div", "bkwrap");
      wrap.style.display = openSpread[c.key] ? "block" : "none";
      wrap.appendChild(
        spreadDetailTable(
          c,
          cells.filter(function (x) {
            return x.key.indexOf(c.key + "/") === 0;
          }),
        ),
      );
      grp.appendChild(wrap);
      th.appendChild(grp);
      row.addEventListener("click", function () {
        openSpread[c.key] = !openSpread[c.key];
        renderChair();
      });
    });
  }

  // Team spread rows, one per category group, tap to drill in like a speech row
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
        el("span", "sv", "ø " + c.avg.toFixed(1) + " - n " + c.n),
      );
      row.appendChild(el("span", "big", "±" + c.spread));
      grp.appendChild(row);

      var wrap = el("div", "bkwrap");
      wrap.style.display = openSpread[c.key] ? "block" : "none";
      // Categories with fewer than 2 judges have no cell
      var catCells = cells.filter(function (x) {
        return c.catKeys.indexOf(x.key) !== -1;
      });
      catCells.sort(function (a, b) {
        return c.catKeys.indexOf(a.key) - c.catKeys.indexOf(b.key);
      });
      wrap.appendChild(spreadDetailTable(c, catCells));
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

  // Ballot: one column per adjudicator (chair first), in speaking order
  var btnBallot = document.getElementById("btnBallot");
  btnBallot.textContent = ballotOpen
    ? "Ballot ausblenden"
    : "Ballot anzeigen / übermitteln";
  var ballotWrap = document.getElementById("ballotWrap");
  ballotWrap.classList.toggle("hide", !ballotOpen);
  if (ballotOpen) {
    var scrollHost = el("div");
    scrollHost.style.overflowX = "auto";
    scrollHost.appendChild(fullBallotTable(summary));
    ballotWrap.innerHTML = "";
    ballotWrap.appendChild(scrollHost);
    var otSwitchBtn = el("button", "btn ghost", "Zu OpenTab wechseln");
    otSwitchBtn.type = "button";
    otSwitchBtn.style.marginTop = "10px";
    otSwitchBtn.addEventListener("click", function () {
      showView("opentabm");
      render();
    });
    ballotWrap.appendChild(otSwitchBtn);
  }
}

// Desktop layout for any judge above isDesktopWidth(); only the Dashboard view is chair-only,
// and every desktop view is wide and desktop-only
var dashboardSelected = { kind: "speaker", s: 0 };
var dashboardView = "namen";
// Last-focused field per view, so Alt+I returns to where you were
var lastFocusByView = {};
// Persists the desktop nav tab per room across reloads
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
// Falls back to "schnell" when the stored view is unreachable or no longer exists on desktop
function effectiveDashboardView() {
  if (dashboardView === "dashboard" && !ME.is_chair && !spreadOpen)
    return "schnell";
  if (
    dashboardView === "offline" &&
    (!ME.is_chair || !Object.keys(offlineJudges).length)
  )
    return "schnell";
  if (dashboardView === "opentab" && !ME.is_chair) return "schnell";
  if (
    dashboardView === "matrix" ||
    dashboardView === "sheet" ||
    dashboardView === "team"
  )
    return "schnell";
  return dashboardView;
}
// Falls back to "namen" when a restored chair view is no longer reachable
function effectiveMobileView() {
  if (view === "chair" && !ME.is_chair && !spreadOpen) return "namen";
  if (view === "opentabm" && !ME.is_chair) return "namen";
  return view;
}

// On desktop widths all mobile views and the dock are hidden
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
    .getElementById("v-notes")
    .classList.toggle("hide", !dash || ev !== "notes");
  document
    .getElementById("v-offline")
    .classList.toggle("hide", !dash || ev !== "offline");
  document
    .getElementById("v-opentab")
    .classList.toggle("hide", !dash || ev !== "opentab");

  if (dash) {
    [
      "v-namen",
      "v-sheet",
      "v-team",
      "v-matrix",
      "v-chair",
      "v-opentabm",
    ].forEach(function (id) {
      document.getElementById(id).classList.add("hide");
    });
    document.getElementById("dock").classList.add("hide");
    document.getElementById("dockSheet").classList.add("hide");
    document.getElementById("dockTeam").classList.add("hide");
    // Clear the mobile tab-bar spacer when widening back to desktop
    syncDockSpacer();
  } else {
    document.getElementById("tabs").classList.remove("hide");
    // Restore the dock when shrinking back to mobile, or there's no way to score
    document.getElementById("dock").classList.remove("hide");
    showView(effectiveMobileView());
    syncDockSpacer();
  }
}

// Pads the viewport so the fixed mobile .tabs bar doesn't cover the last row; rerun when its height or visibility changes
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
      // Hidden until an offline judge exists (see addOfflineJudgeAndOpenPanel())
      b.classList.toggle(
        "hide",
        !ME.is_chair || !Object.keys(offlineJudges).length,
      );
    },
  );
  [].forEach.call(
    document.querySelectorAll('#dashNav button[data-dv="opentab"]'),
    function (b) {
      b.classList.toggle("hide", !ME.is_chair);
    },
  );

  // Show each visible tab's Alt+number shortcut in its tooltip; data-tip keeps the original title
  var visibleTabs = [].filter.call(
    document.querySelectorAll("#dashNav button[data-dv]"),
    function (b) {
      return !b.classList.contains("hide");
    },
  );
  visibleTabs.forEach(function (b, i) {
    if (b.dataset.tip === undefined) b.dataset.tip = b.title;
    b.title = b.dataset.tip + " (Alt+" + (i + 1) + ")";
  });

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

  // The active tab is highlighted for every judge; the rest of this function is chair-only
  var ev = effectiveDashboardView();
  [].forEach.call(
    document.querySelectorAll("#dashNav button[data-dv]"),
    function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.dv === ev));
    },
  );
  // Blatt, Teampunkte and Notizen open with a team band, so the active tab takes Regierung's colour to join it
  var nav = document.getElementById("dashNav");
  nav.classList.remove("team-gov", "team-opp", "team-free");
  if (ev === "blatt") nav.classList.add(teamClass(SPEAKERS[cs].team));
  else if (ev === "teampoints" || ev === "notes")
    nav.classList.add(teamClass(0));

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
  // Offline judges never count as online
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
    (traineeCount ? " - " + traineeCount + " Trainees" : "") +
    " - " +
    onlineCount +
    " Online - " +
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

  // Keep an open judge panel live, since the chips are rebuilt on every render()
  var openPanel = document.getElementById("juryPanel");
  if (openPanel && !openPanel.classList.contains("hide")) renderJuryPanel();
}

// Judge-list popover for the dashboard summary chip, built from the Chair tab's .jrow rows
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
          (j.is_chair ? " - Chair" : "") +
          (j.hidden ? " - Trainee" : ""),
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
      el("span", "n", j.name + " - Offline" + (j.hidden ? " - Trainee" : "")),
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
var DASHNAV_ICON_FROM = {
  namen: "namen",
  blatt: "sheet",
  teampoints: "team",
  schnell: "matrix",
  dashboard: "chair",
  notes: "notes",
  offline: "offline",
  opentab: "opentab",
};
function placeholderTabIcon() {
  var NS = "http://www.w3.org/2000/svg";
  var icon = document.createElementNS(NS, "svg");
  icon.setAttribute("class", "tabicon");
  icon.setAttribute("viewBox", "0 0 20 20");
  icon.setAttribute("aria-hidden", "true");
  var r = document.createElementNS(NS, "rect");
  r.setAttribute("class", "tabiconph");
  r.setAttribute("x", "3.5");
  r.setAttribute("y", "3.5");
  r.setAttribute("width", "13");
  r.setAttribute("height", "13");
  r.setAttribute("rx", "1.5");
  icon.appendChild(r);
  return icon;
}
function tabIcon(name) {
  var src =
    name &&
    document.querySelector(
      '#tabs button[data-t="' +
        name +
        '"] .tabicon, #iconTemplates [data-icon="' +
        name +
        '"]',
    );
  if (!src) return placeholderTabIcon();
  var icon = src.cloneNode(true);
  icon.removeAttribute("data-icon");
  return icon;
}
function initDashNavIcons() {
  [].forEach.call(
    document.querySelectorAll("#dashNav button[data-dv]"),
    function (b) {
      b.insertBefore(tabIcon(DASHNAV_ICON_FROM[b.dataset.dv]), b.firstChild);
    },
  );
}
initDashNavIcons();
document.getElementById("dashNav").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-dv]");
  if (!b) return;
  if (b.dataset.dv === "dashboard" && !ME.is_chair && !spreadOpen) return;
  if (b.dataset.dv === "offline" && !ME.is_chair) return;
  if (b.dataset.dv === "opentab" && !ME.is_chair) return;
  setDashboardView(b.dataset.dv);
  render();
});
// PageUp/PageDown cycle the nav views
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
  var ae = document.activeElement;
  if (ae && ae.id) lastFocusByView[ev] = ae.id;
  commitActiveInput();
  var target = btns[nextIdx].dataset.dv;
  setDashboardView(target);
  render();
  var restoreId = lastFocusByView[target];
  var restoreEl = restoreId && document.getElementById(restoreId);
  if (restoreEl) restoreEl.focus();
});

// Commits a pending score edit and blurs notes before a shortcut navigates,
// so dashEditGuard() doesn't mistake it for an edit in progress and skip the render
function commitActiveInput() {
  var ae = document.activeElement;
  if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) ae.blur();
}

// Alt+1..9 jump to a visible #dashNav tab, remembering focus per view
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (!e.altKey || !/^[1-9]$/.test(e.key)) return;
  var btns = [].slice.call(
    document.querySelectorAll("#dashNav button[data-dv]:not(.hide)"),
  );
  var idx = Number(e.key) - 1;
  if (idx >= btns.length) return;
  e.preventDefault();
  var fromEv = effectiveDashboardView();
  var ae = document.activeElement;
  if (ae && ae.id) lastFocusByView[fromEv] = ae.id;
  commitActiveInput();
  var target = btns[idx].dataset.dv;
  setDashboardView(target);
  render();
  var restoreId = lastFocusByView[target];
  var restoreEl = restoreId && document.getElementById(restoreId);
  if (restoreEl) restoreEl.focus();
});

// Alt+T toggles the timer modal
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (!e.altKey || e.key.toLowerCase() !== "t") return;
  e.preventDefault();
  if (document.getElementById("timerModal")) closeTimerModal();
  else openTimerModal();
});
// Traps Tab inside the timer modal while it's open
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

// Alt+, / Alt+. step to the previous/next speech on Blatt, keeping the same kind of field focused
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

// Alt+I swaps between Blatt and Teampunkte to log an interjection and jump back
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
  // From a team speech, land on the opposing team's Zwischenfragen note; free speakers use the remembered field
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

// Local display toggle for including trainees in the Wertung spreads, never persisted
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

// Whether two dashboard selections point at the same row
function dashSameTarget(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === "none") return false;
  return a.kind === "speaker" ? a.s === b.s : a.t === b.t && a.grp === b.grp;
}

// Reuses spreadOpen; opening it also gives wings a read-only dashboard
function dashFreigebenButton() {
  var dob = el(
    "button",
    "dashfrei" + (spreadOpen ? " on" : ""),
    spreadOpen
      ? "Für Wings / Trainees freigegeben"
      : "Für Wings / Trainees gesperrt",
  );
  dob.type = "button";
  dob.tabIndex = -1;
  dob.title = spreadOpen
    ? "Wings verlieren wieder den Zugriff auf das Dashboard"
    : "Wings erhalten Lesezugriff auf das Dashboard (Spreads und Ballot)";
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

// Builds a desktop view as folder-tabbed sections, remembering the open tab per view;
// sections: [{key, label, build() -> node}], aside(curKey) -> node|null
var dashSectionByView = {};
function dashTabbedSheet(viewKey, sections, aside, rerender) {
  var cur = dashSectionByView[viewKey];
  var active = sections.filter(function (s) {
    return s.key === cur;
  })[0];
  if (!active) {
    active = sections[0];
    cur = active.key;
  }
  var sheet = el("div", "dashsheet");
  var strip = el("div", "dashtabs");
  sections.forEach(function (s) {
    var b = el("button", null, s.label);
    b.type = "button";
    b.tabIndex = -1;
    b.setAttribute("aria-pressed", String(s.key === cur));
    b.addEventListener("click", function () {
      dashSectionByView[viewKey] = s.key;
      rerender();
    });
    strip.appendChild(b);
  });
  var side = aside && aside(cur);
  if (side) {
    side.classList.add("dashtabsaside");
    strip.appendChild(side);
  }
  sheet.appendChild(strip);
  // Per-section class hook for sizing rules
  var body = el("div", "dashtabbody dashtabbody-" + cur);
  body.appendChild(active.build());
  sheet.appendChild(body);
  return sheet;
}

// Dashboard aside: trainee toggle on Wertung, ballot actions on Ballot, Freigeben for the chair
function dashDashboardAside(cur) {
  var aside = el("div");
  if (cur === "wertung") aside.appendChild(dashTraineeToggle());
  if (cur === "ballot" && ME.is_chair) {
    var addOfflineBtn = el("button", "exclbtn", "+ Offline-Juror:in");
    addOfflineBtn.type = "button";
    addOfflineBtn.tabIndex = -1;
    addOfflineBtn.addEventListener("click", addOfflineJudgeAndOpenPanel);
    aside.appendChild(addOfflineBtn);
    var exportBtn = el("button", "exclbtn", "Ballot exportieren");
    exportBtn.type = "button";
    exportBtn.tabIndex = -1;
    exportBtn.addEventListener("click", function () {
      setDashboardView("opentab");
      render();
    });
    aside.appendChild(exportBtn);
  }
  if (ME.is_chair) aside.appendChild(dashFreigebenButton());
  return aside;
}

// "Auffällig" cell: criteria and categories with a spread of 5 or more, largest first, short names unless full is set
function dashHotCats(spreadSummary, keys, full) {
  return spreadSummary.cells
    .filter(function (c) {
      return c.spread >= 5 && keys.indexOf(c.key) !== -1;
    })
    .map(function (c) {
      var k = c.key.split("/")[1];
      var cat = CRITERIA.concat(TEAMCATS).filter(function (x) {
        return x.key === k;
      })[0];
      return (cat ? (full ? cat.label : cat.short) : k) + " ±" + c.spread;
    })
    .join(", ");
}

// Wertung tab: one row per speech and team group with each judge's total, Ø, spread and flagged categories;
// clicking a row toggles its Wertungsvergleich below it
function dashWertungTable(summary, spreadSummary) {
  var chairFirst = chairFirstIds(summary.ids);
  var ncols = chairFirst.length + 4;
  var table = el("table", "ballottable dashwtable");
  var head = el("tr");
  head.appendChild(el("th", "l", "Rede / Teamkategorie"));
  chairFirst.forEach(function (id) {
    head.appendChild(el("th", null, summary.nameOf(id)));
  });
  head.appendChild(el("th", null, "Ø"));
  head.appendChild(el("th", null, "Spread"));
  head.appendChild(el("th", "l dashhot", "Auffällig"));
  table.appendChild(head);

  function fullRow(cls, text) {
    var tr = el("tr", cls);
    var td = el("td", null, text);
    td.setAttribute("colspan", String(ncols));
    tr.appendChild(td);
    return tr;
  }
  // spec: {target, cls, label, cellFor(id) -> {text, cls}, avg, spread, hotKeys, detail() -> node}
  function addRow(spec) {
    var open = dashSameTarget(spec.target, dashboardSelected);
    var tr = el("tr", "dashwrow " + spec.cls + (open ? " open" : ""));
    var lbl = el("td", "l");
    lbl.appendChild(el("span", "dashcaret", open ? "▾" : "▸"));
    lbl.appendChild(el("span", "dashwname", spec.label));
    tr.appendChild(lbl);
    chairFirst.forEach(function (id) {
      var c = spec.cellFor(id);
      tr.appendChild(el("td", c.cls || null, c.text));
    });
    tr.appendChild(el("td", "tot", spec.avg));
    tr.appendChild(dashSpreadCell(spec.spread));
    var hotTd = el("td", "l dashhot", dashHotCats(spreadSummary, spec.hotKeys));
    if (hotTd.textContent)
      hotTd.title = dashHotCats(spreadSummary, spec.hotKeys, true);
    tr.appendChild(hotTd);
    tr.addEventListener("click", function () {
      dashboardSelected = open ? { kind: "none" } : spec.target;
      renderDashboard();
    });
    table.appendChild(tr);
    if (open) {
      var exp = fullRow("dashwexp", "");
      exp.firstChild.appendChild(spec.detail());
      table.appendChild(exp);
    }
  }

  [0, 1, null].forEach(function (t) {
    var teamCls = teamClass(t);
    var speakers = activeSpeakerIndices().filter(function (s) {
      return teamOf(s) === t;
    });
    if (t === null && !speakers.length) return;
    table.appendChild(
      fullRow("dashwgrp " + teamCls, t === null ? "Fraktionsfrei" : TEAMS[t]),
    );
    speakers.forEach(function (s) {
      var avg = summary.speakerRows[s].avg;
      addRow({
        target: { kind: "speaker", s: s },
        cls: teamCls + (deductionLevel(s) ? " deducted" : ""),
        label: speakerLabel(s),
        cellFor: function (id) {
          var v = summary.remoteTotal(id, s);
          return {
            text: v === null ? "-" : String(v),
            cls: summary.includedFor(id, "s" + s) ? null : "trainee",
          };
        },
        avg: avg === null ? "-" : avg.toFixed(1),
        spread: spreadOfKey(spreadSummary.totals, "s" + s),
        hotKeys: CRITERIA.map(function (c) {
          return "s" + s + "/" + c.key;
        }),
        detail: function () {
          return dashBallotTable(summary, s);
        },
      });
    });
  });
  // Team points below the speeches, one block per team
  [0, 1].forEach(function (t) {
    var teamCls = teamClass(t);
    table.appendChild(fullRow("dashwgrp " + teamCls, "Teampunkte " + TEAMS[t]));
    TEAMGROUPS_INFO.forEach(function (g) {
      var cats = g.cats.map(function (i) {
        return TEAMCATS[i];
      });
      var key = "t" + t + "/grp-" + TEAMS[t] + " - " + g.label;
      var gc = summary.groupCells.filter(function (x) {
        return x.key === key;
      })[0];
      addRow({
        target: { kind: "team", t: t, grp: g.label },
        cls: teamCls + " dashwteam",
        label: g.label,
        cellFor: function (id) {
          // Offline judges only have a team total
          if (isOfflineId(id)) return { text: "n.a." };
          var sum = 0,
            complete = true;
          cats.forEach(function (c) {
            var v = (remote[id] || {})[kk("t" + t, c.key)];
            if (v === undefined) complete = false;
            else sum += v;
          });
          return {
            text: complete ? String(sum) : "-",
            cls: summary.includedFor(id, "t" + t) ? null : "trainee",
          };
        },
        avg: gc ? gc.avg.toFixed(1) : "-",
        spread: spreadOfKey(spreadSummary.groupCells, key),
        hotKeys: cats.map(function (c) {
          return "t" + t + "/" + c.key;
        }),
        detail: function () {
          return dashTeamBallotTable(summary, t, g.label);
        },
      });
    });
  });
  return table;
}

function dashSpreadCell(spread) {
  return el(
    "td",
    "tot" + (spread !== null && spread >= 5 ? " spreadhot" : ""),
    spread === null ? "-" : "±" + spread,
  );
}

// Wertungsvergleich: one row per criterion or category with every adjudicator's value, Ø and spread; trainees greyed out;
// spec: {target, rowHead, rows:[{label, key}], totalLabel, totalFor(id) -> number|null, totalSpread, extraRow(ncols) -> tr?}
function dashComparisonTable(summary, spec) {
  // Offline judges only have totals, so their columns come after the chair-first real judges
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
      // "n.a." for offline judges, since "-" means not yet scored
      var v = isOfflineId(id)
        ? undefined
        : (remote[id] || {})[kk(spec.target, r.key)];
      tr.appendChild(
        el(
          "td",
          isHiddenId(id) ? "trainee" : null,
          v === undefined ? (isOfflineId(id) ? "n.a." : "-") : String(v),
        ),
      );
      if (counts(id) && v !== undefined) vals.push(v);
    });
    var avg = avgRound(vals);
    tr.appendChild(el("td", "tot", avg === null ? "-" : String(avg)));
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
        v === null ? (isOfflineId(id) ? "n.a." : "-") : String(v),
      ),
    );
    if (counts(id) && v !== null) totVals.push(v);
  });
  var totAvg = avgRound(totVals);
  totTr.appendChild(el("td", "tot", totAvg === null ? "-" : String(totAvg)));
  totTr.appendChild(dashSpreadCell(spec.totalSpread));

  // Optional row between the criteria and the total (the speaker table's Abzug line)
  var extra = spec.extraRow && spec.extraRow(chairFirst.length);
  if (extra) table.appendChild(extra);
  table.appendChild(totTr);
  return table;
}

// Spread of one summary row, or null while fewer than two judges have scored it
function spreadOfKey(list, key) {
  var hit = list.filter(function (x) {
    return x.key === key;
  })[0];
  return hit ? hit.spread : null;
}

function dashBallotTable(summary, s) {
  return dashComparisonTable(summary, {
    target: "s" + s,
    rowHead: "Kategorie",
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
    // A group's sum only counts once every category in it is scored
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
      "t" + t + "/grp-" + TEAMS[t] + " - " + grp,
    ),
  });
}

// Desktop keyboard shortcut cheat sheet
var SHORTCUTS = [
  ["Bild ↑ / Bild ↓", "Nächsten / vorherigen Tab auswählen"],
  ["Alt + 1 – 5", "Tabs direkt anzeigen"],
  ["Alt + , / Alt + .", "Vorherige / nächste Rede (Einzelreden)"],
  ["Alt + I", "Wechsel von Einzelrede zu Interaktionen der Gegenseite"],
  ["Alt + T", "Timer öffnen/schließen"],
];
// Features without a visible label, listed for people who know OPD but not this tool
var MORE_FEATURES = [
  [
    "Eingabemodus: Noten/Punkte",
    "Im Menü (oben Rechts) kannst du den Eingabe Modus für Redepunkte und Teampunkte getrennt von Punkten (9,12,15 etc.) auf Noten (3+, 1-, 1+ etc.) umschalten. Bereits eingegebene Werte werden automatisch umgerechnet.",
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
// "?" also opens the shortcuts cheat sheet
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (e.key !== "?") return;
  var ae = document.activeElement;
  if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
  e.preventDefault();
  openShortcutsModal();
});

// Chair-only: number of active free-speaker slots; lowering never deletes scores
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

// Einzelergebnisse tab: per judge plus a panel Ø column, the team totals, winner, margin split into speeches vs. team points,
// and best speech with and without the winning team; provisional values are marked "*"
function dashEinzelTable(summary) {
  var chairFirst = chairFirstIds(summary.ids);
  var active = activeSpeakerIndices();

  function fmt(v, dec) {
    return dec ? v.toFixed(1).replace(".", ",") : String(v);
  }
  function signed(v, dec) {
    var a = fmt(Math.abs(v), dec);
    return v > 0 ? "+" + a : v < 0 ? "−" + a : "±" + a;
  }
  // Compact wording for this table: "Reg"/"Opp" and "FFR"
  var TEAM_ABBR = ["Reg", "Opp"];
  function abbr(text) {
    return text
      .replace("Regierung", "Reg")
      .replace("Opposition", "Opp")
      .replace("Fraktionsfreie Rede", "FFR");
  }
  // Highest score among the pool's speech indices, or null
  function bestOf(pool, scoreOf) {
    var best = null,
      who = [];
    pool.forEach(function (s) {
      var v = scoreOf(s);
      if (v === null) return;
      if (best === null || v > best) {
        best = v;
        who = [s];
      } else if (v === best) who.push(s);
    });
    return best === null ? null : { pts: best, who: who };
  }
  // r: {grand, partial, spk, tp, scoreOf(s), dec}; a verdict exists once both teams have a total and is provisional while anything is unscored
  function verdict(r) {
    var v = { r: r, complete: r.grand[0] !== null && r.grand[1] !== null };
    v.prov = v.complete && (r.partial[0] || r.partial[1]);
    if (v.complete) {
      var m = r.grand[0] - r.grand[1];
      v.margin = m;
      v.winner = m > 0 ? 0 : m < 0 ? 1 : null;
    }
    v.best = bestOf(active, r.scoreOf);
    v.bestEx =
      v.complete && v.winner !== null
        ? bestOf(
            active.filter(function (s) {
              return teamOf(s) !== v.winner;
            }),
            r.scoreOf,
          )
        : null;
    return v;
  }

  // A judge's team total counts what they've scored so far; partial while anything is open, "-" while nothing is scored
  var cols = chairFirst.map(function (id) {
    var grand = [],
      partial = [],
      spk = [],
      tp = [];
    [0, 1].forEach(function (t) {
      var teamPts = summary.remoteTeamTotal(id, t);
      var speakerSum = 0,
        scored = 0,
        speakers = speakersOfTeam(t);
      speakers.forEach(function (s) {
        var v = summary.remoteTotal(id, s);
        if (v === null) return;
        speakerSum += v;
        scored++;
      });
      var catsDone = isOfflineId(id)
        ? true
        : TEAMCATS.every(function (c) {
            return (remote[id] || {})[kk("t" + t, c.key)] !== undefined;
          });
      var anything = scored > 0 || teamPts > 0;
      grand.push(anything ? teamPts + speakerSum : null);
      partial.push(scored < speakers.length || !catsDone);
      spk.push(speakerSum);
      tp.push(teamPts);
    });
    return {
      name: summary.nameOf(id),
      v: verdict({
        grand: grand,
        partial: partial,
        spk: spk,
        tp: tp,
        dec: false,
        scoreOf: function (s) {
          return summary.remoteTotal(id, s);
        },
      }),
    };
  });
  var tr0 = summary.teamRows[0],
    tr1 = summary.teamRows[1];
  cols.push({
    name: "Panel (Ø)",
    panel: true,
    v: verdict({
      // The Ballot's Gesamt Ø, partial while a team speech has no score from anyone
      grand: [tr0.grand, tr1.grand],
      partial: [tr0.partial, tr1.partial],
      spk: [tr0.grand - tr0.teamAvg, tr1.grand - tr1.teamAvg],
      tp: [tr0.teamAvg, tr1.teamAvg],
      dec: true,
      scoreOf: function (s) {
        return summary.speakerRows[s].avg;
      },
    }),
  });

  var table = el("table", "ballottable dasheinzel");
  var head = el("tr");
  head.appendChild(el("th", "l"));
  cols.forEach(function (c) {
    head.appendChild(el("th", c.panel ? "dashpanelcol" : null, c.name));
  });
  table.appendChild(head);

  function teamSpan(t, text) {
    return el("span", "dashteamname " + teamClass(t), text);
  }
  // label and cellFor(col) return a string or node; sep starts a new group with a heavier rule
  function line(label, cellFor, sep) {
    var tr = el("tr", sep ? "dasheinzelsep" : null);
    var lbl = el("td", "l");
    lbl.appendChild(typeof label === "string" ? document.createTextNode(label) : label);
    tr.appendChild(lbl);
    cols.forEach(function (c) {
      var td = el("td", c.panel ? "dashpanelcol" : null);
      var content = cellFor(c);
      td.appendChild(
        typeof content === "string" ? document.createTextNode(content) : content,
      );
      tr.appendChild(td);
    });
    table.appendChild(tr);
  }
  // "Σ Reg": the prefix, then the team name in its colour
  function labelWithTeam(t, prefix) {
    var wrap = el("span");
    wrap.appendChild(document.createTextNode(prefix));
    wrap.appendChild(teamSpan(t, TEAM_ABBR[t]));
    return wrap;
  }
  // Best speech as position and points in team colour ("2. FFR · 70"), name in the tooltip, one line per tie
  function speechCell(b, dec) {
    if (!b) return "-";
    var wrap = el("span", "dashbestspeech");
    b.who.forEach(function (s) {
      var entry = el("span", "dashbestentry");
      entry.appendChild(teamSpan(teamOf(s), abbr(SPEAKERS[s].label)));
      entry.appendChild(document.createTextNode(" · " + fmt(b.pts, dec)));
      var name = getName(s);
      entry.title = name ? name + ", " + SPEAKERS[s].label : SPEAKERS[s].label;
      wrap.appendChild(entry);
    });
    return wrap;
  }

  [0, 1].forEach(function (t) {
    line(labelWithTeam(t, "Σ "), function (c) {
      var g = c.v.r.grand[t];
      if (g === null) return "-";
      return el(
        "span",
        "tot",
        fmt(g, c.v.r.dec) + (c.v.r.partial[t] ? " *" : ""),
      );
    });
  });
  line(
    "Sieg",
    function (c) {
      if (!c.v.complete) return "-";
      var star = c.v.prov ? " *" : "";
      if (c.v.winner === null)
        return el("span", "dashtie", "Gleichstand" + star);
      return el(
        "span",
        "dashwinner " + teamClass(c.v.winner),
        TEAM_ABBR[c.v.winner] + star,
      );
    },
    true,
  );
  line("Abstand", function (c) {
    return c.v.complete
      ? el(
          "span",
          "tot",
          fmt(Math.abs(c.v.margin), c.v.r.dec) + (c.v.prov ? " *" : ""),
        )
      : "-";
  });
  // Shown from the winner's side, Regierung's on a tie
  function part(c, key) {
    if (!c.v.complete) return "-";
    var k = c.v.winner === 1 ? -1 : 1;
    var d = (c.v.r[key][0] - c.v.r[key][1]) * k;
    return el(
      "span",
      d < 0 ? "dashneg" : null,
      signed(d, c.v.r.dec) + (c.v.prov ? " *" : ""),
    );
  }
  line("diff. Reden", function (c) {
    return part(c, "spk");
  });
  line("diff. Teampunkte", function (c) {
    return part(c, "tp");
  });
  line(
    "Beste Rede",
    function (c) {
      return speechCell(c.v.best, c.v.r.dec);
    },
    true,
  );
  line("Beste Rede ohne Sieger", function (c) {
    return speechCell(c.v.bestEx, c.v.r.dec);
  });
  var wrap = el("div");
  wrap.appendChild(table);
  var anyProv = cols.some(function (c) {
    return c.v.r.partial[0] || c.v.r.partial[1];
  });
  if (anyProv)
    wrap.appendChild(
      el(
        "p",
        "note",
        "* vorläufig - bei diesem Team sind noch nicht alle Reden und Teampunkte bewertet.",
      ),
    );
  return wrap;
}

function renderDashboard() {
  var root = document.getElementById("v-dashboard");
  if (!root) return;
  // "none" means every Wertung row is closed; a selection that no longer exists falls back to the first speech
  var validSpeaker =
    dashboardSelected.kind === "speaker" &&
    SPEAKERS[dashboardSelected.s] &&
    isActiveSpeaker(dashboardSelected.s);
  var validTeam =
    dashboardSelected.kind === "team" &&
    TEAMS[dashboardSelected.t] !== undefined &&
    dashboardSelected.grp;
  if (dashboardSelected.kind !== "none" && !validSpeaker && !validTeam)
    dashboardSelected = { kind: "speaker", s: 0 };
  var summary = computeChairSummary();
  var spreadSummary = dashIncludeTrainees ? computeChairSummary(true) : summary;
  var scrollTop = root.firstChild ? root.firstChild.scrollTop : 0;
  root.innerHTML = "";
  // Per-judge outcomes, the round as one table, and the official Ballot
  var sheet = dashTabbedSheet(
    "dashboard",
    [
      {
        key: "einzel",
        label: "Einzelergebnisse",
        build: function () {
          var scrollHost = el("div");
          scrollHost.style.overflowX = "auto";
          scrollHost.appendChild(dashEinzelTable(summary));
          return scrollHost;
        },
      },
      {
        key: "wertung",
        label: "Wertung",
        build: function () {
          return dashWertungTable(summary, spreadSummary);
        },
      },
      {
        key: "ballot",
        label: "Ballot",
        build: function () {
          var scrollHost = el("div");
          scrollHost.style.overflowX = "auto";
          scrollHost.appendChild(fullBallotTable(summary));
          return scrollHost;
        },
      },
    ],
    dashDashboardAside,
    renderDashboard,
  );
  root.appendChild(sheet);
  // Toggling a row re-renders the sheet, so keep the scroll position
  sheet.scrollTop = scrollTop;
}

// Schnelleingabe: editable grid over the judge's own scores; Enter advances like Tab within the field's view
function focusNextNumberInput(inp) {
  var root = inp.closest('[id^="v-"]');
  if (!root) return;
  var inputs = [].slice.call(root.querySelectorAll("input.schnellinput"));
  var next = inputs[inputs.indexOf(inp) + 1];
  if (next) next.focus();
}

// Shared digit filter, select-on-focus and Enter-to-next for desktop number fields;
// opts: {width, extraClass}, width: false leaves sizing to CSS
function schnellNumberInput(opts) {
  opts = opts || {};
  var inp = el(
    "input",
    "schnellinput" + (opts.extraClass ? " " + opts.extraClass : ""),
  );
  // type=text, since a number input reports "" for unparsable text and would look filled while committing nothing
  inp.type = "text";
  inp.inputMode = "numeric";
  if (opts.width !== false) inp.style.width = opts.width || "95px";
  // Select the value on focus so typing overwrites it
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
      inp.blur(); // Commits the value (fires "change") before moving on
      if (opts.onEnter) opts.onEnter(inp);
      else focusNextNumberInput(inp);
    }
  });
  return inp;
}

// Grade-mode counterpart to schnellNumberInput with the same opts, restricted to grade characters
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

// Shared commit path for desktop score fields: points are rounded and clamped, grades go through pointsFromGrade,
// unparsable input is reverted, and refresh() always shows the normalised value
function commitScoreField(inp, max, target, criterion, kind, refresh) {
  var raw = inp.value.trim();
  if (raw === "") return;
  var n;
  if (gradeInputMode(kind)) {
    n = pointsFromGrade(raw, max);
  } else {
    n = Math.round(Number(raw));
    if (!isFinite(n)) n = undefined;
    else n = Math.max(0, Math.min(max, n));
  }
  if (n === undefined) {
    refresh(); // Unparsable value, restore the stored one
    return;
  }
  write(target, criterion, n);
  refresh();
}

// Speaker criteria use the 0-20 Notenskala; in grade mode the cell shows the grade mark itself
function schnellSpeakerInput(s, c) {
  var inp = gradeInputMode("speaker") ? gradeTextInput() : schnellNumberInput();
  function refresh() {
    var v = sget(s, c);
    inp.value =
      v === null ? "" : gradeInputMode("speaker") ? gradeMarkFor(v) : String(v);
    updateSchnellSpeakerRow(s);
  }
  refresh();
  inp.addEventListener("change", function () {
    commitScoreField(inp, 20, "s" + s, CRITERIA[c].key, "speaker", refresh);
  });
  return inp;
}

// Team categories use their own point scale (e.g. 0-25)
function schnellTeamInput(t, catIdx) {
  var cat = TEAMCATS[catIdx];
  var inp = gradeInputMode("team") ? gradeTextInput() : schnellNumberInput();
  function refresh() {
    var v = tget(t, catIdx);
    inp.value =
      v === null
        ? ""
        : gradeInputMode("team")
          ? gradeMarkFor(v, cat.max)
          : String(v);
    updateSchnellTeamRow(t);
  }
  refresh();
  inp.addEventListener("change", function () {
    commitScoreField(inp, cat.max, "t" + t, cat.key, "team", refresh);
  });
  return inp;
}

function updateSchnellSpeakerRow(s) {
  var z = zwischensumme(s);
  var abCell = document.getElementById("schnell-ab-" + s);
  var pCell = document.getElementById("schnell-p-" + s);
  if (abCell) {
    var abVal = deductionPoints(s) || "-";
    var abBtn = abCell.querySelector(".schnellab");
    if (abBtn) {
      abBtn.textContent = abVal;
      abBtn.classList.toggle("on", !!deductionLevel(s));
    } else {
      abCell.textContent = abVal;
    }
  }
  if (pCell) pCell.textContent = z === null ? "-" : String(personPunkte(s));
  // The speaker's total also feeds their team's Reden and Gesamt columns
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
  var abTd = el("td", "mt");
  abTd.id = "schnell-ab-" + s;
  if (ME.is_chair) {
    var abBtn = el(
      "button",
      "schnellab" + (deductionLevel(s) ? " on" : ""),
      deductionPoints(s) || "-",
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
    abTd.textContent = deductionPoints(s) || "-";
  }
  tr.appendChild(abTd);
  var pTd = el("td", "tot", z === null ? "-" : String(personPunkte(s)));
  pTd.id = "schnell-p-" + s;
  tr.appendChild(pTd);
  return tr;
}

// Speaking-order phase of a speech, matching SPEAKERS' order
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
  // Rede, spacer, the criteria, Ab and Σ
  grpTd.setAttribute("colspan", String(NC + 4));
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
  // Ab = deduction; Σ = the speech's points after it
  head.appendChild(el("th", null, "Ab"));
  head.appendChild(el("th", null, "Σ"));
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

// True while an input or textarea in root has focus, so remote updates don't rebuild the DOM mid-edit
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
  // Inputs patch their own rows, so skipping a rebuild only risks brief staleness
  if (dashEditGuard(root)) return;
  root.innerHTML = "";
  // One page without a tab strip: speeches then team points, so Enter flows from one into the other
  var sheet = el("div", "dashsheet");
  var body = el("div", "dashtabbody");
  body.appendChild(el("h2", "dashsubhead", "Reden"));
  body.appendChild(schnellSpeakerTable());
  body.appendChild(el("h2", "dashsubhead", "Teampunkte"));
  body.appendChild(schnellTeamTable());
  sheet.appendChild(body);
  root.appendChild(sheet);
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
    refresh(); // Unparsable value, restore the stored one
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
// Highest possible speaker and team sums, used to clamp offline totals
function offlineSpeakerMax() {
  return NC * 20;
}
function offlineTeamMax() {
  return TEAMCATS.reduce(function (sum, c) {
    return sum + c.max;
  }, 0);
}
// Offline counterpart to expectedCellCount(): one cell per active speech plus one per team
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
  // Rows per judge column (name, speeches, teams), the stride for column-major tab order
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
  // The add column stays right of the last judge so the table never has to stretch
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
  root.appendChild(
    dashTabbedSheet(
      "offline",
      [
        {
          key: "offline",
          label: "Offline-Jurierende",
          build: function () {
            var container = el("div", "offlinejurywrap");
            buildOfflineJuryTable(container);
            return container;
          },
        },
      ],
      null,
      renderOfflineJudges,
    ),
  );
}

// Adjudikationsblatt: one speech at a time in 4 columns (Sac and Urt merged), sharing cs with mobile Reden
var BLATT_GROUPS = [
  { key: "spr", critIdx: [0], label: "Sprachkraft" },
  { key: "auf", critIdx: [1], label: "Auftreten" },
  { key: "kon", critIdx: [2], label: "Kontaktfähigkeit" },
  { key: "sacurt", critIdx: [3, 4], label: "Sachverstand & Urteilskraft" },
];

function blattHintText(v) {
  if (v === null) return "–";
  var m = markOf(v);
  return m.name ? m.name + " - " + m.mark : "–";
}

function updateBlattScore(s, c) {
  var v = sget(s, c);
  var grade = gradeInputMode("speaker");
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

// True once every speaker criterion has a score, so Enter can jump to the next speech
function allSpeakerScoresFilled(s) {
  return CRITERIA.every(function (_, c) {
    return sget(s, c) !== null;
  });
}

// Moves to the next active speech and focuses its first score field
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

  var grade = gradeInputMode("speaker");
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
    commitScoreField(inp, 20, "s" + s, CRITERIA[c].key, "speaker", function () {
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

// Text shortcuts replaced with symbols in notes
var NOTE_AUTOREPLACE = [
  ["==>", "⇒"],
  ["-->", "→"],
  ["<--", "←"],
  ["<->", "↔"],
  ["...", "…"],
  ["<=", "≤"],
  [">=", "≥"],
  ["!=", "≠"],
  ["+-", "±"],
  ["-- ", "— "],
];

// Replaces text shortcuts in a notes field with their symbols
function applyNoteAutoReplace(ta) {
  var pos = ta.selectionStart;
  var text = ta.value;
  var before = text.slice(0, pos);
  for (var i = 0; i < NOTE_AUTOREPLACE.length; i++) {
    var from = NOTE_AUTOREPLACE[i][0];
    var to = NOTE_AUTOREPLACE[i][1];
    if (before.slice(-from.length) === from) {
      var newBefore = before.slice(0, -from.length) + to;
      ta.value = newBefore + text.slice(pos);
      ta.selectionStart = ta.selectionEnd = newBefore.length;
      return;
    }
  }
}

function blattNotesField(s, group, tabIdx) {
  var ta = el("textarea", "blattnotes");
  ta.placeholder = "Notizen zu " + group.label + " …";
  ta.value = getNote(s, group.key);
  ta.tabIndex = tabIdx;
  ta.id = "blatt-note-" + s + "-" + group.key;
  ta.addEventListener("input", function () {
    applyNoteAutoReplace(ta);
    setNote(s, group.key, ta.value);
  });
  return ta;
}

// Notes come first in the DOM (not just tabIndex) so tab order works from tabindex=-1 buttons; CSS order puts scores on top
function blattColumn(s, group, scoreTabStart, noteTabIdx, width) {
  var col = el("div", "blattcol");
  if (group.critIdx.length > 1) col.classList.add("blattcol-wide");
  if (width) col.style.flex = "0 0 " + width + "px";
  col.appendChild(blattNotesField(s, group, noteTabIdx));
  var scores = el("div", "blattscores");
  group.critIdx.forEach(function (c, i) {
    scores.appendChild(blattScoreField(s, c, scoreTabStart + i));
  });
  col.appendChild(scores);
  return col;
}

// User-dragged Blatt column widths by group key; the last column always takes the remaining space
function getBlattColWidths() {
  try {
    return JSON.parse(localStorage.getItem("blattColWidths") || "{}");
  } catch (e) {
    return {};
  }
}
function setBlattColWidth(key, w) {
  var widths = getBlattColWidths();
  widths[key] = w;
  try {
    localStorage.setItem("blattColWidths", JSON.stringify(widths));
  } catch (e) {}
}

// Minimum Blatt column width; the wide last column needs double (matches .blattcol-wide in style.css)
var BLATT_COL_MIN = 150;

// Drag handle that resizes the column to its left and persists the width
function blattResizer(leftCol, groupKey) {
  var handle = el("div", "blattresizer");
  handle.addEventListener("mousedown", function (e) {
    e.preventDefault();
    var startX = e.clientX;
    var startWidth = leftCol.getBoundingClientRect().width;
    var body = leftCol.parentNode;
    var cols = body.querySelectorAll(".blattcol");
    var lastCol = cols[cols.length - 1];
    // Fixed-width columns between leftCol and the flexible last column count fully against the maximum
    var otherFixedWidth = 0;
    cols.forEach(function (c) {
      if (c !== leftCol && c !== lastCol)
        otherFixedWidth += c.getBoundingClientRect().width;
    });
    var resizers = body.querySelectorAll(".blattresizer").length;
    document.body.classList.add("blattresizing");
    function onMove(ev) {
      var maxWidth =
        body.getBoundingClientRect().width -
        otherFixedWidth -
        BLATT_COL_MIN * 2 -
        resizers * 6;
      var w = Math.min(
        Math.max(BLATT_COL_MIN, startWidth + (ev.clientX - startX)),
        maxWidth,
      );
      leftCol.style.flex = "0 0 " + w + "px";
    }
    function onUp() {
      document.body.classList.remove("blattresizing");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      var w = leftCol.getBoundingClientRect().width;
      setBlattColWidth(groupKey, w);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  return handle;
}

function renderBlatt() {
  var root = document.getElementById("v-blatt");
  if (!root) return;
  if (dashEditGuard(root)) return;
  root.innerHTML = "";

  var sp = SPEAKERS[cs];
  var teamCls = teamClass(sp.team);

  var head = el("div", "blatthead " + teamCls);
  var prev = el("button", "navbtn blattnav");
  prev.appendChild(el("span", null, "‹"));
  prev.appendChild(el("span", "navhint", "Alt+,"));
  prev.tabIndex = -1;
  prev.title = "Vorherige Rede (Alt+,)";
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
  var sub = el(
    "div",
    "sub",
    "Rede " + activeOrdinal(cs) + " von " + activeSpeakerCount(),
  );
  sub.appendChild(
    el(
      "span",
      "blattswaphint",
      "Alt + I, um zu Interaktion des anderen Teams zu wechseln. Tab, um zwischen Textfeldern zu wechseln.",
    ),
  );
  mid.appendChild(sub);
  head.appendChild(mid);

  var next = el("button", "navbtn blattnav");
  next.appendChild(el("span", null, "›"));
  next.appendChild(el("span", "navhint", "Alt+."));
  next.tabIndex = -1;
  next.title = "Nächste Rede (Alt+.)";
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
  // Notes get the first tab stops, scores follow
  var noteTab = 1;
  var scoreTab = 1 + BLATT_GROUPS.length;
  var savedWidths = getBlattColWidths();
  var unpinnedCols = [];
  BLATT_GROUPS.forEach(function (group, i) {
    var scoreTabStart = scoreTab;
    scoreTab += group.critIdx.length;
    var isLast = i === BLATT_GROUPS.length - 1;
    var col = blattColumn(
      cs,
      group,
      scoreTabStart,
      noteTab,
      isLast ? null : savedWidths[group.key],
    );
    if (i > 0)
      body.appendChild(blattResizer(body.lastChild, BLATT_GROUPS[i - 1].key));
    body.appendChild(col);
    if (!isLast && !savedWidths[group.key]) unpinnedCols.push(col);
    noteTab++;
  });
  root.appendChild(body);
  unpinnedCols.forEach(function (col) {
    col.style.flex = "0 0 " + col.getBoundingClientRect().width + "px";
  });

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
        setDeduction(cs, o.l); // Calls render() itself
      });
      dedu.appendChild(b);
    });
    root.appendChild(dedu);
  }
}

// Printable sheet with all scores and notes for team feedback, usually saved as PDF

// Lets the judge choose whether their own points appear on the printout
function openPrintNotesModal() {
  openModal("printNotesModal", function (box) {
    box.appendChild(el("h2", null, "Notizen exportieren"));
    box.appendChild(
      el(
        "p",
        "note",
        "Eigene Punkte anzeigen, oder nur den Durchschnitt aller Jurierenden?",
      ),
    );
    var actions = el("div", "modalactions");
    var withOwnBtn = el("button", "btn", "Mit eigenen Punkten");
    withOwnBtn.type = "button";
    withOwnBtn.addEventListener("click", function () {
      closeModal("printNotesModal");
      buildPrintSheet(false);
      window.print();
    });
    var avgOnlyBtn = el("button", "btn ghost", "Nur Durchschnitt");
    avgOnlyBtn.type = "button";
    avgOnlyBtn.addEventListener("click", function () {
      closeModal("printNotesModal");
      buildPrintSheet(true);
      window.print();
    });
    actions.appendChild(withOwnBtn);
    actions.appendChild(avgOnlyBtn);
    box.appendChild(actions);
  });
}

function buildPrintSheet(hideOwn) {
  var root = document.getElementById("printSheet");
  root.innerHTML = "";
  var summary = computeChairSummary(false);

  root.appendChild(el("h1", "printtitle", "Notizen - " + (ME ? ME.name : "")));

  activeSpeakerIndices().forEach(function (s) {
    var card = el("div", "printspeaker");
    var heading = speakerLabel(s);
    if (deductionLevel(s)) heading += " (Abzug: −" + deductionPoints(s) + ")";
    card.appendChild(el("h2", "printspeakerlbl", heading));

    var scoreTable = el("table", "printscores");
    var head = el("tr");
    head.appendChild(el("th", "l", "Kategorie"));
    if (!hideOwn) head.appendChild(el("th", null, "Meine Punkte"));
    scoreTable.appendChild(head);
    if (!hideOwn)
      CRITERIA.forEach(function (c, ci) {
        var tr = el("tr");
        tr.appendChild(el("td", "l", c.label));
        var v = sget(s, ci);
        tr.appendChild(el("td", null, v === null ? "–" : String(v)));
        scoreTable.appendChild(tr);
      });
    var totVals = summary.ids
      .filter(function (id) {
        return summary.includedFor(id, "s" + s);
      })
      .map(function (id) {
        return summary.remoteTotal(id, s);
      })
      .filter(function (v) {
        return v !== null;
      });
    if (!hideOwn) {
      var totTr = el("tr", "tot");
      totTr.appendChild(el("td", "l", "Gesamt"));
      totTr.appendChild(el("td", null, String(personPunkte(s))));
      scoreTable.appendChild(totTr);
    }
    var finalTr = el("tr", "tot");
    finalTr.appendChild(el("td", "l", "Ø Gesamt (alle Jurierenden)"));
    var final = avgRound(totVals);
    finalTr.appendChild(el("td", null, final === null ? "–" : String(final)));
    scoreTable.appendChild(finalTr);
    card.appendChild(scoreTable);

    BLATT_GROUPS.forEach(function (group) {
      var note = getNote(s, group.key);
      if (!note) return;
      var noteBlock = el("div", "printnote");
      noteBlock.appendChild(el("div", "printnotelbl", group.label));
      noteBlock.appendChild(el("div", "printnotetext", note));
      card.appendChild(noteBlock);
    });

    root.appendChild(card);
  });

  TEAMS.forEach(function (tm, t) {
    var card = el("div", "printspeaker");
    card.appendChild(el("h2", "printspeakerlbl", "Teampunkte " + tm));

    var scoreTable = el("table", "printscores");
    var head = el("tr");
    head.appendChild(el("th", "l", "Kategorie"));
    if (!hideOwn) head.appendChild(el("th", null, "Meine Punkte"));
    scoreTable.appendChild(head);
    if (!hideOwn)
      TEAMCATS.forEach(function (cat, ci) {
        var tr = el("tr");
        tr.appendChild(el("td", "l", cat.label));
        var v = tget(t, ci);
        tr.appendChild(el("td", null, v === null ? "–" : String(v)));
        scoreTable.appendChild(tr);
      });
    var totVals = summary.ids
      .filter(function (id) {
        return summary.includedFor(id, "t" + t) && summary.teamEntered(id, t);
      })
      .map(function (id) {
        return summary.remoteTeamTotal(id, t);
      });
    if (!hideOwn) {
      var totTr = el("tr", "tot");
      totTr.appendChild(el("td", "l", "Gesamt"));
      totTr.appendChild(el("td", null, String(teamPunkte(t))));
      scoreTable.appendChild(totTr);
    }
    var finalTr = el("tr", "tot");
    finalTr.appendChild(el("td", "l", "Ø Gesamt (alle Jurierenden)"));
    var final = avgRound(totVals);
    finalTr.appendChild(el("td", null, final === null ? "–" : String(final)));
    scoreTable.appendChild(finalTr);
    card.appendChild(scoreTable);

    TEAMCATS.forEach(function (cat) {
      var note = getTeamNote(t, cat.key);
      if (!note) return;
      var noteBlock = el("div", "printnote");
      noteBlock.appendChild(el("div", "printnotelbl", cat.label));
      noteBlock.appendChild(el("div", "printnotetext", note));
      card.appendChild(noteBlock);
    });
    var general = getTeamNote(t, "general");
    if (general) {
      var generalBlock = el("div", "printnote");
      generalBlock.appendChild(el("div", "printnotelbl", "Allgemein"));
      generalBlock.appendChild(el("div", "printnotetext", general));
      card.appendChild(generalBlock);
    }

    root.appendChild(card);
  });
}

// Teampunkte: both teams' categories and notes on one screen
function teamPointsHintText(v, max) {
  if (v === null) return "–";
  var m = markOf(katOf(v, max));
  return m.name ? m.name + " - " + m.mark : "–";
}

function updateTeamPointsScore(t, catIdx) {
  var cat = TEAMCATS[catIdx];
  var v = tget(t, catIdx);
  var grade = gradeInputMode("team");
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

  var grade = gradeInputMode("team");
  var fieldOpts = { extraClass: "blattinput", width: false };
  var inp = grade ? gradeTextInput(fieldOpts) : schnellNumberInput(fieldOpts);
  inp.id = "teampoints-val-t" + t + "-c" + catIdx;
  inp.tabIndex = tabIdx;
  var v = tget(t, catIdx);
  if (v !== null) inp.value = grade ? gradeMarkFor(v, cat.max) : String(v);
  inp.addEventListener("change", function () {
    commitScoreField(inp, cat.max, "t" + t, cat.key, "team", function () {
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
  var wrap = el("div", "teampointsnotewrap");
  var ta = el("textarea", "blattnotes");
  ta.placeholder = "Notizen zu " + cat.label + " …";
  ta.value = getTeamNote(t, cat.key);
  ta.tabIndex = tabIdx;
  ta.id = "teampoints-note-t" + t + "-" + cat.key;
  var hint = el("div", "notegradehint");
  hint.id = "teampoints-notehint-t" + t + "-" + cat.key;
  function refreshHint() {
    hint.textContent = noteGradeAverageHint(ta.value, cat.max);
  }
  refreshHint();
  ta.addEventListener("input", function () {
    applyNoteAutoReplace(ta);
    setTeamNote(t, cat.key, ta.value);
    refreshHint();
  });
  wrap.appendChild(ta);
  wrap.appendChild(hint);
  return wrap;
}

// Notes precede the score in the DOM (see blattColumn); CSS order keeps the score on top
function teamPointsCategoryBlock(t, catIdx, tabIdx, noteTabIdx) {
  var cat = TEAMCATS[catIdx];
  var block = el("div", "teampointscatblock");
  block.appendChild(teamPointsNotesField(t, cat, noteTabIdx));
  var scoreWrap = el("div", "teampointscatscore");
  scoreWrap.appendChild(teamPointsScoreField(t, catIdx, tabIdx));
  block.appendChild(scoreWrap);
  return block;
}

// Notes come before scores in tab order, same as Blatt
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

// Shared tab counters so every note field (both teams) comes before any score field
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
  // Both teams' notes come before either team's scores in tab order
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

// Desktop-only "Allgemeine Notizen" tab
function notesColumn(t) {
  var col = el("div", "notescol " + teamClass(t));
  col.appendChild(el("div", "notescolhead", TEAMS[t]));
  var ta = el("textarea", "notestextarea");
  ta.placeholder = "Notizen zu " + TEAMS[t] + " …";
  ta.value = getTeamNote(t, "general");
  ta.id = "notes-t" + t;
  ta.addEventListener("input", function () {
    applyNoteAutoReplace(ta);
    setTeamNote(t, "general", ta.value);
  });
  col.appendChild(ta);
  return col;
}

function renderNotes() {
  var root = document.getElementById("v-notes");
  if (!root) return;
  if (dashEditGuard(root)) return;
  root.innerHTML = "";

  var wrap = el("div", "noteswrap");
  wrap.appendChild(notesColumn(0));
  wrap.appendChild(notesColumn(1));
  root.appendChild(wrap);
}

// Mobile "Namen" tab: name inputs in speaking order
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

// One seat: a label and a name input, tab order following speaking order
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

// Desktop "Namen" view laid out like the room: facing team tables, Fraktionsfrei and Jury below
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
  if (ME.is_chair) {
    var freeCountBtn = el("button", "juryab freectrl", "Anzahl FFRs ändern");
    freeCountBtn.type = "button";
    freeCountBtn.tabIndex = -1;
    freeCountBtn.addEventListener("click", openFreeSpeakersModal);
    free.appendChild(freeCountBtn);
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
        j.name + (j.is_chair ? " - Chair" : j.hidden ? " - Trainee" : ""),
      ),
    );
    // Only the chair can toggle a wing's trainee status (the server enforces this too)
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
        j.name + " - Offline" + (j.hidden ? " - Trainee" : ""),
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

// Maps OpenTab's ballot.speeches[] onto SPEAKERS indices; returns {s: speech}
function otBuildSlotMap(ballot) {
  var map = {};
  var freeSpeeches = ballot.speeches
    .filter(function (sp) {
      return sp.role === "non_aligned";
    })
    .slice()
    .sort(function (a, b) {
      return a.position - b.position;
    });
  ballot.speeches.forEach(function (sp) {
    if (sp.role === "non_aligned") return;
    var s =
      sp.role === "government"
        ? sp.position === 0
          ? 0
          : sp.position === 1
            ? 2
            : 15
        : sp.position === 0
          ? 1
          : sp.position === 1
            ? 3
            : 14;
    map[s] = sp;
  });
  freeSpeeches.forEach(function (sp, i) {
    var s = FREE_START + i;
    if (s < FREE_START + MAX_FREE_SPEAKERS) map[s] = sp;
  });
  return map;
}
// Builds the OpenTab ballot payload for every mapped judge; unfinished totals are left out rather than sent as 0
function otBuildSubmission(ballot, slotMap) {
  var speeches = ballot.speeches.map(function (sp) {
    var sIdx = null;
    Object.keys(slotMap).forEach(function (s) {
      if (slotMap[s] === sp) sIdx = +s;
    });
    var scores = {};
    Object.keys(otState.judgeMap).forEach(function (uuid) {
      var rid = otState.judgeMap[uuid];
      if (!rid || sIdx === null) return;
      var pts = personPunkteFor(rid, sIdx);
      if (pts !== null) scores[uuid] = { type: "Aggregate", total: pts };
    });
    // Team speeches aren't pre-assigned to a member in the ballot
    var speakerUuid =
      (sIdx !== null && otState.teamSpeakerUuid[sIdx]) ||
      (sp.speaker ? sp.speaker.uuid : null);
    return {
      speaker: speakerUuid,
      role: sp.role,
      position: sp.position,
      scores: scores,
      is_opt_out: !!sp.is_opt_out,
    };
  });
  function teamPayload(team, t) {
    var scores = {};
    Object.keys(otState.judgeMap).forEach(function (uuid) {
      var rid = otState.judgeMap[uuid];
      if (!rid) return;
      var pts = teamPunkteFor(rid, t);
      if (pts !== null) scores[uuid] = { type: "Aggregate", total: pts };
    });
    return { team: team ? team.uuid : null, scores: scores };
  }
  return {
    uuid: ballot.uuid,
    speeches: speeches,
    government: teamPayload(ballot.government, 0),
    opposition: teamPayload(ballot.opposition, 1),
    adjudicators: ballot.adjudicators.map(function (a) {
      return a.uuid;
    }),
    president: ballot.president ? ballot.president.uuid : null,
  };
}
function otStatusMsg(root, text, isError) {
  var s = root.querySelector(".otstatus");
  if (!s) return;
  s.textContent = text || "";
  s.classList.toggle("error", !!isError);
}
function otLabeledField(labelText, id, placeholder) {
  var row = el("div", "otfield");
  row.appendChild(el("div", "slbl", labelText));
  var input = document.createElement("input");
  input.type = "text";
  input.id = id;
  input.placeholder = placeholder || "";
  row.appendChild(input);
  return row;
}
// Drops a stale token and returns to the registration step, keeping the known debate id
function otHandleStaleToken(tournamentId, debateId, apiBase) {
  otForgetToken(tournamentId);
  otPendingTournamentId = tournamentId;
  otPendingDebateId = debateId;
  otPendingApiBase = apiBase;
  otState = {
    debateId: "",
    tournamentId: "",
    ballot: null,
    judgeMap: {},
    teamSpeakerUuid: {},
  };
  saveOtState();
}
function otIsAuthError(err) {
  return err && (err.otStatus === 401 || err.otStatus === 403);
}
// Connects via a pasted ballot URL, asking for a registration URL if no working token exists
function otDoConnectFromBallotUrl(root) {
  var url = document.getElementById("otBallotUrl").value.trim();
  var debateId = otExtractDebateId(url);
  var tournamentId = otExtractTournamentId(url);
  var apiBase = otApiBaseFor(url);
  if (debateId && tournamentId && !apiBase) {
    otStatusMsg(root, otUnknownServerMsg(url), true);
    return;
  }
  if (!debateId || !tournamentId) {
    otStatusMsg(
      root,
      "Bitte eine gültige Ballot-URL einfügen (…/tournament/…/debate/…).",
      true,
    );
    return;
  }
  var saved = otLoadTokens()[tournamentId];
  if (!saved) {
    otPendingTournamentId = tournamentId;
    otPendingDebateId = debateId;
    otPendingApiBase = apiBase;
    renderOpenTab(root.id);
    return;
  }
  otStatusMsg(root, "Verbinde…", false);
  otGetDebate(apiBase, saved, debateId)
    .then(function (ballot) {
      otState.apiBase = apiBase;
      otState.debateId = debateId;
      otState.tournamentId = tournamentId;
      otState.ballot = ballot;
      otState.judgeMap = {};
      otState.teamSpeakerUuid = {};
      saveOtState();
      renderOpenTab(root.id);
    })
    .catch(function (err) {
      if (otIsAuthError(err)) {
        otHandleStaleToken(tournamentId, debateId, apiBase);
        renderOpenTab(root.id);
        otStatusMsg(
          root,
          "Gespeicherter Zugang für dieses Turnier ist abgelaufen. Bitte Registrierungs-URL erneut einfügen.",
          true,
        );
        return;
      }
      otStatusMsg(root, err.message || String(err), true);
    });
}
// Registers with a pasted registration URL and saves the token
function otDoRegisterAndConnect(root) {
  var regUrl = document.getElementById("otRegUrl").value.trim();
  var secret = otExtractSecret(regUrl);
  if (!secret) {
    otStatusMsg(root, "Bitte eine gültige Registrierungs-URL einfügen.", true);
    return;
  }
  var tournamentId = otPendingTournamentId;
  var debateId = otPendingDebateId;
  var apiBase = otPendingApiBase || OPENTAB_DEFAULT_API;
  // Secrets only exist on the issuing server, so the registration link must match the ballot link's server
  var regBase = otApiBaseFor(regUrl);
  if (!regBase) {
    otStatusMsg(root, otUnknownServerMsg(regUrl), true);
    return;
  }
  if (regBase !== apiBase) {
    otStatusMsg(
      root,
      "Die Registrierungs-URL gehört zu einem anderen OpenTab-Server als die Ballot-URL.",
      true,
    );
    return;
  }
  otStatusMsg(root, "Verbinde…", false);
  otRegister(apiBase, secret)
    .then(function (reg) {
      otSaveToken(tournamentId, reg.token);
      return otGetDebate(apiBase, reg.token, debateId);
    })
    .then(function (ballot) {
      otState.apiBase = apiBase;
      otState.debateId = debateId;
      otState.tournamentId = tournamentId;
      otState.ballot = ballot;
      otState.judgeMap = {};
      otState.teamSpeakerUuid = {};
      otPendingTournamentId = null;
      otPendingDebateId = null;
      otPendingApiBase = null;
      saveOtState();
      renderOpenTab(root.id);
    })
    .catch(function (err) {
      otStatusMsg(root, err.message || String(err), true);
    });
}
function otDoRefresh(root) {
  if (!otState.ballot) return;
  var saved = otLoadTokens()[otState.tournamentId];
  if (!saved) {
    otHandleStaleToken(
          otState.tournamentId,
          otState.debateId,
          otState.apiBase,
        );
    renderOpenTab(root.id);
    otStatusMsg(
      root,
      "Kein gespeicherter Zugang mehr für dieses Turnier. Bitte Registrierungs-URL erneut einfügen.",
      true,
    );
    return;
  }
  otStatusMsg(root, "Aktualisiere…", false);
  otGetDebate(otState.apiBase, saved, otState.debateId)
    .then(function (ballot) {
      otState.ballot = ballot;
      saveOtState();
      renderOpenTab(root.id);
    })
    .catch(function (err) {
      if (otIsAuthError(err)) {
        otHandleStaleToken(
          otState.tournamentId,
          otState.debateId,
          otState.apiBase,
        );
        renderOpenTab(root.id);
        otStatusMsg(
          root,
          "Gespeicherter Zugang für dieses Turnier ist abgelaufen. Bitte Registrierungs-URL erneut einfügen.",
          true,
        );
        return;
      }
      otStatusMsg(root, err.message || String(err), true);
    });
}
// Disconnects this round only; the tournament's token stays saved for the next room
function otDoDisconnect(root) {
  otState = {
    debateId: "",
    tournamentId: "",
    ballot: null,
    judgeMap: {},
    teamSpeakerUuid: {},
  };
  saveOtState();
  renderOpenTab(root.id);
}
function otDoSubmit(root) {
  if (!otState.ballot) return;
  if (!Object.keys(otState.judgeMap).length) {
    otStatusMsg(
      root,
      "Bitte zuerst mindestens eine:n Jurierende:n auswählen.",
      true,
    );
    return;
  }
  var saved = otLoadTokens()[otState.tournamentId];
  if (!saved) {
    otHandleStaleToken(
          otState.tournamentId,
          otState.debateId,
          otState.apiBase,
        );
    renderOpenTab(root.id);
    otStatusMsg(
      root,
      "Kein gespeicherter Zugang mehr für dieses Turnier. Bitte Registrierungs-URL erneut einfügen.",
      true,
    );
    return;
  }
  var slotMap = otBuildSlotMap(otState.ballot);
  var payload = otBuildSubmission(otState.ballot, slotMap);
  otStatusMsg(root, "Sende Ballot…", false);
  otSubmit(otState.apiBase, saved, otState.debateId, payload)
    .then(function (res) {
      otStatusMsg(
        root,
        "Ballot übermittelt (" + res.submission_id + ").",
        false,
      );
      openInfoModal(
        "Ballot übermittelt",
        "Das Ballot wurde erfolgreich an OpenTab übermittelt.",
      );
    })
    .catch(function (err) {
      if (otIsAuthError(err)) {
        otHandleStaleToken(
          otState.tournamentId,
          otState.debateId,
          otState.apiBase,
        );
        renderOpenTab(root.id);
        otStatusMsg(
          root,
          "Gespeicherter Zugang für dieses Turnier ist abgelaufen. Bitte Registrierungs-URL erneut einfügen.",
          true,
        );
        return;
      }
      otStatusMsg(root, err.message || String(err), true);
    });
}
// OpenTab view (chair-only): imports names and submits each judge's computed totals as their ballot
function renderOpenTab(rootId) {
  var root = document.getElementById(rootId || "v-opentab");
  if (!root) return;
  if (dashEditGuard(root)) return;
  root.innerHTML = "";

  // Desktop shows sections as folder tabs, mobile as stacked cards
  var mobile = root.id === "v-opentabm";
  function finish(sections, aside, asideLabel) {
    if (mobile) {
      var wrap = el("div", "dashcol");
      if (aside) wrap.appendChild(schnellPanel(asideLabel, aside));
      sections.forEach(function (sec) {
        wrap.appendChild(schnellPanel(sec.label, sec.build()));
      });
      root.appendChild(wrap);
      return;
    }
    root.appendChild(
      dashTabbedSheet(
        "opentab",
        sections,
        aside
          ? function () {
              return aside;
            }
          : null,
        function () {
          renderOpenTab(root.id);
        },
      ),
    );
  }

  if (!ME.is_chair) {
    finish([
      {
        key: "info",
        label: "OpenTab",
        build: function () {
          return el("p", null, "Nur der Chair kann OpenTab verbinden.");
        },
      },
    ]);
    return;
  }

  if (!otState.ballot) {
    var form = el("div", "otform");
    form.appendChild(
      el(
        "p",
        "otintro",
        "Verbindet direkt mit dem OpenTab-Server dieses Turniers. Zugangsdaten werden nur in diesem Browser gespeichert.",
      ),
    );

    if (otPendingTournamentId) {
      form.appendChild(
        el(
          "p",
          "otintro",
          "Kein gespeicherter Zugang für dieses Turnier gefunden. Bitte einmalig die Registrierungs-URL (privater Ballot-Link) einfügen.",
        ),
      );
      form.appendChild(
        otLabeledField(
          "Registrierungs-URL",
          "otRegUrl",
          "https://tabs.debateresult.com/register/…",
        ),
      );
      form.appendChild(el("div", "otstatus"));
      var registerBtn = el("button", "offlinejudgeadd", "Verbinden");
      registerBtn.type = "button";
      registerBtn.addEventListener("click", function () {
        otDoRegisterAndConnect(root);
      });
      form.appendChild(registerBtn);
      var cancelBtn = el("button", "juryab", "Andere Ballot-URL verwenden");
      cancelBtn.type = "button";
      cancelBtn.addEventListener("click", function () {
        otPendingTournamentId = null;
        otPendingDebateId = null;
        otPendingApiBase = null;
        renderOpenTab(root.id);
      });
      form.appendChild(cancelBtn);
    } else {
      form.appendChild(
        otLabeledField(
          "Ballot-URL",
          "otBallotUrl",
          "https://tabs.debateresult.com/tournament/…/debate/…",
        ),
      );
      form.appendChild(el("div", "otstatus"));
      var connectBtn = el("button", "offlinejudgeadd", "Verbinden");
      connectBtn.type = "button";
      connectBtn.addEventListener("click", function () {
        otDoConnectFromBallotUrl(root);
      });
      form.appendChild(connectBtn);
    }

    finish([
      {
        key: "connect",
        label: otPendingTournamentId
          ? "Registrierung erforderlich"
          : "OpenTab verbinden",
        build: function () {
          return form;
        },
      },
    ]);
    return;
  }

  var ballot = otState.ballot;
  var connBody = el("div", "otactions");
  connBody.appendChild(
    el(
      "span",
      "juryname",
      (ballot.government ? ballot.government.name : "?") +
        " vs. " +
        (ballot.opposition ? ballot.opposition.name : "?"),
    ),
  );
  var refreshBtn = el("button", "offlinejudgeadd", "Ballot neu laden");
  refreshBtn.type = "button";
  refreshBtn.addEventListener("click", function () {
    otDoRefresh(root);
  });
  var disconnectBtn = el("button", "offlinejudgeadd", "Trennen");
  disconnectBtn.type = "button";
  disconnectBtn.addEventListener("click", function () {
    otDoDisconnect(root);
  });
  connBody.appendChild(refreshBtn);
  connBody.appendChild(disconnectBtn);

  // Same ordering and formatting as the Offline-Jurierende table
  var slotMap = otBuildSlotMap(ballot);
  var speechWrap = el("div");
  // On desktop each tab has its own status line for the strip's actions; mobile has one next to "Ballot absenden"
  if (!mobile) speechWrap.appendChild(el("div", "otstatus"));
  var speechTable = el("table", "schnelltable otspeechtable");
  var speechTableHead = el("tr");
  speechTableHead.appendChild(el("th", "l", "Rede"));
  speechTableHead.appendChild(el("th", null, "Redner:in"));
  speechTable.appendChild(speechTableHead);

  var teamsByIdx = { 0: ballot.government, 1: ballot.opposition };
  activeSpeakerIndices().forEach(function (s) {
    var tr = el("tr");
    var lbl = el("td", "l", speakerLabel(s));
    var teamCls = teamClass(SPEAKERS[s].team);
    if (teamCls) lbl.classList.add(teamCls);
    tr.appendChild(lbl);
    var td = el("td");
    if (SPEAKERS[s].team === null) {
      // Free speakers are pre-assigned and can't be changed
      var sp = slotMap[s];
      td.appendChild(
        el(
          "span",
          "otname",
          sp && sp.speaker ? sp.speaker.name : "— keine Zuordnung —",
        ),
      );
    } else {
      // OpenTab's team speech order isn't authoritative, so the chair picks who gave each speech
      var team = teamsByIdx[SPEAKERS[s].team];
      var select = document.createElement("select");
      var blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "— auswählen —";
      select.appendChild(blank);
      (team ? team.members : []).forEach(function (m) {
        var opt = document.createElement("option");
        opt.value = m.uuid;
        opt.textContent = m.name;
        if (otState.teamSpeakerUuid[s] === m.uuid) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", function () {
        if (!select.value) return;
        var member = (team ? team.members : []).filter(function (m) {
          return m.uuid === select.value;
        })[0];
        if (!member) return;
        setName(s, member.name);
        otState.teamSpeakerUuid[s] = member.uuid;
        saveOtState();
      });
      td.appendChild(select);
    }
    tr.appendChild(td);
    speechTable.appendChild(tr);
  });
  speechWrap.appendChild(speechTable);

  var applyFreeBtn = el(
    "button",
    "offlinejudgeadd",
    "Namen für fraktionsfreie Reden aus OpenTab übernehmen",
  );
  applyFreeBtn.type = "button";
  applyFreeBtn.addEventListener("click", function () {
    activeSpeakerIndices()
      .filter(function (s) {
        return teamOf(s) === null;
      })
      .forEach(function (s) {
        var sp = slotMap[s];
        if (sp && sp.speaker) setName(s, sp.speaker.name);
      });
    render();
  });
  var applyFreeWrap = el("div", "otactions");
  applyFreeWrap.appendChild(applyFreeBtn);
  speechWrap.appendChild(applyFreeWrap);

  // Map room judges to ballot names
  var judgePanel = el("div");
  judgePanel.appendChild(el("div", "otstatus"));
  var judgeBody = el("div", "offlinejurywrap");
  var roomJudgeIds = Object.keys(peers).concat(
    Object.keys(offlineJudges).map(function (id) {
      return OFFLINE_ID_PREFIX + id;
    }),
  );
  var adjRows = ballot.adjudicators.slice();
  if (
    ballot.president &&
    !adjRows.some(function (a) {
      return a.uuid === ballot.president.uuid;
    })
  ) {
    adjRows.push(ballot.president);
  }
  adjRows.forEach(function (adj) {
    var row = el("div", "juryrow");
    var label =
      adj.name +
      (ballot.president && ballot.president.uuid === adj.uuid
        ? " (Vorsitz)"
        : "");
    row.appendChild(el("span", "juryname", label));
    var select = document.createElement("select");
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "— Jurierende:n wählen —";
    select.appendChild(blank);
    roomJudgeIds.forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = roomJudgeName(id);
      if (otState.judgeMap[adj.uuid] === id) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", function () {
      if (select.value) otState.judgeMap[adj.uuid] = select.value;
      else delete otState.judgeMap[adj.uuid];
      saveOtState();
    });
    row.appendChild(select);
    judgeBody.appendChild(row);
  });
  judgePanel.appendChild(judgeBody);
  var submitBtn = el("button", "otsubmitbtn", "Ballot absenden");
  submitBtn.type = "button";
  submitBtn.addEventListener("click", function () {
    otDoSubmit(root);
  });
  judgePanel.appendChild(submitBtn);

  finish(
    [
      {
        key: "redner",
        label: "Redner:innen",
        build: function () {
          return speechWrap;
        },
      },
      {
        key: "ballot",
        label: "Ballot absenden",
        build: function () {
          return judgePanel;
        },
      },
    ],
    connBody,
    "Verbunden mit OpenTab",
  );
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
    else if (ev === "notes") renderNotes();
    else if (ev === "offline") renderOfflineJudges();
    else if (ev === "opentab") renderOpenTab();
    else renderDashboard();
  } else {
    var mv = effectiveMobileView();
    if (mv === "namen") renderNamen();
    if (mv === "sheet") renderSheet();
    if (mv === "team") renderTeam();
    if (mv === "matrix") renderMatrix();
    if (mv === "chair") renderChair();
    if (mv === "opentabm") renderOpenTab("v-opentabm");
  }
  paintBar();
}

// Lobby and session
function urlCode() {
  var m = location.pathname.match(/^\/r\/([A-Za-z0-9]{4})$/);
  return m ? m[1].toUpperCase() : null;
}
// Most-recent-first index of past rooms (code, name, filled count, timestamp)
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
          (r.judges ? " - " + r.judges + " Judges" : ""),
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
  // render() no longer runs once ME is null, so drop the desktop class here or it stretches the lobby card
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
  // Restore the last open view after a reload
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

// Tell the chair the new code after promotion, since wings need the real link to join
function showPromotionNotice(code) {
  openInfoModal(
    "Raum wurde online geschaltet",
    "Neuer Code: " +
      code +
      ". Bitte den Link erneut teilen, damit Beisitzer:innen beitreten können.",
  );
}

// Turns a pending offline room into a server room and migrates local scores and notes;
// driven by resume() and the heartbeat rather than its own poller
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
      // If the judge left or switched rooms meanwhile, abandon the new server room instead of migrating into it
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
      saveLocal(); // Re-persists mine/queue under the new code
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
      promotingOffline = false; // Still offline, retried on the next resume() or heartbeat
    });
}
function lobbyErr(msg) {
  document.getElementById("lobbyErr").textContent = msg || "";
}

// Offered only when creating a room fails for lack of connectivity, not when the server rejects it
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

// Fabricates a room identity shaped like POST /api/rooms' response, with a code that can't collide (see genOfflineCode())
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
  // Stop the connect() attempt startSession() already began
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
      if (data) startSession(data); // Navigates away, so no need to restore the button
    })
    .catch(function () {
      // fetch() rejected: no connectivity rather than a server error
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
// navigator.clipboard needs https or localhost, so fall back to execCommand("copy") on plain http
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
document
  .getElementById("menuResetBlattCols")
  .addEventListener("click", function () {
    try {
      localStorage.removeItem("blattColWidths");
    } catch (e) {}
    render();
  });
document
  .getElementById("menuPrintNotes")
  .addEventListener("click", openPrintNotesModal);
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
  ["namen", "sheet", "team", "matrix", "chair", "opentabm"].forEach(
    function (vv) {
      document.getElementById("v-" + vv).classList.toggle("hide", vv !== view);
    },
  );
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

// Swipe navigation
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
// Mobile Abzüge options stay collapsed behind the toggle (deduOpen)
document.getElementById("deduRow").addEventListener("click", function (e) {
  if (e.target.closest("#deduToggle")) {
    deduOpen = !deduOpen;
    render();
    return;
  }
  var b = e.target.closest(".dedopt");
  if (!b) return;
  deduOpen = false;
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
  // Copy link stays open to show "Kopiert", and the bell voice switch so voices can be compared
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
    // Back-navigated to the room's URL after leaving: rejoin from the stored session
    var sess = LS.get("opd.session." + code, null);
    if (sess && sess.token) {
      startSession(sess);
      resync();
      return;
    }
  }
  if (!code && ME) {
    // Forward-navigated to the post-leave "/" entry: leave without touching history
    resetRoomState();
    showLobby();
  }
});
document
  .getElementById("chairRoomToggle")
  .addEventListener("click", function () {
    chairRoomOpen = !chairRoomOpen;
    render();
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
document
  .getElementById("btnFreeSpeakers")
  .addEventListener("click", openFreeSpeakersModal);
document.getElementById("themeBtn").addEventListener("click", cycleTheme);
document
  .getElementById("menuGradeInput")
  .addEventListener("click", openGradeInputModal);
document
  .getElementById("menuTimerDisplay")
  .addEventListener("click", toggleTimerCountUp);
document
  .getElementById("menuKeyLabel")
  .addEventListener("click", toggleKeyGradeFirst);
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

// Install button on phone widths: Chromium uses beforeinstallprompt, other browsers get a note about "Add to Home screen"
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

// Boot
(function () {
  if ("serviceWorker" in navigator) {
    // Registration fails for file:// copies; that just means no offline caching
    navigator.serviceWorker.register("/static/sw.js").catch(function () {});
  }
  if (isMobileViewport() && !isStandalone()) {
    document.getElementById("btnInstall").classList.remove("hide");
  }
  applyTheme(LS.get("opd.theme", "light"));
  applyGradeInputLabel();
  applyKeyLabelLabel();
  applyTimerDisplayLabel();
  applyBellVoiceLabel();
  // Only an explicit /r/CODE link auto-resumes a session; the bare URL always shows the lobby
  var code = urlCode();
  var sess = code ? LS.get("opd.session." + code, null) : null;
  if (sess && sess.token) {
    startSession(sess);
    resync();
  } else {
    showLobby();
  }
})();
