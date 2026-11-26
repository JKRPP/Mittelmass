var CACHE = "mittelmass-v3";
var SHELL = [
  "/static/index.html",
  "/static/app.js",
  "/static/vendor/qrcode.js",
  "/static/style.css",
  "/static/manifest.json",
  "/static/favicon.png",
  "/static/fonts/source-serif-4-latin.woff2",
  "/static/fonts/source-serif-4-latin-ext.woff2",
];

// How long to wait for the network before falling back to the cached copy
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

// Network-first so a deploy shows up on the next load and index.html never pairs with a stale app.js;
// falls back to the cache when offline or slower than NET_TIMEOUT_MS
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
    // Resolves only if a cached copy exists, otherwise the network decides
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
// Only /static/* is handled so API calls bypass the cache; fonts never change, so they are cache-first
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
