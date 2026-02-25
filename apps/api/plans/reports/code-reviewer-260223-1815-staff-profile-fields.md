# Code Review: Staff Profile Fields on User Profile

**Date:** 2026-02-23
**Branch:** develop
**Scope:** 10 files — new `MyStaffProfileEndpoint` + `MyStaffProfileSerializer` + frontend hook/component/service additions

---

## Overall Assessment

Implementation is correct and well-scoped. The design decisions (GET-only, lightweight serializer, hide-on-404) are sound. A few issues need attention before merge.

---

## Critical Issues

None.

---

## High Priority

### 1. `read_only_fields = fields` — forward-reference bug

**File:** `apps/api/plane/app/serializers/staff.py` line 77

```python
class Meta:
    model = StaffProfile
    fields = ["id", "staff_id", "position", "department", "department_detail"]
    read_only_fields = fields   # ← assigns the list object, not a copy
```

`read_only_fields = fields` assigns the same list object. If DRF or any mixin mutates `read_only_fields` at class init, it will corrupt `fields` too. This is a latent bug that's bit people before.

**Fix:**
```python
read_only_fields = ["id", "staff_id", "position", "department", "department_detail"]
```
or
```python
read_only_fields = list(fields)
```

### 2. `StaffProfile.objects` used instead of soft-delete-aware manager

**File:** `apps/api/plane/app/views/workspace/staff.py` line 41

```python
staff = StaffProfile.objects.select_related("department").get(
    workspace__slug=slug,
    user=request.user,
    deleted_at__isnull=True,
)
```

The explicit `deleted_at__isnull=True` filter makes it work correctly, but `BaseModel.objects` is already a `SoftDeletionManager` that excludes soft-deleted records automatically. The manual filter is redundant noise — but it also reveals that the other endpoints in the same file (`StaffDetailEndpoint`, `StaffEndpoint`, etc.) all use explicit `deleted_at__isnull=True` filters. This is consistent within the file so not a blocker, but worth noting as a pattern inconsistency with Plane conventions.

**Not blocking**, but if `SoftDeletionManager` is confirmed to exclude `deleted_at` automatically (it does per `mixins.py`), the manual `deleted_at__isnull=True` on line 41 is unnecessary. Keeping it is only harmful if it lulls reviewers into thinking other queries _without_ it are wrong.

### 3. `eslint-disable` suppresses legit warnings in service file

**File:** `apps/web/ce/services/staff.service.ts` line 7

```ts
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
```

This file-level suppression was already present. The new `getMyStaffProfile` method returns `IMyStaffProfile` (typed), so it doesn't need the suppression. The suppression is inherited from the broader file, not introduced by this PR — but worth tracking. Low priority for this PR specifically.

---

## Medium Priority

### 4. No `position` field in `IMyStaffProfile` — but it IS returned

**File:** `apps/web/ce/services/staff.service.ts` lines 85–95

```ts
export interface IMyStaffProfile {
  id: string;
  staff_id: string;
  position: string;      // ← present
  department: string | null;
  department_detail: { ... } | null;
}
```

The interface is correct and matches the serializer. No issue here — just confirming alignment.

### 5. `observer()` wrapper is unnecessary on `StaffProfileSection`

**File:** `apps/web/ce/components/settings/profile/staff-profile-section.tsx` line 7

```tsx
export const StaffProfileSection = observer(() => {
```

This component reads no MobX observables directly from stores (only `currentWorkspace?.slug` via `useWorkspace()`). Wrapping with `observer` is harmless but adds noise/overhead when no reactive data is consumed in the render path beyond the store hook. The `useWorkspace()` hook returns a store, but if `currentWorkspace` is accessed via `observer`, it's correct. This is actually fine given `useWorkspace()` likely returns MobX observable state — **leave as is**.

### 6. `useMyStaffProfile` hook silences all errors, not just 404

**File:** `apps/web/ce/hooks/use-my-staff-profile.ts` lines 16

```ts
.catch(() => setData(null)) // 404 = no profile, not an error
```

The comment says "404 = not an error" but the catch block fires for _all_ errors — network timeout, 500, auth failure (403/401), etc. These should surface differently than "user has no staff profile." A 500 error silently showing nothing is incorrect behavior.

**Fix:**
```ts
.catch((error) => {
  // 404 means the user has no staff profile — hide section silently
  if (error?.error_code !== 404 && error?.status !== 404) {
    console.error("Failed to fetch staff profile:", error);
  }
  setData(null);
})
```

Or at minimum distinguish 404 from other errors (requires checking what the thrown error shape looks like from `APIService` — likely `error?.response?.data` or just a string after `.catch((error) => { throw error?.response?.data; })`).

### 7. `Input` imported from `@plane/ui` instead of `@plane/propel`

**File:** `apps/web/ce/components/settings/profile/staff-profile-section.tsx` line 3

```tsx
import { Input } from "@plane/ui";
```

Per the design system rules (`plane-design-system.md`): if `Input` exists in `@plane/propel`, it must be imported from there. The `Input` component is listed in `@plane/propel` available components.

**Fix:**
```tsx
import { Input } from "@plane/propel/input";
```

Check if `propel/input` has the same API (disabled, className, value props) — if not, file an issue. The form.tsx in the same profile page also imports `Input` from `@plane/ui`, so this may be intentional for consistency within the form. Still non-compliant per stated rules.

### 8. `text-secondary` and `text-tertiary` Tailwind classes

**File:** `apps/web/ce/components/settings/profile/staff-profile-section.tsx` lines 20, 29, 39

```tsx
<h3 className="text-14 font-medium text-color-primary">
<h4 className="text-13 font-medium text-secondary">
```

`text-secondary` is not a semantic Plane token. The correct token is `text-color-secondary`. The existing form.tsx file uses `text-secondary` too (lines 257, 287, etc.), so this is a pre-existing inconsistency — but the new code should use `text-color-secondary` per the design guidelines.

**Fix:** `text-secondary` → `text-color-secondary`, `text-tertiary` → `text-color-tertiary`

---

## Low Priority

### 9. `position` falls back to `"—"` but `staff_id` does not

**File:** `apps/web/ce/components/settings/profile/staff-profile-section.tsx`

```tsx
value={staffProfile.staff_id}          // no fallback
value={staffProfile.position || "—"}   // fallback to em dash
```

`staff_id` can theoretically be an empty string if the API ever returns one. Minor inconsistency — should use `|| "—"` for all three fields or none.

### 10. `me/staff-profile/` URL segment `me` is non-standard for Plane

Plane typically uses `/profile/` or `/me/` at the user level, not nested under workspace slugs. The chosen URL `/api/workspaces/<slug>/me/staff-profile/` is functional and scoped correctly to the workspace, but it mixes workspace-scope with user-self-reference. This is a design choice that's defensible — the staff profile _is_ workspace-scoped — so not a blocker.

### 11. `IMyStaffProfile` defined in `staff.service.ts` — types should be in `packages/types/`

Per the design system checklist, TypeScript interfaces should live in `packages/types/src/`. `IMyStaffProfile` is defined locally in the service file. The broader `IStaff` also lives there. This is a pre-existing pattern for the staff module (not introduced by this PR), but worth normalising eventually.

---

## Positive Observations

- Serializer is correctly minimal — only exposes what the UI needs (id, staff_id, position, department, department_detail). No sensitive fields (phone, notes, date_of_leaving, employment_status) exposed.
- `user=request.user` filter on the backend correctly prevents users from seeing other employees' staff IDs by guessing UUIDs.
- `WorkspaceEntityPermission` is the right permission class — blocks unauthenticated and non-members.
- `http_method_names=["get"]` on the URL registration is a clean defence-in-depth measure.
- Frontend hides the section entirely on 404 — correct UX for users without a staff profile (non-staff workspace members).
- `select_related("department")` prevents N+1 on `get_department_detail()`.
- Translation keys added to all 3 locales (en, ko, vi). Keys align: `staff.profile_section_title`, `staff.staff_id.label`, `staff.department.label`, `staff.position.label`.
- `MyStaffProfileSerializer` is separate from `StaffProfileSerializer` — follows write vs read serializer separation pattern.

---

## Recommended Actions (Priority Order)

1. **Fix `read_only_fields = fields`** → use explicit list (High, 1-line fix)
2. **Fix `Input` import** → `@plane/propel/input` (Medium, unless propel Input API differs)
3. **Fix catch-all error silencing in hook** → distinguish 404 from network errors (Medium)
4. **Fix `text-secondary`** → `text-color-secondary` in the new component (Low)
5. **Add fallback for `staff_id` field display** → `|| "—"` (Low)

---

## Metrics

- Type coverage: Full — `IMyStaffProfile` correctly typed, serializer fields explicit
- Linting: File-level eslint-disable inherited from existing file, no new suppressions added by this PR
- Test coverage: No tests added for `MyStaffProfileEndpoint` — recommend adding a contract test for 200 (has profile) and 404 (no profile) cases

---

## Unresolved Questions

- Does `@plane/propel/input` export an `Input` with `disabled`, `className`, and `value` props compatible with how `@plane/ui Input` is used here? If not, document why `@plane/ui` is acceptable for this case.
- Is the multi-workspace scenario handled? A user in two workspaces each with a `StaffProfile` will see the profile for whichever workspace the profile page resolves `currentWorkspace` to — confirm this is correct behaviour.
- Should `position` being an empty string (`""`) show `"—"` or nothing? Current code shows `"—"` for position but the raw string for staff_id.
