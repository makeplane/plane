---
title: "Dashboard Design Audit Fixes"
description: "Fix all critical/moderate issues from dashboard design audit (tokens, i18n, layout, menu, file split)"
status: complete
priority: P1
effort: 3h
branch: develop
tags: [frontend, design-audit, dashboards, i18n, tokens]
created: 2026-03-02
---

# Dashboard Design Audit Fixes

Fix all issues identified in [design audit report](../reports/design-review-260302-1619-dashboard-design-audit.md).

## Phases

| #   | Phase                                                                                  | Priority | Effort | Status   |
| --- | -------------------------------------------------------------------------------------- | -------- | ------ | -------- |
| 1   | [Fix color tokens & backgrounds](./phase-01-fix-color-tokens-and-backgrounds.md)       | P0+P1    | 15min  | complete |
| 2   | [Add i18n translations](./phase-02-add-i18n-translations.md)                           | P1       | 1h     | complete |
| 3   | [Replace custom dropdown with Propel Menu](./phase-03-replace-custom-dropdown-menu.md) | P2       | 30min  | complete |
| 4   | [Add AppHeader + ContentWrapper layout](./phase-04-add-layout-patterns.md)             | P2       | 45min  | complete |
| 5   | [Split oversized style-settings file](./phase-05-split-oversized-style-settings.md)    | P3       | 30min  | complete |

## Key Dependencies

- Phases 1-3 are independent, can run in parallel
- Phase 4 modifies layout.tsx and page files (conflicts possible with Phase 2)
- Phase 5 is independent refactor

## Key Files

- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/` - route pages + components
- `apps/web/ce/components/dashboards/` - CE override components
- `packages/i18n/src/locales/en/translations.ts` - i18n keys

## Build/Lint

```bash
pnpm check:lint     # lint check
pnpm fix:lint       # auto-fix
```
