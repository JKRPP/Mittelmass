var SPEAKERS = [
  { label: "Eröffnungsrede Regierung", team: 0 },
  { label: "Eröffnungsrede Opposition", team: 1 },
  { label: "Ergänzungsrede Regierung", team: 0 },
  { label: "Ergänzungsrede Opposition", team: 1 },
  { label: "1. Fraktionsfreie Rede", team: null },
  { label: "2. Fraktionsfreie Rede", team: null },
  { label: "3. Fraktionsfreie Rede", team: null },
  { label: "Schlussrede Opposition", team: 1 },
  { label: "Schlussrede Regierung", team: 0 },
];
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
// TEAMCATS grouped by .grp, in first-seen order — {label, cats: [indices
// into TEAMCATS]}. Used wherever a group header needs to span its member
// categories (Schnelleingabe's Teampunkte table).
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

var ME = null; // {code, token, judge_id, name, is_chair}
var mine = {}; // "target|criterion" -> points   (my own, authoritative locally)
var peers = {}; // judge_id -> {name,is_chair,hidden,filled,online}
var remote = {}; // judge_id -> {"target|criterion": points}
var queue = {}; // "target|criterion" -> {target,criterion,points,seq}
var seq = 0;
// Blatt's free-text notes — local-only, never synced (no server field for
// them, no queue entry, no websocket message). Keyed by "s{s}|{groupKey}"
// where groupKey is "spr"/"auf"/"kon"/"sacurt" (Sachverstand+Urteilskraft
// share one note, so it isn't keyed by CRITERIA[i].key directly).
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
  // Collapsing by key means an hour offline costs one entry per cell, not one per tap.
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
  var batch = keys.slice(0, 200).map(function (k) {
    return queue[k];
  });
  pending = keys.length;
  paintBar();
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
      if (view === "chair" || isDesktopChair()) render();
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
  alert(
    "Du wurdest aus der Wertung genommen. Du kannst weiter " +
      "bewerten, deine Punkte zählen aber vorerst nicht mit.",
  );
}
function handleRestored() {
  if (!ME) return;
  alert("Du wurdest wieder in die Wertung aufgenommen.");
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
  LS.del("opd.lastroom");
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
  resetRoomState();
  // Pushed (not replaced): a stray tap on "Verlassen" is recoverable with
  // the browser's back button, since opd.session.<code> is kept around.
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
  s.textContent = online
    ? pending
      ? pending + " ausstehend"
      : "Synchronisiert"
    : pending
      ? "offline · " + pending + " gespeichert"
      : "offline";
  document.getElementById("whoami").textContent = ME
    ? ME.name + (ME.is_chair ? " · Chair" : "") + " · " + ME.code
    : "";
}

// Scoring state for local judge
var NS = SPEAKERS.length,
  NC = CRITERIA.length,
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
// This judge's own team points plus their own speaker totals for that
// team — Übersicht's "Gesamt" column and Schnelleingabe's Teampunkte row
// both show this, so it lives here once instead of twice.
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
      if (cs < NS - 1) {
        cs++;
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
  //document.getElementById("spkSub").textContent =
  //  "Rede "+(cs+1)+" von "+NS+(z!==null ? "  ·  Zwischensumme "+z : "");
  document.getElementById("prev").disabled = cs === 0;
  document.getElementById("next").disabled = cs === NS - 1;

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
  SPEAKERS.forEach(function (sp, s) {
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
function activeJudges() {
  return Object.keys(peers).filter(function (id) {
    return !peers[id].hidden;
  });
}
// Shared chair math: every spread/average computation used by both the
// mobile chair view and the desktop dashboard lives here, so the two never
// disagree.
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
  SPEAKERS.forEach(function (_, s) {
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
  SPEAKERS.forEach(function (sp, s) {
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
  var bestSpeakerAvg = speakerRows.reduce(function (m, r) {
    return r.avg !== null && r.avg > m ? r.avg : m;
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

// Speaker/team result tables — shared markup for the mobile "Endergebnis"
// card and the desktop dashboard's final-result panel.
function finalResultHTML(summary) {
  var fh = [
    '<table class="finalTbl"><tr><th class="l">Redner:in</th><th>Ø Punkte</th><th>n</th></tr>',
  ];
  summary.speakerRows.forEach(function (r) {
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

// Full ballot: one column per adjudicator (chair first), one row per
// speaker in speaking order plus a team-total row per team — the mobile
// "Ballot anzeigen" table and the desktop dashboard's ballot panel share
// this exact build.
function ballotSepRow(ncols) {
  var tr = el("tr", "tsep");
  var td = el("td");
  td.setAttribute("colspan", String(ncols));
  tr.appendChild(td);
  return tr;
}

function fullBallotTable(summary) {
  var chairFirst = summary.ids.slice().sort(function (a, b) {
    return (peers[b].is_chair ? 1 : 0) - (peers[a].is_chair ? 1 : 0);
  });
  var ncols = chairFirst.length + 2;
  var table = el("table", "ballottable");
  var head = el("tr");
  head.appendChild(el("th", "l", "Redner:in"));
  chairFirst.forEach(function (id) {
    head.appendChild(el("th", null, peers[id].name));
  });
  head.appendChild(el("th", null, "Ø"));
  table.appendChild(head);

  // Collected as {vals: [per-judge value or null, ...], avg, tds: [per-judge
  // td, ...], avgTd} so the highest speech (per judge, and on average) and
  // the winning team (per judge, and on average) can be marked "best" once
  // every row has actually been built and compared.
  var speakerMeta = [];
  SPEAKERS.forEach(function (sp, s) {
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
    var avg = scored.length
      ? Math.round(
          (scored.reduce(function (a, b) {
            return a + b;
          }, 0) /
            scored.length) *
            100,
        ) / 100
      : null;
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
    var avg = vals.length
      ? Math.round(
          (vals.reduce(function (a, b) {
            return a + b;
          }, 0) /
            vals.length) *
            100,
        ) / 100
      : null;
    tr.appendChild(el("td", "tot", avg === null ? "·" : String(avg)));
    table.appendChild(tr);
  });

  table.appendChild(ballotSepRow(ncols));

  // Total result: each team's grand total per judge — their own team
  // points plus the totals of their own speakers, same figure as the
  // "Gesamt" column of the mobile Endergebnis card, but per judge here.
  // The higher of the two teams (per judge, and on average) is the
  // winning team on that ballot, so it gets the same "best" mark.
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
    var avg = scored.length
      ? Math.round(
          (scored.reduce(function (a, b) {
            return a + b;
          }, 0) /
            scored.length) *
            100,
        ) / 100
      : null;
    var avgTd = el("td", "tot", avg === null ? "·" : String(avg));
    tr.appendChild(avgTd);
    table.appendChild(tr);
    teamMeta.push({ vals: vals, avg: avg, tds: tds, avgTd: avgTd, tr: tr });
  });
  markColumnBest(teamMeta, chairFirst.length);

  return table;
}

// Marks, per judge column and in the Ø column, whichever row in `rows`
// (speaker totals, or team grand totals) scored strictly highest — a tie
// gets no mark, since there is no single winner to call out.
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
          var goingHidden = !j.hidden;
          if (!confirm(hiddenToggleMessage(j.name, goingHidden))) return;
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

  // Speaker criteria already have their own drill-down under each
  // speech above (totspread); this list is just the team side — one
  // row per team per point-category group (Strategie, Interaktion,
  // Überzeugungskraft). Tapping one reveals the spread of its
  // individual categories, same pattern as a speech revealing its
  // per-criterion breakdown.
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

// Desktop layout — a wide-screen chrome (top nav + room/judges bar) shown
// to any judge, chair or wing, above the isDesktopWidth() threshold. Only
// the "Dashboard" view (chair spread/ballot overview, computeChairSummary())
// is chair-only; Reden/Team/Schnelleingabe are every desktop judge's own
// entry pages, same as on mobile. Übersicht has no desktop nav entry —
// Schnelleingabe is a superset of what it shows (same totals, editable) —
// but "matrix"/renderMatrix() itself stays, since mobile still uses it. The
// connection dot/state and the ⋮ menu (link copy, theme, Impressum, leave
// room) are the existing mobile `.bar` — it's left visible (and extended
// with room/judges/nav) instead of duplicated. dashboardView tracks which
// of these pages shows; "sheet"/"team" reuse the existing mobile pages
// re-centered instead of rebuilt; "dashboard", "schnell" and "blatt" are
// wide, desktop-only views with no mobile equivalent.
var dashboardSelected = { kind: "speaker", s: 0 };
var dashboardView = "dashboard";
var DASH_WIDE_VIEWS = ["dashboard", "schnell", "blatt", "teampoints"];

function isDesktopWidth() {
  return !!(ME && window.matchMedia("(min-width: 1024px)").matches);
}
function isDesktopChair() {
  return isDesktopWidth() && ME.is_chair;
}
// The view the desktop chrome should actually show right now — falls back
// to "schnell" if a wing's dashboardView is somehow left on the chair-only
// "dashboard" (e.g. after losing chair status) or on "matrix"/"sheet"/"team"
// (no longer reachable from the desktop nav, replaced by Schnelleingabe and
// the Notizen views), so none of those can end up showing on desktop just
// because the state var was left there from before.
function effectiveDashboardView() {
  if (dashboardView === "dashboard" && !ME.is_chair) return "schnell";
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
    showView(view);
  }
  return changed;
}

function renderDashChrome() {
  [].forEach.call(
    document.querySelectorAll('#dashNav button[data-dv="dashboard"]'),
    function (b) {
      b.classList.toggle("hide", !ME.is_chair);
    },
  );

  var jury = document.getElementById("dashJury");
  jury.innerHTML = "";
  jury.appendChild(el("span", "dashroom", "Raum " + ME.code));
  var chips = el("div", "dashjurychips");
  jury.appendChild(chips);
  if (!ME.is_chair) return;
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
      x.addEventListener("click", function (e) {
        e.stopPropagation();
        var goingHidden = !j.hidden;
        if (!confirm(hiddenToggleMessage(j.name, goingHidden))) return;
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
      });
      chip.appendChild(x);
    }
    chips.appendChild(chip);
  });

  var ev = effectiveDashboardView();
  [].forEach.call(
    document.querySelectorAll("#dashNav button[data-dv]"),
    function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.dv === ev));
    },
  );
}
document.getElementById("dashNav").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-dv]");
  if (!b) return;
  if (b.dataset.dv === "dashboard" && !ME.is_chair) return;
  dashboardView = b.dataset.dv;
  render();
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
  var rows = SPEAKERS.filter(function (sp) {
    return sp.team === teamVal;
  });
  if (!rows.length) return wrap;
  wrap.appendChild(el("div", "dashgrp", label));
  SPEAKERS.forEach(function (sp, s) {
    if (sp.team !== teamVal) return;
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

// A cell's key is "s{s}/{critKey}" or "t{t}/{catKey}" — resolve it back to
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
  var chairFirst = summary.ids.slice().sort(function (a, b) {
    return (peers[b].is_chair ? 1 : 0) - (peers[a].is_chair ? 1 : 0);
  });
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
    var avg = vals.length
      ? Math.round(
          (vals.reduce(function (a, b) {
            return a + b;
          }, 0) /
            vals.length) *
            100,
        ) / 100
      : null;
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
  var totAvg = totVals.length
    ? Math.round(
        (totVals.reduce(function (a, b) {
          return a + b;
        }, 0) /
          totVals.length) *
          100,
      ) / 100
    : null;
  totTr.appendChild(el("td", "tot", totAvg === null ? "·" : String(totAvg)));
  var totCell = summary.totals.filter(function (x) {
    return x.key === "s" + s;
  })[0];
  totTr.appendChild(dashSpreadCell(totCell ? totCell.spread : null));
  table.appendChild(totTr);
  return table;
}

function dashTeamBallotTable(summary, t, grp) {
  var chairFirst = summary.ids.slice().sort(function (a, b) {
    return (peers[b].is_chair ? 1 : 0) - (peers[a].is_chair ? 1 : 0);
  });
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
    var avg = vals.length
      ? Math.round(
          (vals.reduce(function (a, b) {
            return a + b;
          }, 0) /
            vals.length) *
            100,
        ) / 100
      : null;
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
  var totAvg = totVals.length
    ? Math.round(
        (totVals.reduce(function (a, b) {
          return a + b;
        }, 0) /
          totVals.length) *
          100,
      ) / 100
    : null;
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
  var head = el("div", "dashpanelhead");
  head.appendChild(el("h2", null, "Ballot"));
  panel.appendChild(head);
  var body = el("div", "dashpanelbody dashpanelbody-table");
  var scrollHost = el("div");
  scrollHost.style.overflowX = "auto";
  scrollHost.appendChild(fullBallotTable(summary));
  body.appendChild(scrollHost);
  panel.appendChild(body);
  return panel;
}

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
    dashboardSelected.kind === "speaker" && SPEAKERS[dashboardSelected.s];
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
  body.appendChild(dashColB(summary));
  root.appendChild(body);
}

// Schnelleingabe — an editable grid over the judge's own scores (`mine`,
// via the same write()/sget()/tget() primitives as the mobile Reden/Team
// pages), for entering everything fast with a keyboard instead of tapping
// through one criterion at a time. Any desktop judge gets this, not just
// the chair — it's personal score entry, same as mobile Reden/Team.
// Enter moves to the next cell just like Tab, instead of just committing
// the current one and leaving focus behind.
function schnellFocusNext(inp) {
  var root = document.getElementById("v-schnell");
  if (!root) return;
  var inputs = [].slice.call(root.querySelectorAll("input.schnellinput"));
  var next = inputs[inputs.indexOf(inp) + 1];
  if (next) next.focus();
}

function schnellNumberInput(width) {
  var inp = el("input", "schnellinput");
  inp.type = "number";
  inp.inputMode = "numeric";
  inp.min = "0";
  inp.step = "1";
  inp.style.width = width || "95px";
  // Click or tab in and the whole value is selected, so typing a digit
  // overwrites it instead of inserting next to what's already there —
  // matches Blatt/Teampunkte's number fields.
  inp.addEventListener("focus", function () {
    inp.select();
  });
  // type="number" still lets a user type e/+/-/. (they're valid in a
  // float, just not a score) — strip anything but digits as they type,
  // rather than only catching it once the field loses focus.
  inp.addEventListener("input", function () {
    var digits = inp.value.replace(/[^0-9]/g, "");
    if (digits !== inp.value) inp.value = digits;
  });
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inp.blur(); // commits the value (fires "change") before moving on
      schnellFocusNext(inp);
    }
  });
  return inp;
}

// Speaker criteria (Spr/Auf/Kon/Sac/Urt) sit on the raw 0-20 Notenskala —
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
// valid — the mobile keypad only ever writes a band's midpoint (pickTeam(),
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
    n = Math.max(0, Math.min(cat.max, n));
    var grade = katOf(n, cat.max);
    var snapped = grade === null ? n : mid(convert(grade, cat.max));
    inp.value = String(snapped);
    v = snapped;
    write("t" + t, cat.key, snapped);
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

// Grouped by speaking order (Eröffnungsreden, Ergänzungsreden,
// Fraktionsfreie Reden, Schlussreden) rather than by team — matches how the
// round is actually run, and `SPEAKERS` is already declared in that exact
// order, so a single pass finding where the phase changes is enough.
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

  var i = 0;
  while (i < SPEAKERS.length) {
    var phase = schnellSpeakerPhase(SPEAKERS[i].label);
    var speakers = [];
    while (
      i < SPEAKERS.length &&
      schnellSpeakerPhase(SPEAKERS[i].label) === phase
    ) {
      speakers.push(i);
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
// input/textarea having focus — a button (e.g. Blatt's prev/next) should
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
  // Each input already patches its own row's totals directly
  // (updateSchnellSpeakerRow/updateSchnellTeamRow), so skipping the
  // rebuild costs nothing but a moment's staleness elsewhere on the page,
  // which the next render() (e.g. on blur) clears up anyway.
  if (dashEditGuard(root)) return;
  root.innerHTML = "";
  var wrap = el("div", "dashcol");
  wrap.appendChild(schnellPanel("Reden", schnellSpeakerTable()));
  wrap.appendChild(schnellPanel("Teampunkte", schnellTeamTable()));
  root.appendChild(wrap);
}

// Adjudikationsblatt — one speech at a time, four columns (Sprachkraft /
// Auftreten / Kontaktfähigkeit / Sachverstand+Urteilskraft merged), each
// with a score and free-text notes. Scores go through write()/mine like
// everywhere else; notes are local-only (notes/getNote/setNote above).
// Shares `cs` with the mobile Reden page, so switching views mid-speech
// keeps the same speaker in focus.
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

function blattScoreField(s, c, tabIdx) {
  var wrap = el("div", "blattscore");
  wrap.appendChild(el("div", "blattlbl", CRITERIA[c].label));

  var inp = el("input", "schnellinput blattinput");
  inp.type = "number";
  inp.inputMode = "numeric";
  inp.min = "0";
  inp.max = "20";
  inp.step = "1";
  inp.id = "blatt-val-" + s + "-" + c;
  inp.tabIndex = tabIdx;
  var v = sget(s, c);
  if (v !== null) inp.value = String(v);
  // Click or tab in and the whole value is selected, so typing a digit
  // overwrites it instead of inserting next to what's already there.
  inp.addEventListener("focus", function () {
    inp.select();
  });
  inp.addEventListener("input", function () {
    var digits = inp.value.replace(/[^0-9]/g, "");
    if (digits !== inp.value) inp.value = digits;
  });
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
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inp.blur();
      schnellFocusNext(inp);
    }
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

function blattNotesField(s, group) {
  // tabIndex is assigned afterwards in renderBlatt(), once every score
  // field's index is known — notes as a group come after all scores.
  var ta = el("textarea", "blattnotes");
  ta.placeholder = "Notizen zu " + group.label + " …";
  ta.value = getNote(s, group.key);
  ta.addEventListener("input", function () {
    setNote(s, group.key, ta.value);
  });
  return ta;
}

function blattColumn(s, group, scoreTabStart) {
  var col = el("div", "blattcol");
  if (group.critIdx.length > 1) col.classList.add("blattcol-wide");
  var scores = el("div", "blattscores");
  group.critIdx.forEach(function (c, i) {
    scores.appendChild(blattScoreField(s, c, scoreTabStart + i));
  });
  col.appendChild(scores);
  col.appendChild(blattNotesField(s, group));
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
  prev.disabled = cs === 0;
  prev.addEventListener("click", function () {
    if (cs > 0) {
      cs--;
      render();
    }
  });
  head.appendChild(prev);

  var mid = el("div", "blattheadmid");
  mid.appendChild(el("h1", "blatttitle", sp.label));
  mid.appendChild(el("div", "sub", "Rede " + (cs + 1) + " von " + NS));
  head.appendChild(mid);

  var next = el("button", "navbtn", "›");
  next.disabled = cs === NS - 1;
  next.addEventListener("click", function () {
    if (cs < NS - 1) {
      cs++;
      render();
    }
  });
  head.appendChild(next);

  var totWrap = el("div", "blatttotwrap");
  totWrap.appendChild(el("div", "blatttotlbl", "Gesamtpunkte"));
  var totVal = el("div", "blatttotval", String(personPunkte(cs)));
  totVal.id = "blattTot";
  totWrap.appendChild(totVal);
  head.appendChild(totWrap);
  root.appendChild(head);

  var body = el("div", "blattbody");
  var tab = 1;
  BLATT_GROUPS.forEach(function (group) {
    var scoreTabStart = tab;
    tab += group.critIdx.length;
    body.appendChild(blattColumn(cs, group, scoreTabStart));
  });
  root.appendChild(body);
  // Notes come after every score field in tab order — reassign now that
  // the total number of score fields (`tab - 1`) is known.
  [].slice.call(body.querySelectorAll(".blattnotes")).forEach(function (ta, i) {
    ta.tabIndex = tab + i;
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
        setDeduction(cs, o.l); // calls render() itself
      });
      dedu.appendChild(b);
    });
    root.appendChild(dedu);
  }
}

// Teampunkte-Blatt — team-first sibling to Blatt: both teams' 7 category
// scores plus per-group notes, all on one screen (no paging, unlike Blatt,
// since a judge switching here mid-debate wants to see both teams at once).
function teamPointsFocusNext(inp) {
  var root = document.getElementById("v-teampoints");
  if (!root) return;
  var inputs = [].slice.call(root.querySelectorAll("input.schnellinput"));
  var next = inputs[inputs.indexOf(inp) + 1];
  if (next) next.focus();
}

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

  var inp = el("input", "schnellinput blattinput");
  inp.type = "number";
  inp.inputMode = "numeric";
  inp.min = "0";
  inp.max = String(cat.max);
  inp.step = "1";
  inp.id = "teampoints-val-t" + t + "-c" + catIdx;
  inp.tabIndex = tabIdx;
  var v = tget(t, catIdx);
  if (v !== null) inp.value = String(v);
  inp.addEventListener("focus", function () {
    inp.select();
  });
  inp.addEventListener("input", function () {
    var digits = inp.value.replace(/[^0-9]/g, "");
    if (digits !== inp.value) inp.value = digits;
  });
  inp.addEventListener("change", function () {
    var raw = inp.value.trim();
    if (raw === "") return;
    var n = Math.round(Number(raw));
    if (!isFinite(n)) {
      updateTeamPointsScore(t, catIdx);
      return;
    }
    n = Math.max(0, Math.min(cat.max, n));
    var grade = katOf(n, cat.max);
    var snapped = grade === null ? n : mid(convert(grade, cat.max));
    write("t" + t, cat.key, snapped);
    updateTeamPointsScore(t, catIdx);
  });
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inp.blur();
      teamPointsFocusNext(inp);
    }
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

function teamPointsNotesField(t, cat) {
  var ta = el("textarea", "blattnotes");
  ta.placeholder = "Notizen zu " + cat.label + " …";
  ta.value = getTeamNote(t, cat.key);
  ta.addEventListener("input", function () {
    setTeamNote(t, cat.key, ta.value);
  });
  return ta;
}

function teamPointsCategoryBlock(t, catIdx, tabIdx) {
  var cat = TEAMCATS[catIdx];
  var block = el("div", "teampointscatblock");
  var scoreWrap = el("div", "teampointscatscore");
  scoreWrap.appendChild(teamPointsScoreField(t, catIdx, tabIdx));
  block.appendChild(scoreWrap);
  block.appendChild(teamPointsNotesField(t, cat));
  return block;
}

function teamPointsColumn(t, group, scoreTabStart) {
  var col = el("div", "blattcol teampointscol-" + group.cats.length);
  var row = el("div", "teampointscatrow");
  group.cats.forEach(function (catIdx, i) {
    row.appendChild(teamPointsCategoryBlock(t, catIdx, scoreTabStart + i));
  });
  col.appendChild(row);
  return col;
}

function teamPointsSection(t, tabStart) {
  var teamCls = t === 0 ? "team-gov" : "team-opp";
  var sec = el("div", "teampointssec " + teamCls);

  var head = el("div", "teampointssechead");
  head.appendChild(el("div", "teampointssecname", TEAMS[t]));
  var totWrap = el("div", "teampointstotwrap");
  totWrap.appendChild(el("span", "teampointstotlbl", "Teampunkte"));
  var totVal = el("span", "teampointstotval", String(teamPunkte(t)));
  totVal.id = "teampointsTot-t" + t;
  totWrap.appendChild(totVal);
  head.appendChild(totWrap);
  sec.appendChild(head);

  var body = el("div", "blattbody teampointsbody");
  var tab = tabStart;
  TEAMGROUPS_INFO.forEach(function (group) {
    var scoreTabStart = tab;
    tab += group.cats.length;
    body.appendChild(teamPointsColumn(t, group, scoreTabStart));
  });
  sec.appendChild(body);

  return { el: sec, nextTab: tab, body: body };
}

function renderTeamPoints() {
  var root = document.getElementById("v-teampoints");
  if (!root) return;
  if (dashEditGuard(root)) return;
  root.innerHTML = "";

  var wrap = el("div", "teampointswrap");
  var tab = 1;
  var sections = [];
  for (var t = 0; t < 2; t++) {
    var sec = teamPointsSection(t, tab);
    tab = sec.nextTab;
    sections.push(sec);
    wrap.appendChild(sec.el);
  }
  // Notes come after every score field in tab order, within each section.
  sections.forEach(function (sec) {
    var notesEls = [].slice.call(sec.body.querySelectorAll(".blattnotes"));
    notesEls.forEach(function (ta, i) {
      ta.tabIndex = tab + i;
    });
    tab += notesEls.length;
  });
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
function showLobby() {
  var code = urlCode();
  document.getElementById("v-lobby").classList.remove("hide");
  document.getElementById("main").classList.add("hide");
  document.getElementById("dock").classList.add("hide");
  if (code) {
    document.getElementById("lobbyCode").textContent = code;
    document.getElementById("lobbyJoin").classList.remove("hide");
    document.getElementById("lobbyCreate").classList.add("hide");
    document.getElementById("btnJoin").classList.remove("hide");
  }
  var last = LS.get("opd.lastname", "");
  if (last) document.getElementById("nm").value = last;
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
  LS.set("opd.lastroom", s.code);
  LS.set("opd.lastname", s.name);
  loadLocal();
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
function lobbyErr(msg) {
  document.getElementById("lobbyErr").textContent = msg || "";
}

document.getElementById("btnCreate").addEventListener("click", function () {
  var name = document.getElementById("nm").value.trim();
  if (!name) {
    lobbyErr("Bitte gib deinen Namen ein.");
    return;
  }
  lobbyErr("");
  fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, client_id: CLIENT_ID }),
  })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(startSession)
    .catch(function () {
      lobbyErr("Raum konnte nicht erstellt werden. Verbindung prüfen.");
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
function copyRoomLink(btn, url) {
  var label = btn.textContent;
  var done = function () {
    btn.textContent = "Kopiert";
    setTimeout(function () {
      btn.textContent = label;
    }, 1500);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(done, function () {});
    return;
  }
  var tmp = document.createElement("input");
  tmp.value = url;
  tmp.style.position = "fixed";
  tmp.style.opacity = "0";
  document.body.appendChild(tmp);
  tmp.select();
  tmp.setSelectionRange(0, 99999);
  try {
    document.execCommand("copy");
    done();
  } catch (e) {}
  document.body.removeChild(tmp);
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
  if (cs > 0) {
    cs--;
    cc = Math.max(0, firstEmptyS(cs));
    render();
  }
});
document.getElementById("next").addEventListener("click", function () {
  if (cs < NS - 1) {
    cs++;
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
  applyTheme(LS.get("opd.theme", "light"));
  var code = urlCode() || LS.get("opd.lastroom", null);
  var sess = code ? LS.get("opd.session." + code, null) : null;
  if (sess && sess.token && (!urlCode() || urlCode() === sess.code)) {
    startSession(sess);
    resync();
  } else {
    showLobby();
  }
})();
