# Phase 01: Investigation

## Overview

Map complete data flow for both default filters and summary metrics. Confirm root causes before implementation.

## Key Insights

### Default Filters Architecture

- `IssueView` model has two filter fields: `filters` (legacy JSON) and `rich_filters` (new JSON)
- Default "Daily Status" view seeds with `filters={"start_date": ["today;after_including;"], "target_date": ["today;before_including;"]}` and `rich_filters={}`
- Frontend `WorkspaceIssuesFilter.fetchFilters()` for custom views reads `rich_filters` from view details
- Legacy `filters` field only used by backend `issue_filters()` utility for query building
- **Gap**: Frontend never sees the default date filters because it reads `rich_filters` (empty)

### Analytics Work-Items Metrics Architecture

- `AdvanceAnalyticsEndpoint.get_work_items_stats()` returns 5 state-group counts
- `ANALYTICS_INSIGHTS_FIELDS["work-items"]` maps to 5 insight cards
- `AdvanceAnalyticsStatsEndpoint.get_work_items_stats()` returns per-project breakdown with 5 state groups
- `AdvanceAnalyticsChartEndpoint.work_item_completion_chart()` returns monthly created vs completed
- Date filter (`date_filter` param) is commented out in all frontend API calls
- `get_filtered_counts()` uses `analytics_date_range` but returns unconditional count when range is null

### Filter Flow (Workspace Views)

1. User navigates to workspace view -> `AllIssueLayoutRoot` mounts
2. `fetchFilters()` called in SWR -> reads local storage + view details
3. For non-static views: `getViewDetails()` -> reads `rich_filters`, `display_filters`, `display_properties`
4. `WorkspaceLevelWorkItemFiltersHOC` receives `initialWorkItemFilters` with `richFilters: viewDetails?.rich_filters ?? {}`
5. `WorkItemFiltersHOC` (base) manages filter state and syncs to filter row
6. `ComplexFilterBackend` on backend parses `filters` query param (JSON) for issue list API

## Related Code Files

| File                                                                         | Purpose                                 |
| ---------------------------------------------------------------------------- | --------------------------------------- |
| `apps/api/plane/db/models/view.py`                                           | IssueView model, legacy filter defaults |
| `apps/api/plane/db/signals/workspace.py`                                     | Default view creation signal            |
| `apps/api/plane/db/migrations/0146_seed_default_workspace_views.py`          | Seed migration                          |
| `apps/web/core/store/issue/workspace/filter.store.ts`                        | Workspace filter store                  |
| `apps/web/core/store/issue/helpers/issue-filter-helper.store.ts`             | Filter computation helpers              |
| `apps/web/core/components/work-item-filters/filters-hoc/workspace-level.tsx` | Workspace filter HOC                    |
| `apps/api/plane/app/views/analytic/advance.py`                               | Analytics endpoints                     |
| `packages/constants/src/analytics/common.ts`                                 | Analytics insight field definitions     |
| `apps/web/core/components/analytics/total-insights.tsx`                      | Insight cards component                 |
| `apps/web/core/components/analytics/work-items/root.tsx`                     | Work-items analytics root               |

## Implementation Steps

- [ ] 1. Confirm `rich_filters` schema by examining existing views with filters applied (grep for examples)
- [ ] 2. Check `ComplexFilterBackend` filter parsing for date operators (how `today;after_including;` maps)
- [ ] 3. Verify that `IssueFilterSet` handles `start_date` and `target_date` fields
- [ ] 4. Test analytics endpoint responses to confirm what "doesn't make sense"
- [ ] 5. Check if `date_filter` commented-out code is intentional or a bug

## Success Criteria

- Root causes for both issues confirmed with code references
- `rich_filters` schema for date conditions documented
- Clear mapping of which API params control which metrics

## Risk Assessment

- Low: investigation only, no code changes
- Risk: "summary tab" may refer to something not yet built (need user clarification)
