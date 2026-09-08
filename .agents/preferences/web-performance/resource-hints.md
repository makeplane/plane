---
type: preference
topic: web-performance
status: active
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-07-10
---

# Resource hints

- **preconnect** — default habit: preconnect to known critical domains the
  page will definitely hit (font host, CDN, API host).
- **preload** — deliberate, not default: use only for a resource proven
  necessary for initial render that the browser wouldn't otherwise discover
  early (e.g. an `@import`-chained CSS file, a critical background-image).
  Always pair with the correct `as` (and `crossorigin` for fonts) to avoid
  double-fetching. A "not used within 3s" console warning is a signal it was
  applied wrong.
- **prefetch** — most speculative: only for a high-confidence next-navigation
  guess (e.g. the app bundle behind a login/demo button), not a blanket
  "prefetch everything that might come next" — it competes with current-page
  loading.

Source: [Browser Resource Hints: preload, prefetch, and preconnect](../../../raw/preferences/Browser%20Resource%20Hints%20preload%2C%20prefetch%2C%20and%20preconnect.md)
