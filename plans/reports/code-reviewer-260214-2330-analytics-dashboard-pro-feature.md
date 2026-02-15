# Code Review: Analytics Dashboard Pro Feature

## Scope
- **Files reviewed**: 15 files (frontend store, service, pages, config components, widget components, backend models/views/serializers)
- **LOC**: ~1,400 across all files
- **Focus**: Full feature review (new feature)

## Overall Assessment

Well-structured feature with clean separation of concerns. MobX store follows existing patterns. Backend uses proper permission classes and soft-delete filtering. Several security and correctness issues need attention before merge.

---

## Critical Issues

### CRIT-1: SQL Injection via unvalidated filter values in widget data endpoint
**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/api/views/analytics_dashboard.py` (lines 303-310)

Filter keys are whitelisted (good), but **filter values are passed directly to `queryset.filter(**safe_filters)`** without validation. An attacker with workspace admin access could craft malicious filter values.

```python
# Current code (line 310)
safe_filters = {
    k: v
    for k, v in widget_filters.items()
    if k in self.ALLOWED_FILTER_KEYS
}
if safe_filters:
    queryset = queryset.filter(**safe_filters)
```

While Django ORM generally prevents raw SQL injection, the values could contain dict-based lookups like `{"state__workspace__slug__startswith": "x"}` if the value itself is a dict that gets unpacked. The filter keys alone being whitelisted is insufficient -- values should be validated as lists of UUIDs/strings.

**Fix**: Validate filter values are flat lists of strings/UUIDs:
```python
import uuid

safe_filters = {}
for k, v in widget_filters.items():
    if k not in self.ALLOWED_FILTER_KEYS:
        continue
    if isinstance(v, list):
        safe_filters[f"{k}__in"] = [str(item) for item in v]
    elif isinstance(v, str):
        safe_filters[k] = v
```

### CRIT-2: Number widget data response missing `metric` field
**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/api/views/analytics_dashboard.py` (lines 315-322)

The frontend type `IAnalyticsNumberWidgetData` expects `{value, metric}` but the backend returns only `{value}`:
```python
return Response({"value": count}, status=status.HTTP_200_OK)  # Missing "metric"
```

The frontend type guard at `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx` line 74-76 checks for `"metric" in data`, which will **always fail**, causing number widgets to render nothing.

**Fix**:
```python
return Response({"value": count, "metric": widget.chart_metric}, status=status.HTTP_200_OK)
```
Apply same fix to the `estimate_points` branch (line 322).

### CRIT-3: Detail serializer leaks soft-deleted widgets
**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/api/views/analytics_dashboard.py` (lines 78-79)

`prefetch_related("widgets")` does **not** filter by `deleted_at__isnull=True`. The `AnalyticsDashboardDetailSerializer` uses `widgets = AnalyticsDashboardWidgetSerializer(many=True, read_only=True)` which serializes **all** related widgets including soft-deleted ones.

**Fix**: Use `Prefetch` with a filtered queryset:
```python
from django.db.models import Prefetch

.prefetch_related(
    Prefetch(
        "widgets",
        queryset=AnalyticsDashboardWidget.objects.filter(deleted_at__isnull=True),
    )
)
```

---

## High Priority

### HIGH-1: MobX store `error` typed as `any`
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/store/analytics-dashboard.store.ts` (line 30, 56)

```typescript
error: any | null;  // "any | null" is just "any"
```

Should be typed as `string | Error | null` or a structured error type. `any | null` collapses to `any`, providing zero type safety.

### HIGH-2: `Control<any>` weakens form type safety
**Files**:
- `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/dashboards/config/basic-settings-section.tsx` (line 16)
- `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/dashboards/config/style-settings-section.tsx` (line 14)
- `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/dashboards/config/display-settings-section.tsx` (line 14)

All config components accept `Control<any>`. The `FormData` type is defined in `widget-config-modal.tsx` but not exported or shared.

**Fix**: Export `FormData` (renamed to `WidgetFormData`) from the modal file and use `Control<WidgetFormData>` in all sub-components.

### HIGH-3: No error handling in `handleCreate`/`handleUpdate`/`handleDelete` on list page
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` (lines 37-59)

These callbacks have no try/catch. If the store throws, the error propagates unhandled. The detail page handles errors properly; the list page does not.

**Fix**: Wrap each in try/catch with error toast, matching the detail page pattern.

### HIGH-4: Widget dropdown menu has no click-outside handler
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx` (lines 185-209)

The dropdown menu toggled by `showMenu` state has no mechanism to close when clicking outside. It remains open until an action is selected or the button is clicked again.

**Fix**: Use `useOutsideClickDetector` hook from the codebase or a `Popover` component from `@plane/ui`.

### HIGH-5: `analyticsDashboardStore` in useEffect dependency arrays causes infinite loops
**Files**:
- `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` (line 37)
- `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` (line 35)

The store reference from `useAnalyticsDashboard()` is stable (from context), so this won't cause infinite loops in practice. However, if the store were ever recreated, both `fetchDashboard` and `setActiveDashboard` fire again. This is a minor risk but follows existing codebase patterns, so acceptable. Keeping as note.

---

## Medium Priority

### MED-1: `DashboardIcon` imported from `@plane/propel/icons`
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` (line 10)

The review criteria state to avoid `@plane/propel/*` for buttons/modals/inputs. However, `DashboardIcon` genuinely lives in `@plane/propel/icons` and this is the correct import path. No issue.

### MED-2: `TOAST_TYPE` and `setToast` imported from `@plane/propel/toast`
**Files**: Dashboard detail page (line 12), dashboard list page (line 11)

Same as MED-1 -- toast utilities are correctly sourced from `@plane/propel/toast`. This is fine.

### MED-3: `WidgetConfigModal` form does not reset properly when switching from edit to create mode
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/dashboards/widget-config-modal.tsx` (lines 71-92)

`defaultValues` is set once during form initialization via `useForm`. When switching from editing a widget (configWidget set) to adding a new one (configWidget null), the form retains old values because `useForm` doesn't re-initialize on prop changes.

**Fix**: Add a `useEffect` that calls `reset()` with appropriate defaults when the `widget` prop changes:
```typescript
useEffect(() => {
  if (isOpen) {
    reset(widget ? { /* widget defaults */ } : { /* empty defaults */ });
  }
}, [widget, isOpen, reset]);
```

### MED-4: Backend view catches generic `Exception` and returns internal error details
**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/api/views/analytics_dashboard.py` (lines 94-98, 336-339)

```python
except Exception as e:
    return Response(
        {"error": str(e)},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
```

Exposing `str(e)` to the client can leak internal implementation details (stack frames, module paths, etc.).

**Fix**: Log the exception server-side and return a generic error message:
```python
import logging
logger = logging.getLogger(__name__)

except Exception as e:
    logger.exception("Failed to fetch dashboard detail")
    return Response(
        {"error": "An unexpected error occurred."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
```

### MED-5: `get_analytics_filters` imported but never used
**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/api/views/analytics_dashboard.py` (line 23)

```python
from plane.utils.date_utils import get_analytics_filters  # unused
```

### MED-6: `dashboard` field is writable in widget serializer
**File**: `/Volumes/Data/SHBVN/plane.so/apps/api/plane/api/serializers/analytics_dashboard.py` (lines 48-67)

`dashboard` is included in `fields` but not in `read_only_fields`. A client could potentially change which dashboard a widget belongs to by sending `dashboard: <other_id>` in a PATCH request.

**Fix**: Add `"dashboard"` to `read_only_fields`.

### MED-7: Store file exceeds 200-line guideline
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/store/analytics-dashboard.store.ts` (279 lines)

Per codebase rules, files should be under 200 lines. Consider extracting widget-related actions into a separate module or splitting the interface definition.

---

## Low Priority

### LOW-1: `observer` wrapping is unnecessary on pure config components
**Files**: `widget-type-selector.tsx`, `basic-settings-section.tsx`, `style-settings-section.tsx`, `display-settings-section.tsx`, `color-preset-selector.tsx`

These components receive all data via props (from `react-hook-form` Controller) and don't access any MobX observables directly. Wrapping in `observer` adds overhead with no benefit.

### LOW-2: Inline `style` object in widget card creates new object on every render
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx` (lines 169-172)

```tsx
style={{
  gridColumn: `span ${widget.position.width}`,
  gridRow: `span ${widget.position.height}`,
}}
```

Consider memoizing with `useMemo` if re-renders are frequent, or use CSS classes.

### LOW-3: Empty state button on list page uses raw HTML button instead of `Button` from `@plane/ui`
**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` (lines 92-97)

```tsx
<button className="rounded-md bg-custom-primary-100 px-4 py-2 ...">
  Create dashboard
</button>
```

Should use `<Button>` from `@plane/ui` for consistency.

---

## Positive Observations

1. **Clean type definitions** -- `packages/types/src/analytics-dashboard.ts` is well-structured with proper enums, interfaces, and utility types
2. **Proper soft-delete filtering** -- All backend queries filter `deleted_at__isnull=True`
3. **Permission enforcement** -- `WorkSpaceAdminPermission` on all endpoints restricts dashboard management to admins
4. **Widget cleanup on dashboard delete** -- Store properly cascades widget/data cleanup when a dashboard is deleted (store lines 166-173)
5. **Filter key whitelist** -- Backend whitelists allowed filter keys to prevent arbitrary field filtering
6. **Toast notifications** -- Consistent success/error feedback on the detail page
7. **Good component decomposition** -- Config modal split into logical sub-components (type, basic, style, display)
8. **URL routing** -- Django URL patterns use `uuid:dashboard_id` which validates UUID format at the routing layer

---

## Recommended Actions (Priority Order)

1. **Fix CRIT-2**: Add `metric` field to number widget data response (backend returns incomplete data, frontend renders nothing)
2. **Fix CRIT-3**: Filter soft-deleted widgets in `prefetch_related` using `Prefetch` object
3. **Fix CRIT-1**: Validate filter values, not just keys, in widget data endpoint
4. **Fix HIGH-3**: Add error handling to list page callbacks
5. **Fix MED-3**: Reset form state when widget prop changes in config modal
6. **Fix MED-4**: Don't expose raw exception strings to API clients
7. **Fix MED-5**: Remove unused import `get_analytics_filters`
8. **Fix MED-6**: Make `dashboard` field read-only in widget serializer
9. **Fix HIGH-4**: Add click-outside handler to widget dropdown menu

---

## Metrics
- **Type Coverage**: ~85% (several `any` uses in form control types and error state)
- **Test Coverage**: Unknown (no test files found for this feature)
- **Linting Issues**: 1 unused import (backend), no syntax errors detected
- **File Size Compliance**: 1 file over 200 lines (store at 279 lines)

---

## Unresolved Questions

1. Is `build_analytics_chart` an existing utility or newly created? Its error handling may need review.
2. Does `WorkSpaceAdminPermission` check workspace membership or just role? Non-members should be fully blocked.
3. Are migrations created for the new `AnalyticsDashboard` and `AnalyticsDashboardWidget` models?
4. Are the widget chart rendering components (`bar-chart-widget.tsx`, etc.) implemented and tested? They were imported but not included in the review scope.
5. Should `AnalyticsDashboardWidgetCard.tsx` (220 lines) be split per the 200-line guideline?
