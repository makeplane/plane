---
phase: 5
title: "Admin Management API (backend)"
status: completed
priority: P1
effort: "5h"
dependencies: [4]
---

# Phase 5: Admin Management API (backend)

## Overview

**Extend** the existing instance-admin endpoint (CRUD already partly exists — see below) with menu-permission assignment + PATCH, guarded so only a super-admin (or an admin granted the `administrators` menu) can manage admins. Extend `/admins/me` so the frontend can filter the sidebar.

> **Reframe (red-team M13):** multi-admin support is NOT net-new. `InstanceAdminEndpoint.post` (`admin.py:66`) already creates additional admins, and sign-in (`admin.py:340`) accepts **any** user with an `InstanceAdmin` row — only **signup** blocks the 2nd admin (`admin.py:108`). So the real gap is (a) the `allowed_menus`/`is_super_admin` fields + PATCH, and (b) the UI (Phase 6) — not building CRUD from scratch. Scope/effort is narrower than "new CRUD".

## Key Insights — current code (verified)

- `InstanceAdminEndpoint` (`license/api/views/admin.py:44-86`): `post` (create by email, role default 20), `get` (list, `cache_response` 2h), `delete(pk)`. Uses `InstanceAdminSerializer`.
- `/admins/me/` → `InstanceAdminUserMeEndpoint` (returns current admin). `/admins/session/` AllowAny.
- URLs in `license/urls.py:40-72`.
- Serializers in `license/api/serializers` (`InstanceAdminSerializer`, `InstanceAdminMeSerializer`).

## Requirements

- Functional:
  1. `POST /admins/` accepts `email` + `allowed_menus` (+ optional `is_super_admin`). Validates user exists; menus ⊆ `PERMISSION_KEYS`. Respect `unique_together` (no duplicate).
  2. **Strict escalation guard (decision):** only a super-admin may set `is_super_admin`. A non-super `administrators` admin may grant **only** menus that are a subset of their own `allowed_menus`, and may **not** edit their own row (`allowed_menus`/super flag) — self-edit of grants is forbidden; only another super-admin edits you.
  3. `PATCH /admins/<pk>/` updates `allowed_menus` / `is_super_admin` under guard 2; cannot demote the **last** super-admin. **All "last super-admin" counts use `InstanceAdmin.filter(instance, is_super_admin=True, user__isnull=False, user__is_active=True)`** — a `user=NULL` orphan row (FK is `SET_NULL`, `instance.py:54-59`) or an inactive user must never satisfy the guard (red-team H9: a login-less ghost row would otherwise "protect" nothing while permitting real lockout).
  4. `DELETE /admins/<pk>/` blocked if target is the last super-admin or is self (avoid lockout).
  5. **Retargeted lockout guards (red-team H5 — the original targets were wrong):**
     - ~~`InstanceUserEndpoint.delete`~~ — **no such method exists** (`license/api/views/user.py:35,79,105` defines only get/post/patch). The real instance-level lockout vector is **`PATCH /api/instances/users/<pk>/` with `is_active=False`** (cascades member deactivation, `user.py:120-121`; sign-in then blocks inactive users, `admin.py:315`). Guard: reject `is_active=False` when the target User is the last super-admin.
     - **`InstanceUserResetPasswordEndpoint`** (`user.py`): a `users`-menu admin could reset the super-admin's password and seize the account. Guard: block resetting another super-admin's password unless caller is super-admin.
     - **God-mode staff endpoints** (`license/api/views/staff.py`): `InstanceStaffDeactivateEndpoint` (`:237`, sets `is_active=False` at `:256`) and `InstanceStaffBulkActionEndpoint` (`:373`, `_bulk_status`/`_bulk_delete`) can deactivate the super-admin's user. Apply the same last-super-admin guard to both (incl. inside bulk loops).
     - **`StaffDeactivateEndpoint`** (`app/views/workspace/staff.py:299`) is **workspace-scoped** (`WorkSpaceAdminPermission`), reachable by any workspace admin — not a god-mode endpoint. It sets `employment_status="resigned"` (`:332`), which does NOT touch `User.is_active` or `InstanceAdmin` — so it is NOT a god-mode lockout vector; it only un-resolves the GD (Phase 1 filters `active`). Keep it OUT of the lockout guard; instead document the GD-resignation behavior (owner default falls back to manual picker / 400 — accepted).
  6. `GET /admins/` returns `is_super_admin` + `allowed_menus`.
  7. `GET /admins/me/` returns current admin's `is_super_admin` + `allowed_menus` (drives Phase 6 sidebar). **NOTE:** `InstanceAdminMeSerializer.Meta.model = User` (serializers/admin.py:12-33) and the endpoint serializes `request.user` — the new fields live on `InstanceAdmin`, not `User`. Add them via `SerializerMethodField` that looks up the `InstanceAdmin` row, OR serialize the `InstanceAdmin` instance. A plain `fields +=` will raise `ImproperlyConfigured`. Same for `InstanceAdminUserSessionEndpoint` if the sidebar reads from session. **Frontend consumer (red-team H7):** `/admins/me/` is already fetched by `apps/admin/store/user.store.ts:34,66` via `userService.adminDetails()` (`packages/services/src/user/user.service.ts:85`) into `currentUser: IUser` — there is no separate "instance/admin store". The new fields must extend the `IUser`-shaped payload consumed there (Phase 6 reads `currentUser`).
  8. Management endpoints are enforced via the route-group map: `admins/` prefix → `administrators` permission (super-admin bypasses). No per-view `required_menu` attr (Phase 4 route-group model).
- Non-functional: validate menu keys; clear 4xx errors.

## Architecture

- Serializers: extend `InstanceAdminSerializer` + `InstanceAdminMeSerializer` with `is_super_admin`, `allowed_menus`. Add a write serializer validating `allowed_menus ⊆ PERMISSION_KEYS`.
- View: extend `InstanceAdminEndpoint` (route-group `admins/`→`administrators` covers it); add `patch`. Enforce guards:
  - last-super-admin guard: `InstanceAdmin.filter(instance, is_super_admin=True, user__isnull=False, user__is_active=True).count()` before demote/delete (H9 — exclude ghosts).
  - only super-admin sets `is_super_admin`.
- Cache — **confirmed bug, not "verify" (red-team H4):** `InstanceAdminEndpoint.get` caches under key `request.get_full_path()` = `/api/instances/admins/` (`@cache_response(60*60*2, user=False)` with no `path`, admin.py:70; key derivation `cache.py:33`), but mutations call `invalidate_cache(path="/api/instances/", user=False)` (admin.py:47,82) — a **different key**, deleted with `multiple=False` exact match (`cache.py:66-69`). Invalidation is a no-op for the admins list → grants/revocations invisible for up to 2h in prod. **Fix:** pin both decorators to the same explicit path (`cache_response(..., path="/api/instances/admins/")` + `invalidate_cache(path="/api/instances/admins/")` on post/patch/delete). Note `cache_response` only writes when `not settings.DEBUG` (`cache.py:40`) — the staleness test must run with `DEBUG=False` or it passes vacuously. `/admins/me` has no cache decorator (no staleness there) — do NOT add one; menu grants are authorization data and must be live.
- Self-management: forbid deleting/demoting self if it would remove last super-admin.

## Related Code Files

- Modify: `apps/api/plane/license/api/views/admin.py` (post/patch/delete guards, me-serializer fields, cache path pinning)
- Modify: `apps/api/plane/license/api/serializers/admin.py` (`InstanceAdminSerializer` + `InstanceAdminMeSerializer` method fields + write validation)
- Modify: `apps/api/plane/license/api/views/user.py` (**singular — `users.py` does not exist**): `InstanceUserEndpoint.patch` `is_active=False` guard + `InstanceUserResetPasswordEndpoint` guard
- Modify: `apps/api/plane/license/api/views/staff.py`: `InstanceStaffDeactivateEndpoint` + `InstanceStaffBulkActionEndpoint` last-super-admin guards
- Modify: `apps/api/plane/license/urls.py` (PATCH maps via `admins/<uuid:pk>/`; confirm method allowed)
- Create tests: `apps/api/plane/tests/unit/test_instance_admin_management.py`

## Implementation Steps (TDD)

1. **Tests first**:
   - super-admin creates scoped admin with `allowed_menus=["workspace","users"]` → persisted; menus validated (invalid key → 400).
   - scoped admin **without** `administrators` menu calling `POST /admins/` → 403.
   - scoped admin **with** `administrators` menu → can create/patch; **cannot** set `is_super_admin` (403); **cannot** grant a menu outside its own `allowed_menus` (403); **cannot** edit its own row (403).
   - PATCH updates allowed_menus; demoting last super-admin → 400; deleting last super-admin → 400; deleting self when last super-admin → 400.
   - last-super-admin count excludes `user=NULL` orphan rows and inactive users (H9): with one real super + one ghost-super, deactivating the real one → 400.
   - `PATCH /users/<pk>/ is_active=False` on the last super-admin's user → 400 (`InstanceUserEndpoint.patch` — NOT a `delete`, which doesn't exist).
   - password reset against a super-admin by a non-super admin → 403/400 (`InstanceUserResetPasswordEndpoint`).
   - god-mode staff deactivate + bulk status/delete against the last super-admin's user → 400 (`InstanceStaffDeactivateEndpoint`, `InstanceStaffBulkActionEndpoint`).
   - `/admins/me/` returns `is_super_admin` + `allowed_menus` (serializer-method, no ImproperlyConfigured).
   - cache invalidated after mutation — list reflects change immediately; test must run with `DEBUG=False` so `cache_response` actually writes (H4).
2. Run → fail.
3. Implement serializers, view methods, guards, cache invalidation.
4. `python run_tests.py -u` green.

## Todo List

- [x] Failing tests for create/patch/delete guards + me shape + cache DEBUG=False (27 tests)
- [x] Serializer fields: `InstanceAdminMeSerializer` SerializerMethodFields; `InstanceAdminSerializer` grant fields read-only (blocks mass-assignment self-escalation)
- [x] `post` accepts allowed_menus/super flag; validates user/menus/duplicate; escalation guards
- [x] `patch` + last-super (ghost + inactive excluded) & self-edit guards
- [x] `delete` guards (self-delete blocked; last-super blocked)
- [x] Guards: `InstanceUserEndpoint.patch is_active=False`, `InstanceUserResetPasswordEndpoint`, `InstanceStaffDeactivateEndpoint` — helpers `is_active_super_admin`/`is_last_active_super_admin` in `plane/utils/instance_admin.py`
- [x] `/admins/me/` extended (same serializer feeds `/admins/session/`)
- [x] Cache pinned to `/api/instances/admins/` on get + invalidation on post/patch/delete (H4); DEBUG=False staleness test green
- [x] Tests green (27/27; full suite at develop baseline)

> Deviation (code-verified, H5 scope): `InstanceStaffBulkActionEndpoint._bulk_status`/`_bulk_delete` do NOT touch `User.is_active` (`staff.py` — status only sets `employment_status`; delete soft-deletes StaffProfile rows). They cannot lock out a super-admin, so no guard added there — only the three real vectors are guarded. Bulk delete/status of the GD's staff row merely un-resolves the GD (accepted, handled by picker/400).

## Success Criteria

- [ ] Super-admin can add/edit/remove admins and assign menus
- [ ] `administrators`-menu admin can manage admins but not mint super-admins
- [ ] Cannot lock out the instance (last super-admin protected; self-delete guarded)
- [ ] Invalid menu keys rejected
- [ ] `/admins/me/` exposes fields for sidebar filtering
- [ ] Unit tests pass

## Risk Assessment

- **Lockout** is the top risk → last-super-admin + self guards are mandatory and tested.
- **Stale cache** hiding new menus → invalidate on every write; me-endpoint cache short or invalidated.
- **Privilege escalation (closed per user decision):** non-super `administrators` admin may grant only menus ⊆ own set, cannot mint super-admins, cannot self-edit grants. Tests enforce all three.

## Security Considerations

- All writes behind `administrators` menu (super bypass).
- Validate target user is an existing `User`; never auto-create users here.
- Audit logging of admin grant/revoke: **resolved — out of scope v1** (validation V2). <!-- Updated: Validation Session 1 -->

## Next Steps

- Phase 6 consumes `/admins/me/` + management API in the Administrators UI.
