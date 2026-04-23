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
Permission Inheritance Configuration

Defines the resource hierarchy and how permissions inherit down the tree.
This is the core of the Zanzibar-style permission resolution.
"""

from dataclasses import dataclass
from functools import lru_cache
from typing import TypedDict, Optional
from .definitions import ResourceType


class ResourceConfig(TypedDict):
    children: list[str]  # Child resource types
    parent: Optional[str]  # Parent resource type
    parent_field: Optional[str]  # Field name that references parent ID


@dataclass(frozen=True)
class LinkRelation:
    """Defines how membership in one resource grants access to another.

    'Users who are members of a {source_type} get access to linked
     {target_type}s. The access level (role) is stored on the
     source->target link tuple's relation field.'

    Group membership is binary — no source_relation filter. This
    matches the industry pattern (GitHub, GitLab, Zanzibar, Google
    Workspace): the role lives on the link, not the membership.
    """

    source_type: str  # Resource type the user belongs to (e.g., "teamspace")
    target_type: str  # Resource type they gain access to (e.g., "project")


# Link relations define how resources can be accessed via other resources.
# The access level (role) comes from the link tuple's relation field in ResourcePermission,
# not from this config. This enables Zanzibar-style tuple traversal.
LINK_RELATIONS: list[LinkRelation] = [
    # Teamspace members get access to linked projects.
    # The project role comes from the TeamspaceProject->ResourcePermission
    # tuple's relation field (e.g., "contributor").
    LinkRelation(source_type="teamspace", target_type="project"),
]

# Pre-built index: target_type -> [LinkRelation, ...]
_LINK_INDEX: dict[str, list[LinkRelation]] = {}
for _lr in LINK_RELATIONS:
    _LINK_INDEX.setdefault(_lr.target_type, []).append(_lr)


def get_link_relations(target_type: str) -> list[LinkRelation]:
    """Get all link relations that grant access to the given target resource type."""
    return _LINK_INDEX.get(target_type, [])


# =============================================================================
# RESOURCE HIERARCHY — PARENT DECLARATIONS (Single Source of Truth)
# =============================================================================
# Only declare (parent, parent_field) per resource. The `children` lists are
# auto-derived below, eliminating the bidirectional sync requirement.
#
# To add a new resource: add ONE entry here. Children are computed automatically.
#
# NOTE on conceptual parent_fields: Some resources use polymorphic or non-FK
# parent fields that are never traversed by the engine (endpoints use
# scope_param_type instead). These are marked with comments.

_PARENT_DECLARATIONS: dict[str, tuple[Optional[str], Optional[str]]] = {
    # (parent, parent_field)
    # --- Root ---
    ResourceType.WORKSPACE: (None, None),

    # --- Workspace children ---
    ResourceType.WORKSPACE_MEMBER: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WIKI: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WIKI_COLLECTION: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_WORKITEM_VIEW: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.INTEGRATION: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WEBHOOK: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.API_TOKEN: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.CUSTOM_ROLE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.INITIATIVE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.TEAMSPACE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.FAVORITE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_DRAFT: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.DASHBOARD: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.CUSTOMER: (ResourceType.WORKSPACE, "workspace_id"),
    # NOTE: FileAsset uses entity_type + entity_identifier (polymorphic, not a real FK).
    ResourceType.CUSTOMER_ATTACHMENT: (ResourceType.CUSTOMER, "entity_identifier"),
    ResourceType.WORKSPACE_ASSET: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_PROJECT_STATE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_WORKLOG: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_USER_ACTIVITY: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_WORKITEM_TEMPLATE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_PAGE_TEMPLATE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_PROJECT_TEMPLATE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.ANALYTICS: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.AI: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_ACTIVITY: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.RELEASE: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.BILLING: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_AUTOMATION: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_CUSTOM_PROPERTY: (ResourceType.WORKSPACE, "workspace_id"),
    ResourceType.WORKSPACE_WORKITEM_TYPE: (ResourceType.WORKSPACE, "workspace_id"),

    # --- Project (child of workspace) ---
    ResourceType.PROJECT: (ResourceType.WORKSPACE, "workspace_id"),

    # --- Project children ---
    ResourceType.PROJECT_MEMBER: (ResourceType.PROJECT, "project_id"),
    ResourceType.WORKITEM: (ResourceType.PROJECT, "project_id"),
    ResourceType.EPIC: (ResourceType.PROJECT, "project_id"),
    ResourceType.EPIC_UPDATE: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_UPDATE: (ResourceType.PROJECT, "project_id"),
    ResourceType.MODULE: (ResourceType.PROJECT, "project_id"),
    ResourceType.CYCLE: (ResourceType.PROJECT, "project_id"),
    ResourceType.CYCLE_UPDATE: (ResourceType.PROJECT, "project_id"),
    ResourceType.PAGE: (ResourceType.PROJECT, "project_id"),
    ResourceType.WORKITEM_VIEW: (ResourceType.PROJECT, "project_id"),
    ResourceType.INTAKE: (ResourceType.PROJECT, "project_id"),
    ResourceType.LABEL: (ResourceType.PROJECT, "project_id"),
    ResourceType.STATE: (ResourceType.PROJECT, "project_id"),
    ResourceType.ESTIMATE: (ResourceType.PROJECT, "project_id"),
    ResourceType.ATTACHMENT: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_ANALYTICS: (ResourceType.PROJECT, "project_id"),
    ResourceType.EPIC_PROPERTY: (ResourceType.PROJECT, "project_id"),
    ResourceType.ISSUE_PROPERTY: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_AUTOMATION: (ResourceType.PROJECT, "project_id"),
    ResourceType.WORKFLOW: (ResourceType.PROJECT, "project_id"),
    ResourceType.MILESTONE: (ResourceType.PROJECT, "project_id"),
    ResourceType.RECURRING_WORKITEM: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_ASSET: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_LINK: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_WORKITEM_TEMPLATE: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_PAGE_TEMPLATE: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_ACTIVITY: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_MEMBER_ACTIVITY: (ResourceType.PROJECT, "project_id"),
    ResourceType.PROJECT_WORKITEM_TYPE: (ResourceType.PROJECT, "project_id"),

    # --- Workitem children ---
    ResourceType.COMMENT: (ResourceType.WORKITEM, "issue_id"),
    ResourceType.WORKITEM_LINK: (ResourceType.WORKITEM, "issue_id"),
    ResourceType.WORKITEM_RELATION: (ResourceType.WORKSPACE, "workspace_id"),

    # --- Epic children ---
    ResourceType.EPIC_LINK: (ResourceType.EPIC, "issue_id"),

    # --- Update children ---
    ResourceType.EPIC_UPDATE_COMMENT: (ResourceType.EPIC_UPDATE, "parent_id"),
    ResourceType.PROJECT_UPDATE_COMMENT: (ResourceType.PROJECT_UPDATE, "parent_id"),

    # --- Initiative children ---
    ResourceType.INITIATIVE_COMMENT: (ResourceType.INITIATIVE, "initiative_id"),
    ResourceType.INITIATIVE_LINK: (ResourceType.INITIATIVE, "initiative_id"),
    # NOTE: EntityUpdates has no initiative_id FK. parent_field is conceptual only —
    # never traversed by the engine (endpoints use scope_param_type=ResourceType.INITIATIVE).
    # Keeping parent=initiative preserves is_child_of() correctness for defer_conditions.
    ResourceType.INITIATIVE_UPDATE: (ResourceType.INITIATIVE, "initiative_id"),
    ResourceType.INITIATIVE_UPDATE_COMMENT: (ResourceType.INITIATIVE, "initiative_id"),
    # NOTE: FileAsset uses entity_type + entity_identifier (polymorphic, not a real FK).
    ResourceType.INITIATIVE_ATTACHMENT: (ResourceType.INITIATIVE, "entity_identifier"),

    # --- Teamspace children ---
    ResourceType.TEAMSPACE_COMMENT: (ResourceType.TEAMSPACE, "team_space_id"),
    ResourceType.TEAMSPACE_WORKITEM_VIEW: (ResourceType.TEAMSPACE, "team_space_id"),
    ResourceType.TEAMSPACE_PAGE: (ResourceType.TEAMSPACE, "team_space_id"),

    # --- Teamspace page children ---
    ResourceType.TEAMSPACE_PAGE_COMMENT: (ResourceType.TEAMSPACE_PAGE, "page_id"),
}


def _build_resource_hierarchy() -> dict[str, ResourceConfig]:
    """Build RESOURCE_HIERARCHY with auto-derived children lists.

    Only parent declarations are maintained manually. Children are computed
    by inverting the parent relationships.
    """
    # First pass: create entries with empty children
    hierarchy: dict[str, ResourceConfig] = {}
    for resource_type, (parent, parent_field) in _PARENT_DECLARATIONS.items():
        hierarchy[str(resource_type)] = {
            "children": [],
            "parent": parent,
            "parent_field": parent_field,
        }

    # Second pass: populate children by inverting parent declarations
    for resource_type, (parent, _) in _PARENT_DECLARATIONS.items():
        if parent is not None:
            parent_key = str(parent)
            if parent_key in hierarchy:
                hierarchy[parent_key]["children"].append(str(resource_type))

    return hierarchy


RESOURCE_HIERARCHY: dict[str, ResourceConfig] = _build_resource_hierarchy()


# =============================================================================
# RESOURCE TYPE GROUPINGS — auto-derived from _PARENT_DECLARATIONS
# =============================================================================
# These classify each resource type by its role namespace scope. Derived from
# the hierarchy so they never drift. Used by engine/roles.py for namespace
# mapping and exported via definitions.py for backward compatibility.

def _get_scope_ancestor(resource_type: str) -> str:
    """Walk parent chain to find the scope-defining ancestor.

    Returns the first ancestor that is "workspace", "project", or "teamspace",
    or the resource itself if it IS one of those scope types.
    """
    _SCOPE_TYPES = {"workspace", "project", "teamspace"}
    current = str(resource_type)
    if current in _SCOPE_TYPES:
        return current
    while True:
        entry = _PARENT_DECLARATIONS.get(current)
        if entry is None:
            return "workspace"  # fallback
        parent, _ = entry
        if parent is None:
            return "workspace"
        parent_str = str(parent)
        if parent_str in _SCOPE_TYPES:
            return parent_str
        current = parent_str


def _build_resource_type_groupings() -> (
    tuple[frozenset[ResourceType], frozenset[ResourceType], frozenset[ResourceType]]
):
    """Build workspace/teamspace/project groupings from the hierarchy.

    Each resource is classified by walking its parent chain to find the
    nearest scope-defining ancestor (workspace, project, or teamspace).
    """
    workspace_types: set[ResourceType] = set()
    teamspace_types: set[ResourceType] = set()
    project_types: set[ResourceType] = set()

    for resource_type_val in _PARENT_DECLARATIONS:
        rt = ResourceType(str(resource_type_val))
        scope = _get_scope_ancestor(str(resource_type_val))

        if scope == "teamspace":
            teamspace_types.add(rt)
        elif scope == "project":
            project_types.add(rt)
        else:
            workspace_types.add(rt)

    return frozenset(workspace_types), frozenset(teamspace_types), frozenset(project_types)


WORKSPACE_RESOURCE_TYPES, TEAMSPACE_RESOURCE_TYPES, PROJECT_RESOURCE_TYPES = (
    _build_resource_type_groupings()
)

# Ancestor types that trigger IDOR validation when encountered in a hierarchy chain.
# The engine compares the DB-resolved ancestor ID against the caller-provided ID.
_VALIDATED_ANCESTOR_TYPES = frozenset({"workspace", "project"})


def get_workspace_field_path(resource_type: str) -> Optional[str]:
    """
    Compute the Django ORM field path from a resource to its workspace_id
    by walking the RESOURCE_HIERARCHY parent chain.

    Examples:
        "workspace_workitem_view" → "workspace_id"     (parent is workspace)
        "workitem_view"           → "project__workspace_id" (parent is project → workspace)
        "comment"                 → "issue__project__workspace_id"
        "workspace"               → None (IS the workspace)
    """
    config = RESOURCE_HIERARCHY.get(str(resource_type))
    if not config or not config["parent"]:
        return None  # This IS the root (workspace)
    if str(config["parent"]) == "workspace":
        return config["parent_field"]  # e.g., "workspace_id"
    # Walk up: convert FK field to relation name, recurse
    rel_name = config["parent_field"].removesuffix("_id")
    parent_path = get_workspace_field_path(str(config["parent"]))
    if parent_path:
        return f"{rel_name}__{parent_path}"
    return None


@lru_cache(maxsize=None)
def build_chain_config(
    resource_type: str,
) -> Optional[dict]:
    """Build direct-field chain config for single-query hierarchy resolution.

    Walks RESOURCE_HIERARCHY from ``resource_type`` up to the workspace root,
    collecting direct field names that exist on the model itself. Every
    project-scoped model has ``project_id`` and ``workspace_id`` as direct
    columns (via ``ProjectBaseModel``), so no ORM join-path traversal is needed.

    Returns a dict with:
    - ``fields``: tuple of field names for ``Model.objects.values(...)``
    - ``chain``: tuple of ``(ancestor_type, field_name, validation_type)``
      where ``validation_type`` is ``"project"`` or ``"workspace"`` for IDOR
      checks, ``None`` otherwise.

    Returns ``None`` when single-query traversal is impossible:
    - Any ``parent_field`` that doesn't end with ``_id`` (non-FK)
    - Any ancestor that uses a bridge table (``get_bridge_config()``)

    Example for ``"comment"``::

        {"fields": ("issue_id", "project_id", "workspace_id"),
         "chain": (("workitem", "issue_id", None),
                   ("project", "project_id", "project"),
                   ("workspace", "workspace_id", "workspace"))}
    """
    from .resource_models import get_bridge_config

    chain: list[tuple[str, str, Optional[str]]] = []
    current_type = resource_type

    while True:
        config = RESOURCE_HIERARCHY.get(str(current_type))
        if not config or not config["parent"]:
            break

        parent_type = str(config["parent"])
        parent_field = config["parent_field"]

        # Non-FK field — can't use values() traversal
        if not parent_field.endswith("_id"):
            return None

        # Bridge table — can't join across it
        if get_bridge_config(current_type):
            return None

        # Determine validation type for IDOR checks
        validation_type = parent_type if parent_type in _VALIDATED_ANCESTOR_TYPES else None

        # Use parent_field directly — all models have ancestor IDs as
        # direct columns (workspace_id, project_id) via base model classes.
        chain.append((parent_type, parent_field, validation_type))
        current_type = parent_type

    fields = tuple(field_name for _, field_name, _ in chain)
    return {"fields": fields, "chain": tuple(chain)}


def get_resource_config(resource_type: str) -> Optional[ResourceConfig]:
    """Get the configuration for a resource type."""
    return RESOURCE_HIERARCHY.get(resource_type)


def get_all_resource_types_under(resource_type: str) -> frozenset[str]:
    """
    Get resource_type + all descendants from the hierarchy (recursive).

    For workspace → returns all resource types (workspace + project subtree + direct children).
    For project → returns project + its descendants.
    """
    result = {resource_type}
    config = RESOURCE_HIERARCHY.get(resource_type)
    if config:
        for child in config["children"]:
            result |= get_all_resource_types_under(child)
    return frozenset(result)


def is_child_of(child_type: str, parent_type: str) -> bool:
    """Check if child_type is a child of parent_type (direct or indirect)."""
    current = child_type
    visited = set()

    while current and current not in visited:
        visited.add(current)
        config = get_resource_config(current)
        if not config:
            return False

        parent = config["parent"]
        if parent == parent_type:
            return True
        current = parent

    return False


def validate_permission_system_consistency() -> None:
    """Validate that RESOURCE_ACTIONS, RESOURCE_HIERARCHY, and resource model map are in sync.

    Call from AppConfig.ready() to catch configuration drift at startup.

    Checks:
    1. Every resource type in RESOURCE_ACTIONS has a hierarchy entry
    2. Every hierarchy entry (except aliases) has an entry in RESOURCE_ACTIONS
    3. Every non-root resource type has a model mapping (for condition evaluation)

    Raises AssertionError with a clear message identifying the missing entries.
    """
    from .definitions import RESOURCE_ACTIONS
    from .resource_models import _build_resource_model_map

    model_map = _build_resource_model_map()

    # Collect resource type string values from RESOURCE_ACTIONS
    action_types = {str(rt) for rt in RESOURCE_ACTIONS}
    hierarchy_types = set(RESOURCE_HIERARCHY.keys())

    # 1. RESOURCE_ACTIONS → RESOURCE_HIERARCHY
    missing_hierarchy = action_types - hierarchy_types
    assert not missing_hierarchy, (
        f"Resource types in RESOURCE_ACTIONS but missing from RESOURCE_HIERARCHY: {missing_hierarchy}. "
        f"Add entries to _PARENT_DECLARATIONS in inheritance.py."
    )

    # 2. RESOURCE_HIERARCHY → RESOURCE_ACTIONS
    missing_actions = hierarchy_types - action_types
    assert not missing_actions, (
        f"Resource types in RESOURCE_HIERARCHY but missing from RESOURCE_ACTIONS: {missing_actions}. "
        f"Add entries to RESOURCE_ACTIONS in definitions.py."
    )

    # 3. Model map coverage — log missing entries for awareness.
    # Not all resource types need model mappings (e.g., webhook, integration,
    # api_token use different model paths; analytics/ai are feature flags).
    import logging
    _logger = logging.getLogger(__name__)
    model_types = set(model_map.keys())
    missing_models = action_types - model_types
    if missing_models:
        _logger.debug(
            "Resource types without model mapping (OK if they don't use "
            "condition evaluation): %s", missing_models,
        )
