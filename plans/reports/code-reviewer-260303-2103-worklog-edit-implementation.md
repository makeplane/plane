# Code Review: Worklog Feature — Edit from Activity + Project Settings Page

**Date:** 2026-03-03
**Scope:** 9 files across backend views, stores, services, page components, i18n
**Branch:** develop

---

## Scope

| Layer    | Files                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Backend  | `apps/api/plane/app/views/issue/worklog.py`, `apps/api/plane/app/views/project/worklog.py`, `apps/api/plane/app/serializers/worklog.py` |
| Store    | `apps/web/ce/store/project/worklog.store.ts`, `apps/web/ce/store/root.store.ts`                                                         |
| Service  | `apps/web/ce/services/project-worklog.service.ts`                                                                                       |
| Page     | `worklogs/page.tsx`, `worklog-table-columns.tsx`, `worklog-filters-toolbar.tsx`                                                         |
| Activity | `apps/web/ce/components/issues/worklog/activity/root.tsx`                                                                               |
| i18n     | `vi/translations.ts`, `ko/translations.ts`, `en/translations.ts`                                                                        |

---

## Overall Assessment

Implementation is solid and functional. MobX patterns are correct, backend permissions are appropriately tightened, and the activity click-to-edit UX is clean. Several issues need fixing before merge: one **critical** backend bug, two **high** priority frontend issues, and a handful of medium/low items.

---

## Critical Issues

### 1. Backend: `member_id` filter silently broken for multi-user selection

**File:** `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/page.tsx` L49 + `apps/api/plane/app/views/project/worklog.py` L40, 47-48

Frontend sends comma-separated IDs:

```ts
params.member_id = selectedUsers.join(","); // → "uuid1,uuid2"
```

Backend does:

```python
queryset = queryset.filter(logged_by_id=member_id)
```

`logged_by_id` is a UUID field. Passing `"uuid1,uuid2"` will cause a `ValidationError` or return 0 results — it does NOT do an `__in` filter. Either:

**Option A — fix backend to support multi-value:**

```python
member_ids = request.query_params.get("member_id")
if member_ids:
    id_list = [m.strip() for m in member_ids.split(",") if m.strip()]
    queryset = queryset.filter(logged_by_id__in=id_list)
```

**Option B — fix frontend to send repeated params:**

```ts
// Django reads request.query_params.getlist("member_id")
selectedUsers.forEach((id) => params.append("member_id", id));
```

Option A is simpler given the current service signature uses `Record<string, string>`.

---

## High Priority

### 2. `date_from` / `date_to` filters lack input validation on backend

**File:** `apps/api/plane/app/views/project/worklog.py` L51-54

Raw string from query params is passed directly to `.filter(logged_at__gte=date_from)`. If the value is malformed (e.g., `"2024-13-45"` or `"'; DROP TABLE"`) Django will raise an unhandled `ValidationError` from the ORM, returning a 500.

Fix:

```python
from datetime import datetime

def _parse_date(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None

if date_from:
    parsed = _parse_date(date_from)
    if parsed:
        queryset = queryset.filter(logged_at__gte=parsed)
```

### 3. `worklog-table-columns.tsx`: `log` typed as `any` throughout

**File:** `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/worklog-table-columns.tsx` L25, 34, 52, 71

All `tdRender` callbacks use `(log: any)`. `IWorkLog` is imported in `page.tsx` already. Fix:

```ts
import type { IWorkLog } from "@plane/types";

// Replace (log: any) → (log: IWorkLog) in all tdRender callbacks
```

This eliminates silent property access errors (e.g. if `issue_detail` shape changes).

---

## Medium Priority

### 4. Race condition: filter `useEffect` fires while `isLoading` guard blocks

**File:** `page.tsx` L53, L77-82

`fetchWorklogs` returns early if `isLoading` is true:

```ts
if (this.isLoading) return;
```

When filters change rapidly (user clears date, selects new user), the second fetch is silently dropped. Stale data is then displayed. Add an abort/debounce pattern, or lift the guard to only apply for `loadMore` calls:

```ts
// In store: only guard load-more, not fresh fetches
fetchWorklogs = async (..., loadMore = false) => {
    if (loadMore && this.isLoading) return;
    // ...
}
```

### 5. `page.tsx`: hardcoded English strings in JSX, not translated

**File:** `page.tsx` L123-125, L136, L158-159

```tsx
title = "Worklogs";
description = "Download worklogs AKA timesheets for anyone in any project.";
// loading: "Loading..."
// button: "Load more"
```

i18n keys were added (`project_settings.worklogs.label/heading/description`) but not used in the component. Replace with `t("project_settings.worklogs.heading")` etc.

`worklog-filters-toolbar.tsx` also has hardcoded `"Download"`, `"Export as CSV"`, `"Users"`, `"Start date"`, `"End date"` strings.

### 6. `downloadCSV`: no sanitization of user-controlled fields that may contain commas

**File:** `page.tsx` L100-107

`description` is escaped with `replace(/"/g, '""')` — good. But `display_name` and `issue_detail.name` are not quoted and may contain commas, breaking CSV parsing:

```ts
const rows = worklogs.map((w: IWorkLog) =>
  [
    `"${(w.issue_detail?.identifier || "").replace(/"/g, '""')}"`,
    `"${(w.logged_by_detail?.display_name || "").replace(/"/g, '""')}"`,
    formatMinutesToHours(w.duration_minutes),
    w.logged_at || "",
    `"${(w.description || "").replace(/"/g, '""')}"`,
  ].join(",")
);
```

### 7. `partial_update` / `destroy`: no 404 handling

**File:** `apps/api/plane/app/views/issue/worklog.py` L90, L118

Both use `IssueWorkLog.objects.get(...)` which raises `ObjectDoesNotExist` if the worklog was already deleted (race condition, or stale UI). Wrap in try/except:

```python
from plane.app.views.base import ObjectDoesNotExist  # or django.core.exceptions

try:
    worklog = IssueWorkLog.objects.get(...)
except IssueWorkLog.DoesNotExist:
    return Response({"error": "Worklog not found"}, status=status.HTTP_404_NOT_FOUND)
```

---

## Low Priority

### 8. `worklog.store.ts`: `nextCursor` observable property has type inconsistency

L12: `nextCursor?: string = undefined` — the `?` makes it `string | undefined` but MobX requires explicit type annotation for optional observables. Prefer:

```ts
nextCursor: string | undefined = undefined;
```

### 9. `activity/root.tsx`: `worklog` lookup by `activityComment.id` may be fragile

L38: `worklogs.find((w) => w.id === activityComment.id)`

If the activity's `id` is the activity record ID rather than the worklog ID, this lookup will always return `undefined` and the edit/delete features silently degrade to no-ops. Verify that `activityComment.id` is indeed the `IWorkLog.id` and not a separate activity record ID.

### 10. `worklog-filters-toolbar.tsx`: split-button pattern uses `pointer-events-none` on label

L58: `pointer-events-none` on the "Download" label button prevents clicking the label portion — only the chevron is interactive. This is a UX inconsistency: clicking the left half of the button does nothing. Either make the entire button open the menu, or wire the label to trigger CSV export directly.

### 11. `page.tsx` L93: double fallback `|| []` is redundant

```ts
const worklogs = (projectId ? projectWorklogs.worklogs[projectId] : []) || [];
```

`projectWorklogs.worklogs[projectId]` is initialized to `IWorkLog[]` via `setWorklogs`, so it can return `undefined` only before first fetch. The double fallback is fine but overly defensive — a single `?? []` is cleaner.

### 12. `getWorklogColumns` not memoized inside the module

`getWorklogColumns` returns a new array on every call. It is wrapped in `useMemo` in `page.tsx` (correct), but the function itself recreates JSX closures each call. Low impact but worth noting.

---

## Positive Observations

- MobX usage is correct: `makeObservable` (not `makeAutoObservable`), explicit `set()` for new observable keys, `runInAction` wrapping all mutations, `observer()` on page component.
- `rootStore.ts` correctly drops the `this` argument now that `ProjectWorklogStore` has no root dependency.
- `TPaginatedResponse<IWorkLog[]>` type fix eliminates the `as any` cast cleanly.
- Backend `IssueWorkLogSerializer` validates `duration_minutes > 0`, `<= 1440`, and `logged_at` not more than 7 days future — good guardrails.
- Accessibility in `activity/root.tsx`: `role="button"`, `tabIndex`, `onKeyDown` (Enter/Space) all present.
- Pencil icon uses `opacity-0 group-hover:opacity-100` — clean hover affordance.
- CSV injection protection for description field via `replace(/"/g, '""')`.
- `ProjectWorklogStore` is appropriately stateless of the root store (single responsibility).

---

## Recommended Actions (Priority Order)

1. **Fix `member_id` backend filter** to use `__in` with split — broken for multi-select (Critical)
2. **Add date string validation** in `ProjectWorkLogViewSet.list` before ORM filter (High)
3. **Replace `(log: any)`** with `(log: IWorkLog)` in table columns (High)
4. **Fix `isLoading` guard** — allow fresh fetches to cancel/override, only block `loadMore` (Medium)
5. **Replace hardcoded strings** in page and toolbar with i18n keys (Medium)
6. **Quote all CSV fields** that may contain commas (Medium)
7. **Add 404 handling** in `partial_update` and `destroy` (Medium)
8. **Verify `activityComment.id` === worklog ID** — add comment or assertion (Low)
9. **Fix split-button UX** in toolbar (Low)

---

## Metrics

- Type Coverage: ~85% — `(log: any)` in table columns is the main gap
- Linting Issues: 0 syntax errors observed; `any` usage is the lint concern
- i18n Coverage: ~60% of visible strings — several hardcoded strings remain in page/toolbar
- Test Coverage: not assessed (no test files in diff)

---

## Unresolved Questions

1. Does `activityComment.id` map 1:1 to `IWorkLog.id`? If activity records have their own UUID distinct from the worklog UUID, the edit click will silently fail for all entries.
2. The `ProjectWorkLogViewSet` is for admin/member listing only — is there a plan to add `partial_update`/`destroy` here too for the settings page, or is the intent to always edit via the issue activity panel?
3. `TimesheetBulkEntrySerializer` has `min_value=0` for `duration_minutes` (line 101) but `IssueWorkLogSerializer.validate_duration_minutes` requires `> 0`. Inconsistency — bulk allows 0-minute entries that the single-entry path rejects.
