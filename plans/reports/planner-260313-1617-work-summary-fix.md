# Investigation Report: Work Summary Tab & Default Date Filters

## Summary

Investigated two issues in workspace "Work" feature:

### 1. Default Filters (start_date / target_date)

**Root cause found.** The "Daily Status" default view stores date filters in legacy `filters` JSON field but frontend exclusively reads `rich_filters` (which is `{}`). Fix requires populating `rich_filters` in both the workspace creation signal and a data migration for existing workspaces.

### 2. Summary Tab Metrics

**Multiple issues found:**

- Missing "cancelled" state group in insight cards (4 groups shown, but 5 exist)
- Total != sum of displayed groups (cancelled items create unexplained gap)
- Date filter selector exists in UI but `date_filter` param is commented out in all API calls
- Chart label says "resolved" but data counts "completed" state group

## Key Files

### Backend

- `apps/api/plane/db/signals/workspace.py` - default view signal (needs `rich_filters`)
- `apps/api/plane/db/migrations/0146_seed_default_workspace_views.py` - seed migration
- `apps/api/plane/app/views/analytic/advance.py` - analytics endpoints (needs cancelled)
- `apps/api/plane/utils/filters/filter_backend.py` - ComplexFilterBackend
- `apps/api/plane/app/views/view/base.py` - workspace view CRUD

### Frontend

- `apps/web/core/store/issue/workspace/filter.store.ts` - workspace filter store
- `packages/constants/src/analytics/common.ts` - insight card definitions (needs cancelled)
- `apps/web/core/components/analytics/work-items/root.tsx` - work-items tab root
- `apps/web/core/components/analytics/total-insights.tsx` - insight cards
- `apps/web/ce/components/analytics/tabs.tsx` - analytics tab definitions

## Plan Location

`/Users/ngoctran/Documents/Shinhan/plane/plans/260313-1616-work-summary-fix/`

## Effort Estimate

~3h total across 3 phases
