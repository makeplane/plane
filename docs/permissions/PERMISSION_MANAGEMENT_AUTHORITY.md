# Management Authority

## Overview

Management authority determines **who can manage whom** — specifically, who can
change roles, remove members, or invite users into specific roles.

This is separate from resource permissions (`@can`). The `@can` decorator checks
whether a user has a management permission (e.g., `CHANGE_ROLE`, `REMOVE`, `INVITE`).
Management authority adds a **tier protection** check on top: even if you have the
permission, you cannot manage members in a protected system role tier.

## Protection Rules

| Target's role                      | Who can manage                                 |
| ---------------------------------- | ---------------------------------------------- |
| **Owner**                          | Owners only                                    |
| **Admin**                          | Owners and Admins only                         |
| **Member, Guest, any custom role** | Anyone with the relevant management permission |

Custom roles are unprotected by design. Custom role creation is gated to admins/owners,
so the set of available custom roles is trusted.

## Helper Functions

Located in `plane/permissions/system_roles.py`:

### `can_manage_role(actor_role_slug, target_role_slug) -> (bool, str)`

Check if the actor can modify or remove a member with the target role.
Call this when changing a member's role or removing a member.

### `can_assign_role(actor_role_slug, assigned_role_slug) -> (bool, str)`

Check if the actor can assign (invite into or change to) the given role.
Call this when inviting a user or changing a member's role to a new value.

### Slug Resolution

Always use `get_workspace_role_slug(ws_member)` to obtain slugs. It handles
NULL `role_ref` by falling back to numeric role mapping.

## Usage in Views

```python
from plane.permissions.system_roles import (
    get_workspace_role_slug, can_manage_role, can_assign_role,
)

# Fetch actor's workspace membership
actor_member = WorkspaceMember.objects.select_related("role_ref").get(
    workspace__slug=slug, member=request.user, is_active=True
)
actor_slug = get_workspace_role_slug(actor_member)
target_slug = get_workspace_role_slug(target_member)

# Check management authority
allowed, error = can_manage_role(actor_slug, target_slug)
if not allowed:
    return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)

# For role changes, also check the new role
allowed, error = can_assign_role(actor_slug, new_role.slug)
if not allowed:
    return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
```

## Endpoints Using Management Authority

| Endpoint                                   | Checks                                                |
| ------------------------------------------ | ----------------------------------------------------- |
| `PATCH /workspaces/:slug/members/:pk/`     | `can_manage_role` (current) + `can_assign_role` (new) |
| `DELETE /workspaces/:slug/members/:pk/`    | `can_manage_role`                                     |
| `POST /workspaces/:slug/invitations/`      | `can_assign_role` (per invite)                        |
| `PATCH /workspaces/:slug/invitations/:pk/` | `can_manage_role` (current) + `can_assign_role` (new) |

## Project-Level Management Authority

The same protection pattern applies to project members, using `PROJECT_PROTECTED_ROLE_SLUGS`:

| Target's project role                              | Who can manage                                         |
| -------------------------------------------------- | ------------------------------------------------------ |
| **Admin**                                          | Project Admins only                                    |
| **Contributor, Commenter, Guest, any custom role** | Anyone with the relevant project management permission |

### Slug Resolution

Use `get_project_role_slug(proj_member)` for project members. It handles NULL `role_ref`
by falling back to `project_role_from_member_role()`.

### Workspace Admin Fallback

A workspace admin/owner who is not a project member can still manage project members
(they pass `@can` via workspace-level grants). In views, resolve the actor with
`.filter().first()` and fall back to `"admin"`:

```python
actor_pm = ProjectMember.objects.select_related("role_ref").filter(
    project_id=project_id, member=request.user, is_active=True
).first()
actor_slug = get_project_role_slug(actor_pm) if actor_pm else "admin"
```

### Project Endpoints

| Endpoint                                             | Checks                                                |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `POST /workspaces/:slug/projects/:id/members/`       | `can_assign_role` (per member)                        |
| `PATCH /workspaces/:slug/projects/:id/members/:pk/`  | `can_manage_role` (current) + `can_assign_role` (new) |
| `DELETE /workspaces/:slug/projects/:id/members/:pk/` | `can_manage_role`                                     |

## Defense in Depth

A safety-net guard in `PermissionSyncMixin._validate_management_authority()` runs
before `engine.grant()`. If a developer writes a new endpoint and forgets to call
the view helpers, this layer catches tier violations and raises `PermissionDenied`,
rolling back the entire transaction.

This only applies to request-context code paths where `updated_by_id` is set.
Server-side background tasks that need to bypass this guard should call
`engine.grant()` directly.
