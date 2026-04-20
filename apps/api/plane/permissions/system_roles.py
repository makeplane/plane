# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Namespace-Scoped System Roles

Pre-defined system roles split by namespace:
- INSTANCE_ROLES: Instance-level administrative roles (workspace=NULL)
- WORKSPACE_ROLES: Permissions for workspace-level resources
- PROJECT_ROLES: Permissions for project-level resources

Key design decisions:
1. Instance admin has control over the entire Plane instance (reserved for future use)
2. Workspace admin has FULL ACCESS BYPASS to all resources in their workspace
3. Workspace member can only view projects and create new ones
   (cannot access project content without explicit project membership)
4. Project roles grant permissions for project and child resources

These roles map to the existing role values: ADMIN=20, MEMBER=15, GUEST=5

Permission strings use scopeless format: "resource:action" (e.g., "issue:view", "wiki:edit")
"""

from functools import lru_cache
from typing import TypedDict, Union

# Only the imports needed for INSTANCE_ROLES, TEAMSPACE_ROLES, and helper functions
# that still use typed permission entries directly. WORKSPACE_ROLES and PROJECT_ROLES
# now reference Permission Scheme slugs instead of inline permission lists.
from .definitions import (  # noqa: E501
    Permission,
    Condition,
    ConditionalGrant,
    WildcardGrant,
    FULL_ACCESS,
    # Teamspace scope (used by TEAMSPACE_ROLES)
    TeamspacePermissions,
    TeamspaceCommentPermissions,
    TeamspaceWorkitemViewPermissions,
    TeamspacePagePermissions,
    TeamspacePageCommentPermissions,
)

# Import the sentinel type for the Union (not re-exported)
from .definitions import _FullAccessSentinel  # noqa: E402

# Type alias for permission entries — still used by INSTANCE_ROLES and TEAMSPACE_ROLES.
PermissionEntry = Union[Permission, ConditionalGrant, WildcardGrant, "_FullAccessSentinel"]


class SystemRoleConfig(TypedDict):
    level: int  # Numeric level for comparison (20, 15, 5, etc.)
    sort_order: int  # Display order in UI
    permission_schemes: list[str]  # List of PS slugs (resolved at runtime)
    description: str


class _LegacySystemRoleConfig(TypedDict):
    """For INSTANCE_ROLES and TEAMSPACE_ROLES which still use inline permission lists."""

    level: int
    sort_order: int
    permissions: list[PermissionEntry]
    description: str


# =============================================================================
# ROLE MAPPINGS
# =============================================================================

# Mapping from member table role values to role slugs
# These correspond to WorkspaceMember.role and ProjectMember.role values
ROLE_SLUG_MAP = {
    25: "owner",
    20: "admin",
    15: "member",
    5: "guest",
}

# Reverse mapping: role slug to level
ROLE_LEVEL_MAP = {
    "owner": 25,
    "admin": 20,
    "member": 15,
    "contributor": 15,  # Alias for member at project level
    "commenter": 10,  # New role: view + comment only
    "guest": 5,
}

# Project-specific role mappings (different from workspace)
PROJECT_ROLE_SLUG_MAP = {
    20: "admin",
    15: "contributor",  # Replaces "member" at project level
    10: "commenter",  # New role level
    5: "guest",
}

# Legacy mapping (includes owner for backwards compatibility with member tables)
LEGACY_ROLE_MAP = {
    25: "owner",
    20: "admin",
    15: "member",
    10: "viewer",
    5: "guest",
}

# Backward-compatible member table role values.
# The member table `role` field should only contain 20, 15, or 5.
WORKSPACE_ROLE_MEMBER_VALUE = {"owner": 20, "admin": 20, "member": 15, "guest": 5}
PROJECT_ROLE_MEMBER_VALUE = {"admin": 20, "contributor": 15, "commenter": 5, "guest": 5}


def member_role_from_role_ref(role_ref, default: int = 15) -> int:
    """Convert Role object to backward-compatible member table role value (20, 15, or 5).

    The new Role model has levels like 25 (owner) and 10 (commenter) that don't
    exist in the legacy system. This function maps them back to the original
    values (20, 15, 5) for backward compatibility in the member table.

    Custom roles (is_system=False) always map to 15.
    """
    if role_ref is None:
        return default
    if not role_ref.is_system:
        return 15
    if role_ref.namespace == "workspace":
        return WORKSPACE_ROLE_MEMBER_VALUE.get(role_ref.slug, 15)
    elif role_ref.namespace == "project":
        return PROJECT_ROLE_MEMBER_VALUE.get(role_ref.slug, 15)
    return 15


# =============================================================================
# INSTANCE ROLES
# Instance-level administrative roles (workspace=NULL).
# Reserved for future use.
# =============================================================================
INSTANCE_ROLES: dict[str, _LegacySystemRoleConfig] = {
    "admin": {
        "level": 30,
        "sort_order": 100,
        "permissions": [FULL_ACCESS],  # Full instance control
        "description": "Instance administrator with full control (reserved for future use)",
    },
}


# =============================================================================
# WORKSPACE ROLES
# Permissions for workspace-level resources.
# Owner/Admin has FULL ACCESS BYPASS; member/guest have limited access.
#
# Role levels (higher = more authority):
#   owner: 25 - Full control including workspace deletion
#   admin: 20 - Full control except workspace deletion
#   member: 15 - Can view workspace and create projects
#   guest: 5 - Limited access, view only
# =============================================================================
WORKSPACE_ROLES: dict[str, SystemRoleConfig] = {
    "owner": {
        "level": 25,
        "sort_order": 100,
        "permission_schemes": ["owner"],
        "description": "Full control over the workspace, including deletion and ownership transfer",
    },
    "admin": {
        "level": 20,
        "sort_order": 200,
        "permission_schemes": ["admin"],
        "description": "Workspace admin - manage workspace settings, users, projects, and integrations",
    },
    "member": {
        "level": 15,
        "sort_order": 300,
        "permission_schemes": ["member"],
        "description": "Workspace member - view-only access to workspace resources",
    },
    "guest": {
        "level": 5,
        "sort_order": 500,
        "permission_schemes": ["guest"],
        "description": "Limited workspace access - view workspace only, projects require explicit membership",
    },
}


# =============================================================================
# PROJECT ROLES
# Permissions for project-level and child resources (issues, modules, cycles,
# pages, views, intake, labels, states, estimates).
#
# Requires explicit project membership - workspace membership alone does NOT
# grant project content access (except for workspace admin bypass).
#
# Role levels (higher = more authority):
#   admin: 20 - Full control over project and all content
#   contributor: 15 - Can create, edit, delete issues/modules/cycles; create/edit pages/views
#   commenter: 10 - View only + add comments
#   guest: 5 - No access to issues, can only submit intake forms
# =============================================================================
PROJECT_ROLES: dict[str, SystemRoleConfig] = {
    "admin": {
        "level": 20,
        "sort_order": 100,
        "permission_schemes": ["admin"],
        "description": "Project admin - full control over project settings, members, and all content",
    },
    "contributor": {
        "level": 15,
        "sort_order": 200,
        "permission_schemes": ["contributor"],
        "description": (
            "Contributor - create/edit issues, modules, cycles; create/edit pages and views; delete own content"
        ),
    },
    "commenter": {
        "level": 10,
        "sort_order": 300,
        "permission_schemes": ["commenter"],
        "description": "Commenter - view issues, epics, modules, cycles, pages; add comments; create intake issues",
    },
    "guest": {
        "level": 5,
        "sort_order": 400,
        "permission_schemes": ["guest"],
        "description": (
            "Guest - view pages/views/labels, create intake issues; view/edit/delete own issues via conditional grants"
        ),
    },
}


# =============================================================================
# TEAMSPACE ROLES
# Permissions for teamspace-level resources.
# Requires explicit teamspace membership - workspace membership alone does NOT
# grant teamspace content access (workspace roles only get browse/create).
#
# Role levels:
#   member: 15 - View content; edit/delete/manage if teamspace lead
# =============================================================================
TEAMSPACE_ROLES: dict[str, _LegacySystemRoleConfig] = {
    "member": {
        "level": 15,
        "sort_order": 100,
        "permissions": [
            # Teamspace-level (unchanged)
            TeamspacePermissions.VIEW,
            TeamspacePermissions.EDIT & Condition.LEAD,
            TeamspacePermissions.DELETE & Condition.LEAD,
            TeamspacePermissions.MANAGE & Condition.LEAD,
            # Teamspace comments
            TeamspaceCommentPermissions.CREATE,
            TeamspaceCommentPermissions.EDIT & Condition.CREATOR,  # inline: creator only
            TeamspaceCommentPermissions.DELETE & Condition.CREATOR,  # inline: creator OR lead
            TeamspaceCommentPermissions.REACT,
            # Teamspace views
            TeamspaceWorkitemViewPermissions.VIEW,
            TeamspaceWorkitemViewPermissions.CREATE,
            TeamspaceWorkitemViewPermissions.EDIT & Condition.CREATOR,  # inline: creator only
            TeamspaceWorkitemViewPermissions.DELETE & Condition.CREATOR,  # inline: creator OR lead
            # Teamspace pages
            TeamspacePagePermissions.VIEW,
            TeamspacePagePermissions.CREATE,
            TeamspacePagePermissions.EDIT,  # collaborative — any member
            TeamspacePagePermissions.DELETE,  # inline: owner OR lead
            TeamspacePagePermissions.ARCHIVE,  # inline: owner OR lead
            # Teamspace page comments
            TeamspacePageCommentPermissions.CREATE,
            TeamspacePageCommentPermissions.EDIT,  # inline: creator only
            TeamspacePageCommentPermissions.DELETE,  # inline: creator OR lead
            TeamspacePageCommentPermissions.REACT,
            TeamspacePageCommentPermissions.RESOLVE,  # any member
        ],
        "description": "Teamspace member - content CRUD with inline creator/lead checks",
    },
}


# =============================================================================
# COMBINED SYSTEM ROLES (for convenience)
# =============================================================================
SYSTEM_ROLES = {
    "instance": INSTANCE_ROLES,
    "workspace": WORKSPACE_ROLES,
    "project": PROJECT_ROLES,
    "teamspace": TEAMSPACE_ROLES,
}

# Derived constant: set of system role slugs per namespace (for fast membership check)
SYSTEM_ROLE_SLUGS: dict[str, frozenset[str]] = {
    namespace: frozenset(roles.keys()) for namespace, roles in SYSTEM_ROLES.items()
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def role_from_member_role(member_role: int) -> str:
    """Convert member table role value (20, 15, 5) to role slug."""
    return ROLE_SLUG_MAP.get(int(member_role), "guest")


def project_role_from_member_role(member_role: int) -> str:
    """
    Convert project member role value to project-level role slug.

    Project roles differ from workspace roles:
    - 20 -> admin
    - 15 -> contributor (not "member")
    - 10 -> commenter
    - 5 -> guest
    """
    return PROJECT_ROLE_SLUG_MAP.get(int(member_role), "guest")


def role_from_legacy_value(legacy_value: int) -> str:
    """Convert a legacy role value (20, 15, 5) to a role name."""
    return LEGACY_ROLE_MAP.get(legacy_value, "guest")


def legacy_value_from_role(role_name: str) -> int:
    """Convert a role name to a legacy role value."""
    return ROLE_LEVEL_MAP.get(role_name, 5)


# ---------------------------------------------------------------------------
# Seat classification helpers
# ---------------------------------------------------------------------------
# Roles with level > PAID_ROLE_LEVEL_THRESHOLD are paid (admin, member/contributor).
# DB queries on the integer `role` column use this constant instead of magic numbers.
PAID_ROLE_LEVEL_THRESHOLD = 10

UNPAID_ROLE_SLUGS = frozenset({"guest"})


def is_paid_role_slug(slug: str) -> bool:
    """Return True if the role slug is a paid (non-guest) role."""
    return slug not in UNPAID_ROLE_SLUGS


def is_unpaid_role_slug(slug: str) -> bool:
    """Return True if the role slug is an unpaid (guest) role."""
    return slug in UNPAID_ROLE_SLUGS


# ---------------------------------------------------------------------------
# Management authority helpers
# ---------------------------------------------------------------------------
# Protected system roles and who can manage them.
# Roles NOT in this map can be managed by anyone with the relevant permission.
PROTECTED_ROLE_SLUGS: dict[str, set[str]] = {
    "owner": {"owner"},  # only owners can manage owners
    "admin": {"owner", "admin"},  # only owners and admins can manage admins
}

PROJECT_PROTECTED_ROLE_SLUGS: dict[str, set[str]] = {
    "admin": {"admin"},  # only project admins can manage project admins
}


def can_manage_role(
    actor_role_slug: str,
    target_role_slug: str,
    protected_slugs: dict[str, set[str]] | None = None,
) -> tuple[bool, str]:
    """Check if actor can manage (modify/remove) a member with the target role.

    Args:
        actor_role_slug: The acting user's resolved role slug.
        target_role_slug: The target member's current role slug.
        protected_slugs: Override protection map. Defaults to PROTECTED_ROLE_SLUGS.

    Returns:
        (allowed, error_message) tuple. error_message is empty when allowed.
    """
    slugs = protected_slugs or PROTECTED_ROLE_SLUGS
    required = slugs.get(target_role_slug)
    if required and actor_role_slug not in required:
        return False, f"You do not have permission to manage users with the {target_role_slug} role"
    return True, ""


def can_assign_role(
    actor_role_slug: str,
    assigned_role_slug: str,
    protected_slugs: dict[str, set[str]] | None = None,
) -> tuple[bool, str]:
    """Check if actor can assign (invite as, or change to) the given role.

    Args:
        actor_role_slug: The acting user's resolved role slug.
        assigned_role_slug: The role being assigned or invited into.
        protected_slugs: Override protection map. Defaults to PROTECTED_ROLE_SLUGS.

    Returns:
        (allowed, error_message) tuple. error_message is empty when allowed.
    """
    slugs = protected_slugs or PROTECTED_ROLE_SLUGS
    required = slugs.get(assigned_role_slug)
    if required and actor_role_slug not in required:
        return False, f"You do not have permission to assign the {assigned_role_slug} role"
    return True, ""


def _permission_to_string(perm: PermissionEntry) -> str:
    """Convert a typed permission entry to its string representation."""
    return str(perm)


@lru_cache(maxsize=32)
def get_system_role_permission_set(
    role_slug: str,
    namespace: str = "workspace",
) -> frozenset[str] | None:
    """
    Get the permission set for a system role as a frozenset.
    Returns None if not a system role (caller should fall through to DB).
    Resolves via Permission Schemes: role -> PS list -> union permissions.
    Cached via @lru_cache — zero DB, zero Redis.
    """
    from .permission_schemes import SYSTEM_PERMISSION_SCHEMES

    roles = SYSTEM_ROLES.get(namespace, {})
    role_config = roles.get(role_slug)
    if role_config is None:
        return None

    # INSTANCE_ROLES and TEAMSPACE_ROLES still use inline "permissions" lists.
    if "permissions" in role_config:
        return frozenset(_permission_to_string(p) for p in role_config["permissions"])

    # WORKSPACE_ROLES and PROJECT_ROLES resolve via Permission Scheme slugs.
    ps_registry = SYSTEM_PERMISSION_SCHEMES.get(namespace, {})
    all_perms: set[str] = set()
    for ps_slug in role_config["permission_schemes"]:
        ps = ps_registry.get(ps_slug)
        if ps is not None:
            for perm in ps["permissions"]:
                all_perms.add(str(perm))

    return frozenset(all_perms)


class CompiledPermissions:
    """Pre-compiled permission lookup for O(1) checks instead of O(n) iteration.

    Splits a permission set into structured components:
    - exact: unconditional exact-match permissions
    - wildcard_prefixes: resource prefixes from "resource:*" patterns
    - conditionals: mapping from base permission -> list of condition names
    - has_star: whether "*" (grant-all) is present
    """

    __slots__ = ("exact", "wildcard_prefixes", "conditionals", "has_star")

    def __init__(self, permissions: frozenset[str]):
        exact = set()
        wildcard_prefixes = set()
        conditionals: dict[str, list[str]] = {}
        has_star = False

        for pattern in permissions:
            if "+" in pattern:
                base_perm, condition = pattern.split("+", 1)
                # Handle wildcard conditionals like "comment:*+creator"
                if base_perm.endswith(":*"):
                    prefix = base_perm[:-2]
                    conditionals.setdefault(f"__wildcard__{prefix}", []).append(condition)
                else:
                    conditionals.setdefault(base_perm, []).append(condition)
            elif pattern == "*":
                has_star = True
            elif pattern.endswith(":*"):
                wildcard_prefixes.add(pattern[:-2])
            else:
                exact.add(pattern)

        self.exact = frozenset(exact)
        self.wildcard_prefixes = frozenset(wildcard_prefixes)
        self.conditionals = conditionals
        self.has_star = has_star

    def has_permission(self, permission_str: str) -> bool:
        """O(1) unconditional permission check."""
        if self.has_star:
            return True
        if permission_str in self.exact:
            return True
        # Check wildcard prefixes: "workitem" matches "workitem:*"
        resource = permission_str.split(":", 1)[0]
        return resource in self.wildcard_prefixes

    def get_conditions(self, permission_str: str) -> list[str]:
        """O(1) conditional grant lookup."""
        conditions = list(self.conditionals.get(permission_str, []))
        # Check wildcard conditionals
        resource = permission_str.split(":", 1)[0]
        wildcard_key = f"__wildcard__{resource}"
        if wildcard_key in self.conditionals:
            conditions.extend(self.conditionals[wildcard_key])
        return conditions


@lru_cache(maxsize=64)
def get_compiled_permissions(
    role_slug: str,
    namespace: str = "workspace",
) -> CompiledPermissions | None:
    """Get pre-compiled permission lookup for a system role.

    Returns None if not a system role.
    Cached via @lru_cache — zero cost after first call.
    """
    perm_set = get_system_role_permission_set(role_slug, namespace)
    if perm_set is None:
        return None
    return CompiledPermissions(perm_set)


def get_system_role_permissions(
    role_slug: str,
    namespace: str = "workspace",
) -> list[str]:
    """
    Get the list of permission patterns for a system role.

    Args:
        role_slug: The role (admin, member, guest, etc.)
        namespace: The namespace ("instance", "workspace", "project", or "teamspace")

    Returns:
        List of permission strings. For workspace/project roles, resolves via
        Permission Schemes. For instance/teamspace roles, uses inline lists.
    """
    perm_set = get_system_role_permission_set(role_slug, namespace)
    if perm_set is None:
        return []
    return list(perm_set)


def get_highest_role(roles: list[str]) -> str:
    """Given a list of role slugs, return the one with the highest level."""
    if not roles:
        return "guest"
    return max(roles, key=lambda r: ROLE_LEVEL_MAP.get(r, 0))


# Project role slugs that workspace guests are allowed to be assigned
WORKSPACE_GUEST_PROJECT_CEILING = {"guest", "commenter"}


def is_project_role_allowed_for_workspace_role(
    workspace_role_slug: str,
    project_role_slug: str,
) -> bool:
    """Check if a project role assignment is allowed given the user's workspace role.

    Only workspace guests have a ceiling: they can only be assigned
    project roles with slug 'guest' or 'commenter'. All other workspace roles
    have no restriction.
    """
    if workspace_role_slug == "guest":
        return project_role_slug in WORKSPACE_GUEST_PROJECT_CEILING
    return True


# =============================================================================
# AUTO-JOIN ROLE MAPPING
# =============================================================================

# Workspace slug → project slug mapping for auto-join.
# Custom roles (any slug not in this map) default to "contributor".
AUTO_JOIN_PROJECT_ROLE_MAP = {
    "owner": "admin",
    "admin": "admin",
    "guest": "guest",
}


def get_auto_join_project_role_slug(workspace_role_slug: str) -> str:
    """Get the project role slug to assign when a workspace member auto-joins a project.

    - owner/admin → project admin
    - guest → project guest
    - any other role (member, custom roles) → project contributor
    """
    return AUTO_JOIN_PROJECT_ROLE_MAP.get(workspace_role_slug, "contributor")


# =============================================================================
# ROLE FK RESOLUTION HELPERS
# =============================================================================


def get_roles_for_workspace(workspace_id, namespace="project", system_only=False):
    """Pre-fetch active roles for a workspace in a given namespace.

    Args:
        workspace_id: UUID of the workspace
        namespace: "project" or "workspace"
        system_only: if True, only return system roles (prevents custom role slug shadowing)
    Returns: dict {slug: Role} for direct slug lookups.
    """
    from plane.db.models.permission import Role

    qs = Role.objects.filter(
        workspace_id=workspace_id,
        namespace=namespace,
        deleted_at__isnull=True,
    )
    if system_only:
        qs = qs.filter(is_system=True)
    return {r.slug: r for r in qs}


def get_project_roles_for_workspace(workspace_id):
    """Pre-fetch active project roles (system + custom) for a workspace."""
    return get_roles_for_workspace(workspace_id, "project", system_only=False)


def get_workspace_roles_for_workspace(workspace_id):
    """Pre-fetch active workspace roles (system + custom) for a workspace."""
    return get_roles_for_workspace(workspace_id, "workspace", system_only=False)


def get_workspace_role_slug(ws_member) -> str:
    """Get the workspace role slug from a WorkspaceMember instance.

    Uses role_ref.slug when available, falls back to numeric role mapping.
    Callers should use select_related("role_ref") on the queryset.
    """
    if ws_member.role_ref_id:
        return ws_member.role_ref.slug
    return role_from_member_role(ws_member.role)


def get_project_role_slug(proj_member) -> str:
    """Get the project role slug from a ProjectMember instance.

    Uses role_ref.slug when available, falls back to numeric role mapping.
    Callers should use select_related("role_ref") on the queryset.
    """
    if proj_member.role_ref_id:
        return proj_member.role_ref.slug
    return project_role_from_member_role(proj_member.role)


def resolve_project_role_for_ws_member(ws_member, workspace_id, role_cache=None):
    """Determine the project Role FK for a workspace member auto-joining a project.

    Uses slug-based mapping (not levels):
    - owner/admin → project admin
    - guest → project guest
    - any other role (member, custom) → project contributor

    Args:
        ws_member: WorkspaceMember instance (select_related("role_ref") recommended)
        workspace_id: UUID of the workspace
        role_cache: optional pre-fetched {slug: Role} from get_project_roles_for_workspace()
    Returns:
        Role object (project namespace), or None if not found
    """
    if role_cache is None:
        role_cache = get_project_roles_for_workspace(workspace_id)

    ws_slug = get_workspace_role_slug(ws_member)
    proj_slug = get_auto_join_project_role_slug(ws_slug)
    return role_cache.get(proj_slug)


def enforce_project_role_ceiling(ws_member_or_role, requested_project_role: int) -> int:
    """Cap a project role to the workspace guest ceiling if applicable.

    Used when an admin explicitly assigns a project role to a member.
    Workspace guests can only be assigned guest (5) or commenter (10).
    Returns the role unchanged if allowed, or capped to commenter (10).

    Args:
        ws_member_or_role: Either a WorkspaceMember instance (with optional role_ref)
            or a numeric workspace role level (int) for simpler call sites.
        requested_project_role: The numeric project role being requested.
    """
    if isinstance(ws_member_or_role, int):
        ws_slug = role_from_member_role(ws_member_or_role)
    else:
        ws_slug = get_workspace_role_slug(ws_member_or_role)

    proj_slug = project_role_from_member_role(requested_project_role)
    if is_project_role_allowed_for_workspace_role(ws_slug, proj_slug):
        return requested_project_role
    return min(requested_project_role, 10)


def enforce_project_role_ceiling_for_role(ws_member, requested_role, role_cache=None):
    """Cap a project Role to the workspace guest ceiling if applicable.

    Role-aware variant of enforce_project_role_ceiling that works with Role
    objects instead of numeric values.

    Args:
        ws_member: WorkspaceMember instance (select_related("role_ref") recommended).
        requested_role: The project-namespace Role object being requested.
        role_cache: optional pre-fetched {slug: Role} from get_project_roles_for_workspace().
    Returns:
        The requested Role if allowed, or the commenter Role if capped.
    """
    ws_slug = get_workspace_role_slug(ws_member)
    if is_project_role_allowed_for_workspace_role(ws_slug, requested_role.slug):
        return requested_role

    # Capped — return commenter role for this workspace
    if role_cache is None:
        role_cache = get_project_roles_for_workspace(ws_member.workspace_id)
    return role_cache.get("commenter", requested_role)


# =============================================================================
# WORKSPACE SYSTEM ROLE CREATION
# =============================================================================


def create_workspace_system_roles(workspace_id) -> int:
    """
    Create system Role records and link them to system Permission Schemes.
    Called when a new workspace is created. Ensures global system PS rows
    exist, creates per-workspace role rows, and creates M2M links.
    Uses bulk_create with ignore_conflicts=True for idempotency.
    Returns the number of roles created.
    """
    from plane.db.models.permission import Role, PermissionScheme, RolePermissionScheme

    _seed_system_permission_schemes()

    roles = []
    for namespace, roles_dict in [("workspace", WORKSPACE_ROLES), ("project", PROJECT_ROLES)]:
        for slug, config in roles_dict.items():
            roles.append(
                Role(
                    workspace_id=workspace_id,
                    namespace=namespace,
                    slug=slug,
                    name=slug.title(),
                    level=config["level"],
                    sort_order=config["sort_order"],
                    description=config["description"],
                    is_system=True,
                )
            )

    Role.objects.bulk_create(roles, ignore_conflicts=True)

    workspace_roles = {
        (r.namespace, r.slug): r
        for r in Role.objects.filter(
            workspace_id=workspace_id,
            is_system=True,
            deleted_at__isnull=True,
        )
    }
    system_ps = {
        (ps.namespace, ps.slug): ps
        for ps in PermissionScheme.objects.filter(
            workspace__isnull=True,
            is_system=True,
            deleted_at__isnull=True,
        )
    }

    m2m_links = []
    for namespace, roles_dict in [("workspace", WORKSPACE_ROLES), ("project", PROJECT_ROLES)]:
        for slug, config in roles_dict.items():
            role = workspace_roles.get((namespace, slug))
            if role is None:
                continue
            for ps_slug in config["permission_schemes"]:
                ps = system_ps.get((namespace, ps_slug))
                if ps is not None:
                    m2m_links.append(
                        RolePermissionScheme(
                            workspace_id=workspace_id,
                            role=role,
                            permission_scheme=ps,
                        )
                    )

    RolePermissionScheme.objects.bulk_create(m2m_links, ignore_conflicts=True)
    return len(roles)


def _seed_system_permission_schemes():
    """Ensure global system PermissionScheme rows exist in DB. Idempotent upsert.

    Safe under concurrent workspace creation — IntegrityError on duplicate
    insert is caught and retried as an update.
    """
    from django.db import IntegrityError
    from .permission_schemes import SYSTEM_PERMISSION_SCHEMES
    from plane.db.models.permission import PermissionScheme

    for namespace, schemes in SYSTEM_PERMISSION_SCHEMES.items():
        for slug, config in schemes.items():
            try:
                PermissionScheme.objects.update_or_create(
                    workspace=None,
                    namespace=namespace,
                    slug=slug,
                    is_system=True,
                    deleted_at__isnull=True,
                    defaults={
                        "name": config["name"],
                        "permissions": [str(p) for p in config["permissions"]],
                    },
                )
            except IntegrityError:
                # Concurrent insert won the race — update the existing row
                PermissionScheme.objects.filter(
                    workspace=None,
                    namespace=namespace,
                    slug=slug,
                    is_system=True,
                    deleted_at__isnull=True,
                ).update(
                    name=config["name"],
                    permissions=[str(p) for p in config["permissions"]],
                )
