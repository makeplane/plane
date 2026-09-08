---
type: preference
topic: design
status: active
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-09-05
---

# Design

UI/UX preferences (visual style, component conventions, layout, theming
sequence). Brand identity (typography, logo usage, voice & tone) remains
undefined — fill in once the User actually states or confirms something
there.

## Rules

- [Selection highlight uses the app's own palette](selection-highlight-uses-palette.md) — `applies_when: [frontend-surface]`
- [One consistent icon system per app](consistent-icon-system.md) — `applies_when: [frontend-surface]`
- [Default table/list conventions for dashboard-style apps](modern-saas-table-conventions.md) — `applies_when: [frontend-surface]`
- [Top navigation layout convention](top-nav-layout-convention.md) — `applies_when: [frontend-surface]`
- [Build light mode first, dark theme later](theme-build-sequence.md) — `applies_when: [frontend-surface]`, `status: trial`
- [Shared stylesheet is the source of truth](shared-stylesheet-is-source-of-truth.md) — `applies_when: [frontend-surface]`
- [Live app is authoritative over mockups/wireframes](live-app-authoritative-over-mockups.md) — `applies_when: [frontend-surface]`
- [Verify rendered output after automated CSS/theming rewrites](verify-rendered-output-after-css-rewrites.md) — `applies_when: [frontend-surface]`

## Naming

Naming rules general enough to apply beyond design work (universal-meaning names, subject-first word order) live in [Code Style & Minimalism](../code-style-minimalism/_index.md) — [Name for what a thing universally represents](../code-style-minimalism/naming-for-reusability.md) and [Subject first, modifier last](../code-style-minimalism/naming-word-order.md) apply to CSS classes/design tokens just as much as to code identifiers.

## Still undefined

Typography, logo usage, voice & tone — no preferences stated yet.
