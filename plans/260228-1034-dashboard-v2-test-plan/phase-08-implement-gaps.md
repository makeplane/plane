# Phase 8: Implement BRD Gaps

**Status:** Complete | **Priority:** CRITICAL
**Goal:** Fix all code gaps before running full test suite — COMPLETED

---

## Implementation Order

### Step 1: C1 — Project Picker in Dashboard Form (CRITICAL)

**Why first:** Unblocks ALL data tests. Without this, every widget shows "No data".

**Files to modify:**

- `ce/components/dashboards/dashboard-form-modal.tsx` — Add project multi-select field
- `packages/types/src/custom-dashboard.ts` — Ensure `TDashboardCreate` has `project_ids`

**Implementation:**

1. Import project list from workspace store (`useProject` hook or similar)
2. Add multi-select dropdown below Description in form modal (use `@plane/propel/combobox` or existing project selector pattern)
3. On submit, include `project_ids: string[]` in API payload
4. On edit, pre-populate selected projects from `dashboard.projects`
5. Show helpful hint: "Select projects to scope widget data"

**Verify:** Create dashboard with projects → Add widget → Chart shows real data (not "No data")

---

### Step 2: C2 — Number Widget Full Metrics

**Files to modify:**

- `packages/constants/src/custom-dashboard.ts` — Add 5 missing metrics to `ANALYTICS_CHART_METRIC_OPTIONS`
- `ce/components/dashboards/config/basic-settings-section.tsx` — Show full metric list when chart_type=NUMBER

**Implementation:**

1. Add to `ANALYTICS_CHART_METRIC_OPTIONS`:
   ```ts
   { key: "PENDING_WORK_ITEMS", label: "Pending Work Items" },
   { key: "COMPLETED_WORK_ITEMS", label: "Completed Work Items" },
   { key: "IN_PROGRESS_WORK_ITEMS", label: "In Progress Work Items" },
   { key: "BLOCKED_WORK_ITEMS", label: "Blocked Work Items" },
   { key: "WORK_ITEMS_DUE_TODAY", label: "Work Items Due Today" },
   { key: "WORK_ITEMS_DUE_THIS_WEEK", label: "Work Items Due This Week" },
   ```
2. Conditionally show full metric list for NUMBER type, standard 2 for other types

**Verify:** Create NUMBER widget → See all 7 metrics in dropdown → Each returns correct count

---

### Step 3: H2 — Chart Click Drill-Down

**Files to modify:**

- `ce/components/dashboards/widget-adapter.tsx` — Add onClick handlers to all chart types

**Implementation:**

1. Create `handleChartClick(dataKey: string, value: string)` function
2. Build filter URL: `/${workspaceSlug}/issues/?${x_axis_property}=${clickedValue}`
3. Include widget's existing filters in URL params
4. Use `router.push()` or `window.open()` for navigation
5. Apply to: `BarChart`, `LineChart`, `AreaChart`, `PieChart` (not NUMBER)

**Verify:** Click bar/slice → Navigate to filtered issue list

---

### Step 4: M3 — Progress Donut Center Value

**Files to modify:**

- `ce/components/dashboards/widget-adapter.tsx` — Read `config.center_value`, render center text

**Implementation:**

1. In DONUT_CHART case, check `widget.config?.center_value`
2. If true, overlay `<div>` centered inside donut with total count/percentage
3. Style: `text-2xl font-bold text-color-primary` absolutely positioned

**Verify:** Donut chart → Enable "Center Value" toggle → See number in center

---

### Step 5: M2 — Line Type Setting

**Files to modify:**

- `packages/types/src/custom-dashboard.ts` — Add `line_type?: "solid" | "dashed" | "stepped"` to config
- `ce/components/dashboards/config/style-settings-section.tsx` — Add line type dropdown
- `ce/components/dashboards/widget-adapter.tsx` — Pass `strokeDasharray` prop based on line_type

**Verify:** Line chart → Select "Dashed" → Line renders with dashes

---

### Step 6: M1 — Bar Chart Horizontal Variant

**Files to modify:**

- `packages/types/src/custom-dashboard.ts` — Add `orientation?: "vertical" | "horizontal"` to config
- `ce/components/dashboards/config/style-settings-section.tsx` — Add orientation toggle for BAR_CHART
- `ce/components/dashboards/widget-adapter.tsx` — Pass `layout="vertical"` to BarChart when horizontal

**Verify:** Bar chart → Select "Horizontal" → Bars render horizontally

---

### Step 7: M4 — Number Widget Text Align + Color

**Files to modify:**

- `packages/types/src/custom-dashboard.ts` — Add `text_align?: string`, `text_color?: string`
- `ce/components/dashboards/config/style-settings-section.tsx` — Add alignment buttons + color picker for NUMBER
- `ce/components/dashboards/widget-adapter.tsx` — Apply text_align + text_color to NUMBER rendering

**Verify:** Number widget → Set left align + red color → Renders correctly

---

### Step 8: H1 — Drag-and-Drop Grid (LARGEST)

**Files to modify:**

- `ce/components/dashboards/custom-dashboard-widget-grid.tsx` — Replace CSS grid with `ReactGridLayout`
- `ce/components/dashboards/custom-dashboard-widget-card.tsx` — Wire drag handle
- `ce/store/dashboards/dashboard.store.ts` — Add `bulkUpdatePositions` action
- `apps/web/core/services/dashboards/dashboard.service.ts` — Add bulk position PATCH method
- `apps/api/plane/app/views/dashboard.py` — Add bulk position update endpoint
- `apps/api/plane/app/urls/workspace.py` — Register new endpoint

**Implementation:**

1. Import `ReactGridLayout` from `react-grid-layout`
2. Map widgets to layout items: `{ i: widget.id, x, y, w, h }`
3. Wire `onLayoutChange` → batch update positions
4. Add `PATCH /dashboards/{id}/widgets/positions/` backend endpoint
5. Wire grip handle in card component as drag handle

**Verify:** Drag widgets → Positions save → Persist after reload

---

### Step 9: L1 — Favorite Dashboard (DEFERRED)

Can be implemented later. Uses existing `UserFavorite` pattern from Issues/Cycles.

---

## Todo

- [x] C1: Project picker in dashboard form
- [x] C2: Number widget 7 metrics
- [x] H2: Chart click drill-down
- [x] M3: Progress donut center value
- [x] M2: Line type setting
- [x] M1: Bar horizontal variant
- [x] M4: Number text align/color
- [x] H1: Drag-drop grid layout
- [ ] L1: Favorite dashboard (deferred)
- [x] Build check after each step
- [x] Update test plan with results

## Success Criteria

- `pnpm build --filter=web` passes after all changes
- C1 fix makes widgets show real data
- All 7 Number metrics return data
- Chart drill-down navigates correctly
- Grid drag-drop persists positions
