---
type: preference
topic: design
status: active
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-08-11
---

# Live app is authoritative over mockups/wireframes

When a mockup/wireframe and the live app render the same UI, the live app's current implementation is the source of truth — not the mockup. Mockup-specific corrections (older/simpler markup, no JS available, a static "already open" demo state) belong in a small override file loaded only by the mockup, never folded back into the shared styling the live app also uses.

Concretely: a shared stylesheet holds the live app's real values; a mockup-only override file (loaded after the shared stylesheet, so it wins the cascade) patches just the handful of selectors where the mockup's own markup genuinely can't match what the live app now does.
