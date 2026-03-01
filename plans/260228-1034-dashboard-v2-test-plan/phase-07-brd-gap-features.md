# Phase 7: BRD Gap Features — NEEDS CODE FIRST

**Status:** Complete | **Test Cases:** 18 | **Result:** All API tests pass
**Prereq Met:** All code gaps implemented in Phase 8

---

## C1: Dashboard Projects Scope (CRITICAL — blocks all data tests)

### TC-7.1: Create dashboard with project selection

- **Steps:** Create dashboard → Select 1+ projects from multi-select picker → Save
- **Expected:** Dashboard saved with `project_ids`, widgets fetch data from selected projects
- **CODE NEEDED:** Add project multi-select to `DashboardFormModal`

### TC-7.2: Edit dashboard — change project scope

- **Steps:** Edit dashboard → Add/remove projects → Save → Check widgets
- **Expected:** Widget chart data updates to reflect new project scope

### TC-7.3: Dashboard with no projects → empty state

- **Steps:** Create dashboard without selecting any project
- **Expected:** Clear message "Select projects to see data" (not generic "No data")

---

## C2: Number Widget Full Metrics

### TC-7.4: Number widget — Pending work items

- **Expected:** Shows count of issues in `backlog` + `unstarted` state groups
- **CODE NEEDED:** Add to `ANALYTICS_CHART_METRIC_OPTIONS`

### TC-7.5: Number widget — Completed work items

- **Expected:** Shows count of `completed` state group

### TC-7.6: Number widget — In progress work items

- **Expected:** Shows count of `started` state group

### TC-7.7: Number widget — Blocked work items

- **Expected:** Shows count of issues with `blocked_by` relation

### TC-7.8: Number widget — Due today

- **Expected:** Shows count of issues with `target_date = today`, excluding completed

### TC-7.9: Number widget — Due this week

- **Expected:** Shows count of issues with `target_date` in current week, excluding completed

---

## H1: Drag-and-Drop Grid Layout

### TC-7.10: Drag widget to new position

- **Steps:** Enter edit mode → Drag widget header → Drop at new position
- **Expected:** Widget snaps to grid, `x_axis_coord`/`y_axis_coord` saved via PATCH
- **CODE NEEDED:** Integrate `react-grid-layout`, wire `onLayoutChange`

### TC-7.11: Resize widget

- **Steps:** Drag bottom-right handle → Expand widget
- **Expected:** `width`/`height` updated, other widgets pushed down

### TC-7.12: Grid position persists after reload

- **Steps:** Rearrange 3+ widgets → Reload page
- **Expected:** Same layout preserved

---

## H2: Chart Click Drill-Down

### TC-7.13: Click bar → navigate to filtered issue list

- **Steps:** Bar Chart (priority) → Click "High" bar
- **Expected:** Navigate to `/${workspace}/issues?priority=high` with dashboard filters
- **CODE NEEDED:** Add onClick to chart components in `widget-adapter.tsx`

### TC-7.14: Click pie slice → navigate

- **Steps:** Pie Chart (state_group) → Click "Started" slice
- **Expected:** Navigate to issues filtered by state_group=started

---

## M1-M4: Chart Variants & Styling

### TC-7.15: Bar chart — Horizontal variant

- **Steps:** Create bar chart → Select "Horizontal" variant
- **Expected:** Bars render horizontally (value on X, label on Y)
- **CODE NEEDED:** Add `bar_variant` config option

### TC-7.16: Line chart — Dashed line type

- **Steps:** Create line chart → Select "Dashed" line type
- **Expected:** Line renders with dashes
- **CODE NEEDED:** Add `line_type` dropdown (solid/dashed/stepped)

### TC-7.17: Donut chart — Progress donut with center %

- **Steps:** Create donut → Enable "Center Value" → Single metric
- **Expected:** Center shows percentage/count, arc shows progress
- **CODE NEEDED:** Render center text when `center_value=true`

### TC-7.18: Number widget — Text alignment + custom color

- **Steps:** Create number widget → Set alignment=Left, color=#ff0000
- **Expected:** Number displays left-aligned in red
- **CODE NEEDED:** Add `text_align` + `text_color` to config types + UI

---

## L1: Favorite Dashboard (deferred)

> Not critical for MVP. Can be tested after UserFavorite integration.
> Would add: star toggle on card, star on toolbar, persist per-user, show in favorites sidebar.

---

## Implementation Priority for Code Fixes

| Order | Gap                           | Why                                                      |
| ----- | ----------------------------- | -------------------------------------------------------- |
| 1st   | **C1: Project picker**        | Unblocks ALL data tests (Phase 3, 4, 5)                  |
| 2nd   | **C2: Number metrics**        | Quick constant update, high BRD coverage                 |
| 3rd   | **H2: Chart drill-down**      | onClick handlers on existing charts                      |
| 4th   | **M3: Progress donut center** | `center_value` toggle already in UI, just wire rendering |
| 5th   | **M2: Line type**             | Small config addition                                    |
| 6th   | **M1: Bar variants**          | Medium effort — horizontal bar needs axis swap           |
| 7th   | **M4: Number styling**        | Type + UI additions                                      |
| 8th   | **H1: Drag-drop grid**        | Largest effort — `react-grid-layout` integration         |
| 9th   | **L1: Favorites**             | Nice-to-have, deferred                                   |

## Success Criteria

- All 18 test cases pass after code gaps are implemented
- No regression on existing Phase 1-6 tests
