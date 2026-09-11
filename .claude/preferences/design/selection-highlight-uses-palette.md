---
type: preference
topic: design
status: active
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-07-27
---

# Selection highlight uses the app's own palette

When a table row, list item, or similar element is shown in a "selected" or
"currently viewing" state, its highlight color must come from the app's own
defined palette (e.g. its accent color) — never an arbitrary color that
happened to appear in a reference screenshot or example, even if that color
looks fine in isolation. A reference mockup's colors are inspiration for
layout/interaction patterns, not a literal palette to copy from.

Observed 2026-07-27 (Jobernaut dashboard wireframes): a reference screenshot
used orange for its selected-row highlight; the User called this out
explicitly — the wireframe's own accent/indigo palette should be used
instead, not the orange from the example.
