---
type: preference
topic: design
status: active
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-08-11
---

# Shared stylesheet is the source of truth

Every shared CSS component/token lives in exactly one stylesheet (or a small file tree — a shared base plus page-specific files), never hand-copied into a second location — application code included. Before adding a new class or color, check whether the shared stylesheet already has it; extend that file, don't shadow it locally with a same-purpose rule under a different name or a re-typed copy elsewhere.

This is the design-specific instance of [Single source of truth](../general-principles/single-source-of-truth.md) — called out separately here because the general principle alone didn't stop it from happening: a live app's own styling had silently drifted from its wireframes' shared.css because the app embedded a hand-typed copy instead of reading the file.
