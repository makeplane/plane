# Debugger Report: god-mode/users/ Page

**Date:** 2026-03-02
**Commit investigated:** `6c39373ae4` (feat: add Swing SSO authentication and admin user management)

---

## Executive Summary

The `http://localhost:3001/god-mode/users/` page is **structurally correct and functional**. The backend API returns HTTP 200 for authenticated admin users, the admin dev server is running, routes are registered, and the MobX store is wired correctly.

**Key findings:**

1. Admin app IS running on port 3001 (PID 27297)
2. Backend API `/api/instances/users/` returns HTTP 200 for authenticated admin
3. One pre-existing backend `dispatch` bug (returns `exc` instead of `response`) — affects all exception paths but not the happy path
4. `loader` mutation in `finally` block happens outside `runInAction` — minor MobX concern, same pattern as pre-existing workspace store
5. Two pre-existing TypeScript errors in unrelated files (`logo-spinner.tsx`, `instance/loading.tsx`)
6. No unique bugs specific to the users page that would cause a complete failure

---

## System State

| Component               | Status      | Details                                   |
| ----------------------- | ----------- | ----------------------------------------- |
| Admin app (port 3001)   | Running     | PID 27297, `react-router dev --port 3001` |
| Backend API (port 8000) | Running     | Docker container `planeso-api-1`          |
| `/api/instances/users/` | Working     | Returns 200 for authenticated admin       |
| `duong@shinhan.com`     | Valid admin | `instance_admins` table, role=20          |
| 62 users in DB          | Confirmed   | `postgres:5434`                           |

---

## Route Registration

**File:** `/Volumes/Data/SHBVN/plane.so/apps/admin/app/routes.ts`

```ts
route("users", "./(all)/(dashboard)/users/page.tsx"),          // line 24
route("users/create", "./(all)/(dashboard)/users/create/page.tsx"),  // line 25
route("users/:userId", "./(all)/(dashboard)/users/detail/page.tsx"), // line 26
```

Routes are correctly registered in `routes.ts`. ✓

---

## Backend API Analysis

**Files:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/user.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/urls.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/serializers/user.py`

**URL registration** (license/urls.py lines 77-89):

```python
path("users/", InstanceUserEndpoint.as_view(), name="instance-users"),
path("users/<uuid:pk>/", InstanceUserEndpoint.as_view(), name="instance-user-detail"),
path("users/<uuid:pk>/reset-password/", InstanceUserResetPasswordEndpoint.as_view(), ...),
path("users/<uuid:pk>/workspaces/", InstanceUserWorkspaceEndpoint.as_view(), ...),
```

**Verified from docker logs:**

```
GET /api/instances/users/ 200  (7 queries, ~30-56ms, user_id: 9cb20d7a-...)
```

---

## Issues Found

### Issue 1: `dispatch()` returns `exc` instead of `response` [SEVERITY: LOW — Pre-existing upstream bug]

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/base.py` — **Line 109**

```python
def dispatch(self, request, *args, **kwargs):
    try:
        response = super().dispatch(request, *args, **kwargs)
        if settings.DEBUG: ...
        return response
    except Exception as exc:
        response = self.handle_exception(exc)
        return exc          # BUG: should be `return response`
```

`handle_exception()` correctly creates a DRF `Response`, stores it in `response`, but returns `exc` (the exception object) instead.

**Impact:** Any request that hits an unhandled exception in `InstanceUserEndpoint`, `InstanceUserResetPasswordEndpoint`, or `InstanceUserWorkspaceEndpoint` will return the raw exception object instead of an HTTP error response, crashing gunicorn's response handling.

**Same bug exists in:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/base.py` — **Line 123** (pre-existing upstream code).

**Does not affect happy path** — the normal flow returns `response` before the `except` block.

---

### Issue 2: `loader` state mutation outside `runInAction` [SEVERITY: LOW — Minor MobX concern]

**File:** `/Volumes/Data/SHBVN/plane.so/apps/admin/store/instance-user.store.ts`

Lines 92, 113, 134 — `finally` block after `await`:

```ts
fetchUsers = async (search?: string) => {
    try {
      this.loader = this.userIds.length > 0 ? "mutation" : "init-loader";  // OK (before await)
      const data = await this.service.list({ search });
      runInAction(() => { ... });                                             // OK
      return data.results;
    } catch (error) {
      ...
    } finally {
      this.loader = "loaded";   // Line 92 — outside runInAction, after await
    }
};
```

After `await`, the MobX action context is lost. `this.loader = "loaded"` should be inside `runInAction(() => { this.loader = "loaded"; })`.

**Impact:** In MobX strict mode (`enforceActions: "always"`), this would throw. In default MobX config (which is what this codebase uses — no strict enforcement), MobX logs a warning but the mutation still works and triggers re-renders.

**Note:** The **same pattern** is used in the pre-existing `workspace.store.ts` (which works). So this is a known-accepted pattern here.

---

### Issue 3: TypeScript errors in pre-existing files [SEVERITY: LOW — Pre-existing]

```
components/common/logo-spinner.tsx(11,11): error TS2339: Property '_resolvedTheme' does not exist on type 'UseThemeProps'.
components/instance/loading.tsx(12,11): error TS2339: Property '_resolvedTheme' does not exist on type 'UseThemeProps'.
```

Not related to user management feature. Pre-existing.

---

## Data Flow Verification

### Frontend Store

**File:** `/Volumes/Data/SHBVN/plane.so/apps/admin/store/instance-user.store.ts`

- `users: Record<string, IInstanceUser>` — observable ✓
- `userIds: string[]` — computed from `Object.keys(this.users)` ✓
- `fetchUsers()` — uses `runInAction` for data mutations ✓
- `InstanceUserService` from `@plane/services` — correctly built and exported ✓

### Service Layer

**File:** `/Volumes/Data/SHBVN/plane.so/packages/services/src/user/instance-user.service.ts`

```ts
async list(params?: { search?: string; cursor?: string }): Promise<IInstanceUserPaginatedResponse> {
    return this.get("/api/instances/users/", { params })...
}
```

Exported and included in `packages/services/dist/index.js` (line 1444, 2590). ✓

### Backend Serializer

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/serializers/user.py`

`InstanceUserSerializer` fields match `IInstanceUser` interface:

- `id`, `email`, `first_name`, `last_name`, `display_name`, `avatar`, `is_active`, `date_joined`, `last_login` ✓

Verified by running serializer in Docker — output matches expected shape. ✓

### Pagination

`self.paginate(request=request, queryset=queryset, on_results=..., default_per_page=20, max_per_page=100)`

`BasePaginator.paginate()` receives `queryset` as `**paginator_kwargs` and passes to `OffsetPaginator(queryset=...)`. Response shape:

```json
{ "total_count": ..., "next_cursor": ..., "next_page_results": ..., "results": [...] }
```

Matches `IInstanceUserPaginatedResponse`. ✓

---

## Potential Invisible Issues (No Direct Evidence)

These cannot be confirmed without browser console access:

1. **SWR error silencing**: If `fetchUsers` throws (e.g., session expires mid-use), the `useSWR` call on line 31 of `users/page.tsx` has no `onError` handler — the error is silently ignored, leaving an empty user list with no feedback to the user.

2. **Race condition**: `useSWR("INSTANCE_USERS", ...)` uses a static key. If multiple routes share this key or if the data is stale, re-fetching won't trigger correctly.

3. **`loader` state on error**: If `fetchUsers` throws, `finally` sets `loader = "loaded"` (outside `runInAction`). If MobX doesn't propagate this update due to the missing `runInAction`, the page could remain stuck on the skeleton loader.

---

## Summary: Is the Page Broken?

Based on evidence:

- Backend: **Working** (200 OK, correct data)
- Frontend: **Structurally correct** (routes registered, store wired, service exported)
- Observed behavior from logs: API is being called successfully from browser (Chrome user-agent)

**Most likely scenarios for user-reported issue:**

1. User may not be logged in as admin in the god-mode session (the admin session cookie `admin-session-id` is separate from the regular app session)
2. The page renders correctly but user noticed something specific (visual bug, missing feature, specific action failing)
3. The `dispatch` bug triggers if any exception is raised in a user management endpoint (e.g., trying to create a user with duplicate email — the error response from `InstanceAdminPermission` check raises 403, but if the view itself throws, returns `exc` object)

---

## Recommended Fixes

| Priority | Fix                                                | File                                              | Line         |
| -------- | -------------------------------------------------- | ------------------------------------------------- | ------------ |
| Medium   | `return exc` → `return response` in dispatch       | `apps/api/plane/license/api/views/base.py`        | 109          |
| Low      | Wrap `finally` `loader` mutations in `runInAction` | `apps/admin/store/instance-user.store.ts`         | 92, 113, 134 |
| Low      | Add `onError` handler to `useSWR` in users page    | `apps/admin/app/(all)/(dashboard)/users/page.tsx` | 31           |

---

## Unresolved Questions

1. **What specific issue does the user see?** — No error description provided; behavior could be a specific action failing (create, reset password, add to workspace) rather than the page not loading at all.
2. **Is the admin session cookie set correctly?** — Admin login uses a separate `admin-session-id` cookie (settings line 323). If user is logged in to main app but not god-mode, API calls return 401.
3. **Are there browser console errors?** — Cannot access browser console; Vite HMR logs not captured.
