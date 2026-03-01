# Code Review: Dashboard V2 Final Review

**Reviewer:** code-reviewer
**Date:** 2026-03-01
**Branch:** develop

---

## Scope

- **Files changed:** ~50 (modified + deleted + new)
- **LOC added:** ~1,800 (new files), ~200 (modified)
- **LOC removed:** ~2,500 (V1 analytics-dashboard files)
- **Focus:** V1 removal, BRD gap features (C1/C2/H1/H2/M1-M4), 53 contract tests

### Key Files Reviewed

| File                                                                   | Purpose                               |
| ---------------------------------------------------------------------- | ------------------------------------- |
| `apps/web/ce/components/dashboards/widget-adapter.tsx`                 | Chart rendering dispatch + drill-down |
| `apps/web/ce/components/dashboards/custom-dashboard-widget-grid.tsx`   | Drag-drop grid (react-grid-layout)    |
| `apps/web/ce/components/dashboards/config/style-settings-section.tsx`  | M1/M2/M4 config UI                    |
| `apps/web/ce/store/dashboards/dashboard.store.ts`                      | MobX store with bulk position update  |
| `apps/api/plane/app/views/dashboard.py`                                | Backend CRUD + bulk position endpoint |
| `packages/types/src/custom-dashboard.ts`                               | TypeScript types                      |
| `packages/constants/src/custom-dashboard.ts`                           | Widget constants/metrics              |
| `apps/web/ce/components/dashboards/chart-renderers/*.tsx`              | 4 drill-down chart renderers          |
| `apps/web/ce/components/dashboards/dashboard-form-modal.tsx`           | C1: Project picker modal              |
| `apps/web/core/store/favorite.store.ts`                                | Favorite store migration              |
| `apps/api/plane/db/migrations/0127_drop_analytics_dashboard_tables.py` | V1 table drop migration               |

---

## Overall Assessment

Solid implementation. V1 removal is clean -- all references properly deleted from `__init__.py` files, URL registrations, and model registrations. BRD gap features follow Plane patterns well. However, there is one **critical bug** in the favorite store and several medium-priority issues.

---

## Critical Issues

### C1: Favorite Store `dashboardMap` Reference is Broken

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/core/store/favorite.store.ts` (lines 345-350)

The favorite store accesses `store.dashboardMap.get(entity_identifier)` but the new `DashboardStore` at `/Volumes/Data/SHBVN/plane.so/apps/web/ce/store/dashboards/dashboard.store.ts` uses `dashboards: IDashboard[]` (an array), not a `Map`. The `dashboardMap` property does not exist on the new store.

**Impact:** Unfavoriting a dashboard will silently fail -- `store.dashboardMap` is `undefined`, so `.get()` throws TypeError. The `if (store)` guard passes but `store.dashboardMap` is undefined.

**Fix:**

```typescript
// In favorite.store.ts, line 347-349, replace:
const dashboard = store.dashboardMap.get(entity_identifier);
if (dashboard) {
  store.dashboardMap.set(entity_identifier, { ...dashboard, is_favorite: false });
}

// With:
const dashboards = store.dashboards as IDashboard[];
const idx = dashboards?.findIndex((d: { id: string }) => d.id === entity_identifier);
if (idx !== undefined && idx >= 0) {
  dashboards[idx] = { ...dashboards[idx], is_favorite: false };
}
```

Or better: add a `dashboardMap` computed getter to `DashboardStore` for O(1) lookup.

Similarly, `/Volumes/Data/SHBVN/plane.so/apps/web/core/hooks/use-favorite-item-details.tsx` (line 77) uses `dashboards.find()` which is correct for the new store structure -- but the favorite store itself is inconsistent.

---

## High Priority

### H1: Bulk Position Endpoint Missing Size Validation

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/dashboard.py` (lines 199-209)

The `DashboardWidgetBulkPositionEndpoint.patch()` accepts arbitrary integer values for `x_axis_coord`, `y_axis_coord`, `width`, and `height` without bounds validation. A malicious client could set:

- Negative coordinates (`x_axis_coord: -1`)
- Zero or negative dimensions (`width: 0`, `height: -5`)
- Extremely large values (`width: 99999`) causing UI rendering issues

**Fix:** Add validation before the bulk update loop:

```python
VALID_POSITION_RANGE = (0, 1000)
VALID_SIZE_RANGE = (1, 100)

for item in widgets_data:
    x = int(item.get("x_axis_coord", 0))
    y = int(item.get("y_axis_coord", 0))
    w = int(item.get("width", 2))
    h = int(item.get("height", 2))
    if not (VALID_POSITION_RANGE[0] <= x <= VALID_POSITION_RANGE[1]):
        return Response({"error": "x_axis_coord out of range"}, status=400)
    # ... similar for y, w, h
```

### H2: Drill-Down URL Parameter Injection Risk

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/widget-adapter.tsx` (lines 41-49)

The `handleDrillDown` function constructs a URL from `filterKey` (which comes from `widget.x_axis_property`) and `filterValue` (which comes from chart data `name` field). Both are user-controlled via backend data.

While `URLSearchParams` handles encoding, the `filterKey` comes from the widget's `x_axis_property` which is stored in the database. If an attacker controls widget configuration, they could set `x_axis_property` to an unexpected value that confuses the target issue list page.

**Risk level:** Low-medium since the backend validates `x_axis_property` via the serializer/model choices. But no frontend validation exists.

**Recommendation:** Whitelist `filterKey` against known x-axis property values:

```typescript
const VALID_FILTER_KEYS = new Set(["priority", "state", "state_group", "assignee", "labels", "cycle", "module"]);
if (!VALID_FILTER_KEYS.has(filterKey)) return;
```

### H3: `text_color` Config Accepts Arbitrary CSS Color

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/widget-adapter.tsx` (line 69)

```tsx
style={textColor ? { color: textColor } : undefined}
```

The `textColor` value comes from `widget.config.text_color` which is stored in the backend's JSON field without validation. While React's `style` prop is safe from XSS (React escapes values), arbitrary color strings could include CSS expressions in older browsers or cause unexpected rendering.

**Recommendation:** Validate hex color format on the frontend:

```typescript
const isValidHex = /^#[0-9a-fA-F]{6}$/.test(textColor);
style={textColor && isValidHex ? { color: textColor } : undefined}
```

Also validate in the backend serializer's `config` field or add a Django model-level validator.

---

## Medium Priority

### M1: DashboardFavoriteLiteSerializer Drops `logo_props`

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/serializers/favorite.py`

Old: `fields = ["id", "name", "logo_props"]`
New: `fields = ["id", "name"]`

The `Dashboard` model has `logo_props` field. Dropping it from the serializer may break favorite list rendering if the UI expects logo_props.

**Fix:** Re-add `logo_props` to the serializer fields:

```python
fields = ["id", "name", "logo_props"]
```

### M2: `getColors` Utility Duplicated in 4 Chart Renderers

**Files:**

- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/chart-renderers/drill-down-bar-chart.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/chart-renderers/drill-down-line-chart.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/chart-renderers/drill-down-area-chart.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/chart-renderers/drill-down-pie-chart.tsx`

The `getColors()` function and `DEFAULT_COLORS` array are copied identically in all 4 files. Violates DRY.

**Fix:** Extract to a shared utility:

```typescript
// chart-renderers/chart-color-utils.ts
export const DEFAULT_COLORS = [...];
export const getColors = (config: Record<string, unknown>): string[] => { ... };
```

### M3: Detail Page Uses CSS Grid Instead of react-grid-layout

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` (line 100)

The detail page renders widgets with plain CSS grid (`grid-cols-12`) while the `CustomDashboardWidgetGrid` component uses `react-grid-layout` for drag-drop. The detail page doesn't use `CustomDashboardWidgetGrid` at all, meaning:

1. No drag-drop on the detail page
2. Grid rendering logic is duplicated and may differ

**Recommendation:** Use `CustomDashboardWidgetGrid` on the detail page too, with `isEditMode={false}` for view-only mode.

### M4: Missing Error Boundary for Chart Rendering

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/widget-adapter.tsx`

If recharts throws during rendering (malformed data, missing props), the entire dashboard will crash. No error boundary wraps the chart components.

**Fix:** Add a React error boundary or try-catch wrapper around chart renderers.

### M5: `eslint-disable` for `react-hooks/exhaustive-deps` on Observable Data

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/widget-adapter.tsx` (line 30-31)

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps -- data is MobX observable and stable
const data = dashboardStore.widgetChartData[widget.id] || [];
```

This is not memoized or used in a `useMemo` -- it's just a plain variable. The eslint-disable comment is misleading since this line doesn't involve hooks. The comment appears to be incorrect/unnecessary.

### M6: Hardcoded English Strings in Page Components

**Files:**

- `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` -- "Success!", "Dashboard created successfully.", "No dashboards created yet.", "Create Dashboard"
- `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` -- "Dashboards", "Add Widget", "Widget deleted", etc.

These should use `t()` translations per Plane i18n standards.

---

## Low Priority

### L1: `Control<any>` Type in Config Components

**Files:**

- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/config/style-settings-section.tsx` (line 20)
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/config/basic-settings-section.tsx` (line 24)

Using `Control<any>` loses type safety. Consider defining a shared `WidgetConfigFormValues` type.

### L2: `rootStore` Unused in DashboardStore

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/ce/store/dashboards/dashboard.store.ts` (line 53)

`private rootStore: CoreRootStore` is stored but never accessed. Remove or use it.

### L3: Missing `xs` and `xxs` Layout Entries in Grid

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/custom-dashboard-widget-grid.tsx` (line 90)

`layouts={{ lg: layout, md: layout, sm: layout }}` -- missing `xs` and `xxs` breakpoints but `breakpoints` and `cols` define them. react-grid-layout may fall back gracefully, but explicit layouts prevent surprises.

---

## Positive Observations

1. **Clean V1 removal** -- all `__init__.py` registrations, URL patterns, model imports properly cleaned
2. **Migration ordering** correct -- 0127 depends on 0126 which created the new tables
3. **Optimistic updates with rollback** in `bulkUpdatePositions` and `updateWidget` -- good UX pattern
4. **Debounced layout API calls** (500ms) in grid component prevents API spam during drag
5. **Proper use of Plane patterns**: `observer` wrapping, `runInAction`, `WorkSpaceBasePermission`, `model_activity.delay()`, CE override directory structure
6. **Semantic token usage** throughout (bg-surface-1, text-color-primary, border-color-subtle)
7. **Propel components** used correctly (Button, Input, Dialog from subpaths)
8. **i18n translations** added to all 3 locale files (en, ko, vi)
9. **Type definitions** well-structured with proper `IAnalyticsWidgetConfig` covering all new M1-M4 options
10. **Widget default sizes** per chart type in constants -- good UX default

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix `favorite.store.ts` -- `dashboardMap` does not exist on new `DashboardStore`. Either add `dashboardMap` computed getter to store or rewrite favorite logic to use `dashboards.find()`
2. **[HIGH]** Add bounds validation to `DashboardWidgetBulkPositionEndpoint` for position/size values
3. **[HIGH]** Validate `text_color` hex format before applying as inline style
4. **[MEDIUM]** Re-add `logo_props` to `DashboardFavoriteLiteSerializer.fields`
5. **[MEDIUM]** Extract duplicated `getColors`/`DEFAULT_COLORS` to shared utility
6. **[MEDIUM]** Use `CustomDashboardWidgetGrid` on detail page instead of plain CSS grid
7. **[MEDIUM]** Replace hardcoded English strings with `t()` calls
8. **[LOW]** Remove unused `rootStore` from DashboardStore or use it
9. **[LOW]** Add missing `xs`/`xxs` layouts to ResponsiveGridLayout

---

## Metrics

| Metric          | Value                                                           |
| --------------- | --------------------------------------------------------------- |
| Type Coverage   | ~90% (3 `Control<any>` eslint-disables, few `as` casts)         |
| Test Coverage   | 53 contract tests added (backend only)                          |
| Linting Issues  | ~5 (eslint-disables documented)                                 |
| i18n Coverage   | ~80% (new config strings covered; page-level strings hardcoded) |
| Security Issues | 1 medium (text_color), 1 low (drill-down filterKey)             |

---

## Unresolved Questions

1. Should `DashboardWidget.width` default be `2` (model) or `6` (frontend `widgetToLayoutItem`)? Mismatch between backend default and frontend fallback.
2. Is the `analytics_dashboard` entity_type in favorites being deprecated or maintained? If maintained, the favorite store needs fixing urgently.
3. Does the detail page intentionally lack drag-drop (H1), or was the grid component integration missed?
