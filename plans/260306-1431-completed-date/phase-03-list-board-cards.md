# Phase 03 — List View & Board Cards

**Plan:** [plan.md](./plan.md)

## Overview

| Field       | Value                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| Date        | 2026-03-06                                                                   |
| Description | Add read-only `completed_at` property to list view and board card properties |
| Priority    | P2                                                                           |
| Status      | ⏳ pending                                                                   |

## Key Insights

- Same display condition as Phase 01/02: `issue.completed_at && issue.state?.group === 'completed'`
- List view: typically rendered via property columns or inline property tags
- Board cards: rendered via card property slots
- Must use CE override pattern — do NOT modify `core/` components directly
- Reuse same icon (`DueDatePropertyIcon`), formatter, and i18n key (`common.completed_at`)

## Related Files

- `apps/web/ce/components/issues/` — explore for list/board card CE overrides
- `apps/web/core/components/issues/` — reference only (do not modify)

## Implementation Steps

1. **Explore CE overrides** — check `apps/web/ce/components/issues/` for existing list view and board card CE components
2. **Find injection point** for list view property columns/tags
3. **Find injection point** for board card property slots
4. **Add completed_at property** using dual condition (same as Phase 01):
   ```tsx
   {
     issue.completed_at && issue.state?.group === "completed" && (
       <span>
         {renderFormattedDate(issue.completed_at)} {renderFormattedTime(issue.completed_at, "12-hour")}
       </span>
     );
   }
   ```
5. **Add imports** if not already present

## Todo

- [ ] Explore CE override files for list view and board cards
- [ ] Add completed_at to list view (CE override)
- [ ] Add completed_at to board cards (CE override)
- [ ] Verify display is consistent with sidebars

## Success Criteria

- `completed_at` visible in list view and board cards when state group = "completed"
- Hidden when state is non-completed

## Risk

- Medium — list/board card structure may vary; investigate CE injection points first
