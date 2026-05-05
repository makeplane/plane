# Gap Analysis: BRD vs Implementation

**Date:** 2026-02-28 | **BRD:** `plans/260227-0905-dashboard-feature-brd/`

## Summary: 6 MISSING, 4 PARTIAL, 2 OK

| #   | Feature                     | Status     | Action Required                                                  |
| --- | --------------------------- | ---------- | ---------------------------------------------------------------- |
| 1   | Private/Public toggle       | ✅ OK      | Test only                                                        |
| 2   | Drag-and-drop grid          | ❌ MISSING | **CODE**: Integrate `react-grid-layout` (already installed)      |
| 3   | Widget context menu         | ✅ OK      | Test only                                                        |
| 4   | Drill-down chart click      | ❌ MISSING | **CODE**: Add onClick to chart → navigate to filtered issue list |
| 5   | Number widget 7 metrics     | ⚠️ PARTIAL | **CODE**: Expose 5 missing metrics in frontend dropdown          |
| 6   | Favorite dashboard          | ❌ MISSING | **CODE**: Wire UserFavorite model, add star UI                   |
| 7   | Dashboard projects scope UI | ⚠️ PARTIAL | **CODE**: Add project multi-select picker to form modal          |
| 8   | Bar chart variants          | ❌ MISSING | **CODE**: Add Basic/Stacked/Horizontal variant selector          |
| 9   | Line type setting           | ⚠️ PARTIAL | **CODE**: Add solid/dashed/stepped dropdown                      |
| 10  | Progress Donut              | ⚠️ PARTIAL | **CODE**: Add progress arc + center % rendering                  |
| 11  | Number text align/color     | ❌ MISSING | **CODE**: Add text_align + text_color to config types + UI       |
| 12  | Bulk position update        | ❌ MISSING | **CODE**: Add batch position PATCH endpoint + frontend handler   |

## Critical Priority (blocks basic functionality)

### C1: Dashboard Projects Scope UI (Item #7)

- **Impact:** ALL widgets show "No data" because dashboard has no associated projects
- **Backend:** M2M `projects` field exists, aggregation reads `dashboard.projects.all()`
- **Missing:** Project multi-select in `DashboardFormModal`
- **Fix:** Add project picker to create/edit form, send `project_ids[]` on submit

### C2: Number Widget Full Metrics (Item #5)

- **Backend ready:** `PENDING_WORK_ITEMS`, `COMPLETED_WORK_ITEMS`, `IN_PROGRESS_WORK_ITEMS`, `BLOCKED_WORK_ITEMS`, `WORK_ITEMS_DUE_TODAY`, `WORK_ITEMS_DUE_THIS_WEEK`
- **Missing:** Frontend `ANALYTICS_CHART_METRIC_OPTIONS` only has 2 entries
- **Fix:** Add 5 more options to constants, update metric dropdown to show all 7 for NUMBER type

## High Priority (BRD core features)

### H1: Drag-and-Drop Grid (Item #2 + #12)

- `react-grid-layout@2.2.2` installed in `package.json` but never imported
- Grip icon in `custom-dashboard-widget-card.tsx` is decorative (no event handlers)
- **Fix:** Replace CSS grid with `ReactGridLayout`, wire `onLayoutChange` to batch position PATCH

### H2: Chart Click Drill-Down (Item #4)

- **Missing:** onClick handler on `<BarChart>`, `<LineChart>`, `<PieChart>`, `<AreaChart>` in `widget-adapter.tsx`
- **Fix:** Add click handler → navigate to `/${workspaceSlug}/issues?state=X&priority=Y` with context filters

## Medium Priority (enhanced features)

### M1: Bar Chart Variants (Item #8)

- Currently always renders with `stackId: "s"` — always stacked when grouped
- No horizontal bar option
- **Fix:** Add `bar_variant` to config: `basic | stacked | horizontal`

### M2: Line Type Setting (Item #9)

- Smoothing + markers implemented
- Line type hardcoded to solid
- **Fix:** Add `line_type` dropdown: `solid | dashed | stepped`

### M3: Progress Donut (Item #10)

- Basic Pie + Donut implemented
- `center_value` toggle exists in config UI but `widget-adapter.tsx` never reads it
- **Fix:** Render center percentage text when `center_value=true`, add progress arc variant

### M4: Number Widget Styling (Item #11)

- Hardcoded `justify-center` + `text-color-primary`
- **Fix:** Add `text_align` (left/center/right) + `text_color` (hex) to `IAnalyticsWidgetConfig`

## Low Priority (nice-to-have)

### L1: Favorite Dashboard (Item #6)

- Plane has existing `UserFavorite` model pattern
- **Fix:** Wire `UserFavorite` for dashboards, add star icon to card + toolbar
