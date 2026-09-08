---
type: preference
topic: code-style-minimalism
status: active
scope: context-dependent
applies_when: [frontend-client-state]
updated: 2026-07-12
---

# Frontend/Browser State

Applies only to frontend/browser projects with client-side state or
multi-tab concerns; skip entirely for backend-only or CLI work.

- **State ownership**: before adding a piece of UI state, ask who owns it,
  not just where it can be stored. URL state when the user should be able to
  refresh/share the page; component state when nothing else needs it; global
  state only when multiple flows genuinely depend on it; and if it can be
  derived from other state, it shouldn't be stored at all. Scattering
  ownership decisions (a bit in Redux, a bit in a URL param, a bit cached
  locally, all describing the same thing) is what turns state into a trap.
- **Storage is for storing, events are for communicating**: don't use
  `localStorage` as a fake cross-tab event bus (writing a throwaway key just
  to trigger a `storage` listener elsewhere). For same-origin cross-tab
  coordination (logout sync, cache invalidation, permission refresh), use
  `BroadcastChannel` — a real messaging primitive — instead. Keep messages
  small and event-shaped (`{type, resourceId}`), never a state dump, and
  never broadcast secrets/tokens — broadcast that something changed and let
  each tab re-fetch or re-check locally.

See also: [Narrow State](narrow-state.md) — the general, backend-agnostic form of this same ownership principle.
