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
function teamOf(s) {
  return SPEAKERS[s].team;
}
function setTeamAccent(card, team) {
  card.classList.remove("team-gov", "team-opp", "team-free");
  card.classList.add(
    team === 0 ? "team-gov" : team === 1 ? "team-opp" : "team-free",
  );
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
    cells: [20, 19],
    marks: [" ", " "],
  },
  {
    a: "Exzellent",
    b: "Nationale Spitzenleistung",
    cells: [18, 17, 16],
    marks: [" ", " ", " "],
  },
  {
    a: "Sehr gut",
    b: "Schwächen kaum erkennbar",
    cells: [15, 14, 13],
    marks: ["1+", "1", "1-"],
  },
  {
    a: "Gut",
    b: "Stärken überwiegen",
    cells: [12, 11, 10],
    marks: ["2+", "2", "2-"],
  },
  {
    a: "Solide",
    b: "ausgewogen",
    cells: [9, 8, 7],
    marks: ["3+", "3", "3-"],
  },
  {
    a: "Ausreichend",
    b: "Schwächen überwiegen",
    cells: [6, 5, 4],
    marks: ["4+", "4", "4-"],
  },
  {
    a: "Mangelhaft",
    b: "deutliche Schwächen",
    cells: [3, 2, 1],
    marks: ["5+", "5", "5-"],
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
function labelOf(target, criterion) {
  if (target[0] === "s") {
    var s = SPEAKERS[+target.slice(1)].label;
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
var ws = null,
  wsTries = 0,
  wsTimer = null,
  flushTimer = null;
var online = false,
  pending = 0;

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

// Save locally first, then push to db
function write(target, criterion, points) {
  var k = kk(target, criterion);
  mine[k] = points;
  if (!remote[ME.judge_id]) remote[ME.judge_id] = {};
  remote[ME.judge_id][k] = points;
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
        remote[m.judge_id][kk(p.target, p.criterion)] = p.points;
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
  deductions = {};
  myExclusions = {};
  remoteExclusions = {};
  hist = [];
  thist = [];
  cs = 0;
  cc = 0;
  ct = 0;
  ctc = 0;
  showView("sheet");
}
function leaveRoom() {
  if (!ME) return;
  recordRecentRoom(ME.code, ME.name, ME.is_chair); // capture the final filled count
  resetRoomState();
  // history.pushState keeps a back-button escape hatch: a stray tap on
  // "Verlassen" is recoverable since opd.session.<code> stays around.
  if (history.pushState) history.pushState({ left: true }, "", "/");
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
}

// Scoring state for local judge
var NC = CRITERIA.length,
  NT = TEAMCATS.length;
var view = "sheet",
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
function firstEmptyS(s) {
  for (var c = 0; c < NC; c++) if (sget(s, c) === null) return c;
  return -1;
}
// Own team points + own speakers' totals - shared by Übersicht and Schnelleingabe's Teampunkte row.
function myTeamGrand(t) {
  var teamSpeakers = SPEAKERS.filter(function (sp) {
    return sp.team === t;
  });
  var speakerSum = 0,
    scoredCount = 0;
  teamSpeakers.forEach(function (sp) {
    var s = SPEAKERS.indexOf(sp);
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
      var keys = el("div", "notekeys");
      n.cells.forEach(function (v, j) {
        var b = el("button", "key");
        b.appendChild(el("div", "n", String(mid(convert(v, scaleMax)))));
        b.appendChild(el("div", "m", n.marks[j] || "Kat. " + v));
        b.addEventListener("click", function () {
          onPick(v);
        });
        keys.appendChild(b);
      });
      for (var f = n.cells.length; f < 3; f++)
        keys.appendChild(el("div", "key blank"));
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
  document.getElementById("spkName").textContent = SPEAKERS[cs].label;
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
    h.push('<tr><td class="l">' + lbl + "</td>");
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
        "/ 200 </td>" +
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
// Shared by the mobile chair view and the desktop dashboard's judge chips.
function confirmHiddenToggle(id, name, goingHidden) {
  openConfirmModal({
    text: hiddenToggleMessage(name, goingHidden),
    confirmLabel: goingHidden ? "Zu Trainee" : "Zu Wing",
    onConfirm: function () {
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
    return (peers[b].is_chair ? 1 : 0) - (peers[a].is_chair ? 1 : 0);
  });
}
// Mean of a list of numbers, rounded to 2 decimals; returns null for an
// empty list, so callers can render "·" without a separate check.
function avgRound(vals) {
  if (!vals.length) return null;
  var sum = vals.reduce(function (a, b) {
    return a + b;
  }, 0);
  return Math.round((sum / vals.length) * 100) / 100;
}
// Shared chair math, used by both mobile chair view and desktop dashboard.
function computeChairSummary() {
  var ids = activeJudges();
  function includedFor(id, target) {
    return !(remoteExclusions[id] && remoteExclusions[id][target]);
  }
  function remoteTotal(id, s) {
    var sum = 0;
    for (var c = 0; c < NC; c++) {
      var v = (remote[id] || {})[kk("s" + s, CRITERIA[c].key)];
      if (v === undefined) return null;
      sum += v;
    }
    return sum - deductionPoints(s);
  }
  function remoteTeamTotal(id, t) {
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
    var avg =
      vals.reduce(function (a, b) {
        return a + b;
      }, 0) / vals.length;
    cells.push({
      label: label,
      spread: mx - mn,
      avg: avg,
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
    var avg =
      vals.reduce(function (a, b) {
        return a + b;
      }, 0) / vals.length;
    var spread = Math.max.apply(null, vals) - Math.min.apply(null, vals);
    return {
      label: label,
      spread: spread,
      avg: avg,
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
    var sp = SPEAKERS[s];
    var vals = [],
      names = [],
      judges = [];
    ids.forEach(function (id) {
      if (!includedFor(id, "s" + s)) return;
      var v = remoteTotal(id, s);
      if (v !== null) {
        vals.push(v);
        names.push(peers[id].name + " " + v);
        judges.push({ name: peers[id].name, v: v });
      }
    });
    if (vals.length < 2) return;
    var mx = Math.max.apply(null, vals),
      mn = Math.min.apply(null, vals);
    var avg =
      vals.reduce(function (a, b) {
        return a + b;
      }, 0) / vals.length;
    totals.push({
      label: sp.label,
      spread: mx - mn,
      avg: avg,
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
  var speakerRows = SPEAKERS.map(function (sp, s) {
    var vals = [];
    ids.forEach(function (id) {
      if (!includedFor(id, "s" + s)) return;
      var v = remoteTotal(id, s);
      if (v !== null) vals.push(v);
    });
    var avg = vals.length
      ? vals.reduce(function (a, b) {
          return a + b;
        }, 0) / vals.length
      : null;
    return { label: sp.label, avg: avg, n: vals.length };
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
    var teamAvg = vals.length
      ? vals.reduce(function (a, b) {
          return a + b;
        }, 0) / vals.length
      : null;
    var teamSpeakers = SPEAKERS.filter(function (sp) {
      return sp.team === t;
    });
    var speakerSum = 0,
      scoredCount = 0;
    teamSpeakers.forEach(function (sp) {
      var s = SPEAKERS.indexOf(sp);
      var svals = [];
      ids.forEach(function (id) {
        if (!includedFor(id, "s" + s)) return;
        var v = remoteTotal(id, s);
        if (v !== null) svals.push(v);
      });
      if (!svals.length) return;
      speakerSum +=
        svals.reduce(function (a, b) {
          return a + b;
        }, 0) / svals.length;
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
      '<tr><td class="l' +
        (isBest ? " best" : "") +
        '">' +
        r.label +
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
        r.label +
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
    head.appendChild(el("th", null, peers[id].name));
  });
  head.appendChild(el("th", null, "Ø"));
  table.appendChild(head);

  // {vals, avg, tds, avgTd} per row, so best-speech/best-team can be marked once every row is built.
  var speakerMeta = [];
  activeSpeakerIndices().forEach(function (s) {
    var sp = SPEAKERS[s];
    var tr = el("tr");
    tr.appendChild(el("td", "l", sp.label));
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
    var teamSpeakers = [];
    SPEAKERS.forEach(function (sp, s) {
      if (sp.team === t) teamSpeakers.push(s);
    });
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
      row.appendChild(el("span", "p", j.filled + " / 59"));
      if (!j.is_chair) {
        var x = el("button", "x", j.hidden ? "Zu Wing" : "Zu Trainee");
        x.addEventListener("click", function () {
          confirmHiddenToggle(id, j.name, !j.hidden);
        });
        row.appendChild(x);
      }
      jh.appendChild(row);
    });
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
var dashboardView = "blatt";
var DASH_WIDE_VIEWS = ["dashboard", "schnell", "blatt", "teampoints"];
// Remembers the last-focused field id per view ("blatt"/"teampoints"), so
// Alt+Space can swap between the two and land back where you were.
var lastFocusByView = {};

function isDesktopWidth() {
  return !!(ME && window.matchMedia("(min-width: 1024px)").matches);
}
function isDesktopChair() {
  return isDesktopWidth() && ME.is_chair;
}
// Falls back to "schnell" when dashboardView points somewhere unreachable
// now - "dashboard" for a wing the chair hasn't opened it to, or the
// retired matrix/sheet/team.
function effectiveDashboardView() {
  if (dashboardView === "dashboard" && !ME.is_chair && !spreadOpen)
    return "schnell";
  if (
    dashboardView === "matrix" ||
    dashboardView === "sheet" ||
    dashboardView === "team"
  )
    return "schnell";
  return dashboardView;
}

function applyLayoutMode() {
  var dash = isDesktopWidth();
  var app = document.getElementById("app");
  var changed = app.classList.contains("dashboard-mode") !== dash;
  app.classList.toggle("dashboard-mode", dash);
  document.getElementById("dashNav").classList.toggle("hide", !dash);
  document.getElementById("dashJury").classList.toggle("hide", !dash);

  var ev = effectiveDashboardView();
  var wide = dash && DASH_WIDE_VIEWS.indexOf(ev) !== -1;
  var subview = dash && !wide;

  app.classList.toggle("dashboard-subview", subview);
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

  if (wide) {
    ["v-sheet", "v-team", "v-matrix", "v-chair"].forEach(function (id) {
      document.getElementById(id).classList.add("hide");
    });
    document.getElementById("dock").classList.add("hide");
  } else if (subview) {
    document.getElementById("v-chair").classList.add("hide");
    document.getElementById("v-matrix").classList.add("hide");
    ["sheet", "team"].forEach(function (vv) {
      document.getElementById("v-" + vv).classList.toggle("hide", vv !== ev);
    });
    document.getElementById("dock").classList.remove("hide");
    document
      .getElementById("dockSheet")
      .classList.toggle("hide", ev !== "sheet");
    document.getElementById("dockTeam").classList.toggle("hide", ev !== "team");
    document.getElementById("tabs").classList.add("hide");
  } else {
    document.getElementById("tabs").classList.remove("hide");
    // Restore dock (hidden by the "wide" branch) on plain mobile - otherwise
    // shrinking down from desktop leaves no way to score.
    document.getElementById("dock").classList.remove("hide");
    showView(view);
  }
  return changed;
}

function renderDashChrome() {
  [].forEach.call(
    document.querySelectorAll('#dashNav button[data-dv="dashboard"]'),
    function (b) {
      b.classList.toggle("hide", !ME.is_chair && !spreadOpen);
    },
  );

  var jury = document.getElementById("dashJury");
  jury.innerHTML = "";
  jury.appendChild(el("span", "dashroom", "Raum " + ME.code));
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

  // Reuses spreadOpen - opening it also gives wings the stripped dashboard (minus the right column).
  var dob = el(
    "button",
    "dashjbtn" + (spreadOpen ? " on" : ""),
    spreadOpen ? "Dashboard sperren" : "Dashboard freigeben",
  );
  dob.tabIndex = -1;
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
  jury.appendChild(dob);
  Object.keys(peers).forEach(function (id) {
    var j = peers[id];
    var chip = el("span", "dashjchip" + (j.hidden ? " off" : ""));
    chip.appendChild(el("span", "dot " + (j.online ? "on" : "off")));
    chip.appendChild(
      document.createTextNode(
        " " +
          j.name +
          (j.is_chair ? " · Chair" : "") +
          (j.hidden ? " · Trainee" : "") +
          " · " +
          j.filled +
          "/59",
      ),
    );
    if (!j.is_chair) {
      var x = el("button", "dashjbtn", j.hidden ? "Zu Wing" : "Zu Trainee");
      x.tabIndex = -1;
      x.addEventListener("click", function (e) {
        e.stopPropagation();
        confirmHiddenToggle(id, j.name, !j.hidden);
      });
      chip.appendChild(x);
    }
    chips.appendChild(chip);
  });
}
document.getElementById("dashNav").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-dv]");
  if (!b) return;
  if (b.dataset.dv === "dashboard" && !ME.is_chair && !spreadOpen) return;
  dashboardView = b.dataset.dv;
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
  dashboardView = btns[nextIdx].dataset.dv;
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

// Alt+1..4 jump straight to a chrome tab, by position among the visible
// #dashNav buttons - laptop-friendly alternative to PageUp/PageDown that
// doesn't need cycling through intermediate tabs.
document.addEventListener("keydown", function (e) {
  if (!ME || !isDesktopWidth()) return;
  if (!e.altKey || !/^[1-4]$/.test(e.key)) return;
  var btns = [].slice.call(
    document.querySelectorAll("#dashNav button[data-dv]:not(.hide)"),
  );
  var idx = Number(e.key) - 1;
  if (idx >= btns.length) return;
  e.preventDefault();
  commitActiveInput();
  dashboardView = btns[idx].dataset.dv;
  render();
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
  dashboardView = target;
  render();
  var restoreId = lastFocusByView[target];
  // Jumping into Teampunkte mid-speech snaps straight to the *opposing*
  // team's Zwischenfragen note - that's almost always what an interjection
  // during a team speech needs to be logged against - instead of wherever
  // was last focused there. Free speakers (team index 2) have no opposing
  // side, so fall through to the normal remembered/first-field behavior.
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

function dashSpeakerGroup(label, teamVal, summary) {
  var wrap = el("div");
  var rows = activeSpeakerIndices().filter(function (s) {
    return SPEAKERS[s].team === teamVal;
  });
  if (!rows.length) return wrap;
  wrap.appendChild(el("div", "dashgrp", label));
  rows.forEach(function (s) {
    var sp = SPEAKERS[s];
    var teamCls =
      teamVal === 0 ? "team-gov" : teamVal === 1 ? "team-opp" : "team-free";
    var sel = dashboardSelected.kind === "speaker" && dashboardSelected.s === s;
    var row = el("div", "dashspk " + teamCls + (sel ? " sel" : ""));
    row.appendChild(el("span", "lb", sp.label));
    var avg = summary.speakerRows[s].avg;
    row.appendChild(el("span", "vl", avg === null ? "·" : avg.toFixed(1)));
    var tot = summary.totals.filter(function (t) {
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

function dashSpeakerPanel(summary) {
  var panel = el("div", "dashpanel dashpanel-grow3");
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, "Redner:innen"));
  panel.appendChild(head);
  var body = el("div", "dashpanelbody");
  body.appendChild(dashSpeakerGroup("Regierung", 0, summary));
  body.appendChild(dashSpeakerGroup("Opposition", 1, summary));
  body.appendChild(dashSpeakerGroup("Fraktionsfrei", null, summary));
  panel.appendChild(body);
  return panel;
}

function dashTeamGroupRows(summary) {
  var wrap = el("div");
  TEAMS.forEach(function (tm, t) {
    wrap.appendChild(el("div", "dashgrp", tm));
    summary.teamGroups.forEach(function (g) {
      var teamCls = t === 0 ? "team-gov" : "team-opp";
      var gc = summary.groupCells.filter(function (x) {
        return x.key === "t" + t + "/grp-" + tm + " · " + g;
      })[0];
      var sel =
        dashboardSelected.kind === "team" &&
        dashboardSelected.t === t &&
        dashboardSelected.grp === g;
      var row = el("div", "dashspk " + teamCls + (sel ? " sel" : ""));
      row.appendChild(el("span", "lb", g));
      row.appendChild(el("span", "vl", gc ? gc.avg.toFixed(1) : "·"));
      row.appendChild(dashSpreadBadge(gc ? gc.spread : null));
      row.addEventListener("click", function () {
        dashboardSelected = { kind: "team", t: t, grp: g };
        renderDashboard();
      });
      wrap.appendChild(row);
    });
  });
  return wrap;
}

function dashTeamPanel(summary) {
  var panel = el("div", "dashpanel dashpanel-grow2");
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, "Teampunkte"));
  panel.appendChild(head);
  var body = el("div", "dashpanelbody");
  body.appendChild(dashTeamGroupRows(summary));
  panel.appendChild(body);
  return panel;
}

function dashColA(summary) {
  var col = el("div", "dashcol dashcol-a");
  col.appendChild(dashSpeakerPanel(summary));
  col.appendChild(dashTeamPanel(summary));
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

function dashColB(summary) {
  var col = el("div", "dashcol dashcol-b");
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

function dashBallotTable(summary, s) {
  var chairFirst = chairFirstIds(summary.ids);
  var table = el("table", "ballottable");
  var head = el("tr");
  head.appendChild(el("th", "l", "Kriterium"));
  chairFirst.forEach(function (id) {
    head.appendChild(el("th", null, peers[id].name));
  });
  head.appendChild(el("th", null, "Ø"));
  head.appendChild(el("th", null, "Spread"));
  table.appendChild(head);
  CRITERIA.forEach(function (c) {
    var cell = summary.cells.filter(function (x) {
      return x.key === "s" + s + "/" + c.key;
    })[0];
    var tr = el("tr", cell && cell.spread >= 5 ? "hot" : null);
    tr.appendChild(el("td", "l", c.label));
    var vals = [];
    chairFirst.forEach(function (id) {
      var v = (remote[id] || {})[kk("s" + s, c.key)];
      tr.appendChild(el("td", null, v === undefined ? "·" : String(v)));
      if (summary.includedFor(id, "s" + s) && v !== undefined) vals.push(v);
    });
    var avg = avgRound(vals);
    tr.appendChild(el("td", "tot", avg === null ? "·" : String(avg)));
    tr.appendChild(dashSpreadCell(cell ? cell.spread : null));
    table.appendChild(tr);
  });
  var totTr = el("tr");
  totTr.appendChild(el("td", "l tot", "Gesamt"));
  var totVals = [];
  chairFirst.forEach(function (id) {
    var v = summary.remoteTotal(id, s);
    totTr.appendChild(el("td", "tot", v === null ? "·" : String(v)));
    if (summary.includedFor(id, "s" + s) && v !== null) totVals.push(v);
  });
  var totAvg = avgRound(totVals);
  totTr.appendChild(el("td", "tot", totAvg === null ? "·" : String(totAvg)));
  var totCell = summary.totals.filter(function (x) {
    return x.key === "s" + s;
  })[0];
  totTr.appendChild(dashSpreadCell(totCell ? totCell.spread : null));
  table.appendChild(totTr);
  return table;
}

function dashTeamBallotTable(summary, t, grp) {
  var chairFirst = chairFirstIds(summary.ids);
  var cats = TEAMCATS.filter(function (c) {
    return c.grp === grp;
  });
  var table = el("table", "ballottable");
  var head = el("tr");
  head.appendChild(el("th", "l", "Kategorie"));
  chairFirst.forEach(function (id) {
    head.appendChild(el("th", null, peers[id].name));
  });
  head.appendChild(el("th", null, "Ø"));
  head.appendChild(el("th", null, "Spread"));
  table.appendChild(head);
  cats.forEach(function (c) {
    var cell = summary.cells.filter(function (x) {
      return x.key === "t" + t + "/" + c.key;
    })[0];
    var tr = el("tr", cell && cell.spread >= 5 ? "hot" : null);
    tr.appendChild(el("td", "l", c.label));
    var vals = [];
    chairFirst.forEach(function (id) {
      var v = (remote[id] || {})[kk("t" + t, c.key)];
      tr.appendChild(el("td", null, v === undefined ? "·" : String(v)));
      if (summary.includedFor(id, "t" + t) && v !== undefined) vals.push(v);
    });
    var avg = avgRound(vals);
    tr.appendChild(el("td", "tot", avg === null ? "·" : String(avg)));
    tr.appendChild(dashSpreadCell(cell ? cell.spread : null));
    table.appendChild(tr);
  });
  var totTr = el("tr");
  totTr.appendChild(el("td", "l tot", "Summe " + grp));
  var totVals = [];
  chairFirst.forEach(function (id) {
    var sum = 0,
      complete = true;
    cats.forEach(function (c) {
      var v = (remote[id] || {})[kk("t" + t, c.key)];
      if (v === undefined) {
        complete = false;
        return;
      }
      sum += v;
    });
    totTr.appendChild(el("td", "tot", complete ? String(sum) : "·"));
    if (summary.includedFor(id, "t" + t) && complete) totVals.push(sum);
  });
  var totAvg = avgRound(totVals);
  totTr.appendChild(el("td", "tot", totAvg === null ? "·" : String(totAvg)));
  var totCell = summary.groupCells.filter(function (x) {
    return x.key === "t" + t + "/grp-" + TEAMS[t] + " · " + grp;
  })[0];
  totTr.appendChild(dashSpreadCell(totCell ? totCell.spread : null));
  table.appendChild(totTr);
  return table;
}

function dashSpeakerBallotPanel(summary, s) {
  var sp = SPEAKERS[s];
  var panel = el("div", "dashpanel");
  panel.classList.add(
    sp.team === 0 ? "team-gov" : sp.team === 1 ? "team-opp" : "team-free",
  );
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, sp.label));
  head.appendChild(el("div", "sub", "Ballotvergleich"));
  panel.appendChild(head);
  var body = el("div", "dashpanelbody dashpanelbody-table");
  body.appendChild(dashBallotTable(summary, s));
  panel.appendChild(body);
  return panel;
}

function dashTeamBallotPanel(summary, t, grp) {
  var panel = el("div", "dashpanel");
  panel.classList.add(t === 0 ? "team-gov" : "team-opp");
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, TEAMS[t] + " · " + grp));
  head.appendChild(el("div", "sub", "Ballotvergleich"));
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
      return peers[id] ? peers[id].name : id;
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

function closeConfirmModal() {
  var m = document.getElementById("confirmModal");
  if (m) m.remove();
  document.removeEventListener("keydown", confirmModalEscHandler);
}
function confirmModalEscHandler(e) {
  if (e.key === "Escape") closeConfirmModal();
}
// Generic confirm dialog in the app's modal style - an Abbrechen/confirm
// pair instead of confirm(). opts: {title, text, confirmLabel, cancelLabel, onConfirm}.
function openConfirmModal(opts) {
  closeConfirmModal();

  var backdrop = el("div", "modalbackdrop");
  backdrop.id = "confirmModal";
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeConfirmModal();
  });

  var box = el("div", "modalbox");
  if (opts.title) box.appendChild(el("h2", null, opts.title));
  box.appendChild(el("p", "note", opts.text));

  var actions = el("div", "modalactions");
  var cancelBtn = el("button", "btn ghost", opts.cancelLabel || "Abbrechen");
  cancelBtn.type = "button";
  cancelBtn.addEventListener("click", closeConfirmModal);
  var confirmBtn = el("button", "btn", opts.confirmLabel);
  confirmBtn.type = "button";
  confirmBtn.addEventListener("click", function () {
    closeConfirmModal();
    opts.onConfirm();
  });
  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  box.appendChild(actions);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  document.addEventListener("keydown", confirmModalEscHandler);
}

function closeInfoModal() {
  var m = document.getElementById("infoModal");
  if (m) m.remove();
  document.removeEventListener("keydown", infoModalEscHandler);
}
function infoModalEscHandler(e) {
  if (e.key === "Escape") closeInfoModal();
}
// Generic single-button notice in the app's modal style, replacing alert().
function openInfoModal(title, text) {
  closeInfoModal();

  var backdrop = el("div", "modalbackdrop");
  backdrop.id = "infoModal";
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeInfoModal();
  });

  var box = el("div", "modalbox");
  if (title) box.appendChild(el("h2", null, title));
  box.appendChild(el("p", "note", text));

  var actions = el("div", "modalactions");
  var okBtn = el("button", "btn", "OK");
  okBtn.type = "button";
  okBtn.addEventListener("click", closeInfoModal);
  actions.appendChild(okBtn);
  box.appendChild(actions);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  document.addEventListener("keydown", infoModalEscHandler);
}

function closeBallotExportModal() {
  var m = document.getElementById("ballotExportModal");
  if (m) m.remove();
  document.removeEventListener("keydown", ballotExportEscHandler);
}
function ballotExportEscHandler(e) {
  if (e.key === "Escape") closeBallotExportModal();
}

// Appended to <body>, since #v-dashboard gets torn down on every render().
function openBallotExportModal(summary) {
  closeBallotExportModal();

  var order = chairFirstIds(summary.ids);

  var backdrop = el("div", "modalbackdrop");
  backdrop.id = "ballotExportModal";
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeBallotExportModal();
  });

  var box = el("div", "modalbox");
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
      row.appendChild(el("span", "nm", peers[id] ? peers[id].name : id));
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
    // A direct click (vs. dragging) just runs harmlessly here - the alert explains why nothing happened.
    e.preventDefault();
    alert(
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
  closeBtn.addEventListener("click", closeBallotExportModal);
  actions.appendChild(copyBtn);
  actions.appendChild(closeBtn);
  box.appendChild(actions);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  document.addEventListener("keydown", ballotExportEscHandler);
}

function closeFreeSpeakersModal() {
  var m = document.getElementById("freeSpeakersModal");
  if (m) m.remove();
  document.removeEventListener("keydown", freeSpeakersEscHandler);
}
function freeSpeakersEscHandler(e) {
  if (e.key === "Escape") closeFreeSpeakersModal();
}

// Chair-only: how many reserved free-speaker slots are active. Lowering
// never deletes scores; raising brings them back.
function openFreeSpeakersModal() {
  closeFreeSpeakersModal();

  var backdrop = el("div", "modalbackdrop");
  backdrop.id = "freeSpeakersModal";
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeFreeSpeakersModal();
  });

  var box = el("div", "modalbox");
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
    closeFreeSpeakersModal();
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
  cancelBtn.addEventListener("click", closeFreeSpeakersModal);
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  box.appendChild(actions);

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  document.addEventListener("keydown", freeSpeakersEscHandler);
  input.focus();
  input.select();
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
  inp.type = "number";
  inp.inputMode = "numeric";
  inp.min = "0";
  inp.step = "1";
  if (opts.width !== false) inp.style.width = opts.width || "95px";
  // Selects the whole value on focus, so typing overwrites instead of inserting.
  inp.addEventListener("focus", function () {
    inp.select();
  });
  // Strips non-digits as you type (type=number still allows e/+/-/.).
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

// Speaker criteria (Spr/Auf/Kon/Sac/Urt) sit on the raw 0-20 Notenskala -
// typed value is written as-is, just clamped.
function schnellSpeakerInput(s, c) {
  var v = sget(s, c);
  var inp = schnellNumberInput();
  inp.max = "20";
  if (v !== null) inp.value = String(v);
  inp.addEventListener("change", function () {
    var raw = inp.value.trim();
    if (raw === "") return;
    var n = Math.round(Number(raw));
    if (!isFinite(n)) {
      inp.value = v === null ? "" : String(v);
      return;
    }
    n = Math.max(0, Math.min(20, n));
    inp.value = String(n);
    v = n;
    write("s" + s, CRITERIA[c].key, n);
    updateSchnellSpeakerRow(s);
  });
  return inp;
}

// Team categories are stored in their own point scale (e.g. 0-25), but
// only the discrete bands the Jurierbogen's Umrechnungstabelle defines are
// valid - the mobile keypad only ever writes a band's midpoint (pickTeam(),
// via katOf()/convert()/mid()). A typed number here gets snapped to that
// same midpoint on commit, exactly as if the matching pad button had been
// tapped, so free typing can never produce an invalid team score.
function schnellTeamInput(t, catIdx) {
  var cat = TEAMCATS[catIdx];
  var v = tget(t, catIdx);
  var inp = schnellNumberInput();
  inp.max = String(cat.max);
  if (v !== null) inp.value = String(v);
  inp.addEventListener("change", function () {
    var raw = inp.value.trim();
    if (raw === "") return;
    var n = Math.round(Number(raw));
    if (!isFinite(n)) {
      inp.value = v === null ? "" : String(v);
      return;
    }
    // Clamps to the category's range; the keypad instead snaps to a grade midpoint.
    n = Math.max(0, Math.min(cat.max, n));
    inp.value = String(n);
    v = n;
    write("t" + t, cat.key, n);
    updateSchnellTeamRow(t);
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
  var tr = el("tr");
  var lbl = el("td", "l", SPEAKERS[s].label);
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
    var t = SPEAKERS[s].team;
    return t === 0 ? "team-gov" : t === 1 ? "team-opp" : "team-free";
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
    var lbl = el("td", "l " + (t === 0 ? "team-gov" : "team-opp"), tm);
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
  var valEl = document.getElementById("blatt-val-" + s + "-" + c);
  var hintEl = document.getElementById("blatt-hint-" + s + "-" + c);
  var minusEl = document.getElementById("blatt-minus-" + s + "-" + c);
  var plusEl = document.getElementById("blatt-plus-" + s + "-" + c);
  if (valEl) valEl.value = v === null ? "" : String(v);
  if (hintEl) hintEl.textContent = blattHintText(v);
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

  var inp = schnellNumberInput({
    extraClass: "blattinput",
    width: false,
    onEnter: function (inp) {
      if (allSpeakerScoresFilled(s)) advanceToNextSpeech();
      else focusNextNumberInput(inp);
    },
  });
  inp.max = "20";
  inp.id = "blatt-val-" + s + "-" + c;
  inp.tabIndex = tabIdx;
  var v = sget(s, c);
  if (v !== null) inp.value = String(v);
  inp.addEventListener("change", function () {
    var raw = inp.value.trim();
    if (raw === "") return;
    var n = Math.round(Number(raw));
    if (!isFinite(n)) {
      updateBlattScore(s, c);
      return;
    }
    n = Math.max(0, Math.min(20, n));
    write("s" + s, CRITERIA[c].key, n);
    updateBlattScore(s, c);
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

  var hint = el("div", "blatthint", blattHintText(v));
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
  var teamCls =
    sp.team === 0 ? "team-gov" : sp.team === 1 ? "team-opp" : "team-free";

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
  mid.appendChild(el("h1", "blatttitle", sp.label));
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
  var valEl = document.getElementById("teampoints-val-t" + t + "-c" + catIdx);
  var hintEl = document.getElementById("teampoints-hint-t" + t + "-c" + catIdx);
  var minusEl = document.getElementById(
    "teampoints-minus-t" + t + "-c" + catIdx,
  );
  var plusEl = document.getElementById("teampoints-plus-t" + t + "-c" + catIdx);
  if (valEl) valEl.value = v === null ? "" : String(v);
  if (hintEl) hintEl.textContent = teamPointsHintText(v, cat.max);
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

  var inp = schnellNumberInput({ extraClass: "blattinput", width: false });
  inp.max = String(cat.max);
  inp.id = "teampoints-val-t" + t + "-c" + catIdx;
  inp.tabIndex = tabIdx;
  var v = tget(t, catIdx);
  if (v !== null) inp.value = String(v);
  inp.addEventListener("change", function () {
    var raw = inp.value.trim();
    if (raw === "") return;
    var n = Math.round(Number(raw));
    if (!isFinite(n)) {
      updateTeamPointsScore(t, catIdx);
      return;
    }
    // Clamps to the category's range; the mobile keypad instead snaps to a grade midpoint.
    n = Math.max(0, Math.min(cat.max, n));
    write("t" + t, cat.key, n);
    updateTeamPointsScore(t, catIdx);
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

  var hint = el("div", "blatthint", teamPointsHintText(v, cat.max));
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
  var teamCls = t === 0 ? "team-gov" : "team-opp";
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

function render() {
  if (!ME) return;
  applyLayoutMode();
  if (isDesktopWidth()) {
    renderDashChrome();
    var ev = effectiveDashboardView();
    if (ev === "sheet") renderSheet();
    else if (ev === "team") renderTeam();
    else if (ev === "schnell") renderSchnell();
    else if (ev === "blatt") renderBlatt();
    else if (ev === "teampoints") renderTeamPoints();
    else renderDashboard();
  } else {
    if (view === "sheet") renderSheet();
    if (view === "team") renderTeam();
    if (view === "matrix") renderMatrix();
    if (view === "chair") renderChair();
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
      el("div", "meta", (r.filled || 0) + " Punkte eingetragen"),
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
  document
    .getElementById("app")
    .classList.remove("dashboard-mode", "dashboard-subview");
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
  loadLocal();
  recordRecentRoom(s.code, s.name, s.is_chair);
  if (!remote[ME.judge_id]) remote[ME.judge_id] = {};
  Object.assign(remote[ME.judge_id], mine);
  document.getElementById("v-lobby").classList.add("hide");
  document.getElementById("main").classList.remove("hide");
  document.getElementById("dock").classList.remove("hide");
  updateChairTab();
  if (history.replaceState)
    history.replaceState({ room: ME.code }, "", "/r/" + ME.code);
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
      var oldCode = ME.code;
      var oldJudgeId = ME.judge_id;

      LS.del("opd.session." + oldCode);
      LS.del("opd.scores." + oldCode);
      LS.del("opd.queue." + oldCode);
      LS.del("opd.notes." + oldCode);

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
      recordRecentRoom(ME.code, ME.name, ME.is_chair);

      if (history.replaceState)
        history.replaceState({ room: ME.code }, "", "/r/" + ME.code);

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
      if (r.status === 410) throw new Error("Dieser Raum ist geschlossen.");
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
  [].forEach.call(
    document.querySelectorAll("#tabs button[data-t]"),
    function (x) {
      x.setAttribute("aria-pressed", String(x.dataset.t === view));
    },
  );
  ["sheet", "team", "matrix", "chair"].forEach(function (vv) {
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
  // Copying stays open briefly to show the "Kopiert" confirmation instead
  // of vanishing the instant it's tapped.
  if (item && item.id !== "menuCopyLink") closeMenu();
});
document.addEventListener("click", function (e) {
  var panel = document.getElementById("menuPanel");
  if (panel.classList.contains("hide")) return;
  if (e.target.closest("#menuPanel") || e.target.closest("#menuBtn")) return;
  closeMenu();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeMenu();
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
document.getElementById("themeBtn").addEventListener("click", cycleTheme);
document.getElementById("undoBtn").addEventListener("click", function () {
  var h = hist.pop();
  if (!h) return;
  if (h.prev === null) {
    delete mine[kk("s" + h.s, CRITERIA[h.c].key)];
    write("s" + h.s, CRITERIA[h.c].key, 0); // server has no delete; 0 is the eraser
    delete mine[kk("s" + h.s, CRITERIA[h.c].key)];
  } else {
    write("s" + h.s, CRITERIA[h.c].key, h.prev);
  }
  cs = h.s;
  cc = h.c;
  render();
});
document.getElementById("tundoBtn").addEventListener("click", function () {
  var h = thist.pop();
  if (!h) return;
  if (h.prev === null) {
    delete mine[kk("t" + h.t, TEAMCATS[h.c].key)];
    write("t" + h.t, TEAMCATS[h.c].key, 0); // server has no delete; 0 is the eraser
    delete mine[kk("t" + h.t, TEAMCATS[h.c].key)];
  } else {
    write("t" + h.t, TEAMCATS[h.c].key, h.prev);
  }
  ct = h.t;
  ctc = h.c;
  render();
});

// boot function
(function () {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/static/sw.js");
  }
  applyTheme(LS.get("opd.theme", "light"));
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
