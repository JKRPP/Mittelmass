var CACHE = "mittelmass-v2";
var SHELL = [
  "/static/index.html",
  "/static/app.js",
  "/static/style.css",
  "/static/manifest.json",
  "/static/favicon.png",
  "/static/fonts/source-serif-4-latin.woff2",
  "/static/fonts/source-serif-4-latin-ext.woff2",
];

// How long to wait for the network before falling back to the cached copy.
var NET_TIMEOUT_MS = 3000;

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(
        SHELL.map(function (u) {
          return new Request(u, { cache: "reload" });
        }),
      );
    }),
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

// Network-first for the app shell, so a deploy shows up on the next load
// (stale-while-revalidate needed two loads, and could pair an old
// index.html with a new app.js). The flaky venue Wi-Fi this app is built
// for is covered by the fallback: offline, or no answer within
// NET_TIMEOUT_MS, serves the cached copy - the network response still lands
// in the cache when it arrives. Fonts never change, so they're cache-first.
// Only /static/* is handled, so sync/API calls are untouched.
function networkFirst(req) {
  return caches.open(CACHE).then(function (c) {
    var net = fetch(req).then(function (res) {
      if (res.ok) c.put(req, res.clone());
      return res;
    });
    var offline = net.catch(function () {
      return c.match(req).then(function (hit) {
        return hit || Response.error();
      });
    });
    // Resolves only if there is a cached copy to fall back to; otherwise
    // the network (or its offline fallback) decides.
    var slow = new Promise(function (resolve) {
      setTimeout(function () {
        c.match(req).then(function (hit) {
          if (hit) resolve(hit);
        });
      }, NET_TIMEOUT_MS);
    });
    return Promise.race([offline, slow]);
  });
}
function cacheFirst(req) {
  return caches.open(CACHE).then(function (c) {
    return c.match(req).then(function (hit) {
      return (
        hit ||
        fetch(req).then(function (res) {
          if (res.ok) c.put(req, res.clone());
          return res;
        })
      );
    });
  });
}
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = e.request.url;
  if (url.indexOf("/static/") === -1) return;
  e.respondWith(
    url.indexOf("/static/fonts/") !== -1
      ? cacheFirst(e.request)
      : networkFirst(e.request),
  );
});
