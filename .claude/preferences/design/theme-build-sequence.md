---
type: preference
topic: design
status: trial
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-07-27
---

# Build light mode first, dark theme later

Default to building light-mode UI first, as the standard/default theme.
Add a dark theme (with a theme switcher) later, only once the core UI is
fully built out and stable — not designed alongside the light theme from
the start.

Rationale (the User's own, stated as a working heuristic rather than a
certainty): it's easier to layer a dark theme onto a design that's already
finished in light mode than to design both simultaneously. Filed as
`status: trial` at the User's own request — they flagged this as something
they might revise: "i might be wrong, i am just human in the end."

Observed 2026-07-27 (Jobernaut dashboard wireframes): User confirmed a
preference for light UI on the current wireframes, and separately noted the
intent to add a dark theme + switcher later, after the light-mode UI is
fully built out.
