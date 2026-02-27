# Dashboard Types & Service Alignment Report

## Status: Completed

## Files Modified

- `packages/types/src/analytics-dashboard.ts` — full rewrite (125 lines), aligned with backend Django models
- `apps/web/ce/services/analytics-dashboard.service.ts` — full rewrite (105 lines), fixed URLs `/analytics-dashboards/` -> `/dashboards/`
- `apps/web/ce/store/analytics-dashboard.store.ts` — updated field refs (`position` -> flat coords, removed `widget_count`/`is_favorite`, renamed methods)
- `apps/web/ce/store/dashboards/dashboard.store.ts` — switched import from deleted `DashboardService` to `AnalyticsDashboardService`

## Files Deleted

- `apps/web/core/services/dashboards/dashboard.service.ts` — duplicate service, removed
- `apps/web/core/services/dashboards/` — empty directory removed

## Key Type Changes

| Old                                                | New                                                    |
| -------------------------------------------------- | ------------------------------------------------------ |
| `EAnalyticsWidgetType` (lowercase values)          | `EAnalyticsChartType` (UPPER_CASE values)              |
| `widget_type`                                      | `chart_type`                                           |
| `title`                                            | `name`                                                 |
| `chart_property`                                   | `x_axis_property`                                      |
| `chart_metric`                                     | `y_axis_metric`                                        |
| `position: {row, col, width, height}`              | flat `x_axis_coord`, `y_axis_coord`, `width`, `height` |
| `IAnalyticsDashboardConfig`                        | removed (projects now M2M on dashboard)                |
| `IAnalyticsWidgetConfig`                           | removed (config is `Record<string, unknown>`)          |
| `IAnalyticsWidgetPosition`                         | removed (flat fields)                                  |
| `owner`, `is_default`, `is_favorite`, `sort_order` | removed from dashboard                                 |

## New Enums Added

- `EAnalyticsChartType` — BAR_CHART, LINE_CHART, AREA_CHART, DONUT_CHART, PIE_CHART, NUMBER
- `EAnalyticsChartModel` — BASIC, GROUPED
- `EAnalyticsXAxisProperty` — STATES, STATE_GROUPS, ASSIGNEES, etc.
- `EAnalyticsYAxisMetric` — WORK_ITEM_COUNT, ESTIMATE_POINTS, etc.
- `EAnalyticsDashboardAccess` — PRIVATE=0, PUBLIC=1

## Service Changes

- All URLs changed from `/analytics-dashboards/` to `/dashboards/`
- Removed `duplicateDashboard`, `updateWidgetPositions`, `getWidgetData`
- Added `getWidgetChartData` (uses `/charts/` endpoint)
- Removed all JSDoc comments (conciseness)

## Type Check

- **Our changed files**: 0 errors
- **Consumer components** (widget renderers, config modals): ~45 errors from old field names — these are separate tasks (#3-#5)
- **Pre-existing errors** (analytics tables, logo-spinner, project form): unrelated

## Unresolved Questions

- Consumer components (18 files) still reference old type names (`EAnalyticsWidgetType`, `IAnalyticsWidgetConfig`, `widget_type`, `chart_property`, etc.) — need updating in tasks #3-#5
