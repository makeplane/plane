---
phase: 4
title: "Instance Admin Permission Infra (backend)"
status: completed
priority: P1
effort: "8h"
dependencies: []
---

# Phase 4: Instance Admin Permission Infra (backend)

## Overview

Extend the `InstanceAdmin` model with a **super-admin flag** and a **set of allowed god-mode menus**, define a canonical **URL-prefix → menu registry**, and add a **menu-scoped permission class** that resolves the required menu from the **request path** (route-group scoping). This is the backend half of "Backend + UI" enforcement.

> **Enforcement model (decision): route-group / URL-prefix, not per-view annotation.** A single `InstanceAdminMenuPermission` maps `request.path` against a prefix table (one entry per router group in `license/urls.py`) instead of annotating each of the ~74 view classes. This is the only correct fix for the override defect below and it covers endpoints registered under `/api/instances/` even when their class lives outside `license/api/views` (e.g. `SwingSSOTestEndpoint`).

### ⚠️ Red-team C1 (grep-verified, Critical) — why a base-default swap is NOT enough

Changing only `BaseAPIView.permission_classes` does **nothing** for the **17–27 license views that explicitly set `permission_classes = [InstanceAdminPermission]`** (e.g. `user.py:33`, `configuration.py:33`, `job_position.py:20`, `task_category.py:20`, `workspace.py:20`, `workspace_bulk_create.py:53`, `workspace_project_bulk_import.py:98`, `admin.py:45`, the bulk-import/bulk-assign views). DRF resolves `permission_classes` per-class — a subclass override shadows the base default, so those views silently keep the old all-admin (fail-open) permission. **Every one of those explicit overrides must be replaced with `InstanceAdminMenuPermission`** (or removed so the base default applies). The route-group map then supplies the required menu by path; views carry no per-class `required_menu`.

## Key Insights — current code (verified)

- `InstanceAdmin` (`apps/api/plane/license/models/instance.py:53-70`): `user`, `instance`, `role` (only choice `(20,"Admin")`), `is_verified`, `unique_together[instance,user]`.
- All god-mode views inherit `BaseAPIView` with `permission_classes=[InstanceAdminPermission]` (`license/api/views/base.py:42-47`).
- `InstanceAdminPermission` (`license/api/permissions/instance.py:12-18`): checks `InstanceAdmin.filter(role__gte=15, instance, user).exists()`.
- `is_instance_admin()` util mirrors it (`plane/utils/instance_admin.py`).
- Setup creates the single admin (`license/api/views/admin.py:234`); blocks a 2nd at signup only.
- Frontend menu keys live in `apps/admin/hooks/use-sidebar-menu/core.ts` (general,email,workspace,users,departments,staff,authentication,ai,image,monitoring,task-categories,help-center,job-positions,calendar,usage-monitor).

## Requirements

- Functional:
  1. `InstanceAdmin.is_super_admin: bool` and `InstanceAdmin.allowed_menus: list[str]` (JSON).
  2. Migration backfills existing admins **with a real, active user** as `is_super_admin=True` (decision: safest — preserves today's all-access, avoids zero-super lockout against CLI-created admins). **Orphan filter (red-team H9):** `InstanceAdmin.user` is `SET_NULL` (`instance.py:54-59`) — only backfill rows with `user__isnull=False`; never stamp a login-less ghost row super-admin. Post-migration invariant: `InstanceAdmin.filter(is_super_admin=True, user__isnull=False, user__is_active=True).exists()` (a ghost row must not satisfy it). Zero-admin instance (fresh install) → backfill touches nothing and the invariant is N/A (handled by the setup flow, not this migration).
  3. Canonical `PERMISSION_KEYS` registry (single backend source) incl. new `administrators` key and a grouped `settings` key. **`settings` covers general/email/ai/image AND `authentication`** — all five persist through the single `InstanceConfigurationEndpoint` (`urls.py:54-55`, `authentication/page.tsx:77` → `/api/instances/configurations/`), so `authentication` CANNOT be a separately-enforceable key (red-team H6). There is **no** standalone `authentication` permission key.
  4. **Fail-CLOSED via route map:** every URL under `/api/instances/` resolves to a menu through the prefix table, or sits in the explicit `SHARED_PREFIXES` allowlist (identity/auth/session endpoints). A request whose path matches neither → **denied** (403) for scoped admins. No silent fall-through to "any admin".
  5. `InstanceAdminMenuPermission`: passes if user is instance admin **and** (`is_super_admin` or `required_menu(request.path) in allowed_menus` or the path is shared).
  6. Setup flow sets `is_super_admin=True` + `allowed_menus=ALL` for the first admin.
- Non-functional: super-admin bypasses menu checks; unknown/missing menu key → deny for scoped admins.

## Architecture

- **Model**: add fields; `allowed_menus` `models.JSONField(default=list)`; `is_super_admin` `BooleanField(default=False)`.
- **Registry**: `apps/api/plane/license/menu_registry.py` → `PERMISSION_KEYS: list[str]`, `ALL_PERMISSION_KEYS`, a `PREFIX_MENU_MAP` (ordered list of `(url-prefix, menu_key)` under `/api/instances/`), and `SHARED_PREFIXES` (paths exempt from menu scoping: `/admins/me`, `/admins/session`, sign-in/out/up, config identity). Permission keys: `settings, workspace, users, departments, staff, monitoring, task-categories, help-center, job-positions, calendar, usage-monitor, administrators` (12 keys — **no** standalone `authentication`; general/email/ai/image/authentication all collapse into `settings`). Frontend mirrors these (Phase 6).
- **Permission (fail-closed, route-group)**: `apps/api/plane/license/api/permissions/instance.py` — add `InstanceAdminMenuPermission`:
  ```python
  class InstanceAdminMenuPermission(BasePermission):
      def has_permission(self, request, view):
          if request.user.is_anonymous: return False
          admin = InstanceAdmin.objects.filter(
              instance=Instance.objects.first(), user=request.user
          ).first()
          if not admin: return False
          if admin.is_super_admin: return True
          if is_shared_path(request.path): return True
          required = required_menu_for_path(request.path)  # longest-prefix match in PREFIX_MENU_MAP
          if required is None: return False  # fail-closed: unmapped path denies scoped admins
          return required in (admin.allowed_menus or [])
  ```
  `required_menu_for_path` does a longest-prefix match so nested groups (e.g. `/workspaces/<slug>/projects/`) resolve deterministically.
- **Prefix → menu map (the single source).** One entry per router group in `license/urls.py` (not per class). Seed: `workspaces/owner-options/`→`workspace`, `workspaces/`→`workspace`, `users/`→`users`, `departments/`→`departments`, `staff/`→`staff`, `configurations/`→`settings`, `monitoring/`→`monitoring`, `task-categories/`→`task-categories`, `help-center/`→`help-center`, `job-positions/`→`job-positions`, calendar/holiday/work-schedule/day-override prefixes→`calendar`, `usage-monitor/`→`usage-monitor`, `admins/`→`administrators`, **`swing-sso/`→`settings`** (red-team M11 — this endpoint's class lives in `authentication/views/app/swing_sso.py:156` but is reachable under `/api/instances/`, so route-group scoping covers it where per-class annotation would have missed it). `SHARED_PREFIXES`: `admins/me`, `admins/session`, sign-in/out/up.
- **Override sweep (C1):** replace every explicit `permission_classes = [InstanceAdminPermission]` in `license/api/views/*` (17–27 occurrences) and in `swing_sso.py` with `[InstanceAdminMenuPermission]` (or delete the override to inherit the base default). `is_instance_admin()` util untouched. `InstanceAdminPermission` retained only where an endpoint is intentionally any-admin (none expected after the sweep).

## Related Code Files

- Modify: `apps/api/plane/license/models/instance.py` (fields)
- Create: `apps/api/plane/license/migrations/000X_instance_admin_menu_permissions.py`
- Create: `apps/api/plane/license/menu_registry.py` (`PERMISSION_KEYS`, `ALL_PERMISSION_KEYS`, `PREFIX_MENU_MAP`, `SHARED_PREFIXES`, `required_menu_for_path`, `is_shared_path`)
- Modify: `apps/api/plane/license/api/permissions/instance.py` (+`InstanceAdminMenuPermission`)
- Modify: `apps/api/plane/license/api/views/base.py` (default `permission_classes = [InstanceAdminMenuPermission]`)
- **Sweep** (C1): replace explicit `permission_classes = [InstanceAdminPermission]` in every `license/api/views/*.py` that sets it (grep the 17–27 sites: `user.py`, `configuration.py`, `job_position.py`, `task_category.py`, `workspace.py`, `workspace_bulk_create.py`, `workspace_project_bulk_import.py`, `workspace_module_bulk_import.py`, `workspace_member_bulk_assign.py`, `user_bulk_import.py`, `job_position_bulk_import.py`, `task_category_bulk_import.py`, plus the calendar/holiday/work-schedule/day-override and license `staff.py` views) and in `apps/api/plane/authentication/views/app/swing_sso.py` (`SwingSSOTestEndpoint`).
- Modify: `apps/api/plane/license/api/views/admin.py` (setup sets super-admin + ALL menus)
- Create tests: `apps/api/plane/tests/unit/test_instance_admin_menu_permission.py`

## Implementation Steps (TDD)

1. **Tests first**:
   - migration backfill: pre-existing admins **with `user__isnull=False`** → super-admin + ALL menus; orphan (`user=NULL`) rows NOT stamped super; post-migrate invariant `InstanceAdmin.filter(is_super_admin=True, user__isnull=False, user__is_active=True).exists()`; zero-admin instance → no-op, no false assertion (H9).
   - `InstanceAdminMenuPermission` (route-group): super-admin allowed for any path; scoped admin allowed only when `required_menu_for_path(path)` ∈ allowed_menus; denied for ungranted; **fail-closed**: unmapped path → scoped admin denied; shared path allowed for any admin; anonymous denied; non-admin denied.
   - **override-sweep coverage**: a request to a previously-overridden endpoint (e.g. `GET /api/instances/users/`) by a scoped admin lacking `users` → 403 (proves the sweep landed, not just the base default).
   - `swing-sso/test/` resolves to `settings` (M11).
   - setup endpoint creates first admin as super-admin with ALL menus.
2. Run → fail.
3. Add model fields + makemigrations (rename file to domain slug, **no plan refs**); write data migration for backfill (orphan-filtered).
4. Add `menu_registry.py` (`PREFIX_MENU_MAP` + resolvers) + permission class; swap `BaseAPIView` default.
5. **Override sweep**: replace every explicit `permission_classes=[InstanceAdminPermission]` (run `gitnexus_impact` before editing shared views).
6. Update setup flow.
7. `python run_tests.py -u` green; `makemigrations --check` clean. (Note: `makemigrations --check` validates only the schema migration, NOT the data-migration backfill — the backfill is covered by the forward/reverse unit test in step 1, not by the check.)

## Todo List

- [x] Failing tests (41 tests: registry, fail-closed permission, override-sweep coverage via real endpoints, orphan-filtered backfill, setup)
- [x] Model fields `is_super_admin`, `allowed_menus`
- [x] Data migration `0007_instance_admin_menu_permissions` (backfill `user__isnull=False` admins = super + ALL; ghost rows untouched; zero-admin no-op; reverse op)
- [x] `menu_registry.py` (12 keys, `PREFIX_MENU_MAP`, `SHARED_PREFIXES`, `EXACT_MENU_MAP` for root, resolvers)
- [x] `InstanceAdminMenuPermission` + `BaseAPIView` default swap
- [x] Override sweep: all 21 files (license views + business_calendar + `swing_sso.py` + `instance.py` get_permissions)
- [x] Setup flow → super-admin + ALL menus
- [x] Tests green (41/41; full unit suite at develop baseline), `makemigrations license --check` clean

> Implementation deltas vs plan:
>
> - Root `/api/instances/` mapped via `EXACT_MENU_MAP {"": "settings"}` (PATCH = instance settings; a prefix entry would catch-all and defeat fail-closed). Root GET stays AllowAny on the view.
> - Existing unit/contract admin fixtures updated to `is_super_admin=True` (business calendar, state permissions, usage monitor, user mgmt, slug check, help center) — they relied on the old all-admin model.

## Success Criteria

- [ ] Scoped admin blocked at API for ungranted menus (real 403, not just hidden UI)
- [ ] Super-admin unrestricted
- [ ] Existing admins unaffected (full access preserved post-migration)
- [ ] Menu keys identical to frontend registry
- [ ] Unit tests + migration check pass

## Risk Assessment

- **Unmapped path** is now fail-closed (denies scoped admins) instead of fail-open — but over-denial breaks legit access. Mitigate with the Phase 7 coverage test that **fails the build** if any URL under `/api/instances/` (enumerated from `license/urls.py`) resolves to neither a `PREFIX_MENU_MAP` entry nor a `SHARED_PREFIXES` entry — forcing an explicit decision per route group. The test must also assert **no view still uses bare `InstanceAdminPermission`** (catches a missed override from the C1 sweep).
- **Config menus can't be separated** — general/email/ai/image **and `authentication`** all hit `InstanceConfigurationEndpoint`; grouped under one `settings` permission (H6). These 5 are all-or-nothing in v1; there is no standalone `authentication` key. Splitting would require per-`category` enforcement on the config endpoint (out of scope v1).
- **Route-group vs per-class:** scoping by URL prefix avoids the 74-annotation drift problem and is the only model that survives the explicit-override defect (C1) and reaches out-of-package endpoints like `SwingSSOTestEndpoint` (M11). Risk: a new router group added without a map entry fail-closes — caught by the build test above.
- **Caching**: `InstanceAdminEndpoint.get` uses `cache_response`; per-admin menu changes must invalidate (handled in Phase 5). Permission checks are per-request (no cache) — safe.
- **Two-admin signup block** is unchanged; additional admins are added via management API (Phase 5), not signup.

## Security Considerations

- Default-deny for scoped admins on unknown/unlisted menus.
- Super-admin determination is a stored flag, not inferred — avoids privilege ambiguity.

## Next Steps

- Phase 5 exposes management API + `/admins/me` shape consuming these fields.
