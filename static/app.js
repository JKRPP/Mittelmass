// The dock (score pad + tabs) is position:fixed to the bottom of the
// viewport rather than sized into a fixed-height flex shell, because mobile
// browsers (Firefox Android in particular) resize their address bar in and
// out of the layout in ways that fixed-height shells (100dvh etc.) don't
// track reliably. Fixed-position elements are anchored to the true visual
// viewport by the browser itself, so this just works. The scrolling content
// behind it needs bottom padding reserved to match, since the dock's height
// itself varies (grade pad open/closed, view switching).
function syncDockSpace() {
  var dock = document.getElementById("dock");
  var vp = document.getElementById("viewport");
  if (!dock || !vp) return;
  vp.style.paddingBottom = dock.classList.contains("hide")
    ? ""
    : dock.offsetHeight + 14 + "px";
}
window.addEventListener("resize", syncDockSpace);
window.addEventListener("orientationchange", syncDockSpace);

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
      if (view === "chair") render();
    } else if (m.type === "judges") {
      peers = {};
      m.judges.forEach(function (j) {
        peers[j.id] = j;
      });
      if (view === "chair") render();
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
      if (view === "chair") render();
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
  deductions = {};
  myExclusions = {};
  remoteExclusions = {};
  hist = [];
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
var THEME_LABEL = { light: "Light", dark: "Dark" };
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
  eb.textContent = excluded
    ? "In die Wertung eingehen"
    : "Aus der Wertung herausnehmen";
  eb.classList.toggle("on", excluded);
  document
    .querySelector("#v-sheet .card")
    .classList.toggle("excluded", excluded);

  buildPad(document.getElementById("padHost"), 20, pickSpeaker);

  var f = document.getElementById("lastEntry"),
    u = document.getElementById("undoBtn");
  var h = hist[hist.length - 1];
  if (!h) {
    f.textContent = "Noch keine Eingabe";
    f.className = "";
    u.classList.add("hide");
  } else {
    var v2 = sget(h.s, h.c),
      mm = v2 === null ? null : markOf(v2);
    f.textContent =
      v2 === null
        ? "—"
        : CRITERIA[h.c].label +
          " · " +
          v2 +
          " · " +
          mm.name +
          (mm.mark ? " (" + mm.mark + ")" : "");
    f.className = v2 !== null && v2 >= 16 ? "flag" : "";
    u.classList.remove("hide");
  }
}

function pickTeam(v) {
  var wasEmpty = tget(ct, ctc) === null;
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
  var v3 = tget(ct, ctc);
  document.getElementById("tlastEntry").textContent =
    v3 === null
      ? TEAMCATS[ctc].label + " — offen"
      : TEAMCATS[ctc].label +
        " · " +
        v3 +
        " · " +
        markOf(katOf(v3, TEAMCATS[ctc].max)).name;
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
    var teamSpeakers = SPEAKERS.filter(function (sp) {
      return sp.team === i;
    });
    var speakerSum = 0,
      scoredCount = 0;
    teamSpeakers.forEach(function (sp) {
      var s = SPEAKERS.indexOf(sp);
      if (firstEmptyS(s) !== -1) return; // not fully scored yet
      speakerSum += personPunkte(s);
      scoredCount++;
    });
    var grand = teamPunkte(i) + speakerSum;
    var partial = scoredCount < teamSpeakers.length;
    if (partial) anyPartial = true;
    h.push(
      '<tr><td class="l">' +
        t +
        '</td><td class="tot">' +
        teamPunkte(i) +
        " / 200</td>" +
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
function activeJudges() {
  return Object.keys(peers).filter(function (id) {
    return !peers[id].hidden;
  });
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
          if (
            goingHidden &&
            !confirm(j.name + " wirklich aus der Wertung nehmen?")
          )
            return;
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

  // Grouped spread across a team's three point categories (Strategie,
  // Interaktion, Überzeugungskraft). `catKeys` records which of the
  // per-category `cells` entries above belong to this group, so tapping
  // one can reveal exactly those — same pattern as a speech's total
  // revealing its per-criterion breakdown.
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
  var TEAMGROUPS = [];
  TEAMCATS.forEach(function (c) {
    if (TEAMGROUPS.indexOf(c.grp) === -1) TEAMGROUPS.push(c.grp);
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

  var fh = [
    '<table class="finalTbl"><tr><th class="l">Redner:in</th><th>Ø Punkte</th><th>n</th></tr>',
  ];
  speakerRows.forEach(function (r) {
    var isBest = r.avg !== null && r.avg === bestSpeakerAvg;
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
  // Only bold a leader once both teams actually have a total to compare.
  var teamsComparable = teamRows.every(function (r) {
    return r.grand !== null;
  });

  fh.push(
    '</table><table class="finalTbl" style="margin-top:14px"><tr><th class="l">Team</th><th>Ø Team</th><th>Gesamt</th></tr>',
  );
  teamRows.forEach(function (r) {
    var isBest = teamsComparable && r.grand !== null && r.grand === bestGrand;
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
  var anyTeamPartial = teamRows.some(function (r) {
    return r.partial;
  });
  if (anyTeamPartial)
    fh.push(
      '<p class="note">* vorläufig — noch nicht alle Reden dieses Teams bewertet.</p>',
    );
  document.getElementById("finalResult").innerHTML = fh.join("");

  // Ballot: one column per adjudicator (chair first), in speaking order.
  var btnBallot = document.getElementById("btnBallot");
  btnBallot.textContent = ballotOpen ? "Ballot ausblenden" : "Ballot anzeigen";
  var ballotWrap = document.getElementById("ballotWrap");
  ballotWrap.classList.toggle("hide", !ballotOpen);
  if (ballotOpen) {
    var chairFirst = ids.slice().sort(function (a, b) {
      return (peers[b].is_chair ? 1 : 0) - (peers[a].is_chair ? 1 : 0);
    });
    var bTable = el("table");
    var head = el("tr");
    head.appendChild(el("th", "l", "Redner:in"));
    chairFirst.forEach(function (id) {
      head.appendChild(el("th", null, peers[id].name));
    });
    head.appendChild(el("th", null, "Ø"));
    bTable.appendChild(head);
    SPEAKERS.forEach(function (sp, s) {
      var tr = el("tr");
      tr.appendChild(el("td", "l", sp.label));
      var vals = [];
      chairFirst.forEach(function (id) {
        var v = remoteTotal(id, s);
        tr.appendChild(el("td", null, v === null ? "·" : String(v)));
        if (includedFor(id, "s" + s) && v !== null) vals.push(v);
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
      bTable.appendChild(tr);
    });
    TEAMS.forEach(function (tm, t) {
      var tr = el("tr");
      var teamAbbr = tm
        .replace("Regierung", "Reg")
        .replace("Opposition", "Opp");
      tr.appendChild(el("td", "l tot", "Teampunkte " + teamAbbr));
      var vals = [];
      chairFirst.forEach(function (id) {
        var v = remoteTeamTotal(id, t);
        tr.appendChild(el("td", "tot", String(v)));
        if (includedFor(id, "t" + t)) vals.push(v);
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
      bTable.appendChild(tr);
    });
    var scrollHost = el("div");
    scrollHost.style.overflowX = "auto";
    scrollHost.appendChild(bTable);
    ballotWrap.innerHTML = "";
    ballotWrap.appendChild(scrollHost);
  }
}

function render() {
  if (!ME) return;
  if (view === "sheet") renderSheet();
  if (view === "team") renderTeam();
  if (view === "matrix") renderMatrix();
  if (view === "chair") renderChair();
  paintBar();
  syncDockSpace();
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
document.getElementById("btnCopy").addEventListener("click", function () {
  var u = document.getElementById("shareUrl");
  u.select();
  u.setSelectionRange(0, 99999);
  var done = function () {
    var b = document.getElementById("btnCopy");
    b.textContent = "Kopiert";
    setTimeout(function () {
      b.textContent = "Link kopieren";
    }, 1500);
  };
  if (navigator.clipboard)
    navigator.clipboard.writeText(u.value).then(done, function () {});
  else {
    try {
      document.execCommand("copy");
      done();
    } catch (e) {}
  }
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
  document
    .getElementById("dockTeam")
    .classList.toggle("hide", view !== "team");
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
