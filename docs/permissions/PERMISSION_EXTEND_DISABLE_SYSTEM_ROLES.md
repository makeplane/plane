# Per-Workspace System Roles: Extend & Disable

## Context

The permission engine resolves system role permissions from in-memory definitions in `system_roles.py` via `get_system_role_permission_set()` (fast path, zero DB queries). Per-workspace system Role rows exist in the DB but their `permissions` field is `[]` — the engine never reads it for system roles.

**Question:** Are per-workspace system Role rows still useful?

**Answer: Yes** — they serve as the per-workspace state layer for two new features:

1. **Extend system roles** — users create new custom roles by cloning a system role's permissions (one-time copy)
2. **Disable system roles** — workspace admins can deactivate system roles they don't want, with forced reassignment of existing members

## Design Decisions

| Decision            | Choice               | Rationale                                                                                                                   |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Inheritance model   | **One-time copy**    | Clone permissions into an independent custom role. No ongoing sync with upstream.                                           |
| Disable behavior    | **Force reassign**   | Disabling requires a fallback role. All affected members auto-migrate.                                                      |
| Engine fast path    | **Preserved**        | Zero-cost for uncustomized workspaces. Force reassign eliminates disabled-role tuples, so the engine never encounters them. |
| Provenance tracking | **Store `based_on`** | New field on Role for UI display ("Based on Contributor"). Informational only.                                              |

---

## Feature 1: Extend System Roles (One-Time Copy)

### Overview

A workspace admin selects a system role as a "template" and creates a new custom role pre-populated with that system role's permissions. The new role is fully independent — changes to the system role definition in `system_roles.py` do NOT propagate.

### Data Model Changes

**`Role` model** (`plane/db/models/permission.py`):

```python
# New field
based_on = models.SlugField(
    max_length=100,
    null=True,
    blank=True,
    help_text="System role slug this role was cloned from (informational only)",
)
```

- Nullable — only set for custom roles created via "extend"
- Not a FK — just stores the slug string (e.g., `"contributor"`)
- Purely informational — the engine never reads this field

### Flow

1. **API request:** `POST /api/workspaces/{slug}/roles/`

   ```json
   {
     "name": "Senior Contributor",
     "based_on": "contributor",
     "namespace": "project"
   }
   ```

2. **Backend logic** (in `RoleSerializer.create()`):
   - Validate `based_on` is a valid system role slug for the given namespace (check against `SYSTEM_ROLES[namespace]`)
   - Call `get_system_role_permissions(based_on, namespace)` to get the permission strings
   - Create a new `Role(is_system=False, permissions=[...copied...], based_on=based_on)`
   - The admin can then modify permissions via `PATCH` as with any custom role

3. **If `based_on` is not provided:** existing behavior — create with explicitly provided permissions (or empty)

### Engine Impact

**None.** The new role is `is_system=False`, so it follows the existing custom role slow path (`Role.objects.get(workspace_id, namespace, slug)` → read `permissions` from DB).

### Serializer Changes

- Add `based_on` and `status` to `RoleSerializer.fields`
- Add `validate_based_on()` to check against `SYSTEM_ROLES` keys for the given namespace
- `based_on` is writable on create, read-only on update (raise `ValidationError` if present in PATCH)
- In `create()`: if `based_on` is set and `permissions` is not provided, auto-populate from system role definition

### API Response

```json
{
  "id": "uuid",
  "name": "Senior Contributor",
  "slug": "senior-contributor",
  "namespace": "project",
  "based_on": "contributor",
  "permissions": {"issue:view": true, "issue:create": true, ...},
  "is_system": false,
  "status": "active",
  "level": 10,
  "sort_order": 65535
}
```

---

## Feature 2: Disable System Roles

### Overview

A workspace admin can deactivate a system role (e.g., "commenter") for their workspace. All members currently assigned that role are force-reassigned to a chosen fallback role. New members cannot be assigned the disabled role.

### Key Insight: No Engine Hot-Path Changes

Since force reassignment migrates ALL existing members and their `ResourcePermission` tuples to the fallback role, there are zero tuples referencing the disabled role slug after the operation. The engine's fast path never encounters the disabled role — **no changes to `_get_cached_role_permissions()` or the in-memory lookup**.

The `status="inactive"` flag serves only to:

- Block new role assignments (application-level validation)
- Show disabled state in the admin UI

### Data Model Changes

**`Role` model:**

- `status` field already exists with `active`/`inactive` choices — **no schema change needed**
- Add `status` to `TRACKED_FIELDS` so `ChangeTrackerMixin` detects changes:
  ```python
  TRACKED_FIELDS = ["permissions", "deleted_at", "status"]
  ```

**`RoleSerializer`:**

- Add `status` to `fields` (currently excluded)
- For system roles, allow `status` and `sort_order` updates (currently only `sort_order` is allowed)

### Required Roles (Non-Disableable)

Add a `REQUIRED_ROLES` constant to `system_roles.py`:

```python
REQUIRED_ROLES: dict[str, frozenset[str]] = {
    "instance": frozenset(["admin"]),
    "workspace": frozenset(["owner", "admin"]),
    "project": frozenset(["admin"]),
}
```

These roles cannot be disabled — they are always required for workspace/project management.

Also add helper functions:

```python
def is_required_role(role_slug: str, namespace: str = "workspace") -> bool:
    """Check if a system role is required (cannot be disabled)."""
    return role_slug in REQUIRED_ROLES.get(namespace, frozenset())

def is_system_role(role_slug: str, namespace: str = "workspace") -> bool:
    """Check if a slug corresponds to a system role in the given namespace."""
    return role_slug in SYSTEM_ROLE_SLUGS.get(namespace, frozenset())
```

### Disable Flow

1. **API request:** `PATCH /api/workspaces/{slug}/roles/{role_id}/`

   ```json
   {
     "status": "inactive",
     "fallback_role_slug": "contributor"
   }
   ```

2. **Validation:**
   - Role must be `is_system=True` (custom roles use soft-delete instead)
   - Cannot disable required roles (checked against `REQUIRED_ROLES`)
   - `fallback_role_slug` is required when setting `status="inactive"`
   - Fallback must be an active role in the same namespace
   - Fallback must be different from the role being disabled

3. **Member reassignment** (in a `transaction.atomic()` block):

   **a. For workspace-namespace roles:**

   ```python
   # Update ResourcePermission tuples
   ResourcePermission.objects.filter(
       workspace=workspace,
       resource_type="workspace",
       relation=disabled_role.slug,
       deleted_at__isnull=True,
   ).update(relation=fallback_role.slug)

   # Update WorkspaceMember integer role field
   fallback_int = ROLE_LEVEL_MAP[fallback_role.slug]
   WorkspaceMember.objects.filter(
       workspace=workspace,
       role=ROLE_LEVEL_MAP[disabled_role.slug],
       is_active=True,
       deleted_at__isnull=True,
   ).update(role=fallback_int)
   ```

   **b. For project-namespace roles:**

   ```python
   # Same pattern but for project-level tuples
   ResourcePermission.objects.filter(
       workspace=workspace,
       resource_type="project",
       relation=disabled_role.slug,
       deleted_at__isnull=True,
   ).update(relation=fallback_role.slug)

   fallback_int = PROJECT_ROLE_LEVEL_MAP[fallback_role.slug]
   ProjectMember.objects.filter(
       workspace=workspace,
       role=PROJECT_ROLE_LEVEL_MAP[disabled_role.slug],
       is_active=True,
       deleted_at__isnull=True,
   ).update(role=fallback_int)
   ```

4. **Mark role inactive:** `Role.status = "inactive"` → `save()` triggers cache invalidation

5. **Invalidate permission caches** for affected users (their ResourcePermission tuples changed):
   ```python
   for user_id in affected_user_ids:
       version_key = f"perm_v:{user_id}"
       try:
           cache.incr(version_key)
       except ValueError:
           cache.set(version_key, 1)
   ```

### Preventing New Assignments to Disabled Roles

**PermissionSyncMixin** (`sync.py`):

- Add `_check_role_not_disabled(relation, workspace_id)` method
- Called in `_sync_to_resource_permission()` before calling `engine.grant()`
- Uses a cached lookup (`disabled_roles:{workspace_id}` → `set(["commenter", ...])`, 5-min TTL)
- If the relation slug is found in the disabled set, raise `ValidationError`
- Cache is invalidated when any Role's status changes (via `_invalidate_role_cache()` on the Role model)

### Re-enabling a Disabled Role

```json
PATCH /api/workspaces/{slug}/roles/{role_id}/
{ "status": "active" }
```

- No `fallback_role_slug` needed
- Simply marks the role as active again
- No member migration needed — new members can now be assigned this role

---

## Files to Modify

| File                                | Changes                                                                                                                                                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plane/db/models/permission.py`     | Add `based_on` field; add `"status"` to `TRACKED_FIELDS`; invalidate `disabled_roles` cache in `_invalidate_role_cache()`                                                                                                        |
| `plane/permissions/system_roles.py` | Add `REQUIRED_ROLES` constant; add `is_required_role()` and `is_system_role()` helpers                                                                                                                                           |
| `plane/permissions/serializers.py`  | Add `based_on` and `status` to fields; add `validate_based_on()`; enforce `based_on` read-only on update; allow `status` in system role updates; auto-populate permissions from `based_on` in `create()`                         |
| `plane/permissions/views.py`        | Refactor `create()` to use serializer context; add `_handle_system_role_status_change()` with force-reassign logic; add `_reassign_workspace_members()` / `_reassign_project_members()` / `_invalidate_affected_users()` helpers |
| `plane/permissions/sync.py`         | Add `_check_role_not_disabled()` method; call it in `_sync_to_resource_permission()` before granting                                                                                                                             |
| `plane/permissions/__init__.py`     | Export new `REQUIRED_ROLES`, `is_required_role`, `is_system_role`                                                                                                                                                                |
| `plane/db/migrations/0122_*.py`     | Add `based_on` SlugField to Role model                                                                                                                                                                                           |

---

## Per-Workspace System Role Rows: Verdict

**Keep them.** They serve as the per-workspace state layer:

| Purpose                       | Field Used                           | Feature                                        |
| ----------------------------- | ------------------------------------ | ---------------------------------------------- |
| Disable/enable system roles   | `status`                             | Feature 2                                      |
| Unique constraint enforcement | `(workspace, namespace, slug)`       | Prevents custom role slug collisions           |
| Admin API listing             | All display fields                   | Both features — UI shows all roles             |
| `is_system` mutation guard    | `is_system`                          | Prevents editing system role permissions       |
| Template source display       | Listed in API alongside custom roles | Feature 1 — users pick a system role to extend |

**The `permissions` field on system Role rows stays `[]`.** It is still dead data for system roles. The in-memory `system_roles.py` definitions remain the single source of truth for system role permissions. The per-workspace Role rows provide workspace-scoped _metadata_ (status, existence), not permission definitions.

---

## Open Questions

1. **Which system roles are non-disableable?** Proposed: `owner` and `admin` at workspace level, `admin` at project level. Should `guest` also be protected?

2. **Integer role field on membership models:** The force-reassign updates both `ResourcePermission.relation` (string slug) and `WorkspaceMember.role` / `ProjectMember.role` (integer). The integer mapping is global, not per-workspace. If "commenter" (10) is disabled, `bulk_update(role=15)` works. But if we later add more system roles or custom roles, the integer mapping becomes a bottleneck. This is a known limitation of the legacy integer system — eventual migration to slug-based assignment is out of scope here.

3. **Audit trail:** Should role disable/enable and force reassignment be logged in `PermissionAuditLog`? The model already exists in `permission.py` with `action`, `actor`, `subject_type/id`, `resource_type/id`, `relation_before/after`, and `metadata` fields.

4. **Bulk operations:** `bulk_update()` on WorkspaceMember/ProjectMember bypasses `save()` hooks (PermissionSyncMixin). The force-reassign flow updates ResourcePermission tuples directly (not via sync), so this is handled. But we should document this pattern.

5. **Teamspace resource type:** `PermissionSyncMixin` is also used by `TeamspaceMember` with `PERMISSION_RESOURCE_TYPE = "teamspace"`. The `_check_role_not_disabled()` method maps resource types to namespaces — `teamspace` doesn't map to a system role namespace, so the check is skipped (teamspace members use their own relation, not system role slugs).
