/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: service worker of web push notifications about new work items (apps/web/liviere/push).
// Registered with the scope /liviere/push/: it controls no page, it only receives pushes and clicks, so it
// cannot clash with a service worker of the app at "/". Payload: { title, body, tag, url }.
// A notification with the same tag (one per project) replaces the previous one; `renotify` is not set, so by the
// Notifications API the replacement does not alert again while the previous one is still shown.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const windowClients = () => self.clients.matchAll({ type: "window", includeUncontrolled: true });

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const show = self.registration.showNotification(data.title || "Plane", {
    body: data.body || "",
    tag: data.tag || undefined,
    icon: "/favicon/android-chrome-192x192.png",
    data: { url: data.url || "/" },
  });
  // Open tabs reload the "New" counter
  const tell = windowClients().then((clients) => {
    for (const client of clients) client.postMessage({ type: "liviere:new-work-items" });
  });
  event.waitUntil(Promise.all([show, tell]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin);
  event.waitUntil(
    windowClients().then((clients) => {
      // A tab already showing the target is focused; otherwise a new one opens (opening the work item there
      // marks it as read). Pages outside the scope cannot be navigated by this worker.
      const open = clients.find((client) => client.url === url.href);
      return open ? open.focus() : self.clients.openWindow(url.href);
    })
  );
});
