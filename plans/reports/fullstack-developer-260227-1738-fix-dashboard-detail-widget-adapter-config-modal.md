# Phase Implementation Report

## Executed Phase

- Phase: Fix Dashboard Detail Page + Widget Adapter + Config Modal
- Status: completed

## Files Modified

| File                                                                              | Lines | Change                                                                                                                                        |
| --------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` | 126   | Rewrote to use `useCustomDashboard()` store, CSS Grid layout, removed analytics dashboard refs                                                |
| `apps/web/ce/components/dashboards/widget-adapter.tsx`                            | 140   | Fixed imports to `@plane/propel/charts/*` subpaths, correct prop shapes for all chart types                                                   |
| `apps/web/ce/components/dashboards/widget-config-modal.tsx`                       | 145   | Rewrote form to use backend DashboardWidget fields (name, chart_type, chart_model, x_axis_property, y_axis_metric, group_by, config, filters) |
| `apps/web/ce/components/dashboards/widget-config-tab-content.tsx`                 | 42    | Replaced `EAnalyticsWidgetType` with plain string `chartType`                                                                                 |
| `apps/web/ce/components/dashboards/config/widget-type-selector.tsx`               | 50    | Changed to backend chart types (BAR_CHART, LINE_CHART, etc.)                                                                                  |
| `apps/web/ce/components/dashboards/config/basic-settings-section.tsx`             | 124   | Rewrote fields: name, x_axis_property, y_axis_metric, chart_model, group_by                                                                   |
| `apps/web/ce/components/dashboards/config/style-settings-section.tsx`             | 88    | Replaced `EAnalyticsWidgetType` with plain string comparisons                                                                                 |
| `apps/web/ce/components/dashboards/config/display-settings-section.tsx`           | 78    | Replaced `EAnalyticsWidgetType` with plain string comparisons                                                                                 |
| `apps/web/ce/components/dashboards/config/filter-settings-section.tsx`            | 127   | Changed field paths from `config.filters.xxx` to `filters.xxx` (top-level)                                                                    |
| `apps/web/ce/components/dashboards/config/color-preset-selector.tsx`              | 41    | Removed unnecessary `observer` wrapper, fixed semantic tokens                                                                                 |
| `apps/web/ce/components/dashboards/config/widget-preview-panel.tsx`               | 62    | Replaced `EAnalyticsWidgetType` with plain string chart types                                                                                 |
| `apps/web/ce/components/dashboards/config/widget-sample-data.ts`                  | 119   | No functional changes, kept analytics types for data shape compat                                                                             |

## Tasks Completed

- [x] Dashboard detail page uses `useCustomDashboard()` hook (not analytics dashboard store)
- [x] On mount: fetches widgets + chart data for each widget
- [x] CSS Grid layout with `grid-cols-12`, widgets span their `width`/`height`
- [x] Widget cards have header (name + context menu) + body (WidgetAdapter)
- [x] "Add Widget" button opens config modal
- [x] Widget adapter uses correct propel chart subpath imports (`@plane/propel/charts/bar-chart` etc.)
- [x] BarChart: `bars` prop with `key/label/fill/textClassName/stackId`, `xAxis/yAxis` with `key`
- [x] LineChart: `lines` prop with `key/label/stroke/fill/dashedLine/showDot/smoothCurves`
- [x] AreaChart: `areas` prop with `key/label/stackId/fill/fillOpacity/strokeColor/strokeOpacity/showDot/smoothCurves`
- [x] PieChart: `data/dataKey/cells/showLabel`, DonutChart adds `innerRadius`
- [x] NUMBER type: simple large text display
- [x] Grouped mode: dynamic keys from data excluding "name"
- [x] Config modal form fields match backend: name, chart_type, chart_model, x_axis_property, y_axis_metric, group_by, config, filters
- [x] Removed all `EAnalyticsWidgetType` enum usage from config components -- plain strings
- [x] Removed refs to `ANALYTICS_DEFAULT_WIDGET_CONFIGS`/`ANALYTICS_DEFAULT_WIDGET_SIZES` from modal -- inline defaults
- [x] All files under 150 lines

## Tests Status

- Type check: pass (0 new errors; 17 pre-existing errors in unrelated analytics/common files)
- Unit tests: N/A (no test files for dashboard components yet)

## Key Architecture Decisions

- Backend chart_type values (BAR_CHART, LINE_CHART, etc.) used as-is throughout frontend -- no enum mapping needed
- Widget config stored in `config` JSON field; widget filters in separate `filters` JSON field (matches backend model)
- Preview panel reuses existing widget components from `ce/components/dashboards/widgets/` which use analytics types -- these types are compatible since we defined them

## Unresolved Questions

- Widget context menu `handleCopyLink` uses `alert()` instead of toast -- minor UX issue
- Widget positioning doesn't support drag-and-drop yet (CSS Grid only)
- No `dashboard-toolbar.tsx` file existed -- header built inline in page.tsx
