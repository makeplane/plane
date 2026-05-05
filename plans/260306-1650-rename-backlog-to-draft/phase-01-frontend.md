# Phase 01 — Frontend Constants & Types

**Parent:** [plan.md](plan.md)
**Date:** 2026-03-06 | **Status:** pending

## Overview

Rename all user-visible "Backlog" labels in frontend packages and components. Internal key `"backlog"` stays.

## Key Insights

- `STATE_GROUPS.backlog.label` and `defaultStateName` drive all group labels in UI
- `PROGRESS_STATE_GROUPS_DETAILS` has a hardcoded `title: "Backlog"` entry
- Module status icon file `backlog.tsx` exports `ModuleBacklogIcon` — filename/export stays, no rename needed (internal)
- `backlog_work_items` i18n key value contains "Backlog" text — handled in Phase 02

## Related Files

| File                                                     | Change                                                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/constants/src/state.ts`                        | `label: "Backlog"` → `"Draft"`, `defaultStateName: "Backlog"` → `"Draft"`, title `"Backlog"` in `PROGRESS_STATE_GROUPS_DETAILS` → `"Draft"` |
| `packages/utils/src/work-item/modal.ts`                  | Check for hardcoded "Backlog" label                                                                                                         |
| `apps/web/core/components/project-states/group-list.tsx` | Check for hardcoded "Backlog" text                                                                                                          |
| `apps/web/helpers/dashboard.helper.ts`                   | Check for hardcoded "Backlog"                                                                                                               |

## Implementation Steps

<!-- Updated: Validation Session 1 - Add broader grep before editing -->

0. **Full-repo grep** — before editing anything, run:

   ```bash
   grep -r '"Backlog"' packages/ apps/ --include='*.ts' --include='*.tsx' -l
   grep -r "'Backlog'" packages/ apps/ --include='*.ts' --include='*.tsx' -l
   <!-- Updated: Validation Session 2 - Expand grep to all apps/ not just apps/web/ -->
   ```

   Review all hits and confirm each is a display label (not an internal key). Update any additional files found.

1. **`packages/constants/src/state.ts`** — 3 changes:

   ```diff
   -  label: "Backlog",
   +  label: "Draft",
   -  defaultStateName: "Backlog",
   +  defaultStateName: "Draft",
   ```

   and in `PROGRESS_STATE_GROUPS_DETAILS`:

   ```diff
   -  title: "Backlog",
   +  title: "Draft",
   ```

2. **Verify other frontend files** — grep for hardcoded `"Backlog"` strings (not i18n keys) and update display labels only.

## Success Criteria

- All group label displays show "Draft" for the backlog group
- No compile errors, no changes to logic/keys
