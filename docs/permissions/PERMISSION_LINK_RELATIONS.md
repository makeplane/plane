# Permission Link Relations

Link relations enable Zanzibar-style tuple traversal, allowing group membership in one resource to grant access to another. This is how teamspace membership grants project access without syncing `ProjectMember` records.

## What Link Relations Are

A link relation defines a traversal pattern: "users who are members of resource A get access to linked resource B, at the role specified on the A→B link tuple."

```
User ──member──▶ Teamspace ──contributor──▶ Project
                  (source)                   (target)
```

The user's **project role** comes from the teamspace→project link tuple's `relation` field, not from any config. This is the key design principle.

## Design Principles

### Role on the Link, Not in Config

The `LinkRelation` dataclass only defines the traversal pattern (`source_type`, `target_type`). The role (e.g., "contributor") is stored on the `ResourcePermission` tuple that connects the source to the target.

This matches industry patterns:

- **GitHub Teams** — team has a permission level on each repo (read/write/admin)
- **GitLab Groups** — group has a role on each project (guest/reporter/developer/maintainer)
- **Zanzibar** — relation on the group→document tuple determines access level
- **Google Workspace** — group has a role on each resource (viewer/editor/owner)

### Binary Membership

Group membership is binary — you're either a member or not. There's no `source_relation` filter. The access level lives on the group→resource link, not on the user→group membership.

### Engine Identifies Links by `subject_type`

Since the relation field on link tuples is now variable ("contributor", "admin", etc.), the engine identifies link tuples by `subject_type` (e.g., "teamspace") instead of by a fixed relation string.

## The `LinkRelation` Dataclass

```python
@dataclass(frozen=True)
class LinkRelation:
    source_type: str    # Resource type the user belongs to (e.g., "teamspace")
    target_type: str    # Resource type they gain access to (e.g., "project")
```

Defined in `plane/permissions/inheritance.py`.

### Current Link Relations

```python
LINK_RELATIONS: list[LinkRelation] = [
    LinkRelation(source_type="teamspace", target_type="project"),
]
```

### Adding a New Link Relation

1. Add a `LinkRelation` entry to `LINK_RELATIONS`
2. Ensure the source model uses `PermissionSyncMixin` to sync membership tuples
3. Ensure the link model (e.g., `TeamspaceProject`) uses `PermissionSyncMixin` with `_get_permission_relation()` returning the target role
4. Update this doc and `PERMISSION_MATRIX.md`

## Tuple Structure

Two tuples are needed for a link relation to work:

### 1. User→Source membership tuple

Created by `TeamspaceMember` via `PermissionSyncMixin`:

```
subject_type="user", subject_id=<user_id>,
resource_type="teamspace", resource_id=<teamspace_id>,
relation="member"
```

### 2. Source→Target link tuple

Created by `TeamspaceProject` via `PermissionSyncMixin`:

```
subject_type="teamspace", subject_id=<teamspace_id>,
resource_type="project", resource_id=<project_id>,
relation="contributor"    ← this is the target role
```

## Engine Resolution Flow

### `_prefetch_hierarchy_tuples()` (Permission Check)

1. For each hierarchy level (e.g., project), check if any `LinkRelation` targets it
2. Query link tuples: find source resources (teamspaces) linked to this target, capturing their `relation` (target role)
3. Add user→source membership queries to the main OR filter
4. Wrap each membership tuple in a `ResolvedLinkPerm` dataclass pairing it with the target role from the link relation

### `_resolve_permission()` (Permission Check)

At each hierarchy level, after checking direct tuples:

1. Look up prefetched link tuples (`ResolvedLinkPerm` objects) for this level
2. Iterate all link perms — if the user is in multiple teamspaces linking to the same project, any one granting the permission is sufficient
3. For each link perm, call `_check_role_permission()` with the target role
4. `_check_role_permission()` checks unconditional grants, then conditional grants (e.g., `workitem:delete+creator`)
5. If no permission from any link perm, continue to next hierarchy level

### `get_accessible_resources()` (Workspace-Level Listing)

1. Find all source resources (teamspaces) where user is a member
2. Find all target resources (projects) linked from those sources, with their roles
3. Group by role and batch-check permissions
4. Include resources where role grants the requested permission

## Comparison with Platforms

| Aspect              | Plane                                 | GitHub                             | GitLab                             | Zanzibar                       |
| ------------------- | ------------------------------------- | ---------------------------------- | ---------------------------------- | ------------------------------ |
| Group→Resource link | `ResourcePermission` tuple            | Team permission on repo            | Group role on project              | Relation tuple                 |
| Role location       | `relation` field on link tuple        | Permission level on team-repo link | Access level on group-project link | Relation on group-object tuple |
| Membership type     | Binary (member or not)                | Binary (team member or not)        | Binary (group member or not)       | Binary (member or not)         |
| Resolution          | Traverse link, check role permissions | Check team permission level        | Check group access level           | Traverse userset rewrite       |
