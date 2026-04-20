# Member ViewSets — Decisions, TODOs & Implementation Record

> Covers `WorkSpaceMemberViewSet` and `ProjectMemberViewSet` migration to the `@can` permission system.

---

## Migration Status

| ViewSet                  | Status                                             | Date       |
| ------------------------ | -------------------------------------------------- | ---------- |
| `WorkSpaceMemberViewSet` | Fully migrated (4 of 5 methods; `retrieve` unused) | 2026-02-23 |
| `ProjectMemberViewSet`   | Fully migrated (all 6 methods)                     | 2026-02-23 |

---

## 1. Decisions

### 1.1 Use Resource-Specific Permissions, Not Parent Resource

**Decision:** `list()` uses `WorkspaceMemberPermissions.VIEW` / `ProjectMemberPermissions.VIEW` — not `WorkspacePermissions.VIEW` / `ProjectPermissions.VIEW`.

**Rationale:** Follows the design principle "always check the specific resource permission, not the parent resource." This enables future roles that can access a workspace but not its member list (e.g., a restricted bot account).

**Exception:** `leave()` endpoints use `WorkspacePermissions.VIEW` / `ProjectPermissions.VIEW` because leaving is a self-action — the only gate needed is "are you a member at all?"

### 1.2 Guest Grant for Workspace Member List

**Decision:** Added `WorkspaceMemberPermissions.VIEW` to workspace guest role in `system_roles.py`.

**Rationale:** The FE fetches the member list on workspace init (`workspace-wrapper.tsx` line 149 calls `useSWR` for members). Without this grant, guests get a 403 on workspace load. The old system (`@allow_permission([ADMIN, MEMBER, GUEST])`) allowed guest access. PII is protected via serializer selection — guests receive `WorkSpaceMemberSerializer` (no email/last_login_medium).

### 1.3 Tightened `ProjectMemberViewSet.partial_update()` to Admin-Only

**Decision:** Changed from `@allow_permission([ADMIN, MEMBER, GUEST])` to `@can(ProjectMemberPermissions.CHANGE_ROLE)` which only project admin has.

**Rationale:**

- The old decorator was overly permissive — inline role hierarchy checks prevented non-admins from performing useful operations anyway.
- FE gates the role dropdown to admin only (`allowPermissions([ROLE.ADMIN])`).
- Workspace admin bypass is preserved: workspace admin has `project_member:*` wildcard in `system_roles.py`, granting `project_member:change_role`.
- No behavioral change for any user — purely enforcement alignment.

### 1.4 Inline Business Logic Kept Alongside `@can`

**Decision:** All target-specific business logic (role hierarchy checks, self-action prevention, workspace-project role constraints) is retained as inline code within view methods.

**Rationale:** The `@can` decorator answers "does this user have permission X?" — it cannot answer "does this user have permission to do X _to this specific target member_?" The permission engine has no built-in mechanism for comparing two different members' role levels. Specifically:

| Check                                                  | Why It Can't Be a `@can` Condition                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Role hierarchy (`requesting.role < target.role`)       | Compares two different members' roles — fundamentally different from CREATOR/LEAD which check one user against a resource field |
| Self-action prevention (`user.id == member.member_id`) | Simple identity check — adding a `NOT_SELF` condition would be over-engineering for two methods                                 |
| Workspace↔project role constraint                      | Cross-resource validation (workspace role vs. project role) — permission system operates on single resource                     |
| Seat limit validation                                  | Payment module concern, not permission                                                                                          |
| Last admin protection                                  | Aggregate query (count admins) — not a permission pattern                                                                       |

### 1.5 `leave()` Uses Parent `VIEW` Permission

**Decision:** `leave()` uses `WorkspacePermissions.VIEW` / `ProjectPermissions.VIEW` rather than a dedicated `LEAVE` action.

**Rationale:** Leaving is a self-action. The only meaningful gate is "are you a member?" — which `VIEW` on the parent resource guarantees. Adding `ProjectMemberPermissions.LEAVE` or `WorkspaceMemberPermissions.LEAVE` would be semantically cleaner but adds definition surface area for no functional benefit.

**Possible future change:** If a use case arises where some members should be prevented from leaving (e.g., contractual obligation), a dedicated `LEAVE` action could be added. Currently not needed.

### 1.6 Serializer PII Gating via `role_from_member_role`

**Decision:** Replaced magic number comparisons (`role > 5`, `role > ROLE.GUEST.value`) with symbolic role checks (`role_from_member_role(role) != "guest"`, `project_role_from_member_role(role) != "guest"`).

**Rationale:** Uses the system's official role mapping functions instead of hardcoded numeric thresholds. More readable, survives role value changes.

**What's gated:**

- `WorkspaceMemberAdminSerializer` — includes `email`, `last_login_medium` (PII fields from `UserAdminLiteSerializer`)
- `ProjectMemberAdminSerializer` — includes `email`, `last_login_medium` via same nested serializer
- Guests receive basic serializers without PII in both cases

### 1.7 Role Hierarchy Enforcement Added to `WorkSpaceMemberViewSet.partial_update()`

**Decision:** Added two inline role hierarchy checks that were previously missing (existed in `destroy()` and `ProjectMemberViewSet.partial_update()` but not in workspace `partial_update()`):

1. Cannot modify a member with a strictly higher role
2. Cannot assign a role higher than your own

**Rationale:** Without these checks, an admin (role 20) could theoretically modify an owner (role 25) — the `@can` decorator only checks "has `workspace_member:change_role`" not "target is lower-ranked." The pattern already existed in `destroy()` (line 168) and `ProjectMemberViewSet.partial_update()` (lines 347-355).

---

## 2. TODOs

### 2.1 Custom Role Hierarchy Enforcement

**Location:** `WorkSpaceMemberViewSet.partial_update()` (line 113), `destroy()` (line 186)

**Current state:** Role hierarchy checks use `WorkspaceMember.role` numeric comparison (5/15/20/25). This works for system roles.

**TODO:** When custom role assignment is implemented, hierarchy enforcement must resolve `Role.level` instead of `WorkspaceMember.role` for members with custom roles. The `Role` model has a `level` field (default=10) that exists but isn't wired to member hierarchy checks yet. Utility functions `compare_roles()` and `get_role_level()` exist in `system_roles.py` but operate on role slugs, not numeric member role values.

**Impact:** Low urgency — custom roles are not yet assignable to members. Track alongside the custom roles feature.

### 2.2 Unused `retrieve()` in WorkSpaceMemberViewSet

**Location:** `workspace/member.py` line 79-96
**URL config:** `workspace.py` line 108 (commented out)

**Current state:** Method exists but has no `@can` decorator and is not in the URL config. Marked with `# TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.`

**Action needed:** If the FE ever needs individual member retrieval, apply `@can(WorkspaceMemberPermissions.VIEW, resource_param="pk")` and uncomment the URL. Consider whether `pk` or `workspace_id` is the correct `resource_param` (the engine can resolve workspace from pk via hierarchy).

### 2.3 Unused `ProjectMemberPreferenceEndpoint`

**Location:** `project/member.py` lines 608-631
**URL config:** `project.py` lines 101-106, 142-147 (both commented out)

**Current state:** Class exists with no decorators (stale `@allow_permission` decorators were removed in this migration). URLs are commented out. Marked with `# TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.`

**Action needed:** If re-enabled, apply appropriate `@can` decorator. Consider whether this should use `ProjectMemberPermissions.EDIT` or a dedicated preference permission.

### 2.4 `partial_update` Workspace Admin Flag Uses `ROLE.ADMIN.value`

**Location:** `project/member.py` line 326

```python
is_workspace_admin = workspace_role == ROLE.ADMIN.value
```

**Current state:** This checks if the _target member's_ workspace role is admin (20). Used to allow workspace admins to self-update their project role. The `ROLE` import is kept specifically for this and helper methods.

**TODO:** When the distinction between workspace owner (25) and admin (20) matters for this check, update to include both. Currently workspace owner also has role 20 on Free/Pro/One plans, so this works. On Business/Enterprise, the owner has role 25 and would fail this check — investigate if workspace owners should also be able to self-update their project role.

### 2.5 Bulk Operations and Permission Sync

**Location:** `ProjectMemberViewSet.create()` line 156

```python
project_members = ProjectMember.objects.bulk_create(bulk_project_members, batch_size=10, ignore_conflicts=True)
```

**Current state:** `bulk_create` bypasses `save()` hooks, which means `PermissionSyncMixin` won't fire. The permission sync for newly created members relies on the signal handler (`post_bulk_create` signal in `plane/db/models/project.py`) rather than the mixin.

**TODO:** Verify that the `post_bulk_create` signal handler (`_sync_project_member_permissions`) correctly handles the `ignore_conflicts=True` case — conflicting (already-existing) records may not trigger the signal for role updates. The `bulk_update` on line 117 similarly bypasses `save()` hooks — verify signal coverage.

---

## 3. Implementation Details

### 3.1 Permission Mapping Summary

#### WorkSpaceMemberViewSet

| Method           | Old Decorator                                          | New Decorator                                  | `resource_param` |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------- | ---------------- |
| `list`           | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspaceMemberPermissions.VIEW)`        | `workspace_id`   |
| `retrieve`       | (none — unused)                                        | (none — unused)                                | —                |
| `partial_update` | `@allow_permission([ADMIN], WORKSPACE)`                | `@can(WorkspaceMemberPermissions.CHANGE_ROLE)` | `pk`             |
| `destroy`        | `@allow_permission([ADMIN], WORKSPACE)`                | `@can(WorkspaceMemberPermissions.REMOVE)`      | `pk`             |
| `leave`          | `@allow_permission([ADMIN, MEMBER, GUEST], WORKSPACE)` | `@can(WorkspacePermissions.VIEW)`              | `workspace_id`   |

#### ProjectMemberViewSet

| Method           | Old Decorator                               | New Decorator                                | `resource_param` |
| ---------------- | ------------------------------------------- | -------------------------------------------- | ---------------- |
| `create`         | `@allow_permission([ADMIN])`                | `@can(ProjectMemberPermissions.INVITE)`      | `project_id`     |
| `list`           | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectMemberPermissions.VIEW)`        | `project_id`     |
| `retrieve`       | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectMemberPermissions.VIEW)`        | `pk`             |
| `partial_update` | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectMemberPermissions.CHANGE_ROLE)` | `pk`             |
| `destroy`        | `@allow_permission([ADMIN])`                | `@can(ProjectMemberPermissions.REMOVE)`      | `pk`             |
| `leave`          | `@allow_permission([ADMIN, MEMBER, GUEST])` | `@can(ProjectPermissions.VIEW)`              | `project_id`     |

### 3.2 Role Access Matrix

#### Workspace Member Endpoints

| Action        | W-Owner | W-Admin                           | W-Member                   | W-Guest                    |
| ------------- | ------- | --------------------------------- | -------------------------- | -------------------------- |
| List members  | ✅ `*`  | ✅ `workspace_member:view`        | ✅ `workspace_member:view` | ✅ `workspace_member:view` |
| Update role   | ✅ `*`  | ✅ `workspace_member:change_role` | ❌                         | ❌                         |
| Remove member | ✅ `*`  | ✅ `workspace_member:remove`      | ❌                         | ❌                         |
| Leave         | ✅ `*`  | ✅ `workspace:view`               | ✅ `workspace:view`        | ✅ `workspace:view`        |

#### Project Member Endpoints

| Action      | P-Admin               | P-Contributor            | P-Commenter              | P-Guest                  | W-Admin (bypass)      | W-Owner (bypass) |
| ----------- | --------------------- | ------------------------ | ------------------------ | ------------------------ | --------------------- | ---------------- |
| Invite      | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       | ✅ `project_member:*` | ✅ `*`           |
| List        | ✅ `project_member:*` | ✅ `project_member:view` | ✅ `project_member:view` | ✅ `project_member:view` | ✅                    | ✅               |
| View        | ✅ `project_member:*` | ✅ `project_member:view` | ✅ `project_member:view` | ✅ `project_member:view` | ✅                    | ✅               |
| Update role | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       | ✅ `project_member:*` | ✅ `*`           |
| Remove      | ✅ `project_member:*` | ❌                       | ❌                       | ❌                       | ✅ `project_member:*` | ✅ `*`           |
| Leave       | ✅                    | ✅ `project:view`        | ✅ `project:view`        | ✅ `project:view`        | ✅                    | ✅               |

### 3.3 Inline Business Logic Inventory

#### WorkSpaceMemberViewSet

| Method           | Check                                                | Purpose                                       | Could This Be a `@can` Condition?             |
| ---------------- | ---------------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| `list`           | `role_from_member_role(role) != "guest"`             | PII gating — select admin vs basic serializer | No — data-level filtering, not access control |
| `partial_update` | `request.user.id == workspace_member.member_id`      | Cannot update own role                        | Possible (`NOT_SELF`) but over-engineering    |
| `partial_update` | `requesting_member.role < workspace_member.role`     | Cannot modify higher-ranked member            | No — compares two members' roles              |
| `partial_update` | `int(request.data["role"]) > requesting_member.role` | Cannot assign role higher than own            | No — inspects request body                    |
| `partial_update` | `int(request.data["role"]) == 5` → cascade           | Demote project roles + remove teamspaces      | No — side effect, not access control          |
| `partial_update` | `workspace_member_check()`                           | Seat limit validation                         | No — payment concern                          |
| `destroy`        | `str(member.id) == str(requesting.id)`               | Cannot remove self (use leave)                | Possible (`NOT_SELF`) but over-engineering    |
| `destroy`        | `requesting.role < workspace_member.role`            | Cannot remove higher-ranked member            | No — compares two members' roles              |
| `destroy`        | `Project.objects.annotate(...)` aggregate query      | Last admin protection                         | No — aggregate query                          |
| `leave`          | `workspace_member.role == 20 and count(admins) <= 1` | Cannot leave as sole admin                    | No — aggregate query                          |
| `leave`          | Same project sole-admin check                        | Last admin in projects protection             | No — aggregate query                          |

#### ProjectMemberViewSet

| Method           | Check                                                            | Purpose                                       | Could This Be a `@can` Condition?                   |
| ---------------- | ---------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| `create`         | `workspace_member_role in [20] and project_role in [5, 15]`      | Workspace admin can't get lower project role  | No — cross-resource validation                      |
| `create`         | `workspace_member_role in [5] and project_role in [15, 20]`      | Workspace guest can't get higher project role | No — cross-resource validation                      |
| `retrieve`       | `project_role_from_member_role(role) != "guest"`                 | PII gating — select admin vs basic serializer | No — data-level filtering                           |
| `partial_update` | `request.user.id == member.member_id and not is_workspace_admin` | Cannot self-update (unless WS admin)          | No — compound condition with workspace admin bypass |
| `partial_update` | `workspace_role in [5] and new_role in [15, 20]`                 | Cannot assign project role > workspace role   | No — cross-resource validation                      |
| `partial_update` | `new_role > requesting.role and not is_workspace_admin`          | Cannot assign role > own (unless WS admin)    | No — request body + workspace admin bypass          |
| `destroy`        | `str(member.id) == str(requesting.id)`                           | Cannot remove self                            | Possible but over-engineering                       |
| `destroy`        | `requesting.role < member.role`                                  | Cannot remove higher-ranked                   | No — compares two members' roles                    |
| `leave`          | `role == 20 and count(admins) <= 1`                              | Cannot leave as sole admin                    | No — aggregate query                                |

### 3.4 Grant Changes Made

| Role            | Permission Added                  | File              | Rationale                                                                 |
| --------------- | --------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| Workspace Guest | `WorkspaceMemberPermissions.VIEW` | `system_roles.py` | FE fetches member list on workspace init; old system allowed guest access |

No other grant changes were needed. All project roles already had `project_member:view`. Project admin already had `project_member:*` wildcard.

### 3.5 Import Changes

#### `workspace/member.py`

```python
# Removed:
from plane.app.permissions import allow_permission, ROLE

# Added:
from plane.permissions import WorkspacePermissions, WorkspaceMemberPermissions, can
from plane.permissions.system_roles import role_from_member_role
```

#### `project/member.py`

```python
# Removed:
from plane.app.permissions.base import allow_permission, ROLE
# ↓ Changed to:
from plane.app.permissions.base import ROLE  # Retained — used by helper methods + other classes

# Added:
from plane.permissions import WorkspacePermissions, ProjectPermissions, ProjectMemberPermissions, can
from plane.permissions.system_roles import project_role_from_member_role
```

### 3.6 Endpoints NOT Migrated (Intentionally)

| Endpoint                                    | File                  | Reason                                                                         |
| ------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ |
| `WorkSpaceMemberViewSet.retrieve()`         | `workspace/member.py` | Unused by FE; URL commented out; no decorator applied                          |
| `ProjectMemberPreferenceEndpoint.get/patch` | `project/member.py`   | Unused by FE; URLs commented out; stale `@allow_permission` decorators removed |

### 3.7 Related Endpoints (Already Migrated, Unchanged)

These endpoints in the same files were already using `@can` and were not modified:

| Endpoint                                      | Decorator                         | Notes                                |
| --------------------------------------------- | --------------------------------- | ------------------------------------ |
| `WorkspaceMemberUserViewsEndpoint.post`       | `@can(WorkspacePermissions.VIEW)` | Self-scoped                          |
| `WorkspaceMemberUserEndpoint.get`             | `@can(WorkspacePermissions.VIEW)` | Self-scoped                          |
| `WorkspaceMemberUserOnboardingEndpoint.patch` | `@can(WorkspacePermissions.VIEW)` | Self-scoped                          |
| `WorkspaceProjectMemberEndpoint.get`          | `@can(WorkspacePermissions.VIEW)` | Self-scoped                          |
| `ProjectMemberUserEndpoint.get`               | `@can(ProjectPermissions.VIEW)`   | Self-scoped with teamspace elevation |
| `UserProjectRolesEndpoint.get`                | `@can(WorkspacePermissions.VIEW)` | Returns project→role mapping         |

### 3.8 Teamspace Integration (Project Members)

The `ProjectMemberViewSet.list()` endpoint has significant teamspace integration that was not modified during migration:

1. `get_teamspace_members()` — checks feature flag, queries `TeamspaceProject` → `TeamspaceMember`
2. `_process_direct_members()` — elevates direct members to `ROLE.MEMBER.value` (15) if also in a teamspace
3. `_process_teamspace_only_members()` — creates synthetic member entries with `ROLE.MEMBER.value` for teamspace-only access

These helper methods use `ROLE.MEMBER.value` for data processing (role elevation), not for permission checks — this is why the `ROLE` import is retained.

---

## 4. Files Modified

| File                                           | Changes                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/api/plane/permissions/system_roles.py`   | Added `WorkspaceMemberPermissions.VIEW` to workspace guest                                               |
| `apps/api/plane/app/views/workspace/member.py` | Migrated `list`, `partial_update`, `destroy`; updated imports; added role hierarchy to `partial_update`  |
| `apps/api/plane/app/views/project/member.py`   | Migrated all 6 methods; updated imports; removed stale decorators from `ProjectMemberPreferenceEndpoint` |
| `docs/permissions/PERMISSION_MIGRATION.md`     | Full migration entries for both viewsets                                                                 |
| `docs/permissions/PERMISSION_MATRIX.md`        | Updated role access tables for workspace + project members                                               |
| `designs/permissions/plan-view-migration.md`   | Updated status to fully migrated for both viewsets                                                       |

---

## 5. Verification Checklist

### Workspace Members

- [ ] `has_permission_pattern("guest", "workspace_member:view", "workspace")` returns `True`
- [ ] Guest: `GET /workspaces/<slug>/members/` → 200 (basic serializer, no email)
- [ ] Member: `GET /workspaces/<slug>/members/` → 200 (admin serializer, with email)
- [ ] Admin: `PATCH /workspaces/<slug>/members/<pk>/` → 200
- [ ] Member: `PATCH /workspaces/<slug>/members/<pk>/` → 403
- [ ] Admin: `DELETE /workspaces/<slug>/members/<pk>/` → 204
- [ ] Admin self-delete → 400
- [ ] Admin modify owner → 400 (role hierarchy)
- [ ] Admin assign role > own → 400 (role hierarchy)
- [ ] Any role: `POST /workspaces/<slug>/members/leave/` → 204 (unless sole admin)
- [ ] FE smoke: log in as guest, verify workspace loads without 403

### Project Members

- [ ] Project Admin: `POST /members/` → 201
- [ ] Contributor: `POST /members/` → 403
- [ ] All roles: `GET /members/` → 200
- [ ] Guest: `GET /members/<pk>/` → 200 (limited serializer)
- [ ] Admin: `PATCH /members/<pk>/` → 200
- [ ] Contributor: `PATCH /members/<pk>/` → 403
- [ ] Admin: `DELETE /members/<pk>/` → 204
- [ ] Admin self-delete → 400
- [ ] Workspace Admin (non-project-member): `PATCH /members/<pk>/` → 200 (via `project_member:*` bypass)
- [ ] All roles: `POST /members/leave/` → 204 (unless sole admin)
- [ ] FE smoke: verify project members load for all roles, role editing restricted to admin

### Regression

- [ ] `pytest plane/tests/ -k "workspace_member or project_member or permission"`
- [ ] No `allow_permission` references remain in `workspace/member.py`
- [ ] `ROLE` import absent from `workspace/member.py`, present in `project/member.py` (used by helpers)

---

## 6. Previous Migration Attempt (Context)

The `ProjectMemberViewSet` migration was previously attempted and reverted. The blockers were:

1. **Target-specific role hierarchy checks** — e.g., "can't remove a member with a higher role" — cannot be expressed in `@can` because the decorator only evaluates the requesting user against a resource, not the requesting user against another user.

2. **Workspace admin bypass in `partial_update`** — workspace admins can self-update their project role, which requires cross-checking the workspace membership model.

**Resolution in current migration:** Inline validation is kept alongside `@can`. The decorator gates coarse-grained access ("do you have the `change_role` permission at all?"), while inline code handles fine-grained target-specific rules ("is the target lower-ranked than you?"). This separation is clean and documented.
