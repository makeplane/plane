# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For comprehensive documentation including frontend usage, migration guide, and testing examples, see `docs/PERMISSION_SYSTEM.md`.

## Overview

Hybrid RBAC + GAC permission system inspired by Google Zanzibar. Three-level scoping: Instance → Workspace → Project.

## Architecture

```
permissions/
├── definitions.py            # ResourceType, Action enums, static Permission classes,
│                             # WildcardGrant, FULL_ACCESS, auto-derived RESOURCE_ACTIONS
├── permission_schemes.py     # System PS definitions, deduplicate_conditionals()
├── engine/                   # Permission engine subpackage
│   ├── core.py               # PermissionEngine facade - composed from focused helpers
│   ├── hierarchy.py          # HierarchyResolver - builds resource→parent chains, IDOR validation
│   ├── tuples.py             # TupleFetcher - prefetches ResourcePermission tuples + link relations
│   ├── resolver.py           # PermissionResolver - the Zanzibar deny→grant→role→conditions loop
│   ├── roles.py              # RoleLookup - compiled O(1) system roles, cached/DB custom roles
│   ├── conditions.py         # ConditionEvaluator - creator, lead condition handlers
│   └── queries.py            # PermissionQueries - accessible resources, permission matrices
├── resource_models.py        # Resource type → Django model registry (get_model_for_resource)
├── grants.py                 # Grant dataclass + grant/revoke/bulk_grant operations
├── cache.py                  # Cache invalidation (versioned per-user keys, O(1) invalidation)
├── context.py                # PermissionContext, AccessResult, ResourceID
├── sync.py                   # PermissionSyncMixin - model→ResourcePermission sync
├── decorators.py             # @can decorator, HasResourcePermission DRF class, shared helpers
├── system_roles.py           # Built-in roles with typed permission grants (WildcardGrant, FULL_ACCESS)
├── inheritance.py            # Resource hierarchy (auto-derived children + scope groupings), startup validation
├── serializers.py            # API serializers
├── views.py                  # REST API views
└── urls.py                   # URL routes

# Related middleware (plane/middleware/):
middleware/
└── workspace.py       # WorkspaceResolverMiddleware - resolves slug→workspace once per request
```

## Permission Schemes

Roles are composed of Permission Schemes (PS). A PS is a named, reusable
collection of permissions. Effective permissions = union of all PS in the role.

### System PS

Each system role maps 1:1 to a single system PS defined in code
(`permission_schemes.py`). Adding permissions to a system role is a code change.

### Custom PS

Created by workspace admins. Custom roles compose from any mix of system + custom PS.

### Key Files

- `permission_schemes.py` — System PS definitions + `deduplicate_conditionals()`
- `system_roles.py` — Roles reference PS slugs via `permission_schemes` key

### Union Semantics

When combining permissions across PS, unconditional wins over conditional:
`{"workitem:delete", "workitem:delete+creator"}` → `{"workitem:delete"}`

### Adding a New Resource Type

1. Add to `ResourceType` enum in `definitions.py`
2. Add a static permission class in `definitions.py`
   (`_PERMISSION_CLASSES` registry and `RESOURCE_ACTIONS` are auto-derived — no manual entry needed)
3. Add to `_PARENT_DECLARATIONS` in `inheritance.py` (children + scope groupings are auto-derived)
4. Add model mapping in `resource_models.py` (if needed for condition evaluation)
5. Add role permissions in `system_roles.py` using typed grants:
   - `Permission` objects for specific actions (e.g., `WorkitemPermissions.VIEW`)
   - `WildcardGrant(ResourceType.X)` for full access to a resource type (replaces `"resource:*"` strings)
   - `Permission & Condition.CREATOR` for conditional grants
6. Export in `__init__.py`

`validate_permission_system_consistency()` runs at startup and catches missing
entries in steps 1-3.

### Key Design: No Raw Strings in Role Definitions

Role permission lists in `system_roles.py` use typed objects exclusively:

- `WorkitemPermissions.VIEW` — specific permission (IDE autocomplete, type-checked)
- `WildcardGrant(ResourceType.WORKITEM)` — all actions on a resource type (validates ResourceType exists)
- `FULL_ACCESS` — grant everything (replaces `"*"`)
- `WorkitemPermissions.DELETE & Condition.CREATOR` — conditional grant

This means a typo like `WildcardGrant(ResourceType.WORKITME)` fails at import time,
not silently at runtime.

## Permission Resolution (Zanzibar-style)

0. Resource ownership validation → raise `PermissionDenied` if workspace_id or project_id from URL doesn't match DB
1. Explicit DENY → `False`
2. Explicit GRANT → `True`
3. Role permissions → resolve via system/custom roles
4. Conditional grants (e.g., `+creator`) → evaluate condition against resource
   4a. Conditional grants with `defer_conditions=True` → return `AccessResult` with conditions (no evaluation)
5. Link relations → tuple traversal (e.g., teamspace→project)
6. Inherited permissions → recurse up hierarchy
7. Default → `False`

**Ownership validation:** `_build_hierarchy_chain()` always resolves parents from DB and compares against caller-provided `workspace_id`/`project_id`. Mismatches raise `PermissionDenied` (prevents cross-workspace/project access via crafted URLs). The `@can` decorator and `HasResourcePermission` pass both IDs automatically. Programmatic callers pass `project_id=None` by default to skip project validation.

## System Roles

**Workspace Roles:**

Workspace roles differ by plan tier:

| Plan                  | Available Roles             |
| --------------------- | --------------------------- |
| Free / Pro / One      | Owner, Member, Guest        |
| Business / Enterprise | Owner, Admin, Member, Guest |

| Role   | Level | Plans                      | Description                                                                                     |
| ------ | ----- | -------------------------- | ----------------------------------------------------------------------------------------------- |
| owner  | 25    | All                        | Full control including workspace deletion and ownership transfer                                |
| admin  | 20    | Business / Enterprise only | Manage workspace settings, users, projects, and integrations (cannot delete/transfer workspace) |
| member | 15    | All                        | View-only access to workspace resources                                                         |
| guest  | 5     | All                        | View workspace and project list only                                                            |

On Free/Pro/One plans, all `WorkspaceMember.role=20` users get the Owner relation (Admin role does not exist on these plans). On Business/Enterprise, only the workspace creator (`Workspace.owner` FK) gets Owner; other role=20 members get Admin.

**Project Roles:**

| Role        | Level | Description                                                           |
| ----------- | ----- | --------------------------------------------------------------------- |
| admin       | 20    | Full control over project settings, members, and all content          |
| contributor | 15    | Create/edit issues, modules, cycles, pages, views; delete own content |
| commenter   | 10    | View issues, add comments, create intake issues                       |
| guest       | 5     | View pages/views, submit intake forms, add attachments                |

**Auto-Join Role Mapping:**

When a workspace member joins a public project, their project role is derived from
their workspace role slug (not level):

- `owner` / `admin` → project `admin`
- `guest` → project `guest`
- Everything else (member, custom roles) → project `contributor`

Helper: `resolve_project_role_for_ws_member()` in `system_roles.py`
Ceiling: `enforce_project_role_ceiling()` — workspace guests capped at commenter for explicit assignment

## Usage

### Design Principle

**Always check the specific resource permission, not the parent resource.**

```python
# CORRECT: workitem:view for listing issues
@can(WorkitemPermissions.VIEW, resource_param='project_id')

# WRONG: project:view for listing issues
@can(ProjectPermissions.VIEW, resource_param='project_id')
```

This enables future roles with parent access but not child access (e.g., project metadata without issue access).

### @can Decorator

The `@can` decorator requires a Permission object (e.g., `WorkitemPermissions.VIEW`).

```python
from plane.permissions import can, WorkitemPermissions, ProjectPermissions, CommentPermissions
from plane.permissions import WikiPermissions, WorkspaceWorkitemViewPermissions

# Basic permission check
@can(WorkitemPermissions.VIEW, resource_param='pk')
def retrieve(self, request, pk): ...

@can(WorkitemPermissions.EDIT, resource_param='pk')
def partial_update(self, request, pk): ...

@can(ProjectPermissions.MANAGE, resource_param='pk')
def update_settings(self, request, pk): ...

# Wiki pages
@can(WikiPermissions.VIEW, resource_param='pk')
def retrieve_wiki(self, request, pk): ...

# Workspace views (saved filters at workspace level)
@can(WorkspaceWorkitemViewPermissions.VIEW, resource_param='pk')
def retrieve_workspace_view(self, request, pk): ...

# Creator-based permissions are handled via conditional grants in system_roles.py
# (e.g., WorkitemPermissions.DELETE & Condition.CREATOR for contributor role)
# No special decorator parameter needed — the engine evaluates them automatically.
@can(WorkitemPermissions.DELETE, resource_param='pk')
def destroy(self, request, pk): ...

# List endpoints with conditional grants: defer condition evaluation to queryset
@can(WorkitemPermissions.VIEW, resource_param='project_id', defer_conditions=True)
def list(self, request, slug, project_id):
    ...

def get_queryset(self):
    from plane.permissions import get_permission_conditions
    qs = Issue.issue_objects.filter(...)
    conditions = get_permission_conditions(self.request)
    if 'creator' in conditions:
        qs = qs.filter(created_by=self.request.user)
    return qs

# Creator-only business rules (admin cannot override) — use inline checks:
@can(WorkspaceWorkitemViewPermissions.EDIT, resource_param='pk')
def partial_update(self, request, slug, pk):
    view = IssueView.objects.get(pk=pk)
    if view.created_by_id != request.user.id:
        raise PermissionDenied("Only the creator can edit this view")
    ...
```

### `resource_param` + Ownership Validation Decision Tree

When adding `@can` to a view, choose `resource_param` based on this decision tree:

1. **Permission type matches child resource?** (e.g., `PagePermissions.VIEW` + `page_id` in URL)
   → Use `resource_param=child_id`. The engine validates the full hierarchy chain automatically (page→project→workspace).

2. **Permission type is parent/scope type?** (e.g., `TeamspacePermissions.VIEW` + `page_id` in URL)
   → Use `resource_param=scope_id` (e.g., `team_space_id`). Add an **inline ownership check** for the child resource (bridge table lookup or queryset filter) to prevent IDOR.

3. **List/create endpoint?** (no child ID in URL)
   → Use `resource_param=parent_id`. No child validation needed.

**Examples:**

```python
# Case 1: permission matches child — engine validates chain
@can(PagePermissions.VIEW, resource_param="page_id")
def get(self, request, slug, project_id, page_id): ...

# Case 2: permission is parent scope — add inline bridge check
@can(TeamspacePermissions.VIEW, resource_param="team_space_id")
def get(self, request, slug, team_space_id, pk=None):
    if pk:
        if not TeamspacePage.objects.filter(page_id=pk, team_space_id=team_space_id).exists():
            return Response({"error": "..."}, status=400)
        ...

# Case 3: list/create — use parent
@can(WorkitemPermissions.VIEW, resource_param="project_id")
def list(self, request, slug, project_id): ...
```

### Programmatic Check

```python
from plane.permissions import permission_engine, WorkitemPermissions, AccessResult

result = permission_engine.check(
    user=request.user,
    permission=WorkitemPermissions.EDIT,
    resource_id=issue_id,
    workspace_id=workspace_id,
)
# result is AccessResult; bool(result) is True for unconditional allow
# result.allowed is True if permitted (unconditional or conditional)
# result.conditions is tuple of deferred conditions (e.g., ('creator',))
```

### Creator Permission Patterns

| Pattern               | Mechanism                                           | Behavior                                                | Use Case                        |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| Conditional grants    | `Permission & Condition.CREATOR` in system_roles    | Role grants permission only if user is resource creator | Issues, Modules, Cycles, Views  |
| Deferred conditionals | `defer_conditions=True` on `@can` + queryset filter | View passes gate, queryset filters by condition         | Issue list for guest role       |
| Inline creator check  | `if obj.created_by_id != request.user.id` in view   | ONLY creator (admin cannot override) — business rule    | View EDIT (workspace + project) |

### Deferred Conditions Enforcement

When `defer_conditions=True` is used, conditions are stored on a **private** attribute `request._permission_conditions`. Views **must** use the `get_permission_conditions()` helper to read them:

```python
from plane.permissions import get_permission_conditions

conditions = get_permission_conditions(request)  # marks conditions as consumed
if 'creator' in conditions:
    queryset = queryset.filter(created_by=request.user)
```

**Enforcement:** `finalize_response` in `BaseViewSet` and `BaseAPIView` checks that non-empty conditions were consumed. If a view forgets to call the helper, a `PermissionDenied` is raised. This prevents conditional grants (e.g., creator-only) from silently becoming unconditional.

**Do NOT** access `request._permission_conditions` directly — always use the helper.

## Permission Sync (Model → ResourcePermission)

Membership models sync to `ResourcePermission` via `PermissionSyncMixin` (in `plane/permissions/sync.py`), which calls `PermissionEngine.grant()` and `revoke()`.

Each model file defines its own bulk signal handler connected to `post_bulk_create`/`post_bulk_update` (from `plane.db.signals`).

### Flow

```
WorkspaceMember.save()
  → ChangeTrackerMixin detects role/deleted_at change
  → PermissionSyncMixin._sync_to_resource_permission()
    → PermissionEngine(use_cache=False).grant() or .revoke()
      → ResourcePermission created/updated/soft-deleted
      → PermissionAuditLog entry created
```

### Models Using PermissionSyncMixin

| Model              | File                           | Signal Handler                       |
| ------------------ | ------------------------------ | ------------------------------------ |
| `WorkspaceMember`  | `plane/db/models/workspace.py` | `_sync_workspace_member_permissions` |
| `ProjectMember`    | `plane/db/models/project.py`   | `_sync_project_member_permissions`   |
| `TeamspaceMember`  | `plane/ee/models/teamspace.py` | `_sync_teamspace_permissions`        |
| `TeamspaceProject` | `plane/ee/models/teamspace.py` | `_sync_teamspace_permissions`        |

### grant() Behavior

- Uses `update_or_create()` with lookup keys: `(subject_type, subject_id, resource_type, resource_id)`
- Role changes update in place (same record ID, new relation)
- Restores soft-deleted records (sets `deleted_at=None` via defaults)
- Logs `"grant"` for new records, `"modify"` for updates

### revoke() Behavior

- Finds active permission matching `(subject_type, subject_id, resource_type, resource_id)`
- Soft-deletes the record
- Logs `"revoke"` with `relation_before`
- Returns `False` if no matching permission exists

### Cache Strategy

- Sync operations use `PermissionEngine(use_cache=False)` — bypasses read cache
- Permission checks use versioned cache keys (`perm:{user_id}:v{version}:{action}:{resource_type}:{resource_id}`) with 5-minute TTL (`PERMISSION_CACHE_TTL = 300`)
- `_invalidate_cache_for_user()` increments per-user version counter (`perm_v:{user_id}`), immediately orphaning stale entries — O(1) invalidation
- `_invalidate_cache_for_resource()` handled indirectly via Role's `ChangeTrackerMixin`
- Role permissions cached for 24 hours (`ROLE_CACHE_TTL = 86400`), actively invalidated on Role model save

## Troubleshooting

```python
# Check user's permissions
from plane.db.models import ResourcePermission
ResourcePermission.objects.filter(subject_type="user", subject_id=user.id, deleted_at__isnull=True)

# Verify role has permission (using compiled O(1) lookup)
from plane.permissions.system_roles import get_compiled_permissions
compiled = get_compiled_permissions("contributor", "project")
compiled.has_permission("workitem:edit")      # True
compiled.get_conditions("workitem:delete")    # ["creator"]

# Clear permission cache
from django.core.cache import cache
cache.clear()
```
