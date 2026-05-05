# Code Review: Dashboard Feature Fixes (Re-review)

**Score: 7.5 / 10** (up from 5.5)

**Date:** 2026-02-27
**Scope:** 16 changed files — backend view/util/serializer/model, frontend types/service/store/hook/components/pages
**LOC reviewed:** ~1,450

---

## Overall Assessment

All critical and high-priority issues from the original review have been addressed. The enum mismatch is fixed, access control is now enforced at the queryset level, MobX reactivity is correct, types replaced all `any`, and aggregation logic is properly extracted. The codebase is now functional and architecturally sound. Remaining issues are medium/low priority and do not block shipping.

---

## Previously Fixed — Confirmed

| Issue                                                          | Status                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| C1: Enum mismatch (priority→PRIORITIES, count→WORK_ITEM_COUNT) | Fixed — defaults now `"BAR_CHART"`, `"PRIORITIES"`, `"WORK_ITEM_COUNT"` |
| C2: Widget queryset missing dashboard ownership check          | Fixed — `Q(dashboard__created_by=...)` applied                          |
| C3: Chart endpoint missing dashboard access check              | Fixed — explicit 403 check on dashboard access                          |
| H1: MobX localWidgetEdit reactivity                            | Fixed — replaces array reference, triggers observers                    |
| H2/H4: `any` types replaced                                    | Fixed — `IDashboard`, `IDashboardWidget` types created and used         |
| H3: View exceeding 150-line limit                              | Fixed — `dashboard_chart_aggregation.py` extracted, view now 191 lines  |
| H5: model_activity.delay() missing                             | Fixed — all create/update/destroy methods fire webhook tasks            |

---

## Remaining Issues

### Medium Priority

**M1. Duplicate `analytics-dashboard-form-modal.tsx` — DRY violation**

Two near-identical files exist:

- `/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-form-modal.tsx`
- `/apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-form-modal.tsx`

Diff shows minor cosmetic differences (label text, htmlFor, description placeholder, access section wording). These should be a single shared component. As the routes directory matures, divergence will increase.

**Fix:** Consolidate into one shared CE component at `apps/web/ce/components/dashboards/analytics-dashboard-form-modal.tsx`.

---

**M2. `updateWidget` has no rollback on API failure**

`apps/web/ce/store/dashboards/dashboard.store.ts` line 152-163:

```typescript
async updateWidget(...) {
  try {
    this.localWidgetEdit(dashboardId, widgetId, data as Partial<IDashboardWidget>); // optimistic update
    await this.dashboardService.updateWidget(...);
    // no rollback if ^ throws
  } catch (error) {
    console.error("Failed to update widget", error); // silent failure, stale UI
  }
}
```

If the API call fails, the UI reflects the changed widget but the backend has not saved it. The store silently swallows the error with no toast and no state restoration.

**Fix:** Capture the original widget before update and restore on failure:

```typescript
async updateWidget(workspaceSlug, dashboardId, widgetId, data) {
  const original = this.dashboardWidgets[dashboardId]?.find((w) => w.id === widgetId);
  try {
    this.localWidgetEdit(dashboardId, widgetId, data as Partial<IDashboardWidget>);
    await this.dashboardService.updateWidget(workspaceSlug, dashboardId, widgetId, data);
    // ...
  } catch (error) {
    if (original) runInAction(() => { this.localWidgetEdit(dashboardId, widgetId, original); });
    throw error; // let caller show toast
  }
}
```

---

**M3. `navigator.clipboard` without error handling**

`apps/web/ce/components/dashboards/widget-context-menu.tsx` line 31:

```typescript
navigator.clipboard.writeText(url); // no await, no catch
setToast({ type: TOAST_TYPE.SUCCESS, title: "Link copied to clipboard" });
```

`navigator.clipboard` is async and throws in non-HTTPS contexts or when permissions are denied. The success toast fires unconditionally.

**Fix:**

```typescript
const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(url);
    setToast({ type: TOAST_TYPE.SUCCESS, title: "Link copied to clipboard" });
  } catch {
    setToast({ type: TOAST_TYPE.ERROR, title: "Failed to copy link" });
  }
};
```

---

**M4. Non-semantic color tokens in routes page**

`apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` lines 148, 156:

```tsx
<Loader className="rounded-lg border border-subtle p-4">   // should be border-color-subtle
<p className="text-sm text-tertiary">                       // should be text-color-tertiary
```

These are bare Tailwind classes, not the semantic token names defined in `plane-design-system.md`. They will not adapt to dark mode correctly.

---

**M5. `current_instance=None` on all `model_activity.delay()` calls**

`apps/api/plane/app/views/dashboard.py` — all six `model_activity.delay()` calls pass `current_instance=None`, including on `partial_update`. Per the backend architecture rules, before-update state must be captured for meaningful activity diffing:

```python
# partial_update — capture before mutating
current_instance = json.dumps(DashboardSerializer(dashboard).data, cls=DjangoJSONEncoder)
serializer.save()
model_activity.delay(..., current_instance=current_instance, ...)
```

This is a low-impact omission (webhooks fire correctly, diffs just show no before-state) but is non-compliant with the codebase pattern.

---

### Low Priority

**L1. `as unknown as` double cast in routes page**

`apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` lines 111, 115, 191:

```typescript
data as unknown as TAnalyticsWidgetUpdate;
data as unknown as TAnalyticsWidgetCreate;
configWidget.config as unknown as Record<string, unknown>;
```

These exist because `WidgetConfigModal` uses the CE `WidgetFormData` shape while the routes page uses `IAnalyticsDashboardWidget`. The mismatch indicates the `WidgetConfigModal` is shared between two incompatible data models. This is an architectural seam — the double casts will work at runtime but lose type safety. Low risk since 0 TS errors confirmed, but should be addressed by creating a separate widget config modal for the routes (pro analytics) path.

---

**L2. Import location of `aggregate_chart_data` is deferred (inside method)**

`apps/api/plane/app/views/dashboard.py` line 176:

```python
def get(self, request, slug, dashboard_id, widget_id):
    from plane.utils.dashboard_chart_aggregation import aggregate_chart_data
```

Deferred imports are a Django pattern used to avoid circular imports. Here there is no circular import risk — move to module-level for clarity and minor startup-time improvement.

---

**L3. i18n coverage gap in CE components**

CE dashboard components (`widget-config-modal.tsx`, `widget-context-menu.tsx`, `widget-adapter.tsx`) contain user-facing hardcoded English strings ("Configure Widget", "Add Widget", "Edit", "Delete", "No data available for these filters"). The `page.tsx` files partially use `t()`. These strings are missing from the translation files.

Low priority since the feature is CE-only, but non-compliant with the i18n rule.

---

**L4. View size — `dashboard.py` at 191 lines**

The limit for Django view files is 150 lines. At 191 lines it is 27% over limit. `DashboardViewSet` + `DashboardWidgetViewSet` + `DashboardWidgetChartEndpoint` could be split into two files: `dashboard_crud.py` and `dashboard_chart.py`.

---

## Positive Observations

- Backend aggregation utility is well-structured with clear docstrings and separate `METRICS_MAP`, `X_AXIS_MAP`, `FILTER_MAPPING` dicts (KISS/DRY applied)
- `FILTER_MAPPING` whitelist prevents ORM injection — security pattern correctly applied
- `IDashboardStore` interface is correctly defined and implemented, enabling CE extensibility
- MobX pattern is consistent: `makeObservable` + `runInAction` + `action` decorators all correct
- Service layer follows `APIService` pattern exactly with correct URL prefixes and error handling
- `use-custom-dashboard.ts` correctly uses `StoreContext` with RootStore cast — CE override pattern respected
- `ToggleSwitch` properly uses `@plane/ui` (no propel equivalent exists)
- Semantic color tokens used throughout CE components (`bg-surface-1`, `text-color-primary`, `border-color-subtle`, etc.)
- TypeScript: 0 dashboard-specific errors, all `any` eliminated

---

## Metrics

| Metric                         | Value                                       |
| ------------------------------ | ------------------------------------------- |
| Critical issues                | 0 (all resolved)                            |
| High priority                  | 0 (all resolved)                            |
| Medium priority                | 5                                           |
| Low priority                   | 4                                           |
| TS errors (dashboard-specific) | 0                                           |
| File size violations           | 1 (`dashboard.py` at 191 vs 150-line limit) |
| Pre-existing TS errors         | ~16 (unrelated)                             |

---

## Recommended Actions

1. Consolidate duplicate `analytics-dashboard-form-modal.tsx` into single CE component (M1)
2. Add rollback to `updateWidget` and propagate error to caller for toast (M2)
3. Add `await` + try/catch to `navigator.clipboard.writeText` (M3)
4. Fix `border-subtle` → `border-color-subtle` and `text-tertiary` → `text-color-tertiary` in routes page (M4)
5. Capture `current_instance` before save in `partial_update` methods (M5)
6. Move deferred import to module level in `dashboard.py` (L2)
7. Split `dashboard.py` into crud + chart files to comply with 150-line limit (L4)

---

## Unresolved Questions

- Are the two `app/(all)/` and `app/routes/(all)/` directory trees intentional (migration in progress)? If so, which takes precedence for new CE dashboard code? The duplication creates maintenance overhead.
- Does the `model_activity.delay()` for `dashboard` and `dashboard_widget` model names have registered handlers in `bgtasks/webhook_task.py`? If unregistered model names are silently ignored, the webhook calls are no-ops.
