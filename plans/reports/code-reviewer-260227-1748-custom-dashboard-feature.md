# Code Review: Custom Dashboard Feature

**Score: 5.5 / 10**

**Date:** 2026-02-27
**Scope:** Full-stack custom dashboard feature (models, views, serializers, services, stores, pages, components)
**LOC:** ~1,350 across 16 files

---

## Overall Assessment

The feature implements a workspace-level custom dashboard with CRUD for dashboards/widgets and a chart aggregation endpoint. The architecture follows Plane patterns mostly correctly (BaseModel inheritance, CE override, MobX stores, propel imports). However, several critical and high-priority issues exist around **data mismatch between frontend/backend enums**, **missing authorization checks**, **excessive `any` usage**, and a **backend view exceeding size limits**.

---

## Critical Issues

### C1. Frontend/Backend Enum Mismatch -- DATA WILL NOT RENDER

**Files:** `widget-config-modal.tsx` (line 57-58), `dashboard.py` view (lines 185-192, 157-164)

The frontend default `x_axis_property` is `"priority"` but the backend `x_axis_map` expects uppercase keys like `"PRIORITIES"`. Similarly, the frontend default `y_axis_metric` is `"count"` but the backend `metrics_map` expects `"WORK_ITEM_COUNT"`.

**Impact:** Widgets created with defaults produce no chart data. The backend silently falls through to `("state_id",)` for x_axis and `Count("id")` for y_axis.

```typescript
// widget-config-modal.tsx line 57-58 -- WRONG
x_axis_property: "priority",  // Backend expects "PRIORITIES"
y_axis_metric: "count",       // Backend expects "WORK_ITEM_COUNT"
```

**Fix:** Align frontend defaults to backend enum keys:

```typescript
x_axis_property: "PRIORITIES",
y_axis_metric: "WORK_ITEM_COUNT",
```

### C2. Missing Dashboard Ownership Check on Widget Operations

**File:** `dashboard.py` (DashboardWidgetViewSet, line 78-87)

The `DashboardWidgetViewSet.get_queryset()` filters by `workspace__slug` and `dashboard_id` but does NOT verify the requesting user owns/has access to the parent dashboard. A user could manipulate widgets on another user's private dashboard by knowing the dashboard UUID.

**Impact:** Authorization bypass -- any workspace member can modify any dashboard's widgets.

**Fix:** Add the same `Q(created_by=self.request.user) | Q(access=1)` filter on the parent dashboard:

```python
def get_queryset(self):
    return self.filter_queryset(
        super().get_queryset()
        .filter(
            workspace__slug=self.kwargs.get("slug"),
            dashboard_id=self.kwargs.get("dashboard_id"),
        )
        .filter(
            Q(dashboard__created_by=self.request.user) | Q(dashboard__access=1)
        )
        .select_related("workspace", "dashboard")
    )
```

### C3. Chart Endpoint Missing Dashboard Access Check

**File:** `dashboard.py` (DashboardWidgetChartEndpoint, line 118-131)

Same issue as C2. The chart endpoint fetches widget by `pk`, `dashboard_id`, and `workspace__slug` but never checks if the user has access to the dashboard. Private dashboard chart data leaks to any workspace member.

---

## High Priority Issues

### H1. `localWidgetEdit` Mutates Observable Without `runInAction`

**File:** `dashboard.store.ts` (lines 114-123)

The `localWidgetEdit` method directly mutates `widgets[index]` outside `runInAction`. While it is decorated as `action`, the mutation on an array item property may not trigger MobX reactions reliably since the array reference does not change.

**Fix:** Use `runInAction` and replace array to ensure reactivity:

```typescript
localWidgetEdit(dashboardId: string, widgetId: string, localData: any) {
  runInAction(() => {
    const widgets = this.dashboardWidgets[dashboardId];
    if (widgets) {
      this.dashboardWidgets[dashboardId] = widgets.map(w =>
        w.id === widgetId ? { ...w, ...localData } : w
      );
    }
  });
}
```

### H2. Pervasive `any` Types in Service and Store

**Files:** `dashboard.service.ts` (all 11 methods use `Promise<any>`), `dashboard.store.ts` (6 fields typed as `any`), `use-custom-dashboard.ts` (line 8: `(context as any).customDashboard`)

No TypeScript interfaces exist for `IDashboard` or `IDashboardWidget`. This defeats type safety entirely.

**Fix:** Create interfaces in `packages/types/src/` and use them throughout:

```typescript
export interface IDashboard {
  id: string;
  name: string;
  description: string | null;
  access: number;
  filters: Record<string, unknown>;
  logo_props: Record<string, unknown>;
  widgets: IDashboardWidget[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface IDashboardWidget {
  id: string;
  name: string;
  chart_type: string;
  chart_model: string;
  x_axis_property: string;
  y_axis_metric: string;
  group_by: string | null;
  config: Record<string, unknown>;
  filters: Record<string, unknown>;
  width: number;
  height: number;
}
```

### H3. Backend View File Exceeds 200-Line Limit

**File:** `apps/api/plane/app/views/dashboard.py` -- 231 lines

The `DashboardWidgetChartEndpoint` (lines 109-231, ~123 lines alone) contains all aggregation logic inline. This should be extracted into a service/utility module.

### H4. `useCustomDashboard` Hook Uses `as any` Cast

**File:** `use-custom-dashboard.ts` line 8

```typescript
return (context as any).customDashboard;
```

The `StoreContext` type comes from `CoreRootStore` which does not include `customDashboard`. The CE `RootStore` extends it, but the hook bypasses type safety.

**Fix:** Create a proper `IRootStore` interface in CE that includes `customDashboard`, or use a typed store context.

### H5. No `model_activity.delay()` After Mutations

**Files:** `dashboard.py` views -- create, partial_update, destroy actions

Per Plane patterns, all mutations should fire `model_activity.delay()` for webhook support. None of the dashboard/widget views do this.

---

## Medium Priority Issues

### M1. Hardcoded Color `text-red-500` in Widget Context Menu

**File:** `widget-context-menu.tsx` line 74

```html
<div className="flex items-center gap-2 text-red-500"></div>
```

Should use `text-color-danger-primary`.

### M2. Invalid Semantic Token `bg-surface-3` and `text-color-subtle`

**File:** `widget-context-menu.tsx` line 45

```html
hover:bg-surface-3 ... text-color-subtle
```

These are not valid Plane design tokens. `bg-surface-3` does not exist; use `bg-layer-2`. `text-color-subtle` is not a token; use `text-color-tertiary`.

### M3. `alert()` Used Instead of Toast

**File:** `widget-context-menu.tsx` line 37

```typescript
alert("Link copied to clipboard");
```

Should use `setToast()` from `@plane/propel/toast`.

### M4. `isOpen` State in Widget Context Menu is Unused

**File:** `widget-context-menu.tsx` line 14

`const [isOpen, setIsOpen] = useState(false);` -- the state is set but never read. `CustomMenu` manages its own open state.

### M5. Dashboard List Empty State Not Using Translation Keys

**File:** `dashboards/page.tsx` lines 106-113

Hardcoded English strings: "No dashboards yet", "Create your first dashboard...", "Create dashboard". Should use `t()`.

### M6. Missing `distinct()` on Widget Queryset with M2M Joins

**File:** `dashboard.py` (DashboardWidgetChartEndpoint, line 133-136)

When filtering by `assignees__id__in` or `labels__id__in`, the queryset can produce duplicate rows without `.distinct()`.

### M7. `DashboardWidget` Default Width Mismatch

**Model:** `width = IntegerField(default=2)` but **frontend default:** `width: 6` (in a 12-col grid).

Widgets created via API without frontend will default to 2 columns (tiny), while the frontend sends 6. Not a bug per se but a confusing discrepancy.

---

## Low Priority Issues

### L1. `workspaceSlug` Prop Unused in Delete Modal

**File:** `analytics-dashboard-delete-modal.tsx` line 16 -- `workspaceSlug` is in props but never used.

### L2. Missing `key` Attribute Warning Potential in Widget Grid

**File:** `[dashboardId]/page.tsx` line 98 -- uses `w.id` as key which is correct, no issue.

### L3. `fetchWidgetChartData` Not Awaited in `createWidget`

**File:** `dashboard.store.ts` line 107

```typescript
this.fetchWidgetChartData(workspaceSlug, dashboardId, response.id);
```

Fire-and-forget is intentional but should have a comment explaining why.

---

## Positive Observations

1. **Correct CE override pattern** -- Store in `ce/store/dashboards/`, hooks in `ce/hooks/store/`, components in `ce/components/dashboards/`
2. **Proper `runInAction` usage** in most store async methods
3. **Filter whitelist** in chart endpoint (line 138-153) prevents SQL injection -- good security practice
4. **Propel subpath imports** used correctly (button, toast, charts)
5. **`observer()` wrapper** on all components reading store
6. **`react-hook-form`** for form management with validation
7. **Semantic color tokens** used correctly in most components
8. **File sizes** mostly under 200 lines (except backend view)
9. **Error handling** with try/catch in all store actions

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix frontend/backend enum mismatch for `x_axis_property` and `y_axis_metric` defaults
2. **[CRITICAL]** Add dashboard ownership/access checks to `DashboardWidgetViewSet` and `DashboardWidgetChartEndpoint`
3. **[HIGH]** Create `IDashboard`/`IDashboardWidget` TypeScript interfaces, replace all `any`
4. **[HIGH]** Add `model_activity.delay()` calls after mutations for webhook support
5. **[HIGH]** Extract chart aggregation logic from view into separate utility (~120 lines)
6. **[HIGH]** Fix `localWidgetEdit` MobX reactivity
7. **[MEDIUM]** Replace `text-red-500` with `text-color-danger-primary`, fix `bg-surface-3`/`text-color-subtle`
8. **[MEDIUM]** Replace `alert()` with `setToast()`
9. **[MEDIUM]** Add `.distinct()` to chart queryset
10. **[MEDIUM]** Add i18n keys for all hardcoded strings

---

## Metrics

| Metric                  | Value                                             |
| ----------------------- | ------------------------------------------------- |
| Type Coverage           | ~30% (heavy `any` usage)                          |
| Test Coverage           | 0% (no tests found)                               |
| Linting Issues          | ~8 eslint-disable comments for `any`              |
| File Size Violations    | 1 (backend view 231 lines)                        |
| Security Issues         | 2 critical (auth bypass on widgets/charts)        |
| Design Token Violations | 3 (text-red-500, bg-surface-3, text-color-subtle) |

---

## Unresolved Questions

1. Is `ANALYTICS_COLOR_PRESETS` exported from `@plane/constants` correctly? The import exists but runtime availability unverified.
2. Should dashboard deletion be soft-delete only (inherits from BaseModel so `objects` manager excludes `deleted_at`)? The frontend `destroy` action calls Django's default which is soft-delete via `SoftDeletionManager` -- confirm this is intended.
3. The `DashboardWidget.x_axis_property` and `y_axis_metric` are free-text `CharField(max_length=100)` on the model. Should these have `choices` constraints to prevent invalid values?
4. No pagination on dashboard list or widget list endpoints -- will this be an issue at scale?
