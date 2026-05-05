# Phase 02 — i18n Locales (EN / KO / VI)

**Parent:** [plan.md](plan.md)
**Date:** 2026-03-06 | **Status:** pending

## Overview

Update translation values for the backlog state label in all 3 locale files. Keys are unchanged.

## Related Files

| File                                           | Lines                      | Change                                                                     |
| ---------------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| `packages/i18n/src/locales/en/translations.ts` | ~1117, ~1457, ~1535, ~2807 | values `"Backlog"` / `"Backlog {entity}"` → `"Draft"` / `"Draft {entity}"` |
| `packages/i18n/src/locales/ko/translations.ts` | ~1111, ~1476, ~1527, ~2790 | `"백로그"` / `"백로그 {entity}"` → `"Draft"` / `"Draft {entity}"`          |
| `packages/i18n/src/locales/vi/translations.ts` | ~1125, ~1493, ~1544, ~2820 | `"Tồn đọng"` / `"{entity} tồn đọng"` → `"Draft"` / `"Draft {entity}"`      |

## Implementation Steps

1. **EN** — replace 4 occurrences:
   - `backlog: "Backlog"` → `backlog: "Draft"` (3 locations in different sections)
   - `backlog_work_items: "Backlog {entity}"` → `backlog_work_items: "Draft {entity}"`

2. **KO** — replace 4 occurrences:
   - `backlog: "백로그"` → `backlog: "Draft"` (3 locations)
   - `backlog_work_items: "백로그 {entity}"` → `backlog_work_items: "Draft {entity}"`

3. **VI** — replace 4 occurrences:
   - `backlog: "Tồn đọng"` → `backlog: "Draft"` (3 locations)
   - `backlog_work_items: "{entity} tồn đọng"` → `backlog_work_items: "Draft {entity}"`

## Success Criteria

- All locales render "Draft" for the backlog state group
- Keys `backlog` and `backlog_work_items` unchanged (no i18n lookup breakage)
