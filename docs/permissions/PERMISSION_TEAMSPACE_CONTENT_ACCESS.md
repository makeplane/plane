# Teamspace Content Access — Design & Future Paths

## Problem

Teamspace content endpoints (issues, user properties, etc.) must be restricted to teamspace members. The current permission engine's hierarchy walk means that `@can(TeamspacePermissions.VIEW)` alone resolves via teamspace→workspace, granting access to any workspace member who has `teamspace:view` — even if they are not a member of that specific teamspace.

## Current Solution (Path 1 — Layered Permission)

Retain `permission_classes = [TeamspacePermission]` on content view classes alongside `@can` + `@check_feature_flag` decorators:

- `TeamspacePermission` (DRF permission class) gates on `TeamspaceMember` table membership
- `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")` integrates with the permission framework
- `@check_feature_flag(FeatureFlag.TEAMSPACES)` ensures the feature is enabled

This preserves exact parity with the old access model. The `TeamspacePermission` class acts as a membership gate that the permission engine cannot express today.

**Affected classes (17 total content views):**

- `TeamspaceIssueEndpoint`
- `TeamspaceUserPropertiesEndpoint`
- (15 additional teamspace content view classes — pending migration)

## Future Path 2 — Explicit Tuple Grants

Add a `permissions_grant=["teamspace:access"]` field on `TeamspaceMember` sync tuples. The engine would check `teamspace:access` (which is NOT granted at workspace level) instead of `teamspace:view`.

**Pros:**

- Clean separation: `teamspace:view` = browse/list teamspaces; `teamspace:access` = content access
- Works within existing engine architecture

**Cons:**

- Requires changes to `PermissionSyncMixin` for TeamspaceMember
- Requires data migration to add `teamspace:access` tuples for existing members
- Two permissions for related but distinct concepts may be confusing

## Future Path 3 — Teamspace Role Namespace (Recommended)

Add "teamspace" as a role namespace in `engine.py:_get_namespace()`, paralleling the existing "project" namespace.

### Design

Define `TEAMSPACE_ROLES` in `system_roles.py`:

```python
TEAMSPACE_ROLES = {
    "member": {
        "grants": [
            TeamspacePermissions.VIEW,      # teamspace:view (redundant with WS, but explicit)
            TeamspacePermissions.ACCESS,     # teamspace:access (content access)
        ]
    },
    "lead": {
        "grants": [
            TeamspacePermissions.VIEW,
            TeamspacePermissions.ACCESS,
            TeamspacePermissions.EDIT,
            TeamspacePermissions.DELETE,
            TeamspacePermissions.MANAGE,
        ]
    },
}
```

**Workspace "member" role changes:**

- Keep: `teamspace:view` (browse/list teamspaces)
- Remove: `teamspace:edit+lead`, `teamspace:delete+lead`, `teamspace:manage+lead` (move to teamspace "lead" role)

**How it works:**

- Existing `TeamspaceMember` tuples already have `relation="member"` or could have `relation="lead"`
- The `PermissionSyncMixin` on `TeamspaceMember` would sync with the teamspace namespace
- Engine resolves `teamspace:access` by checking the teamspace namespace first, before falling back to workspace

**Pros:**

- Parallels project namespace — familiar pattern
- No data migration needed (existing tuples have correct structure)
- Eliminates `TeamspacePermission` class from all 17 content views
- Clean permission hierarchy: workspace grants for browsing, teamspace grants for content

**Cons:**

- Requires `_get_namespace()` extension in engine
- Need to add `ACCESS` action to teamspace resource type in `definitions.py`
- Slightly larger change than Path 2

## Decision

**Path 3 (teamspace namespace) has been implemented.** The teamspace role namespace is now live with `TEAMSPACE_ROLES` in `system_roles.py`, `_get_namespace()` routing in `engine.py`, and `BROWSE` action on the teamspace resource type. All 28+ teamspace content views now use `@can(TeamspacePermissions.VIEW, resource_param="team_space_id")` without requiring the `TeamspacePermission` DRF class.

Key differences from the original design above:

- Used `BROWSE` action instead of `ACCESS` — `BROWSE` already existed and better conveys "list without access"
- Single "member" role with `LEAD` condition for edit/delete/manage instead of separate "lead" role
- Workspace roles now get only `teamspace:browse` and `teamspace:create` (no content access)

Path 1 (layered `TeamspacePermission`) has been fully removed from all active endpoints.
