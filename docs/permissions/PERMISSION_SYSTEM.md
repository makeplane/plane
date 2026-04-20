# Plane Permission System (RBAC + GAC)

## Overview

This document describes the new **Role-Based Access Control (RBAC)** and **Granular Access Control (GAC)** permission system implemented in Plane. The system is inspired by Google's Zanzibar authorization system and provides enterprise-grade access control while maintaining excellent developer experience.

### Key Features

- **Relationship-Based Access Control (ReBAC)**: Everything is a relationship tuple `(subject, relation, resource)`
- **Hierarchical Inheritance**: Permissions cascade from workspace → project → resources
- **Link Relations (Tuple Traversal)**: Indirect access via linked resources (e.g., teamspace membership grants project access)
- **Custom Roles**: Workspace admins can create custom roles with specific permission sets
- **Resource-Level Permissions (GAC)**: Grant/deny specific permissions on individual resources
- **Backwards Compatible**: Existing ADMIN/MEMBER/GUEST roles continue to work
- **Audit Logging**: Full audit trail of permission changes

---

## Permission Strings

Permission strings use a flat **`resource:action`** format. Each string uniquely identifies a permission by combining the resource type and the action.

### Format

```
resource:action
```

Examples: `issue:view`, `project:edit`, `workspace:manage`, `wiki:create`

### All Permissions

**Workspace-level resources:**

| Permission String                | Description                        |
| -------------------------------- | ---------------------------------- |
| `workspace:view`                 | View workspace                     |
| `workspace:edit`                 | Edit workspace settings            |
| `workspace:delete`               | Delete workspace                   |
| `workspace:manage`               | Manage workspace                   |
| `workspace:invite`               | Invite to workspace                |
| `workspace_member:view`          | View workspace members             |
| `workspace_member:invite`        | Invite workspace members           |
| `workspace_member:edit`          | Edit workspace members             |
| `workspace_member:delete`        | Remove workspace members           |
| `workspace_member:change_role`   | Change workspace member role       |
| `wiki:view`                      | View wiki pages                    |
| `wiki:create`                    | Create wiki pages                  |
| `wiki:edit`                      | Edit wiki pages                    |
| `wiki:delete`                    | Delete wiki pages                  |
| `wiki:share`                     | Share wiki pages                   |
| `wiki:comment`                   | Comment on wiki pages              |
| `workspace_workitem_view:view`   | View workspace views               |
| `workspace_workitem_view:create` | Create workspace views             |
| `workspace_workitem_view:edit`   | Edit workspace views               |
| `workspace_workitem_view:delete` | Delete workspace views             |
| `initiative:view`                | View initiatives                   |
| `initiative:create`              | Create initiatives                 |
| `initiative:edit`                | Edit initiatives                   |
| `initiative:delete`              | Delete initiatives                 |
| `teamspace:view`                 | View teamspaces                    |
| `teamspace:create`               | Create teamspaces                  |
| `teamspace:edit`                 | Edit teamspaces                    |
| `teamspace:delete`               | Delete teamspaces                  |
| `teamspace_comment:create`       | Create teamspace comments          |
| `teamspace_comment:edit`         | Edit teamspace comments            |
| `teamspace_comment:delete`       | Delete teamspace comments          |
| `teamspace_comment:react`        | React to teamspace comments        |
| `teamspace_view:view`            | View teamspace views               |
| `teamspace_view:create`          | Create teamspace views             |
| `teamspace_view:edit`            | Edit teamspace views               |
| `teamspace_view:delete`          | Delete teamspace views             |
| `teamspace_page:view`            | View teamspace pages               |
| `teamspace_page:create`          | Create teamspace pages             |
| `teamspace_page:edit`            | Edit teamspace pages               |
| `teamspace_page:delete`          | Delete teamspace pages             |
| `teamspace_page:archive`         | Archive/unarchive TS pages         |
| `teamspace_page_comment:create`  | Create TS page comments            |
| `teamspace_page_comment:edit`    | Edit TS page comments              |
| `teamspace_page_comment:delete`  | Delete TS page comments            |
| `teamspace_page_comment:react`   | React to TS page comments          |
| `teamspace_page_comment:resolve` | Resolve/unresolve TS page comments |
| `integration:view`               | View integrations                  |
| `integration:connect`            | Connect integrations               |
| `integration:edit`               | Edit integrations                  |
| `integration:delete`             | Delete integrations                |
| `webhook:view`                   | View webhooks                      |
| `webhook:create`                 | Create webhooks                    |
| `webhook:edit`                   | Edit webhooks                      |
| `webhook:delete`                 | Delete webhooks                    |
| `api_token:view`                 | View API tokens                    |
| `api_token:create`               | Create API tokens                  |
| `api_token:delete`               | Delete API tokens                  |
| `custom_role:view`               | View custom roles                  |
| `custom_role:create`             | Create custom roles                |
| `custom_role:edit`               | Edit custom roles                  |
| `custom_role:delete`             | Delete custom roles                |

**Project-level resources:**

| Permission String            | Description                |
| ---------------------------- | -------------------------- |
| `project:browse`             | List/browse projects       |
| `project:view`               | View project               |
| `project:create`             | Create project             |
| `project:edit`               | Edit project settings      |
| `project:delete`             | Delete project             |
| `project:manage`             | Manage project             |
| `project:archive`            | Archive project            |
| `project_member:view`        | View project members       |
| `project_member:invite`      | Invite project members     |
| `project_member:edit`        | Edit project members       |
| `project_member:remove`      | Remove project members     |
| `project_member:change_role` | Change project member role |
| `issue:view`                 | View issues                |
| `issue:create`               | Create issues              |
| `issue:edit`                 | Edit issues                |
| `issue:delete`               | Delete issues              |
| `issue:assign`               | Assign issues              |
| `issue:bulk_edit`            | Bulk edit issues           |
| `issue:react`                | React to issues            |
| `module:view`                | View modules               |
| `module:create`              | Create modules             |
| `module:edit`                | Edit modules               |
| `module:delete`              | Delete modules             |
| `module:archive`             | Archive/unarchive modules  |
| `cycle:view`                 | View cycles                |
| `cycle:create`               | Create cycles              |
| `cycle:edit`                 | Edit cycles                |
| `cycle:delete`               | Delete cycles              |
| `cycle:archive`              | Archive/unarchive cycles   |
| `page:view`                  | View pages                 |
| `page:create`                | Create pages               |
| `page:edit`                  | Edit pages                 |
| `page:delete`                | Delete pages               |
| `page:share`                 | Share pages                |
| `page:comment`               | Comment on pages           |
| `view:view`                  | View views                 |
| `view:create`                | Create views               |
| `view:edit`                  | Edit views                 |
| `view:delete`                | Delete views               |
| `intake:view`                | View intake                |
| `intake:create`              | Create intake items        |
| `intake:edit`                | Edit intake                |
| `intake:delete`              | Delete intake              |
| `label:view`                 | View labels                |
| `label:create`               | Create labels              |
| `label:edit`                 | Edit labels                |
| `label:delete`               | Delete labels              |
| `state:view`                 | View states                |
| `state:create`               | Create states              |
| `state:edit`                 | Edit states                |
| `state:delete`               | Delete states              |
| `estimate:view`              | View estimates             |
| `estimate:create`            | Create estimates           |
| `estimate:edit`              | Edit estimates             |
| `estimate:delete`            | Delete estimates           |
| `comment:view`               | View comments              |
| `comment:create`             | Create comments            |
| `comment:edit`               | Edit comments              |
| `comment:delete`             | Delete comments            |
| `attachment:view`            | View attachments           |
| `attachment:create`          | Create attachments         |
| `attachment:delete`          | Delete attachments         |

### Import

```python
from plane.permissions import ResourceType, Action, Permission

ResourceType.WORKITEM       # issue
ResourceType.PROJECT     # project
ResourceType.WORKSPACE   # workspace
Action.VIEW              # view
Action.EDIT              # edit
```

---

## Architecture

### Core Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Permissions │    │    Roles     │    │ Relationships│       │
│  │  (Actions)   │    │ (Templates)  │    │  (Grants)    │       │
│  │              │    │              │    │              │       │
│  │ issue:view   │    │ Admin (20)   │    │ user:123     │       │
│  │ issue:edit   │    │ Contrib (15) │    │   ↓ admin    │       │
│  │ wiki:create  │    │ Commenter(10)│    │ workspace:X  │       │
│  │ project:     │    │ Guest (5)    │    │              │       │
│  │   browse     │    │              │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             ▼                                   │
│                 ┌──────────────────────┐                        │
│                 │  PermissionEngine    │                        │
│                 │  (Single Entry Point)│                        │
│                 └──────────────────────┘                        │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  @can()     │    │  .check()   │    │  Frontend   │          │
│  │  Decorator  │    │   Method    │    │    Hook     │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Permission String Format

Permissions use flat strings in the format `resource:action`:

```
issue:view                  # resource=issue, action=view
issue:edit                  # resource=issue, action=edit
issue:delete                # resource=issue, action=delete
project:manage              # resource=project, action=manage
workspace:invite            # resource=workspace, action=invite
initiative:view             # resource=initiative, action=view
wiki:create                 # resource=wiki, action=create
workspace_workitem_view:edit         # resource=workspace_workitem_view, action=edit
```

### Permission Classes (Type-Safe API)

For type safety and IDE auto-completion, use Permission classes instead of raw strings:

```python
from plane.permissions import (
    # Core types
    ResourceType,                   # ResourceType.WORKITEM, ResourceType.PROJECT, etc.
    Action,                         # Action.VIEW, Action.EDIT, etc.
    Permission,                     # Permission(ResourceType.WORKITEM, Action.VIEW)

    # Permission classes for each resource type
    WorkitemPermissions,               # .VIEW, .CREATE, .EDIT, .DELETE, .ASSIGN, .BULK_EDIT, .REACT
    ProjectPermissions,             # .BROWSE, .VIEW, .CREATE, .EDIT, .DELETE, .MANAGE, .ARCHIVE
    WorkspacePermissions,           # .VIEW, .EDIT, .MANAGE, .INVITE, .DELETE
    WikiPermissions,                # .VIEW, .CREATE, .EDIT, .DELETE, .SHARE, .COMMENT
    WorkspaceWorkitemViewPermissions,       # .VIEW, .CREATE, .EDIT, .DELETE
    ModulePermissions,              # .VIEW, .CREATE, .EDIT, .DELETE, .ARCHIVE
    CyclePermissions,               # .VIEW, .CREATE, .EDIT, .DELETE, .ARCHIVE
    PagePermissions,                # .VIEW, .CREATE, .EDIT, .DELETE, .SHARE, .COMMENT
    CommentPermissions,             # .VIEW, .CREATE, .EDIT, .DELETE
    WorkspaceMemberPermissions,     # .VIEW, .INVITE, .EDIT, .DELETE, .CHANGE_ROLE
    ProjectMemberPermissions,       # .VIEW, .INVITE, .EDIT, .REMOVE, .CHANGE_ROLE

    # ... and more (EpicPermissions, IntakePermissions, etc.)

    # Validation helpers
    is_valid_permission,    # Check if action is valid for resource type
    get_valid_actions,      # Get all valid actions for a resource type
    get_permission,         # Get Permission object from string
)

# Usage
print(WorkitemPermissions.VIEW)                # "workitem:view"
print(WorkitemPermissions.VIEW.action)         # Action.VIEW
print(WorkitemPermissions.VIEW.resource_type)  # ResourceType.WORKITEM

print(WorkspacePermissions.VIEW)            # "workspace:view"
print(ProjectPermissions.BROWSE)            # "project:browse"
print(WikiPermissions.CREATE)               # "wiki:create"
print(WorkspaceWorkitemViewPermissions.EDIT)        # "workspace_workitem_view:edit"
print(WorkspaceMemberPermissions.VIEW)      # "workspace_member:view"
print(ProjectMemberPermissions.VIEW)        # "project_member:view"

# Validation
is_valid_permission(ResourceType.WORKITEM, Action.VIEW)    # True
is_valid_permission(ResourceType.WORKITEM, Action.INVITE)  # False
```

### Resource Hierarchy

```
Workspace (workspace)
├── Workspace Member (workspace_member)
├── Wiki (wiki)
├── Workspace Workitem View (workspace_workitem_view)
├── Project (project)
│   ├── Project Member (project_member)
│   ├── Workitem (workitem)
│   ├── Epic (epic)
│   ├── Module (module)
│   ├── Cycle (cycle)
│   ├── Page (page)
│   ├── WorkitemView (workitem_view)
│   ├── Intake (intake)
│   ├── Label (label)
│   ├── State (state)
│   ├── Estimate (estimate)
│   ├── Comment (comment)
│   └── Attachment (attachment)
├── Initiative (initiative)
└── Teamspace (teamspace)
```

Permissions inherit downward: A workspace admin automatically has admin access to all projects and their resources.

The `RESOURCE_HIERARCHY` in `plane/permissions/inheritance.py` matches this documented hierarchy. Use `get_all_resource_types_under(resource_type)` to derive the full set of resource types under any node (e.g., `get_all_resource_types_under("workspace")` returns all 25 types).

### System Roles

Roles are namespace-scoped. Workspace and project levels have different role sets.

**Workspace Roles:**

Workspace roles differ by plan tier:

| Plan                  | Available Roles             |
| --------------------- | --------------------------- |
| Free / Pro / One      | Owner, Member, Guest        |
| Business / Enterprise | Owner, Admin, Member, Guest |

| Role   | Level | Plans                      | Description                                                                                     |
| ------ | ----- | -------------------------- | ----------------------------------------------------------------------------------------------- |
| Owner  | 25    | All                        | Full control including workspace deletion and ownership transfer                                |
| Admin  | 20    | Business / Enterprise only | Manage workspace settings, users, projects, and integrations (cannot delete/transfer workspace) |
| Member | 15    | All                        | View-only access to workspace resources; can browse projects (`project:browse`)                 |
| Guest  | 5     | All                        | View workspace only; no project browsing                                                        |

On Free/Pro/One plans, all `WorkspaceMember.role=20` users get the Owner relation (Admin role does not exist on these plans). On Business/Enterprise, only the workspace creator (`Workspace.owner` FK) gets Owner; other role=20 members get Admin.

**Project Roles:**

| Role        | Level | Description                                                                  |
| ----------- | ----- | ---------------------------------------------------------------------------- |
| Admin       | 20    | Full control over project settings, members, and all content                 |
| Contributor | 15    | Create/edit issues, modules, cycles, pages, views; delete own content        |
| Commenter   | 10    | View issues, add comments, create intake issues                              |
| Guest       | 5     | View pages/views, submit intake forms, add attachments; limited issue access |

### Workspace → Project Role Mapping (Auto-Join)

When a workspace member joins a public project, their project role is derived from their workspace role slug (not level):

| Workspace Role             | Project Role  | Rationale                                 |
| -------------------------- | ------------- | ----------------------------------------- |
| `owner`                    | `admin`       | Workspace owners get full project control |
| `admin`                    | `admin`       | Workspace admins get full project control |
| `guest`                    | `guest`       | Ceiling enforced                          |
| Any other (member, custom) | `contributor` | Safe default — no over-granting           |

**Custom roles**: Any workspace role slug not in `{owner, admin, guest}` maps to `contributor`. This avoids level-based ambiguity.

**Guest ceiling**: Workspace guests are constrained to project `guest` or `commenter` only:

- Auto-join → always `guest`
- Explicit assignment by admin → up to `commenter` (enforced by `enforce_project_role_ceiling()`)

**How `role_ref` FK is set**:

- Auto-join endpoints (`UserProjectJoinEndpoint`, `process_workspace_project_invitations`): resolved via `resolve_project_role_for_ws_member()` and set on `bulk_create`
- Explicit assignment (`ProjectMemberViewSet.create`): resolved from requested numeric role via `project_role_from_member_role()` and set on `bulk_create`
- Individual `.create()` calls: `save()` auto-populates `role_ref` via `_sync_role_ref_from_numeric()`
- Background tasks using `bulk_create` without `role_ref`: safety net in `post_bulk_create` signal handler backfills it

See `designs/permissions/decision-auto-join-role-mapping.md` for industry research and rationale.

### Teamspace Roles

Teamspace roles require explicit teamspace membership. Workspace membership alone does NOT grant teamspace content access (workspace roles only get `teamspace:browse` and `teamspace:create`).

| Role   | Level | Description                                                                        |
| ------ | ----- | ---------------------------------------------------------------------------------- |
| member | 15    | Content CRUD with inline creator/lead checks; edit/delete/manage teamspace if lead |

**Key grants (teamspace-level):**

- `teamspace:view` — All members
- `teamspace:edit` + LEAD condition — Teamspace lead only
- `teamspace:delete` + LEAD condition — Teamspace lead only
- `teamspace:manage` + LEAD condition — Teamspace lead only

**Content grants (all unconditional; creator/lead enforcement is inline):**

- `teamspace_comment:create/edit/delete/react` — All members; edit/delete inline-restricted to creator OR admin/lead
- `teamspace_view:view/create/edit/delete` — All members; edit/delete inline-restricted to owner OR admin/lead
- `teamspace_page:view/create/edit/delete/archive` — All members; delete/archive/lock inline-restricted to owner OR admin/lead; edit is collaborative (any member)
- `teamspace_page_comment:create/edit/delete/react/resolve` — All members; edit/delete inline-restricted to creator OR admin/lead; resolve is any member

**Key design decisions:**

- Workspace admin has per-resource wildcards for project bypass — cannot delete/transfer workspace
- Project "member" is renamed to "contributor" to better reflect the role's capabilities
- Commenter is a new role between contributor and guest
- Delete permissions for contributor are conditional grants — the role grants delete only when the user is the resource creator (`Permission & Condition.CREATOR` in system_roles.py)
- Workspace membership alone does NOT grant project content access (except for workspace admin bypass)

### Creator Permission Patterns

Creator-based permissions are handled via **conditional grants** in `system_roles.py`, not decorator parameters.

| Pattern               | Mechanism                                           | Behavior                                                | Use Case                        |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| Conditional grants    | `Permission & Condition.CREATOR` in system_roles    | Role grants permission only if user is resource creator | Issues, Modules, Cycles, Views  |
| Deferred conditionals | `defer_conditions=True` on `@can` + queryset filter | View passes gate, queryset filters by condition         | Issue list for guest role       |
| Inline creator check  | `if obj.created_by_id != request.user.id` in view   | ONLY creator (admin cannot override) — business rule    | View EDIT (workspace + project) |

**How it works:**

- Creator is computed from the `created_by` field (no extra tuples stored)
- Membership is verified via direct tuple lookup (not VIEW permission)
- Removed users cannot access resources they created
- The engine evaluates conditional grants automatically during role permission resolution

### Link Relations (Tuple Traversal)

The system supports Zanzibar-style `tuple_to_userset` for indirect access patterns. This allows users to gain access to resources through linked relationships without explicit permission grants.

**Use Case: Teamspace Membership Grants Project Access**

When a user is a member of a teamspace, and that teamspace is linked to a project, the user automatically gains access to the project without explicit `ProjectMember` records.

**Configuration:**

```python
# plane/permissions/inheritance.py
LINK_RELATIONS: dict[str, dict[str, str]] = {
    "project": {
        "teamspace": "member",  # Check teamspace→project link, then user→teamspace#member
    },
}
```

**How it works:**

1. **Teamspace membership tuple**: When a user joins a teamspace, a tuple is created:

   ```
   (user:U1, member, teamspace:T1)
   ```

2. **Teamspace-project link tuple**: When a project is added to a teamspace, a link tuple is created:

   ```
   (teamspace:T1, teamspace, project:P1)
   ```

3. **Permission check**: When checking if user U1 can access project P1:
   - Direct check: `project:P1#admin@user:U1` → NOT FOUND
   - Direct check: `project:P1#member@user:U1` → NOT FOUND
   - Link relation traversal:
     - Find: `project:P1#teamspace@teamspace:T1` → FOUND
     - Check: `teamspace:T1#member@user:U1` → FOUND ✓
   - Result: **GRANTED** via teamspace traversal

**Benefits over sync-based approach:**

| Aspect                | Sync-Based (Old)               | Tuple Traversal (New) |
| --------------------- | ------------------------------ | --------------------- |
| Write complexity      | O(users × projects)            | O(1) per link         |
| Consistency           | Eventual (sync delay)          | Immediate             |
| Storage               | ProjectMember per user×project | 2 tuples total        |
| Permission revocation | Async cleanup needed           | Instant               |

**Full Permission Resolution Order:**

The engine builds the full hierarchy chain (e.g., issue → project → workspace), prefetches all tuples across the chain in a single query (including link relations via subqueries), then resolves in-memory level by level:

```
For each level in hierarchy (resource → parent → ... → workspace):
  1. Check explicit DENY → False
  2. Check explicit GRANT → True
  3. Check role permissions (cached) → True if granted
  4. Check link relations (prefetched) → True if found
  5. (handled by conditional grants in step 3-4)
Default → False
```

### Resource Ownership Validation

The permission engine validates that resources belong to the workspace and project specified in the URL. This prevents cross-workspace and cross-project access via crafted URLs.

**How it works:**

When `_build_hierarchy_chain()` resolves a resource's parent hierarchy from the database, it compares each resolved parent against the caller-provided context:

- **Workspace validation**: If the resource's DB-stored workspace differs from the URL's `workspace_id`, the engine raises `PermissionDenied`.
- **Project validation**: If the resource's DB-stored project differs from the URL's `project_id`, the engine raises `PermissionDenied`.

Both the `@can` decorator and `HasResourcePermission` DRF class automatically extract `workspace_id` and `project_id` from URL kwargs and pass them to the engine. Programmatic callers (`permission_engine.check()`) can pass `project_id=None` to skip project validation (appropriate when the caller has already scoped the queryset).

**When validation runs:**

| Scenario                                                | Workspace validation           | Project validation                      |
| ------------------------------------------------------- | ------------------------------ | --------------------------------------- |
| Workspace-level endpoint (no project in URL)            | Yes                            | Skipped (no project_id)                 |
| Project as the resource (`resource_param='project_id'`) | Yes                            | Skipped (project's parent is workspace) |
| Sub-resource (e.g., issue via `resource_param='pk'`)    | Yes                            | Yes                                     |
| Programmatic caller (project_id=None)                   | Yes (if workspace_id provided) | Skipped                                 |

---

## File Structure

### Backend

```
apps/api/plane/
├── permissions/                    # Permission module
│   ├── __init__.py                # Public exports
│   ├── definitions.py             # ResourceType, Action, Permission enums
│   ├── system_roles.py            # System role definitions
│   ├── inheritance.py             # Resource hierarchy + LINK_RELATIONS config + get_workspace_field_path()
│   ├── engine/                 # Permission engine subpackage
│   │   ├── core.py            # PermissionEngine facade
│   │   ├── hierarchy.py       # Hierarchy chain building + IDOR validation
│   │   ├── resolver.py        # Zanzibar resolution loop
│   │   ├── roles.py           # Role permission lookups (compiled/cached/DB)
│   │   ├── conditions.py      # Conditional grant evaluators
│   │   ├── tuples.py          # Tuple prefetching
│   │   └── queries.py         # Bulk permission queries
│   ├── sync.py                    # PermissionSyncMixin - model→ResourcePermission sync
│   ├── decorators.py              # @can() decorator
│   ├── serializers.py             # API serializers
│   ├── views.py                   # REST API views
│   └── urls.py                    # URL routes
│
├── middleware/
│   └── workspace.py               # WorkspaceResolverMiddleware (resolves slug→workspace per request)
│
├── db/models/
│   └── permission.py              # Role, ResourcePermission models
│
└── db/migrations/
    ├── 0119_resourcepermission_permissionauditlog_role_and_more.py  # Create tables
    └── 0120_auto_20260130_0910.py     # Backfill: migrate existing data + teamspace tuples
```

**Note:** The `WorkspaceResolverMiddleware` (in `plane/middleware/workspace.py`) resolves the workspace slug from URL kwargs once per request via Django's `process_view()` hook, setting `request.workspace` and `request.workspace_id`. The `@can` decorator and DRF permission classes use these to avoid redundant DB lookups.

### Frontend

```
packages/types/src/
└── permissions.ts                  # TypeScript types

apps/web/core/
├── services/
│   └── permission.service.ts       # API client
└── hooks/
    └── use-granular-permissions.ts # React hooks
```

---

## Database Models

### Role

Stores system and custom roles per workspace, scoped by namespace.

```python
class Role(BaseModel):
    workspace = ForeignKey(Workspace, null=True)  # NULL for instance-level roles
    namespace = CharField()         # "instance", "workspace", or "project"
    name = CharField()              # "QA Lead"
    slug = SlugField()              # "qa-lead"
    description = TextField()
    permissions = ArrayField()      # ["workitem:view", "workitem:edit", ...]
    level = PositiveSmallIntegerField()  # Numeric level for comparison
    is_system = BooleanField()      # True for built-in roles
    status = CharField()            # "active" or "inactive"
    sort_order = PositiveIntegerField()  # Display order in UI
```

### ResourcePermission

Core relationship tuple - the heart of the system.

```python
class ResourcePermission(BaseModel):
    workspace = ForeignKey(Workspace, null=True)  # NULL for instance-level permissions

    # Subject (who)
    subject_type = CharField()      # "user", "role", "team"
    subject_id = UUIDField()

    # Relation
    relation = CharField()          # "admin", "member", "qa-lead"

    # Resource (what)
    resource_type = CharField()     # "workspace", "project", "issue"
    resource_id = UUIDField()

    # GAC overrides
    permissions_grant = ArrayField()  # Additional permissions
    permissions_deny = ArrayField()   # Explicitly denied

    # Metadata
    expires_at = DateTimeField()    # Temporary access
    granted_by = ForeignKey(User)
```

---

## Backend Usage

### Design Principle: Check Specific Resource Permissions

**Always check the permission for the specific resource type being accessed, not the parent resource.**

```python
# CORRECT: Check issue permission for listing issues
@can(WorkitemPermissions.VIEW, resource_param='project_id')
def list(self, request, project_id):
    ...

# INCORRECT: Don't check parent (project:view) permission for child resource operations
@can(ProjectPermissions.VIEW, resource_param='project_id')  # Wrong!
def list(self, request, project_id):
    ...
```

**Why?** This enables future roles that may have access to a parent resource but not all its children. For example, a "Project Observer" role might have `project:view` to see project metadata but not `issue:view` to see actual work items. Checking the specific resource permission provides granular control and follows the principle of least privilege.

### 1. Using the @can() Decorator

The simplest way to protect a view. The `@can` decorator requires a Permission object (e.g., `WorkitemPermissions.VIEW`).

```python
from plane.permissions import can, WorkitemPermissions, ProjectPermissions, CommentPermissions

class IssueViewSet(BaseViewSet):

    @can(WorkitemPermissions.VIEW, resource_param='project_id')
    def list(self, request, project_id):
        # User is verified to have issue:view permission
        ...

    @can(WorkitemPermissions.VIEW, resource_param='issue_id')
    def retrieve(self, request, issue_id):
        # User is verified to have issue:view permission
        issue = Issue.objects.get(id=issue_id)
        return Response(IssueSerializer(issue).data)

    @can(WorkitemPermissions.EDIT, resource_param='issue_id')
    def update(self, request, issue_id):
        # User is verified to have issue:edit permission
        ...

    @can(WorkitemPermissions.DELETE, resource_param='issue_id')
    def destroy(self, request, issue_id):
        # User is verified to have issue:delete permission
        ...

    # Creator-based delete: handled via conditional grants in system_roles.py
    # (WorkitemPermissions.DELETE & Condition.CREATOR for contributor role)
    # No special decorator parameter needed — the engine evaluates automatically.
    @can(WorkitemPermissions.DELETE, resource_param='issue_id')
    def destroy(self, request, issue_id):
        # Contributors can delete if they created the issue (conditional grant)
        # Admins can always delete (unconditional grant via wildcard)
        ...
```

### 2. Using DRF Permission Classes

For ViewSet-level permissions, use the DRF permission classes instead of decorators:

```python
from rest_framework.permissions import IsAuthenticated
from plane.permissions import HasResourcePermission
from plane.permissions import WorkitemPermissions, ResourceType

# Option A: action_permissions dict for declarative configuration
class IssueViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, HasResourcePermission]

    # Note: Always check the specific resource permission (issue:view for issues)
    # not the parent permission (project:view). This enables granular role control.
    action_permissions = {
        'list': {'permission': WorkitemPermissions.VIEW},
        'create': {'permission': WorkitemPermissions.CREATE},
        'retrieve': {'permission': WorkitemPermissions.VIEW},
        'update': {'permission': WorkitemPermissions.EDIT},
        'partial_update': {'permission': WorkitemPermissions.EDIT},
        'destroy': {'permission': WorkitemPermissions.DELETE},
    }
```

**When to use each approach:**

| Approach                      | Use Case                                             |
| ----------------------------- | ---------------------------------------------------- |
| `@can` decorator              | Method-level control, explicit per-action            |
| `HasResourcePermission` class | ViewSet-level, declarative `action_permissions` dict |

### 3. Using PermissionEngine Directly (Programmatic)

For more complex logic:

```python
from plane.permissions import permission_engine, WorkitemPermissions, CommentPermissions

class IssueViewSet(BaseViewSet):

    def destroy(self, request, issue_id):
        issue = Issue.objects.get(id=issue_id)

        # Check if user can delete (role permission OR creator)
        # The engine handles creator check + membership verification
        can_delete = permission_engine.check(
            user=request.user,
            permission=WorkitemPermissions.DELETE,
            resource_id=issue.id,
            workspace_id=issue.workspace_id,
                )

        if can_delete:
            issue.delete()
            return Response(status=204)

        raise PermissionDenied("Cannot delete this issue")


class CommentViewSet(BaseViewSet):

    def update(self, request, comment_id):
        comment = IssueComment.objects.get(id=comment_id)

        # Conditional grant (comment:edit+creator) evaluated automatically
        can_edit = permission_engine.check(
            user=request.user,
            permission=CommentPermissions.EDIT,
            resource_id=comment.id,
            workspace_id=comment.workspace_id,
        )

        if can_edit:
            # Update comment...
            return Response(status=200)

        raise PermissionDenied("Only the creator can edit this comment")
```

### 4. Adding \_permissions to API Responses

Use the `PermissionSerializerMixin`:

```python
from plane.permissions.serializers import PermissionSerializerMixin
from plane.permissions.definitions import ResourceType

class IssueSerializer(PermissionSerializerMixin, ModelSerializer):
    class Meta:
        model = Issue
        resource_type = ResourceType.WORKITEM  # Required for mixin
        fields = ['id', 'title', 'description', 'state', ...]
```

This automatically adds `_permissions` to responses:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Fix login bug",
  "description": "...",
  "_permissions": {
    "can_view": true,
    "can_edit": true,
    "can_delete": false,
    "can_assign": true,
    "can_comment": true
  }
}
```

### 5. Granting Permissions (GAC)

```python
from plane.permissions import permission_engine, ResourceType

# Grant a user editor access to a specific issue
permission_engine.grant(
    granter=request.user,
    subject_type="user",
    subject_id=target_user.id,
    relation="editor",
    resource_type=ResourceType.WORKITEM,
    resource_id=issue.id,
    workspace_id=workspace.id,
    expires_at=None,  # Or a datetime for temporary access
)

# Grant with specific permission overrides
permission_engine.grant(
    granter=request.user,
    subject_type="user",
    subject_id=target_user.id,
    relation="viewer",
    resource_type=ResourceType.WORKITEM,
    resource_id=issue.id,
    workspace_id=workspace.id,
    permissions_grant=["comment:create"],   # Also allow commenting
    permissions_deny=["workitem:share"],       # But not sharing
)
```

### 6. Revoking Permissions

```python
permission_engine.revoke(
    revoker=request.user,
    subject_type="user",
    subject_id=target_user.id,
    resource_type=ResourceType.WORKITEM,
    resource_id=issue.id,
    workspace_id=workspace.id,
)
```

### 7. Filtering Querysets by Accessible Resources

For list views that need to filter results based on user permissions, use `PermissionMixin`:

```python
from plane.permissions import can, WorkspacePermissions, WorkitemPermissions, PermissionMixin

class WorkspaceViewIssuesViewSet(PermissionMixin, BaseViewSet):
    """List all issues across projects the user can access."""

    @property
    def workspace_id(self):
        """Required for PermissionMixin methods."""
        return self.request.workspace_id

    def get_queryset(self):
        # Get projects where user can VIEW ISSUES (not just view projects)
        # We query project tuples but check issue:view permission
        accessible_project_ids = self.get_accessible_resources(
            resource_type="project",
            permission=WorkitemPermissions.VIEW,  # Check issue:view, not project:view
        )

        return Issue.objects.filter(
            workspace_id=self.request.workspace_id,
            project_id__in=accessible_project_ids,
        )
```

**Important**: The `permission` parameter specifies which permission to check, and can differ from `resource_type`. When listing issues, check `issue:view` even though querying project tuples. This follows the design principle: _"Always check the specific resource permission, not the parent resource."_

**With relations (for role-specific filtering):**

```python
# Get accessible projects WITH their relations (e.g., for guest filtering)
project_relations = self.get_accessible_resources(
    resource_type="project",
    permission=WorkitemPermissions.VIEW,  # Check issue:view permission
    include_relations=True,  # Returns dict instead of list
)
# Returns: {project_id: "admin", project_id: "member", project_id: "guest", ...}

# Separate by role for different filtering logic
guest_project_ids = [pid for pid, rel in project_relations.items() if rel == "guest"]
non_guest_project_ids = [pid for pid, rel in project_relations.items() if rel != "guest"]

# Apply role-specific filters (e.g., guests only see their own issues)
queryset = Issue.objects.filter(
    Q(project_id__in=non_guest_project_ids)
    | Q(project_id__in=guest_project_ids, project__guest_view_all_features=True)
    | Q(project_id__in=guest_project_ids, project__guest_view_all_features=False,
        created_by=request.user)
)
```

**PermissionMixin methods:**

| Method                                                     | Returns                            | Purpose                                     |
| ---------------------------------------------------------- | ---------------------------------- | ------------------------------------------- |
| `check_can(permission, resource_id)`                       | `bool` (raises `PermissionDenied`) | Check single resource permission            |
| `has_permission(permission, resource_id)`                  | `bool`                             | Check single resource permission (no raise) |
| `get_user_permissions(resource_type, resource_id)`         | `dict[str, bool]`                  | Get all permissions for a resource          |
| `get_accessible_resources(resource_type, permission, ...)` | `list[UUID]` or `dict[UUID, str]`  | Get all accessible resource IDs             |

**What `get_accessible_resources()` handles:**

1. **Direct tuples**: `user → project#{relation}` (ProjectMember records)
2. **Link relations**: `user → teamspace#member` + `teamspace → project#teamspace` (Teamspace access)
3. **Permission validation**: Only returns resources where the user's role grants the specified permission

### 8. Permission Sync (Membership → ResourcePermission)

Membership models automatically sync changes to `ResourcePermission` via `PermissionSyncMixin` (located in `plane/permissions/sync.py`). This bridges Django membership models with the Zanzibar-style permission engine.

**How it works:**

```
WorkspaceMember.save()
  → ChangeTrackerMixin detects role/is_active/deleted_at change
  → PermissionSyncMixin._sync_to_resource_permission()
    → PermissionEngine(use_cache=False).grant() or .revoke()
      → ResourcePermission created/updated/soft-deleted
      → PermissionAuditLog entry created
```

**Models using PermissionSyncMixin:**

| Model              | Resource Type | Signal Handler                       |
| ------------------ | ------------- | ------------------------------------ |
| `WorkspaceMember`  | `workspace`   | `_sync_workspace_member_permissions` |
| `ProjectMember`    | `project`     | `_sync_project_member_permissions`   |
| `TeamspaceMember`  | `teamspace`   | `_sync_teamspace_permissions`        |
| `TeamspaceProject` | `project`     | `_sync_teamspace_permissions`        |

**Configuration on models:**

```python
from plane.permissions.sync import PermissionSyncMixin
from plane.db.mixins import ChangeTrackerMixin

class WorkspaceMember(PermissionSyncMixin, ChangeTrackerMixin, BaseModel):
    TRACKED_FIELDS = ["role", "is_active", "deleted_at"]
    PERMISSION_SUBJECT_TYPE = "user"
    PERMISSION_SUBJECT_ID_FIELD = "member_id"
    PERMISSION_RESOURCE_TYPE = "workspace"
    PERMISSION_RESOURCE_ID_FIELD = "workspace_id"
```

**Sync behavior:**

| Event                              | Engine Method     | Audit Action |
| ---------------------------------- | ----------------- | ------------ |
| Member created                     | `engine.grant()`  | `"grant"`    |
| Role changed (e.g., member→admin)  | `engine.grant()`  | `"modify"`   |
| Member soft-deleted or deactivated | `engine.revoke()` | `"revoke"`   |

**Bulk operations:** Each model file connects its own signal handler to `post_bulk_create` and `post_bulk_update` signals (using `sender=Model` for efficient filtering).

**Plan-aware owner sync:** `WorkspaceMember._get_permission_relation()` checks the workspace's
plan tier via `WorkspaceLicense.plan`. On Free/Pro/One, all role=20 members sync as "owner".
On Business/Enterprise, only the `Workspace.owner` FK user syncs as "owner".

**Cache strategy:** Sync operations bypass the read cache (`use_cache=False`). Permission result cache uses versioned keys (`perm:{user_id}:v{version}:{action}:{resource_type}:{resource_id}`) — on grant/revoke, the user's version counter is incremented, immediately orphaning stale entries. Role permissions are cached for 24 hours with active invalidation via `ChangeTrackerMixin` on the `Role` model.

---

## Frontend Usage

### 1. Using the useGranularPermissions Hook

```tsx
import { useGranularPermissions } from "@/hooks/use-granular-permissions";
import { EAction, EResourceType } from "@plane/types";

function IssueActions({ issue, workspaceSlug }) {
  const { can } = useGranularPermissions(workspaceSlug);

  // Use _permissions from the resource (fastest, no API call)
  const canEdit = can(EAction.EDIT, EResourceType.WORKITEM, issue.id, issue);
  const canDelete = can(EAction.DELETE, EResourceType.WORKITEM, issue.id, issue);

  return (
    <div className="flex gap-2">
      {canEdit && <Button onClick={handleEdit}>Edit</Button>}
      {canDelete && (
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      )}
    </div>
  );
}
```

### 2. Using the useCanAction Hook

For single permission checks:

```tsx
import { useCanAction } from "@/hooks/use-granular-permissions";
import { EAction, EResourceType } from "@plane/types";

function DeleteButton({ issue, workspaceSlug }) {
  const canDelete = useCanAction(
    workspaceSlug,
    EAction.DELETE,
    EResourceType.WORKITEM,
    issue.id,
    issue // Pass the resource with _permissions
  );

  if (!canDelete) return null;

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

### 3. Using \_permissions from API Response

When resources include `_permissions`:

```tsx
function IssueCard({ issue }) {
  // Direct access to permissions from API response
  const { _permissions } = issue;

  return (
    <Card>
      <CardContent>
        <h3>{issue.title}</h3>
        <p>{issue.description}</p>
      </CardContent>
      <CardFooter>
        {_permissions?.can_edit && <EditButton />}
        {_permissions?.can_delete && <DeleteButton />}
        {_permissions?.can_comment && <CommentButton />}
      </CardFooter>
    </Card>
  );
}
```

### 4. Fetching Permissions Dynamically

```tsx
const { getPermissions, checkPermission } = useGranularPermissions(workspaceSlug);

// Async permission check (hits API)
const allowed = await checkPermission(EAction.DELETE, EResourceType.WORKITEM, issueId);

// Get all permissions for a resource
const permissions = await getPermissions(EResourceType.WORKITEM, issueId);
// { can_view: true, can_edit: true, can_delete: false, ... }
```

---

## API Reference

### Hierarchy Helpers

```python
from plane.permissions.inheritance import get_all_resource_types_under, get_workspace_field_path

# Get all resource types under workspace (all 25 types)
get_all_resource_types_under("workspace")
# frozenset({"workspace", "workspace_member", "wiki", "project", "issue", ...})

# Get all resource types under project (project + descendants)
get_all_resource_types_under("project")
# frozenset({"project", "project_member", "issue", "module", "cycle", ...})

# Get ORM field path to workspace_id by walking the resource hierarchy
get_workspace_field_path("workspace_workitem_view")  # "workspace_id"
get_workspace_field_path("workitem_view")             # "project__workspace_id"
get_workspace_field_path("comment")                   # "issue__project__workspace_id"
get_workspace_field_path("workspace")                 # None (IS the workspace)
```

### Model Resolution

```python
from plane.permissions.engine import get_model_for_resource

# Get Django model for any resource type
get_model_for_resource("workitem_view")             # IssueView
get_model_for_resource("workspace_workitem_view")   # IssueView
get_model_for_resource("workitem")                  # Issue
get_model_for_resource("epic")                      # Issue
```

### Roles API

```
GET    /api/v1/workspaces/{slug}/roles/           # List all roles
POST   /api/v1/workspaces/{slug}/roles/           # Create custom role
PATCH  /api/v1/workspaces/{slug}/roles/{id}/      # Update role
DELETE /api/v1/workspaces/{slug}/roles/{id}/      # Delete role
```

### Permission Checks API

```
GET /api/v1/workspaces/{slug}/permissions/check/
    ?action=edit
    &resource_type=issue
    &resource_id={uuid}

Response: { "allowed": true }
```

```
GET /api/v1/workspaces/{slug}/permissions/resource/
    ?resource_type=issue
    &resource_id={uuid}

Response: {
  "can_view": true,
  "can_edit": true,
  "can_delete": false,
  ...
}
```

### Permission Grants API (GAC)

```
GET    /api/v1/workspaces/{slug}/permissions/grants/
       ?resource_type=issue&resource_id={uuid}

POST   /api/v1/workspaces/{slug}/permissions/grants/
       Body: {
         "subject_type": "user",
         "subject_id": "{uuid}",
         "relation": "editor",
         "resource_type": "issue",
         "resource_id": "{uuid}",
         "permissions_grant": ["comment:create"],
         "permissions_deny": [],
         "expires_at": "2024-12-31T23:59:59Z"
       }

PATCH  /api/v1/workspaces/{slug}/permissions/grants/{id}/
DELETE /api/v1/workspaces/{slug}/permissions/grants/{id}/
```

---

## Migration Guide

### Step 1: Run Database Migrations

```bash
cd apps/api
python manage.py migrate
```

This creates the new tables and migrates existing `WorkspaceMember` and `ProjectMember` data.

### Step 2: Initialize System Roles (Optional)

If migration didn't run or you need to reinitialize:

```bash
python manage.py init_permissions --migrate-members

# Options:
#   --workspace=slug    Only for specific workspace
#   --dry-run           Preview without changes
#   --force             Recreate existing system roles
```

### Step 3: Verify Migration

```python
from plane.db.models import Role, ResourcePermission

# Check system roles exist (4 workspace roles + 4 project roles per workspace, plus 1 instance role)
Role.objects.filter(is_system=True).count()

# Check permissions were migrated
ResourcePermission.objects.count()  # Should match member count
```

### Step 4: Gradually Migrate Code

**Old pattern:**

```python
@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
def update_issue(self, request, slug, project_id, issue_id):
    ...
```

**New pattern (with Permission objects):**

```python
from plane.permissions import can, WorkitemPermissions

@can(WorkitemPermissions.EDIT, resource_param='issue_id')
def update_issue(self, request, slug, project_id, issue_id):
    ...
```

Permission objects provide type safety, IDE auto-completion, and compile-time error detection.

---

## Testing Guide

### Backend Unit Tests

```python
from django.test import TestCase
from plane.db.models import User, Workspace, Project, Issue, ResourcePermission
from plane.permissions import permission_engine, WorkitemPermissions, CommentPermissions, ResourceType

class PermissionEngineTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create(email="test@example.com")
        self.workspace = Workspace.objects.create(name="Test", slug="test")
        self.project = Project.objects.create(
            name="Project",
            workspace=self.workspace,
        )
        self.issue = Issue.objects.create(
            name="Issue",
            project=self.project,
            workspace=self.workspace,
        )

        # Grant admin on workspace
        permission_engine.grant(
            granter=self.user,
            subject_type="user",
            subject_id=self.user.id,
            relation="admin",
            resource_type=ResourceType.WORKSPACE,
            resource_id=self.workspace.id,
            workspace_id=self.workspace.id,
        )

    def test_workspace_admin_can_edit_issue(self):
        """Workspace admin should inherit issue:edit permission."""
        result = permission_engine.check(
            user=self.user,
            permission=WorkitemPermissions.EDIT,
            resource_id=self.issue.id,
            workspace_id=self.workspace.id,
        )
        self.assertTrue(result)

    def test_guest_cannot_delete_issue(self):
        """Guest should not have issue:delete permission."""
        guest = User.objects.create(email="guest@example.com")
        permission_engine.grant(
            granter=self.user,
            subject_type="user",
            subject_id=guest.id,
            relation="guest",
            resource_type=ResourceType.WORKSPACE,
            resource_id=self.workspace.id,
            workspace_id=self.workspace.id,
        )

        result = permission_engine.check(
            user=guest,
            permission=WorkitemPermissions.DELETE,
            resource_id=self.issue.id,
            workspace_id=self.workspace.id,
        )
        self.assertFalse(result)

    def test_explicit_deny_overrides_role(self):
        """Explicit deny should override role permissions."""
        permission_engine.grant(
            granter=self.user,
            subject_type="user",
            subject_id=self.user.id,
            relation="admin",
            resource_type=ResourceType.WORKITEM,
            resource_id=self.issue.id,
            workspace_id=self.workspace.id,
            permissions_deny=["workitem:delete"],
        )

        result = permission_engine.check(
            user=self.user,
            permission=WorkitemPermissions.DELETE,
            resource_id=self.issue.id,
            workspace_id=self.workspace.id,
        )
        self.assertFalse(result)

    def test_conditional_creator_grant_with_membership(self):
        """Contributor can delete own issue via conditional grant + active membership."""
        creator = User.objects.create(email="creator@example.com")

        # Grant contributor role (not delete permission)
        permission_engine.grant(
            granter=self.user,
            subject_type="user",
            subject_id=creator.id,
            relation="contributor",
            resource_type=ResourceType.PROJECT,
            resource_id=self.project.id,
            workspace_id=self.workspace.id,
        )

        # Create issue by this user
        issue = Issue.objects.create(
            name="Creator's Issue",
            project=self.project,
            workspace=self.workspace,
            created_by=creator,
        )

        # Contributor can delete own issue via conditional grant (workitem:delete+creator)
        result = permission_engine.check(
            user=creator,
            permission=WorkitemPermissions.DELETE,
            resource_id=issue.id,
            workspace_id=self.workspace.id,
                    )
        self.assertTrue(result)

    def test_conditional_creator_grant_without_membership(self):
        """Removed user CANNOT delete own issue (no membership tuple)."""
        creator = User.objects.create(email="removed@example.com")

        # Create issue by this user
        issue = Issue.objects.create(
            name="Removed Creator's Issue",
            project=self.project,
            workspace=self.workspace,
            created_by=creator,
        )

        # No membership tuple for creator - they've been removed
        result = permission_engine.check(
            user=creator,
            permission=WorkitemPermissions.DELETE,
            resource_id=issue.id,
            workspace_id=self.workspace.id,
                    )
        self.assertFalse(result)  # Denied because no membership

    def test_conditional_grant_blocks_admin(self):
        """Admin CANNOT edit someone else's comment (conditional grant restricts to creator)."""
        from plane.db.models import IssueComment

        regular_user = User.objects.create(email="regular@example.com")

        # Create comment by regular user
        comment = IssueComment.objects.create(
            issue=self.issue,
            project=self.project,
            workspace=self.workspace,
            created_by=regular_user,
            comment_stripped="Test comment",
        )

        # Admin tries to edit — conditional grant restricts to creator
        result = permission_engine.check(
            user=self.user,  # Admin user
            permission=CommentPermissions.EDIT,
            resource_id=comment.id,
            workspace_id=self.workspace.id,
                    )
        self.assertFalse(result)  # Admin cannot override conditional grant

    def test_conditional_grant_allows_creator(self):
        """Creator CAN edit their own comment via conditional grant."""
        from plane.db.models import IssueComment

        creator = User.objects.create(email="commenter@example.com")

        # Grant contributor role
        permission_engine.grant(
            granter=self.user,
            subject_type="user",
            subject_id=creator.id,
            relation="contributor",
            resource_type=ResourceType.PROJECT,
            resource_id=self.project.id,
            workspace_id=self.workspace.id,
        )

        # Create comment by this user
        comment = IssueComment.objects.create(
            issue=self.issue,
            project=self.project,
            workspace=self.workspace,
            created_by=creator,
            comment_stripped="My comment",
        )

        # Creator can edit their own comment
        result = permission_engine.check(
            user=creator,
            permission=CommentPermissions.EDIT,
            resource_id=comment.id,
            workspace_id=self.workspace.id,
                    )
        self.assertTrue(result)
```

### API Tests

```python
from rest_framework.test import APITestCase

class PermissionAPITestCase(APITestCase):
    def test_check_permission(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(
            f"/api/v1/workspaces/{self.workspace.slug}/permissions/check/",
            {
                "action": "edit",
                "resource_type": "issue",
                "resource_id": str(self.issue.id),
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["allowed"])

    def test_create_custom_role(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            f"/api/v1/workspaces/{self.workspace.slug}/roles/",
            {
                "name": "QA Lead",
                "permissions": ["workitem:view", "workitem:edit", "comment:create"],
                "level": 12,
            }
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["slug"], "qa-lead")
```

### Frontend Tests

```tsx
import { renderHook } from "@testing-library/react-hooks";
import { useGranularPermissions } from "@/hooks/use-granular-permissions";

describe("useGranularPermissions", () => {
  it("should check permissions from _permissions object", () => {
    const { result } = renderHook(() => useGranularPermissions("test-workspace"));

    const issue = {
      id: "123",
      _permissions: {
        can_view: true,
        can_edit: true,
        can_delete: false,
      },
    };

    expect(result.current.can(EAction.EDIT, EResourceType.WORKITEM, "123", issue)).toBe(true);
    expect(result.current.can(EAction.DELETE, EResourceType.WORKITEM, "123", issue)).toBe(false);
  });
});
```

### Manual Testing Checklist

1. **Workspace Permissions**
   - [ ] Workspace admin can access all projects (explicit permissions, not wildcard)
   - [ ] Workspace member has view-only access (cannot create projects)
   - [ ] Workspace guest can view workspace and project list only

2. **Project Permissions**
   - [ ] Project admin can manage project settings and all content
   - [ ] Project contributor can create/edit issues, modules, cycles, pages, views
   - [ ] Project contributor can delete own issues/modules/cycles (Creator Only)
   - [ ] Project commenter can view issues and add comments only
   - [ ] Project guest can view pages/views, submit intake forms, add attachments

3. **Resource-Level (GAC)**
   - [ ] Can grant specific user access to an issue
   - [ ] Can deny specific permissions to a user
   - [ ] Temporary access expires correctly

4. **Custom Roles**
   - [ ] Can create custom role with specific permissions
   - [ ] Can assign custom role to user
   - [ ] Custom role permissions are enforced

5. **Inheritance**
   - [ ] Workspace admin has full project access
   - [ ] Project permissions inherit to issues
   - [ ] Explicit denies override inherited permissions

6. **Creator Permissions**
   - [ ] Creator can delete own issue (conditional grant: `WorkitemPermissions.DELETE & Condition.CREATOR`)
   - [ ] Removed user cannot delete own issue (no membership)
   - [ ] Only comment creator can edit (conditional grant: `CommentPermissions.EDIT & Condition.CREATOR`)
   - [ ] Admin cannot edit others' comments (conditional grant restricts to creator only)

7. **Teamspace Access (Link Relations)**
   - [ ] User added to teamspace can access linked projects
   - [ ] Project added to teamspace grants access to teamspace members
   - [ ] User removed from teamspace loses project access immediately
   - [ ] Project removed from teamspace revokes teamspace member access

8. **API Responses**
   - [ ] `_permissions` included in issue responses
   - [ ] `_permissions` reflects actual user permissions
   - [ ] Frontend correctly hides/shows buttons

---

## Troubleshooting

### Permission Always Denied

1. Check if user has any `ResourcePermission` entries:

```python
ResourcePermission.objects.filter(
    subject_type="user",
    subject_id=user.id,
    deleted_at__isnull=True,
)
```

2. Check if permission is expired:

```python
from django.utils import timezone
ResourcePermission.objects.filter(
    subject_id=user.id,
    expires_at__lt=timezone.now(),
)
```

3. Verify the role has the permission:

```python
from plane.permissions.system_roles import get_compiled_permissions
compiled = get_compiled_permissions("contributor", "project")
compiled.has_permission("workitem:edit")    # True
compiled = get_compiled_permissions("commenter", "project")
compiled.has_permission("workitem:edit")    # False
```

### Creator Permission Issues

1. Check if user is the creator:

```python
from plane.db.models import Issue
issue = Issue.objects.get(id=issue_id)
print(f"Creator: {issue.created_by_id}, User: {user.id}")
print(f"Is creator: {issue.created_by_id == user.id}")
```

2. Check if user has active membership tuple (required for creator permissions):

```python
from plane.db.models import ResourcePermission
has_membership = ResourcePermission.objects.filter(
    subject_type="user",
    subject_id=user.id,
    resource_type="project",
    resource_id=issue.project_id,
    relation__in=["admin", "contributor", "commenter", "guest"],  # Project-level roles
    deleted_at__isnull=True,
).exists()
print(f"Has membership: {has_membership}")
```

3. Test creator permission directly:

```python
from plane.permissions import permission_engine, WorkitemPermissions

result = permission_engine.check(
    user=user,
    permission=WorkitemPermissions.DELETE,
    resource_id=issue_id,
    workspace_id=workspace_id,
)
# Conditional grant (workitem:delete+creator) is evaluated automatically
print(f"Can delete: {result}")
```

### Teamspace Access Issues

1. Check if user has teamspace membership tuple:

```python
from plane.db.models import ResourcePermission
ResourcePermission.objects.filter(
    subject_type="user",
    subject_id=user.id,
    resource_type="teamspace",
    relation="member",
    deleted_at__isnull=True,
)
```

2. Check if teamspace is linked to the project:

```python
ResourcePermission.objects.filter(
    subject_type="teamspace",
    resource_type="project",
    resource_id=project.id,
    relation="teamspace",
    deleted_at__isnull=True,
)
```

3. Test link relation traversal (via full permission check):

```python
from plane.permissions import permission_engine, ProjectPermissions

# Link relations are resolved as part of the hierarchy prefetch
result = permission_engine.check(
    user=user,
    permission=ProjectPermissions.VIEW,
    resource_id=project.id,
    workspace_id=project.workspace_id,
)
print(f"Has project access (includes teamspace links): {result}")
```

### Migration Issues

If backpopulation didn't work:

```bash
python manage.py init_permissions --migrate-members --force
```

### Cache Issues

The permission engine uses two cache layers:

- **Permission result cache**: 5-minute TTL (`PERMISSION_CACHE_TTL = 300`) with versioned keys. On grant/revoke, the user's version counter (`perm_v:{user_id}`) is incremented, immediately invalidating all stale entries. Orphaned entries expire via TTL.
- **Role permission cache**: 24-hour TTL (`ROLE_CACHE_TTL = 86400`), actively invalidated when a Role's permissions are modified (via `ChangeTrackerMixin`).

To force immediate effect:

```python
from django.core.cache import cache
cache.clear()
```

---

## Performance Considerations

### Query Optimization

The engine uses hierarchical traversal with prefetching to minimize queries:

| Scenario                                  | Queries                        |
| ----------------------------------------- | ------------------------------ |
| Issue check (with/without link relations) | 2                              |
| Project check (with link relations)       | 1-2                            |
| Workspace check                           | 1                              |
| Any check (role cache warm)               | Same (roles cached separately) |

**How it works:**

1. `_build_hierarchy_chain()` — resolves the full parent chain (1-3 queries, always resolves from DB with ownership validation)
2. `_prefetch_hierarchy_tuples()` — single query with subqueries fetches all tuples across hierarchy + link relations
3. In-memory resolution — iterates levels checking deny/grant/role/link/creator with cached roles (0 queries)

### Caching

- **Permission results**: Cached for 5 minutes (`PERMISSION_CACHE_TTL = 300`) with versioned keys (`perm:{user_id}:v{version}:...`). On grant/revoke, the version counter is incremented — O(1) invalidation that works with any cache backend.
- **Role permissions**: Cached for 24 hours (`ROLE_CACHE_TTL = 86400`), actively invalidated via `ChangeTrackerMixin` on Role model save
- Sync operations (via `PermissionSyncMixin`) bypass the read cache
- Maximum staleness after permission changes: instant (versioned invalidation on grant/revoke), instant (role changes)
- For high-traffic endpoints, consider prefetching permissions

### Bulk Operations

For list views with many items:

```python
# Prefetch permissions for all issues
permissions = permission_engine.bulk_check(
    user=request.user,
    permission=WorkitemPermissions.EDIT,
    resources=[(ResourceType.WORKITEM, i.id) for i in issues],
)
```

### Database Indexes

The migration creates indexes on:

- `(subject_type, subject_id)` - Find user's permissions
- `(resource_type, resource_id)` - Find resource's permissions
- `(workspace, resource_type)` - Workspace-scoped queries
- `(workspace, relation)` - Role-based queries

---

## Future Enhancements

1. **Permission Schemes**: Jira-style templates that can be applied to projects
2. ~~**Conditional Access**: Rules like "can edit if created_by = self"~~ ✅ Implemented via conditional grants (`Permission & Condition.CREATOR` in system_roles.py)
3. ~~**Team Permissions**: Grant permissions to teams instead of individuals~~ ✅ Implemented via Link Relations (teamspace membership grants project access)
4. **Permission Analytics**: Dashboard showing permission distribution
5. **Bulk Permission Management**: UI for managing permissions at scale

---

## Questions?

Contact the platform team or open an issue in the repository.
