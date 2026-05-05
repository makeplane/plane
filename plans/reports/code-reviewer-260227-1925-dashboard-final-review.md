# Code Review: Dashboard Feature — Final Re-Review

**Date:** 2026-02-27
**Scope:** Re-review after fixes from previous 7.5/10 score
**Files reviewed:**

- `apps/api/plane/app/views/dashboard.py`
- `apps/api/plane/app/views/dashboard_chart.py`
- `apps/api/plane/app/views/__init__.py` (lines 267–268)
- `apps/web/ce/store/dashboards/dashboard.store.ts`
- `apps/web/ce/components/dashboards/analytics-dashboard-form-modal.tsx`
- `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`
- `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`

---

## Overall Assessment

Fixes are mostly correct. The 5 targeted medium issues (M1–M5) and the file-split (L2+L4) are resolved. Three new issues surfaced during this review — one TypeScript correctness bug (newly introduced), one silent error-swallowing pattern carried forward, and one redundant auth layer. Score moves from **7.5 → 8.5/10**.

---

## Fixes Verified — All Confirmed

| Fix                                             | Status                                     | Notes                                                                                                                                                         |
| ----------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1: Form modal consolidated to CE               | Confirmed                                  | Both page.tsx files import from `@/plane-web/components/dashboards/analytics-dashboard-form-modal`. Old component dirs contain no form modal.                 |
| M2: `updateWidget` rollback                     | Confirmed                                  | Captures `original` before optimistic update; restores via `runInAction(() => { this.localWidgetEdit(..., original) })` on failure; propagates `throw error`. |
| M3: Clipboard `.then/.catch`                    | Not re-reviewed (confirmed in prior round) |                                                                                                                                                               |
| M4: Semantic tokens in `[dashboardId]/page.tsx` | Confirmed                                  | `border-color-subtle` and `text-color-tertiary` present; no hardcoded colors found.                                                                           |
| M5: `current_instance` with `DjangoJSONEncoder` | Confirmed                                  | `partial_update` in both `DashboardViewSet` and `DashboardWidgetViewSet` use `json.dumps(..., cls=DjangoJSONEncoder)`.                                        |
| L2+L4: File split + module-level imports        | Confirmed                                  | `dashboard.py` (~150 lines), `dashboard_chart.py` (~35 lines); all imports at module level; both exported from `__init__.py` at lines 267–268.                |

---

## New Issues Found

### High Priority

#### H1: TypeScript prop leak — `workspaceSlug` not in `Props` type but passed by both callers

**File:** `apps/web/ce/components/dashboards/analytics-dashboard-form-modal.tsx`

The `Props` type is:

```typescript
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DashboardFormPayload) => Promise<void>;
  dashboard?: { name?: string; description?: string | null; access?: number } | null;
};
```

Both call sites pass an extra `workspaceSlug` prop:

```tsx
// apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx (lines 144, 153, 163)
<AnalyticsDashboardFormModal workspaceSlug={workspaceSlug} ... />

// apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx (lines ~85, ~93, ~101)
<AnalyticsDashboardFormModal workspaceSlug={workspaceSlug ?? ""} ... />
```

TypeScript strict mode should flag this. The prop is silently ignored at runtime, but this indicates either: (a) the `Props` type was not updated when callers were updated, or (b) the callers added the prop speculatively. Either way, it causes a TypeScript compilation error.

**Fix:** Remove `workspaceSlug` from both call sites, or add it to the `Props` type if it is genuinely needed by the modal.

---

### Medium Priority

#### M1 (new): `createWidget` and `deleteWidget` swallow errors silently — callers get no feedback

**File:** `apps/web/ce/store/dashboards/dashboard.store.ts`

`createWidget` and `deleteWidget` log the error but do not rethrow:

```typescript
async createWidget(...) {
  try { ... } catch (error) {
    console.error("Failed to create widget", error); // no throw
  }
}

async deleteWidget(...) {
  try { ... } catch (error) {
    console.error("Failed to delete widget", error); // no throw
  }
}
```

The detail page's `handleDeleteWidget` has a proper try/catch with a toast notification, but since `deleteWidget` doesn't throw, the error branch in the caller is never reached. The user sees the widget disappear (no optimistic UI present here) but gets no error toast if the API call fails.

Compare with `createDashboard`, `updateDashboard`, `deleteDashboard` — all rethrow correctly.

**Fix:**

```typescript
async createWidget(...) {
  try { ... } catch (error) {
    console.error("Failed to create widget", error);
    throw error;
  }
}

async deleteWidget(...) {
  try { ... } catch (error) {
    console.error("Failed to delete widget", error);
    throw error;
  }
}
```

#### M2 (new): `DashboardWidgetChartEndpoint` has redundant class-level permission check

**File:** `apps/api/plane/app/views/dashboard_chart.py`

```python
class DashboardWidgetChartEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id, widget_id):
```

`WorkSpaceBasePermission` on GET allows any active workspace member (including `ROLE.GUEST = 5`). The `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` decorator then restricts further. The class-level permission is effectively bypassed by the decorator, making it misleading noise. Since `dashboard.py` uses the same class-level permission with decorator restriction pattern and it works, this isn't a functional bug — but it's inconsistent.

**Fix (minor):** Remove `permission_classes = [WorkSpaceBasePermission]` from the class and rely solely on `@allow_permission`, or document why both are present. If guests should be blocked from chart data (matching the main dashboard read endpoints that also use `ADMIN + MEMBER`), the decorator is the correct gate.

---

## Low Priority Observations

#### L1: `routes/page.tsx` uses `any` type for state without `IDashboard`

**File:** `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const [editDashboard, setEditDashboard] = useState<any | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const [deleteDashboard, setDeleteDashboard] = useState<any | null>(null);
```

The `app/(all)/` version of the same page correctly uses `IDashboard`. The routes version regressed to `any`. The eslint-disable comments confirm this was noticed but not fixed.

**Fix:** Replace `any` with `IDashboard` and import type from `@plane/types`.

#### L2: `destroy` doesn't capture `current_instance` before deletion

**File:** `apps/api/plane/app/views/dashboard.py`

Both `DashboardViewSet.destroy` and `DashboardWidgetViewSet.destroy` pass `current_instance=None` to `model_activity`. For audit/webhook purposes, some implementations capture the pre-delete state so webhooks include the deleted object's data. Check if this is intentional by comparing with other destroy implementations. If external consumers rely on the webhook payload containing the deleted entity, this is a gap.

This is consistent with the current codebase pattern, so treat as low priority / informational.

---

## Positive Observations

- Rollback in `updateWidget` is correctly structured: `original` captured before mutation, `runInAction` wraps the restore call, `throw error` propagates to caller.
- `localWidgetEdit` correctly decorated as `action` in `makeObservable`; calling it inside `runInAction` on rollback is valid MobX.
- File split (`dashboard.py` / `dashboard_chart.py`) is clean — both files are well under 200 lines, imports are correctly at module level.
- Semantic token usage in `[dashboardId]/page.tsx` is correct throughout: `border-color-subtle`, `text-color-tertiary`, `bg-accent-subtle`.
- `DashboardWidgetChartEndpoint` correctly validates widget ownership against the parent dashboard after the queryset fetch, preventing cross-dashboard data access.
- The consolidated `AnalyticsDashboardFormModal` in `ce/components/dashboards/` is clean, uses Propel components (`Button`, `Input`), semantic tokens, and proper `react-hook-form` pattern with validation.
- The two stores (`DashboardStore` via `useCustomDashboard`, `AnalyticsDashboardStore` via `useAnalyticsDashboard`) correctly target different backend APIs (`/dashboards/` vs `/analytics-dashboards/`). The detail page using the analytics store is intentional, not an architectural error.

---

## Recommended Actions

1. **[High] Fix TypeScript prop leak** — Remove `workspaceSlug` prop from both call sites of `AnalyticsDashboardFormModal`, or add it to `Props` type if required.
2. **[Medium] Add `throw error` to `createWidget` and `deleteWidget`** in `dashboard.store.ts` so callers receive error feedback.
3. **[Low] Replace `any` types** in `routes/(all)/.../dashboards/page.tsx` with `IDashboard`.
4. **[Low] Remove redundant class-level `permission_classes`** from `DashboardWidgetChartEndpoint` or add a comment explaining the dual-layer intent.

---

## Metrics

| Metric                     | Value                           |
| -------------------------- | ------------------------------- |
| Previous score             | 7.5/10                          |
| Current score              | **8.5/10**                      |
| Critical issues            | 0                               |
| High issues                | 1 (new — TS prop type mismatch) |
| Medium issues              | 2 (1 carried forward, 1 new)    |
| Low issues                 | 2                               |
| Files within size limits   | All pass                        |
| Semantic token compliance  | Pass                            |
| `current_instance` pattern | Pass                            |

---

## Unresolved Questions

1. Is `workspaceSlug` actually needed inside `AnalyticsDashboardFormModal`? If future EE overrides need it, add to `Props`; if not, remove from callers.
2. Should `destroy` endpoints capture `current_instance` for delete webhook payloads? Depends on whether webhook consumers expect deleted entity data in the event body.
3. Should `ROLE.GUEST` be allowed to read chart data? Currently blocked by `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`. If public dashboards (`access=1`) should be viewable by guests, the decorator needs `ROLE.GUEST` added.
