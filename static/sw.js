var CACHE = "mittelmass-v1";
var SHELL = [
  "/static/index.html",
  "/static/app.js",
  "/static/style.css",
  "/static/manifest.json",
  "/static/favicon.png",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL);
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
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
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return (
        cached ||
        fetch(e.request).then(function (res) {
          if (res.ok && res.url.indexOf("/static/") !== -1) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) {
              c.put(e.request, copy);
            });
          }
          return res;
        })
      );
    })
  );
});
