var CACHE = "mittelmass-v2";
var SHELL = [
  "/static/index.html",
  "/static/app.js",
  "/static/style.css",
  "/static/manifest.json",
  "/static/favicon.png",
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL);
    })
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
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

// Stale-while-revalidate: serve the cached shell immediately (no network
// wait, important on the flaky venue Wi-Fi this app is built to tolerate),
// then refetch in the background so the *next* load picks up a new deploy.
// Only /static/* is cached, so sync/API calls are untouched.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  if (e.request.url.indexOf("/static/") === -1) return;
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request).then(function (cached) {
        var fetched = fetch(e.request)
          .then(function (res) {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          })
          .catch(function () {
            return cached;
          });
        return cached || fetched;
      });
    })
  );
});
