# Phase 4: Frontend UI Components

## Context Links

- Plan: [plan.md](./plan.md)
- Phase 3: [phase-03-frontend-types-stores.md](./phase-03-frontend-types-stores.md)

## Overview

- **Priority**: P1
- **Status**: pending
- **Description**: Remove `estimate_time` UI from issue detail sidebar, notification card, and time tracking report

## Key Insights

- `WorkItemAdditionalSidebarProperties` component is the main UI for editing estimate_time on issue detail
- Notification card content has a formatter for `estimate_time` activity changes
- Time tracking report displays estimated time column + variance calculation
- The entire `additional-properties.tsx` file exists solely for estimate_time -- can be removed or gutted

## Requirements

### Functional

- Remove estimate time input from issue detail sidebar
- Remove estimate_time activity display from notification card
- Remove estimated time column + variance from time tracking report
- Clean up unused imports/utilities

### Non-functional

- No visual regressions in remaining UI
- TypeScript compiles cleanly
- Lint passes

## Architecture

Component-level removals. No new patterns needed.

## Related Code Files

### Files to Modify

| File                                                                                     | Change                                                                      |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `apps/web/core/components/workspace-notifications/sidebar/notification-card/content.tsx` | Remove `estimate_time` entry from activity content map (line 110)           |
| `apps/web/core/components/time-tracking/time-tracking-issue-table.tsx`                   | Remove `estimate_time` column + variance calculation (lines 39, 64)         |
| `apps/web/core/components/time-tracking/time-tracking-summary-cards.tsx`                 | Remove `totalEstimatedMinutes` calculation + variance display (lines 31-34) |

### Files to Delete

<!-- Updated: Validation Session 2 - Always delete unconditionally -->
<!-- Updated: Validation Session 3 - Removed from Files to Modify (belongs only here) -->

- `apps/web/ce/components/issues/issue-details/additional-properties.tsx`

### Files to Check for Import Cleanup

- Any file that imports `WorkItemAdditionalSidebarProperties` -- remove the import + usage
- Check `apps/web/core/components/issues/issue-detail/sidebar.tsx` for usage of additional properties component

## Embedded Rules

- Use `observer()` wrapper on MobX-connected components
- Follow kebab-case file naming
- Keep components under 150 lines
- Remove unused imports after cleanup
- Run `pnpm check:lint` after changes

## Implementation Steps

### Step 1: Remove Additional Properties Component

<!-- Updated: Validation Session 2 - Always delete the file unconditionally, no content check needed -->

1. Delete `apps/web/ce/components/issues/issue-details/additional-properties.tsx` entirely
2. Search for imports of `WorkItemAdditionalSidebarProperties` and remove them:
   - Check `apps/web/core/components/issues/issue-detail/sidebar.tsx`
   - Remove the component usage from JSX

### Step 2: Clean Notification Card

1. Open `apps/web/core/components/workspace-notifications/sidebar/notification-card/content.tsx`
2. Remove the `estimate_time` entry from the activity content map (line 110-114)
3. Remove `convertMinutesToHoursMinutesString` import if no longer used

### Step 3: Clean Time Tracking Issue Table

<!-- Updated: Validation Session 1 - Remove estimated column entirely, no replacement -->

1. Open `apps/web/core/components/time-tracking/time-tracking-issue-table.tsx`
2. Remove the "Estimated" table header column entirely
3. Remove the variance calculation (line 39) entirely
4. Remove the estimate_time cell (line 64) entirely
5. Remove the variance cell entirely
6. Adjust table column count

### Step 4: Clean Time Tracking Summary Cards

<!-- Updated: Validation Session 1 - Remove estimated/variance cards entirely, no replacement -->

1. Open `apps/web/core/components/time-tracking/time-tracking-summary-cards.tsx`
2. Remove `totalEstimatedMinutes` calculation (lines 31-32) entirely
3. Remove variance display (line 34) entirely
4. Remove the entire summary card for estimated vs actual (no replacement)

### Step 5: Final Verification

1. Run `pnpm tsc --noEmit` -- zero errors
2. Run `pnpm check:lint` -- passes
3. Search: `grep -r "estimate_time" apps/web/ packages/` should return zero (excluding node_modules, plans)

## Post-Phase Checklist

- [ ] Estimate time input removed from issue detail sidebar
- [ ] Notification card no longer renders estimate_time activities
- [ ] Time tracking table no longer shows estimated column
- [ ] Time tracking summary no longer shows variance
- [ ] All unused imports removed
- [ ] TypeScript compiles with zero errors
- [ ] ESLint passes
- [ ] No remaining `estimate_time` references in frontend code

## Todo List

- [ ] Remove/gut additional-properties component
- [ ] Clean notification card content
- [ ] Clean time tracking issue table
- [ ] Clean time tracking summary cards
- [ ] Remove orphaned imports
- [ ] Run TS + lint checks

## Success Criteria

- `grep -r "estimate_time" apps/web/ packages/ --include="*.ts" --include="*.tsx"` returns zero results
- App compiles and runs without errors
- Issue detail sidebar no longer shows estimate time field
- Time tracking report still works but without estimated column

## Risk Assessment

- **Medium**: Time tracking report loses estimated vs actual comparison -- users may notice missing data
- **Low**: Notification card gracefully ignores old `estimate_time` activities (they just wont render)

## Security Considerations

- No security impact

## Next Steps

- Run full compilation check across monorepo
- Test manually in browser: issue detail, time tracking report, notifications
- Update docs/codebase-summary.md and docs/system-architecture.md to remove estimate_time references
