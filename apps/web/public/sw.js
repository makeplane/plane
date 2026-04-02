// @sw-version DEVELOPMENT
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
