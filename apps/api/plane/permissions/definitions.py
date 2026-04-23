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
Permission Definitions

This module defines all atomic permissions in the system.
Permissions are the combination of a ResourceType and Action.

Example: Permission(ResourceType.WORKITEM, Action.EDIT) -> "issue:edit"

Format: "resource:action" (e.g., "issue:view", "wiki:edit", "project:browse")

Resources that exist at multiple hierarchy levels are disambiguated with
distinct resource type names:
- Workspace Pages -> "wiki" (not "page")
- Workspace Views -> "workspace_workitem_view" (not "view")
- Workspace Members -> "workspace_member" (not "member")
- Project Members -> "project_member" (not "member")
"""

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Optional, FrozenSet


class ResourceType(str, Enum):
    """
    All resource types that can have permissions.
    These map to database models/entities in the system.
    """

    # Workspace-level resources
    WORKSPACE = "workspace"
    WORKSPACE_MEMBER = "workspace_member"
    WIKI = "wiki"
    WIKI_COLLECTION = "wiki_collection"
    WORKSPACE_WORKITEM_VIEW = "workspace_workitem_view"
    INITIATIVE = "initiative"
    INITIATIVE_COMMENT = "initiative_comment"
    INITIATIVE_ATTACHMENT = "initiative_attachment"
    INITIATIVE_LINK = "initiative_link"
    INITIATIVE_UPDATE = "initiative_update"
    INITIATIVE_UPDATE_COMMENT = "initiative_update_comment"
    TEAMSPACE = "teamspace"
    TEAMSPACE_COMMENT = "teamspace_comment"
    TEAMSPACE_WORKITEM_VIEW = "teamspace_workitem_view"
    TEAMSPACE_PAGE = "teamspace_page"
    TEAMSPACE_PAGE_COMMENT = "teamspace_page_comment"
    INTEGRATION = "integration"
    WEBHOOK = "webhook"
    API_TOKEN = "api_token"
    CUSTOM_ROLE = "custom_role"

    # Workspace feature resources
    DASHBOARD = "dashboard"
    ANALYTICS = "analytics"
    PROJECT_ANALYTICS = "project_analytics"  # Project-scoped analytics (advance analytics per project)
    AI = "ai"
    WORKSPACE_ACTIVITY = "workspace_activity"  # Workspace member activity logs
    WORKSPACE_USER_ACTIVITY = "workspace_user_activity"  # Workspace user activity logs
    FAVORITE = "favorite"  # User favorites (workspace-scoped)
    WORKSPACE_DRAFT = "workspace_draft"  # Personal draft issues (workspace-scoped)
    CUSTOMER = "customer"
    CUSTOMER_ATTACHMENT = "customer_attachment"
    WORKSPACE_ASSET = "workspace_asset"  # Workspace-scoped asset operations
    WORKSPACE_PROJECT_STATE = "workspace_project_state"  # Project grouping states (CRUD on ProjectState)
    WORKSPACE_WORKLOG = "workspace_worklog"  # Workspace-level worklog listing and export
    WORKSPACE_CUSTOM_PROPERTY = "workspace_custom_property"
    WORKSPACE_WORKITEM_TYPE = "workspace_workitem_type"
    RELEASE = "release"  # Workspace-scoped release management
    BILLING = "billing"  # Workspace-scoped billing management

    # Project-level resources
    PROJECT = "project"
    PROJECT_MEMBER = "project_member"
    WORKITEM = "workitem"
    EPIC = "epic"
    EPIC_UPDATE = "epic_update"
    EPIC_UPDATE_COMMENT = "epic_update_comment"
    PROJECT_UPDATE = "project_update"
    PROJECT_UPDATE_COMMENT = "project_update_comment"
    MODULE = "module"
    CYCLE = "cycle"
    CYCLE_UPDATE = "cycle_update"
    PAGE = "page"  # Project pages only
    WORKITEM_VIEW = "workitem_view"  # Project views (saved filters)
    INTAKE = "intake"
    LABEL = "label"  # Project-only
    STATE = "state"  # Project-only
    ESTIMATE = "estimate"
    COMMENT = "comment"
    ATTACHMENT = "attachment"
    WORKITEM_LINK = "workitem_link"
    WORKITEM_RELATION = "workitem_relation"
    PROJECT_ACTIVITY = "project_activity"  # Project activity logs
    PROJECT_MEMBER_ACTIVITY = "project_member_activity"  # Project member activity logs
    EPIC_LINK = "epic_link"
    EPIC_PROPERTY = "epic_property"
    ISSUE_PROPERTY = "issue_property"
    PROJECT_AUTOMATION = "project_automation"
    WORKSPACE_AUTOMATION = "workspace_automation"
    WORKFLOW = "workflow"
    MILESTONE = "milestone"
    RECURRING_WORKITEM = "recurring_workitem"
    PROJECT_ASSET = "project_asset"  # Project-scoped asset operations (upload, download, serve)
    PROJECT_LINK = "project_link"  # Project-level links (PROJECT_OVERVIEW feature)
    PROJECT_WORKITEM_TYPE = "project_workitem_type"

    # Template resources (workspace-level)
    WORKSPACE_WORKITEM_TEMPLATE = "workspace_workitem_template"
    WORKSPACE_PAGE_TEMPLATE = "workspace_page_template"
    WORKSPACE_PROJECT_TEMPLATE = "workspace_project_template"

    # Template resources (project-level)
    PROJECT_WORKITEM_TEMPLATE = "project_workitem_template"
    PROJECT_PAGE_TEMPLATE = "project_page_template"

    def __str__(self) -> str:
        return self.value


class Action(str, Enum):
    """
    All possible actions that can be performed on resources.
    """

    # Collection browsing
    BROWSE = "browse"  # List resources in a collection

    # Basic CRUD
    VIEW = "view"
    CREATE = "create"
    EDIT = "edit"
    DELETE = "delete"

    # Resource-specific actions
    MANAGE = "manage"  # Manage settings, members
    ASSIGN = "assign"  # Assign to users
    SHARE = "share"  # Share with others (internal private resource sharing)
    PUBLISH = "publish"  # Publish externally (outside ecosystem)
    ARCHIVE = "archive"  # Archive/unarchive
    EXPORT = "export"  # Export data
    IMPORT = "import"  # Import data

    # Advanced actions
    BULK_EDIT = "bulk_edit"  # Bulk operations
    TRANSFER = "transfer"  # Transfer ownership
    USE = "use"  # Use a feature/service
    INVITE = "invite"  # Invite members
    REMOVE = "remove"  # Remove members

    # Workspace-specific actions
    CONNECT = "connect"  # Connect integrations
    CHANGE_ROLE = "change_role"  # Change member roles
    DEFINE = "define"  # Define project roles/templates

    # Project-specific actions
    COMMENT = "comment"  # Comment on resources
    REACT = "react"  # React to resources
    SUBMIT = "submit"  # Submit intake forms
    CONFIGURE = "configure"  # Configure intake forms
    RESOLVE = "resolve"  # Resolve/unresolve comments

    def __str__(self) -> str:
        return self.value


class Condition(str, Enum):
    """
    Named conditions that can be attached to permission grants.

    A conditional grant is only effective when the condition is satisfied
    at check time. For example, CREATOR means the user must be the
    created_by of the resource AND have active membership.
    """

    CREATOR = "creator"
    LEAD = "lead"

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class Permission:
    """
    A permission is the combination of a resource type and action.

    Immutable (frozen) for safe use as dict keys and in sets.

    Examples:
        Permission(ResourceType.WORKITEM, Action.EDIT) -> "issue:edit"
        Permission(ResourceType.WIKI, Action.VIEW) -> "wiki:view"
        Permission.from_string("issue:edit") -> Permission(ResourceType.WORKITEM, Action.EDIT)

    Supports conditional grants via the & operator:
        CommentPermissions.EDIT & Condition.CREATOR -> ConditionalGrant("comment:edit+creator")
    """

    resource_type: ResourceType
    action: Action

    def __str__(self) -> str:
        return f"{self.resource_type}:{self.action}"

    def __repr__(self) -> str:
        return f"Permission({self.resource_type!r}, {self.action!r})"

    def __and__(self, condition: "Condition") -> "ConditionalGrant":
        """Create a conditional grant: Permission & Condition.CREATOR -> ConditionalGrant."""
        if isinstance(condition, Condition):
            return ConditionalGrant(self, condition)
        return NotImplemented

    @classmethod
    def from_string(cls, permission_str: str) -> Optional["Permission"]:
        """
        Parse a permission string into a Permission object.

        Format: "resource:action" (e.g., "issue:view", "wiki:edit")

        Returns None if the string is invalid.
        """
        try:
            parts = permission_str.split(":")
            if len(parts) != 2:
                return None
            resource_str, action_str = parts
            resource_type = ResourceType(resource_str)
            action = Action(action_str)
            return cls(resource_type, action)
        except (ValueError, KeyError):
            return None


@dataclass(frozen=True)
class ConditionalGrant:
    """
    A permission grant with a condition attached.

    Created via the & operator: CommentPermissions.EDIT & Condition.CREATOR
    String representation uses + separator: "comment:edit+creator"

    The engine evaluates the condition at check time:
    - Unconditional grants always apply
    - Conditional grants only apply when the condition is satisfied
    """

    permission: Permission
    condition: Condition

    def __str__(self) -> str:
        return f"{self.permission}+{self.condition}"

    def __repr__(self) -> str:
        return f"ConditionalGrant({self.permission!r}, {self.condition!r})"


@dataclass(frozen=True)
class WildcardGrant:
    """
    A wildcard grant for all actions on a resource type.

    Type-safe replacement for raw strings like "workitem:*" in role definitions.
    Validates the resource type at construction time — typos are caught immediately.

    Usage in system_roles.py:
        WildcardGrant(ResourceType.WORKITEM)   # replaces "workitem:*"
        WildcardGrant(ResourceType.EPIC)       # replaces "epic:*"
    """

    resource_type: ResourceType

    def __post_init__(self):
        if not isinstance(self.resource_type, ResourceType):
            raise TypeError(
                f"WildcardGrant requires a ResourceType, got {type(self.resource_type).__name__}: "
                f"{self.resource_type!r}"
            )

    def __str__(self) -> str:
        return f"{self.resource_type}:*"

    def __repr__(self) -> str:
        return f"WildcardGrant({self.resource_type!r})"


class _FullAccessSentinel:
    """Sentinel for the '*' (full access) grant. Use FULL_ACCESS constant."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __str__(self) -> str:
        return "*"

    def __repr__(self) -> str:
        return "FULL_ACCESS"

    def __hash__(self) -> int:
        return hash("*")

    def __eq__(self, other) -> bool:
        return isinstance(other, _FullAccessSentinel) or other == "*"


FULL_ACCESS = _FullAccessSentinel()
"""Grant all permissions. Type-safe replacement for the raw string "*" in role definitions."""


# =============================================================================
# PERMISSION CLASSES (Single Source of Truth)
# =============================================================================
# Static class definitions for full IDE support: autocomplete, type checking,
# and "Go to Definition". RESOURCE_ACTIONS is derived from these classes
# automatically — no duplication.
#
# To add a new resource type:
# 1. Add to ResourceType enum above
# 2. Add a static permission class below
# 3. Register it in _PERMISSION_CLASSES at the bottom of this section


# ---- Workspace-level resources ----


class WorkspacePermissions:
    """Permissions for workspace resources."""

    DELETE = Permission(ResourceType.WORKSPACE, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE, Action.EDIT)
    INVITE = Permission(ResourceType.WORKSPACE, Action.INVITE)
    MANAGE = Permission(ResourceType.WORKSPACE, Action.MANAGE)
    TRANSFER = Permission(ResourceType.WORKSPACE, Action.TRANSFER)
    VIEW = Permission(ResourceType.WORKSPACE, Action.VIEW)


class WorkspaceMemberPermissions:
    """Permissions for workspace_member resources."""

    CHANGE_ROLE = Permission(ResourceType.WORKSPACE_MEMBER, Action.CHANGE_ROLE)
    EDIT = Permission(ResourceType.WORKSPACE_MEMBER, Action.EDIT)
    IMPORT = Permission(ResourceType.WORKSPACE_MEMBER, Action.IMPORT)
    INVITE = Permission(ResourceType.WORKSPACE_MEMBER, Action.INVITE)
    REMOVE = Permission(ResourceType.WORKSPACE_MEMBER, Action.REMOVE)
    VIEW = Permission(ResourceType.WORKSPACE_MEMBER, Action.VIEW)


class WikiPermissions:
    """Permissions for wiki (workspace pages) resources."""

    COMMENT = Permission(ResourceType.WIKI, Action.COMMENT)
    CREATE = Permission(ResourceType.WIKI, Action.CREATE)
    DELETE = Permission(ResourceType.WIKI, Action.DELETE)
    EDIT = Permission(ResourceType.WIKI, Action.EDIT)
    SHARE = Permission(ResourceType.WIKI, Action.SHARE)
    VIEW = Permission(ResourceType.WIKI, Action.VIEW)


class WikiCollectionPermissions:
    """Permissions for wiki_collection (workspace page collection) resources."""

    CREATE = Permission(ResourceType.WIKI_COLLECTION, Action.CREATE)
    DELETE = Permission(ResourceType.WIKI_COLLECTION, Action.DELETE)
    EDIT = Permission(ResourceType.WIKI_COLLECTION, Action.EDIT)
    VIEW = Permission(ResourceType.WIKI_COLLECTION, Action.VIEW)


class WorkspaceWorkitemViewPermissions:
    """Permissions for workspace_workitem_view resources."""

    CREATE = Permission(ResourceType.WORKSPACE_WORKITEM_VIEW, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_WORKITEM_VIEW, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_WORKITEM_VIEW, Action.EDIT)
    EXPORT = Permission(ResourceType.WORKSPACE_WORKITEM_VIEW, Action.EXPORT)
    PUBLISH = Permission(ResourceType.WORKSPACE_WORKITEM_VIEW, Action.PUBLISH)
    SHARE = Permission(ResourceType.WORKSPACE_WORKITEM_VIEW, Action.SHARE)
    VIEW = Permission(ResourceType.WORKSPACE_WORKITEM_VIEW, Action.VIEW)


class InitiativePermissions:
    """Permissions for initiative resources."""

    CREATE = Permission(ResourceType.INITIATIVE, Action.CREATE)
    DELETE = Permission(ResourceType.INITIATIVE, Action.DELETE)
    EDIT = Permission(ResourceType.INITIATIVE, Action.EDIT)
    MANAGE = Permission(ResourceType.INITIATIVE, Action.MANAGE)
    REACT = Permission(ResourceType.INITIATIVE, Action.REACT)
    VIEW = Permission(ResourceType.INITIATIVE, Action.VIEW)


class InitiativeCommentPermissions:
    """Permissions for initiative_comment resources."""

    CREATE = Permission(ResourceType.INITIATIVE_COMMENT, Action.CREATE)
    DELETE = Permission(ResourceType.INITIATIVE_COMMENT, Action.DELETE)
    EDIT = Permission(ResourceType.INITIATIVE_COMMENT, Action.EDIT)
    REACT = Permission(ResourceType.INITIATIVE_COMMENT, Action.REACT)
    VIEW = Permission(ResourceType.INITIATIVE_COMMENT, Action.VIEW)


class InitiativeAttachmentPermissions:
    """Permissions for initiative_attachment resources."""

    CREATE = Permission(ResourceType.INITIATIVE_ATTACHMENT, Action.CREATE)
    DELETE = Permission(ResourceType.INITIATIVE_ATTACHMENT, Action.DELETE)
    EDIT = Permission(ResourceType.INITIATIVE_ATTACHMENT, Action.EDIT)
    VIEW = Permission(ResourceType.INITIATIVE_ATTACHMENT, Action.VIEW)


class InitiativeLinkPermissions:
    """Permissions for initiative_link resources."""

    CREATE = Permission(ResourceType.INITIATIVE_LINK, Action.CREATE)
    DELETE = Permission(ResourceType.INITIATIVE_LINK, Action.DELETE)
    EDIT = Permission(ResourceType.INITIATIVE_LINK, Action.EDIT)
    VIEW = Permission(ResourceType.INITIATIVE_LINK, Action.VIEW)


class InitiativeUpdatePermissions:
    """Permissions for initiative_update resources."""

    CREATE = Permission(ResourceType.INITIATIVE_UPDATE, Action.CREATE)
    DELETE = Permission(ResourceType.INITIATIVE_UPDATE, Action.DELETE)
    EDIT = Permission(ResourceType.INITIATIVE_UPDATE, Action.EDIT)
    REACT = Permission(ResourceType.INITIATIVE_UPDATE, Action.REACT)
    VIEW = Permission(ResourceType.INITIATIVE_UPDATE, Action.VIEW)


class InitiativeUpdateCommentPermissions:
    """Permissions for initiative_update_comment resources."""

    CREATE = Permission(ResourceType.INITIATIVE_UPDATE_COMMENT, Action.CREATE)
    DELETE = Permission(ResourceType.INITIATIVE_UPDATE_COMMENT, Action.DELETE)
    EDIT = Permission(ResourceType.INITIATIVE_UPDATE_COMMENT, Action.EDIT)
    REACT = Permission(ResourceType.INITIATIVE_UPDATE_COMMENT, Action.REACT)
    VIEW = Permission(ResourceType.INITIATIVE_UPDATE_COMMENT, Action.VIEW)


class TeamspacePermissions:
    """Permissions for teamspace resources."""

    BROWSE = Permission(ResourceType.TEAMSPACE, Action.BROWSE)
    CREATE = Permission(ResourceType.TEAMSPACE, Action.CREATE)
    DELETE = Permission(ResourceType.TEAMSPACE, Action.DELETE)
    EDIT = Permission(ResourceType.TEAMSPACE, Action.EDIT)
    MANAGE = Permission(ResourceType.TEAMSPACE, Action.MANAGE)
    VIEW = Permission(ResourceType.TEAMSPACE, Action.VIEW)


class TeamspaceCommentPermissions:
    """Permissions for teamspace_comment resources."""

    CREATE = Permission(ResourceType.TEAMSPACE_COMMENT, Action.CREATE)
    DELETE = Permission(ResourceType.TEAMSPACE_COMMENT, Action.DELETE)
    EDIT = Permission(ResourceType.TEAMSPACE_COMMENT, Action.EDIT)
    REACT = Permission(ResourceType.TEAMSPACE_COMMENT, Action.REACT)


class TeamspaceWorkitemViewPermissions:
    """Permissions for teamspace_workitem_view resources."""

    CREATE = Permission(ResourceType.TEAMSPACE_WORKITEM_VIEW, Action.CREATE)
    DELETE = Permission(ResourceType.TEAMSPACE_WORKITEM_VIEW, Action.DELETE)
    EDIT = Permission(ResourceType.TEAMSPACE_WORKITEM_VIEW, Action.EDIT)
    SHARE = Permission(ResourceType.TEAMSPACE_WORKITEM_VIEW, Action.SHARE)
    VIEW = Permission(ResourceType.TEAMSPACE_WORKITEM_VIEW, Action.VIEW)


class TeamspacePagePermissions:
    """Permissions for teamspace_page resources."""

    ARCHIVE = Permission(ResourceType.TEAMSPACE_PAGE, Action.ARCHIVE)
    CREATE = Permission(ResourceType.TEAMSPACE_PAGE, Action.CREATE)
    DELETE = Permission(ResourceType.TEAMSPACE_PAGE, Action.DELETE)
    EDIT = Permission(ResourceType.TEAMSPACE_PAGE, Action.EDIT)
    VIEW = Permission(ResourceType.TEAMSPACE_PAGE, Action.VIEW)


class TeamspacePageCommentPermissions:
    """Permissions for teamspace_page_comment resources."""

    CREATE = Permission(ResourceType.TEAMSPACE_PAGE_COMMENT, Action.CREATE)
    DELETE = Permission(ResourceType.TEAMSPACE_PAGE_COMMENT, Action.DELETE)
    EDIT = Permission(ResourceType.TEAMSPACE_PAGE_COMMENT, Action.EDIT)
    REACT = Permission(ResourceType.TEAMSPACE_PAGE_COMMENT, Action.REACT)
    RESOLVE = Permission(ResourceType.TEAMSPACE_PAGE_COMMENT, Action.RESOLVE)


class IntegrationPermissions:
    """Permissions for integration resources."""

    CONNECT = Permission(ResourceType.INTEGRATION, Action.CONNECT)
    CREATE = Permission(ResourceType.INTEGRATION, Action.CREATE)
    DELETE = Permission(ResourceType.INTEGRATION, Action.DELETE)
    EDIT = Permission(ResourceType.INTEGRATION, Action.EDIT)
    MANAGE = Permission(ResourceType.INTEGRATION, Action.MANAGE)
    VIEW = Permission(ResourceType.INTEGRATION, Action.VIEW)


class WebhookPermissions:
    """Permissions for webhook resources."""

    CREATE = Permission(ResourceType.WEBHOOK, Action.CREATE)
    DELETE = Permission(ResourceType.WEBHOOK, Action.DELETE)
    EDIT = Permission(ResourceType.WEBHOOK, Action.EDIT)
    VIEW = Permission(ResourceType.WEBHOOK, Action.VIEW)


class ApiTokenPermissions:
    """Permissions for api_token resources."""

    CREATE = Permission(ResourceType.API_TOKEN, Action.CREATE)
    DELETE = Permission(ResourceType.API_TOKEN, Action.DELETE)
    VIEW = Permission(ResourceType.API_TOKEN, Action.VIEW)


class CustomRolePermissions:
    """Permissions for custom_role resources."""

    CREATE = Permission(ResourceType.CUSTOM_ROLE, Action.CREATE)
    DELETE = Permission(ResourceType.CUSTOM_ROLE, Action.DELETE)
    EDIT = Permission(ResourceType.CUSTOM_ROLE, Action.EDIT)
    VIEW = Permission(ResourceType.CUSTOM_ROLE, Action.VIEW)


class DashboardPermissions:
    """Permissions for dashboard resources."""

    CREATE = Permission(ResourceType.DASHBOARD, Action.CREATE)
    DELETE = Permission(ResourceType.DASHBOARD, Action.DELETE)
    EDIT = Permission(ResourceType.DASHBOARD, Action.EDIT)
    VIEW = Permission(ResourceType.DASHBOARD, Action.VIEW)


class AnalyticsPermissions:
    """Permissions for analytics resources."""

    EXPORT = Permission(ResourceType.ANALYTICS, Action.EXPORT)
    VIEW = Permission(ResourceType.ANALYTICS, Action.VIEW)


class BillingPermissions:
    """Permissions for billing resources."""

    MANAGE = Permission(ResourceType.BILLING, Action.MANAGE)
    VIEW = Permission(ResourceType.BILLING, Action.VIEW)


class ProjectAnalyticsPermissions:
    """Permissions for project_analytics resources."""

    EXPORT = Permission(ResourceType.PROJECT_ANALYTICS, Action.EXPORT)
    VIEW = Permission(ResourceType.PROJECT_ANALYTICS, Action.VIEW)


class AIPermissions:
    """Permissions for ai resources."""

    USE = Permission(ResourceType.AI, Action.USE)


class WorkspaceActivityPermissions:
    """Permissions for workspace_activity resources."""

    EXPORT = Permission(ResourceType.WORKSPACE_ACTIVITY, Action.EXPORT)
    VIEW = Permission(ResourceType.WORKSPACE_ACTIVITY, Action.VIEW)


class WorkspaceUserActivityPermissions:
    """Permissions for workspace_user_activity resources."""

    EXPORT = Permission(ResourceType.WORKSPACE_USER_ACTIVITY, Action.EXPORT)
    VIEW = Permission(ResourceType.WORKSPACE_USER_ACTIVITY, Action.VIEW)


class FavoritePermissions:
    """Permissions for favorite resources."""

    CREATE = Permission(ResourceType.FAVORITE, Action.CREATE)
    DELETE = Permission(ResourceType.FAVORITE, Action.DELETE)
    EDIT = Permission(ResourceType.FAVORITE, Action.EDIT)
    VIEW = Permission(ResourceType.FAVORITE, Action.VIEW)


class WorkspaceDraftPermissions:
    """Permissions for workspace_draft resources."""

    CREATE = Permission(ResourceType.WORKSPACE_DRAFT, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_DRAFT, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_DRAFT, Action.EDIT)
    MANAGE = Permission(ResourceType.WORKSPACE_DRAFT, Action.MANAGE)
    VIEW = Permission(ResourceType.WORKSPACE_DRAFT, Action.VIEW)


class CustomerPermissions:
    """Permissions for customer resources."""

    CREATE = Permission(ResourceType.CUSTOMER, Action.CREATE)
    DELETE = Permission(ResourceType.CUSTOMER, Action.DELETE)
    EDIT = Permission(ResourceType.CUSTOMER, Action.EDIT)
    VIEW = Permission(ResourceType.CUSTOMER, Action.VIEW)


class CustomerAttachmentPermissions:
    """Permissions for customer_attachment resources."""

    CREATE = Permission(ResourceType.CUSTOMER_ATTACHMENT, Action.CREATE)
    DELETE = Permission(ResourceType.CUSTOMER_ATTACHMENT, Action.DELETE)


class WorkspaceAssetPermissions:
    """Permissions for workspace_asset resources."""

    CREATE = Permission(ResourceType.WORKSPACE_ASSET, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_ASSET, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_ASSET, Action.EDIT)
    MANAGE = Permission(ResourceType.WORKSPACE_ASSET, Action.MANAGE)
    VIEW = Permission(ResourceType.WORKSPACE_ASSET, Action.VIEW)


class WorkspaceProjectStatePermissions:
    """Permissions for workspace_project_state resources."""

    CREATE = Permission(ResourceType.WORKSPACE_PROJECT_STATE, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_PROJECT_STATE, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_PROJECT_STATE, Action.EDIT)
    VIEW = Permission(ResourceType.WORKSPACE_PROJECT_STATE, Action.VIEW)


class WorkspaceWorklogPermissions:
    """Permissions for workspace_worklog resources."""

    EXPORT = Permission(ResourceType.WORKSPACE_WORKLOG, Action.EXPORT)
    VIEW = Permission(ResourceType.WORKSPACE_WORKLOG, Action.VIEW)


class WorkspaceCustomPropertyPermissions:
    """Permissions for workspace_custom_property resources."""

    CREATE = Permission(ResourceType.WORKSPACE_CUSTOM_PROPERTY, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_CUSTOM_PROPERTY, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_CUSTOM_PROPERTY, Action.EDIT)
    VIEW = Permission(ResourceType.WORKSPACE_CUSTOM_PROPERTY, Action.VIEW)


class WorkspaceWorkitemTypePermissions:
    """Permissions for workspace_workitem_type resources."""

    CREATE = Permission(ResourceType.WORKSPACE_WORKITEM_TYPE, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_WORKITEM_TYPE, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_WORKITEM_TYPE, Action.EDIT)
    VIEW = Permission(ResourceType.WORKSPACE_WORKITEM_TYPE, Action.VIEW)


# ---- Project-level resources ----


class ProjectPermissions:
    """Permissions for project resources."""

    ARCHIVE = Permission(ResourceType.PROJECT, Action.ARCHIVE)
    BROWSE = Permission(ResourceType.PROJECT, Action.BROWSE)
    CREATE = Permission(ResourceType.PROJECT, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT, Action.EDIT)
    MANAGE = Permission(ResourceType.PROJECT, Action.MANAGE)
    PUBLISH = Permission(ResourceType.PROJECT, Action.PUBLISH)
    REACT = Permission(ResourceType.PROJECT, Action.REACT)
    VIEW = Permission(ResourceType.PROJECT, Action.VIEW)


class ProjectMemberPermissions:
    """Permissions for project_member resources."""

    CHANGE_ROLE = Permission(ResourceType.PROJECT_MEMBER, Action.CHANGE_ROLE)
    EDIT = Permission(ResourceType.PROJECT_MEMBER, Action.EDIT)
    INVITE = Permission(ResourceType.PROJECT_MEMBER, Action.INVITE)
    REMOVE = Permission(ResourceType.PROJECT_MEMBER, Action.REMOVE)
    VIEW = Permission(ResourceType.PROJECT_MEMBER, Action.VIEW)


class WorkitemPermissions:
    """Permissions for workitem (issue) resources."""

    ARCHIVE = Permission(ResourceType.WORKITEM, Action.ARCHIVE)
    ASSIGN = Permission(ResourceType.WORKITEM, Action.ASSIGN)
    BULK_EDIT = Permission(ResourceType.WORKITEM, Action.BULK_EDIT)
    CREATE = Permission(ResourceType.WORKITEM, Action.CREATE)
    DELETE = Permission(ResourceType.WORKITEM, Action.DELETE)
    EDIT = Permission(ResourceType.WORKITEM, Action.EDIT)
    EXPORT = Permission(ResourceType.WORKITEM, Action.EXPORT)
    IMPORT = Permission(ResourceType.WORKITEM, Action.IMPORT)
    REACT = Permission(ResourceType.WORKITEM, Action.REACT)
    VIEW = Permission(ResourceType.WORKITEM, Action.VIEW)


class EpicPermissions:
    """Permissions for epic resources."""

    ARCHIVE = Permission(ResourceType.EPIC, Action.ARCHIVE)
    CREATE = Permission(ResourceType.EPIC, Action.CREATE)
    DELETE = Permission(ResourceType.EPIC, Action.DELETE)
    EDIT = Permission(ResourceType.EPIC, Action.EDIT)
    EXPORT = Permission(ResourceType.EPIC, Action.EXPORT)
    REACT = Permission(ResourceType.EPIC, Action.REACT)
    VIEW = Permission(ResourceType.EPIC, Action.VIEW)


class EpicUpdatePermissions:
    """Permissions for epic_update resources."""

    CREATE = Permission(ResourceType.EPIC_UPDATE, Action.CREATE)
    DELETE = Permission(ResourceType.EPIC_UPDATE, Action.DELETE)
    EDIT = Permission(ResourceType.EPIC_UPDATE, Action.EDIT)
    REACT = Permission(ResourceType.EPIC_UPDATE, Action.REACT)
    VIEW = Permission(ResourceType.EPIC_UPDATE, Action.VIEW)


class EpicUpdateCommentPermissions:
    """Permissions for epic_update_comment resources."""

    CREATE = Permission(ResourceType.EPIC_UPDATE_COMMENT, Action.CREATE)
    DELETE = Permission(ResourceType.EPIC_UPDATE_COMMENT, Action.DELETE)
    EDIT = Permission(ResourceType.EPIC_UPDATE_COMMENT, Action.EDIT)
    REACT = Permission(ResourceType.EPIC_UPDATE_COMMENT, Action.REACT)
    VIEW = Permission(ResourceType.EPIC_UPDATE_COMMENT, Action.VIEW)


class ProjectUpdatePermissions:
    """Permissions for project_update resources."""

    CREATE = Permission(ResourceType.PROJECT_UPDATE, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT_UPDATE, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT_UPDATE, Action.EDIT)
    REACT = Permission(ResourceType.PROJECT_UPDATE, Action.REACT)
    VIEW = Permission(ResourceType.PROJECT_UPDATE, Action.VIEW)


class ProjectUpdateCommentPermissions:
    """Permissions for project_update_comment resources."""

    CREATE = Permission(ResourceType.PROJECT_UPDATE_COMMENT, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT_UPDATE_COMMENT, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT_UPDATE_COMMENT, Action.EDIT)
    REACT = Permission(ResourceType.PROJECT_UPDATE_COMMENT, Action.REACT)
    VIEW = Permission(ResourceType.PROJECT_UPDATE_COMMENT, Action.VIEW)


class ModulePermissions:
    """Permissions for module resources."""

    ARCHIVE = Permission(ResourceType.MODULE, Action.ARCHIVE)
    CREATE = Permission(ResourceType.MODULE, Action.CREATE)
    DELETE = Permission(ResourceType.MODULE, Action.DELETE)
    EDIT = Permission(ResourceType.MODULE, Action.EDIT)
    EXPORT = Permission(ResourceType.MODULE, Action.EXPORT)
    MANAGE = Permission(ResourceType.MODULE, Action.MANAGE)
    VIEW = Permission(ResourceType.MODULE, Action.VIEW)


class CyclePermissions:
    """Permissions for cycle resources."""

    ARCHIVE = Permission(ResourceType.CYCLE, Action.ARCHIVE)
    CREATE = Permission(ResourceType.CYCLE, Action.CREATE)
    DELETE = Permission(ResourceType.CYCLE, Action.DELETE)
    EDIT = Permission(ResourceType.CYCLE, Action.EDIT)
    EXPORT = Permission(ResourceType.CYCLE, Action.EXPORT)
    MANAGE = Permission(ResourceType.CYCLE, Action.MANAGE)
    VIEW = Permission(ResourceType.CYCLE, Action.VIEW)


class CycleUpdatePermissions:
    """Permissions for cycle_update resources."""

    CREATE = Permission(ResourceType.CYCLE_UPDATE, Action.CREATE)
    DELETE = Permission(ResourceType.CYCLE_UPDATE, Action.DELETE)
    EDIT = Permission(ResourceType.CYCLE_UPDATE, Action.EDIT)
    REACT = Permission(ResourceType.CYCLE_UPDATE, Action.REACT)
    VIEW = Permission(ResourceType.CYCLE_UPDATE, Action.VIEW)


class PagePermissions:
    """Permissions for page (project pages) resources."""

    CREATE = Permission(ResourceType.PAGE, Action.CREATE)
    DELETE = Permission(ResourceType.PAGE, Action.DELETE)
    EDIT = Permission(ResourceType.PAGE, Action.EDIT)
    SHARE = Permission(ResourceType.PAGE, Action.SHARE)
    VIEW = Permission(ResourceType.PAGE, Action.VIEW)


class WorkitemViewPermissions:
    """Permissions for workitem_view (project views / saved filters) resources."""

    CREATE = Permission(ResourceType.WORKITEM_VIEW, Action.CREATE)
    DELETE = Permission(ResourceType.WORKITEM_VIEW, Action.DELETE)
    EDIT = Permission(ResourceType.WORKITEM_VIEW, Action.EDIT)
    EXPORT = Permission(ResourceType.WORKITEM_VIEW, Action.EXPORT)
    PUBLISH = Permission(ResourceType.WORKITEM_VIEW, Action.PUBLISH)
    SHARE = Permission(ResourceType.WORKITEM_VIEW, Action.SHARE)
    VIEW = Permission(ResourceType.WORKITEM_VIEW, Action.VIEW)


class IntakePermissions:
    """Permissions for intake resources."""

    CONFIGURE = Permission(ResourceType.INTAKE, Action.CONFIGURE)
    CREATE = Permission(ResourceType.INTAKE, Action.CREATE)
    DELETE = Permission(ResourceType.INTAKE, Action.DELETE)
    EDIT = Permission(ResourceType.INTAKE, Action.EDIT)
    EXPORT = Permission(ResourceType.INTAKE, Action.EXPORT)
    MANAGE = Permission(ResourceType.INTAKE, Action.MANAGE)
    REACT = Permission(ResourceType.INTAKE, Action.REACT)
    SUBMIT = Permission(ResourceType.INTAKE, Action.SUBMIT)
    VIEW = Permission(ResourceType.INTAKE, Action.VIEW)


class LabelPermissions:
    """Permissions for label resources."""

    CREATE = Permission(ResourceType.LABEL, Action.CREATE)
    DELETE = Permission(ResourceType.LABEL, Action.DELETE)
    EDIT = Permission(ResourceType.LABEL, Action.EDIT)
    VIEW = Permission(ResourceType.LABEL, Action.VIEW)


class StatePermissions:
    """Permissions for state resources."""

    CREATE = Permission(ResourceType.STATE, Action.CREATE)
    DELETE = Permission(ResourceType.STATE, Action.DELETE)
    EDIT = Permission(ResourceType.STATE, Action.EDIT)
    VIEW = Permission(ResourceType.STATE, Action.VIEW)


class EstimatePermissions:
    """Permissions for estimate resources."""

    CREATE = Permission(ResourceType.ESTIMATE, Action.CREATE)
    DELETE = Permission(ResourceType.ESTIMATE, Action.DELETE)
    EDIT = Permission(ResourceType.ESTIMATE, Action.EDIT)
    VIEW = Permission(ResourceType.ESTIMATE, Action.VIEW)


class CommentPermissions:
    """Permissions for comment resources."""

    CREATE = Permission(ResourceType.COMMENT, Action.CREATE)
    DELETE = Permission(ResourceType.COMMENT, Action.DELETE)
    EDIT = Permission(ResourceType.COMMENT, Action.EDIT)
    REACT = Permission(ResourceType.COMMENT, Action.REACT)


class AttachmentPermissions:
    """Permissions for attachment resources."""

    CREATE = Permission(ResourceType.ATTACHMENT, Action.CREATE)
    DELETE = Permission(ResourceType.ATTACHMENT, Action.DELETE)
    EDIT = Permission(ResourceType.ATTACHMENT, Action.EDIT)
    VIEW = Permission(ResourceType.ATTACHMENT, Action.VIEW)


class WorkitemLinkPermissions:
    """Permissions for workitem_link resources."""

    CREATE = Permission(ResourceType.WORKITEM_LINK, Action.CREATE)
    DELETE = Permission(ResourceType.WORKITEM_LINK, Action.DELETE)
    EDIT = Permission(ResourceType.WORKITEM_LINK, Action.EDIT)
    VIEW = Permission(ResourceType.WORKITEM_LINK, Action.VIEW)


class WorkitemRelationPermissions:
    """Permissions for workitem_relation resources."""

    CREATE = Permission(ResourceType.WORKITEM_RELATION, Action.CREATE)
    DELETE = Permission(ResourceType.WORKITEM_RELATION, Action.DELETE)
    EDIT = Permission(ResourceType.WORKITEM_RELATION, Action.EDIT)
    VIEW = Permission(ResourceType.WORKITEM_RELATION, Action.VIEW)


class ProjectActivityPermissions:
    """Permissions for project_activity resources."""

    VIEW = Permission(ResourceType.PROJECT_ACTIVITY, Action.VIEW)


class ProjectMemberActivityPermissions:
    """Permissions for project_member_activity resources."""

    VIEW = Permission(ResourceType.PROJECT_MEMBER_ACTIVITY, Action.VIEW)


class EpicLinkPermissions:
    """Permissions for epic_link resources."""

    CREATE = Permission(ResourceType.EPIC_LINK, Action.CREATE)
    DELETE = Permission(ResourceType.EPIC_LINK, Action.DELETE)
    EDIT = Permission(ResourceType.EPIC_LINK, Action.EDIT)
    VIEW = Permission(ResourceType.EPIC_LINK, Action.VIEW)


class EpicPropertyPermissions:
    """Permissions for epic_property resources."""

    CREATE = Permission(ResourceType.EPIC_PROPERTY, Action.CREATE)
    DELETE = Permission(ResourceType.EPIC_PROPERTY, Action.DELETE)
    EDIT = Permission(ResourceType.EPIC_PROPERTY, Action.EDIT)
    VIEW = Permission(ResourceType.EPIC_PROPERTY, Action.VIEW)


class IssuePropertyPermissions:
    """Permissions for issue_property resources."""

    CREATE = Permission(ResourceType.ISSUE_PROPERTY, Action.CREATE)
    DELETE = Permission(ResourceType.ISSUE_PROPERTY, Action.DELETE)
    EDIT = Permission(ResourceType.ISSUE_PROPERTY, Action.EDIT)
    VIEW = Permission(ResourceType.ISSUE_PROPERTY, Action.VIEW)


class ProjectAutomationPermissions:
    """Permissions for project automation resources."""

    CREATE = Permission(ResourceType.PROJECT_AUTOMATION, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT_AUTOMATION, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT_AUTOMATION, Action.EDIT)
    VIEW = Permission(ResourceType.PROJECT_AUTOMATION, Action.VIEW)


class WorkspaceAutomationPermissions:
    """Permissions for workspace automation resources."""

    CREATE = Permission(ResourceType.WORKSPACE_AUTOMATION, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_AUTOMATION, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_AUTOMATION, Action.EDIT)
    VIEW = Permission(ResourceType.WORKSPACE_AUTOMATION, Action.VIEW)


class WorkflowPermissions:
    """Permissions for workflow resources."""

    CREATE = Permission(ResourceType.WORKFLOW, Action.CREATE)
    DELETE = Permission(ResourceType.WORKFLOW, Action.DELETE)
    EDIT = Permission(ResourceType.WORKFLOW, Action.EDIT)
    VIEW = Permission(ResourceType.WORKFLOW, Action.VIEW)


class ReleasePermissions:
    """Permissions for release resources."""

    CREATE = Permission(ResourceType.RELEASE, Action.CREATE)
    DELETE = Permission(ResourceType.RELEASE, Action.DELETE)
    EDIT = Permission(ResourceType.RELEASE, Action.EDIT)
    VIEW = Permission(ResourceType.RELEASE, Action.VIEW)


class MilestonePermissions:
    """Permissions for milestone resources."""

    CREATE = Permission(ResourceType.MILESTONE, Action.CREATE)
    DELETE = Permission(ResourceType.MILESTONE, Action.DELETE)
    EDIT = Permission(ResourceType.MILESTONE, Action.EDIT)
    VIEW = Permission(ResourceType.MILESTONE, Action.VIEW)


class RecurringWorkitemPermissions:
    """Permissions for recurring_workitem resources."""

    CREATE = Permission(ResourceType.RECURRING_WORKITEM, Action.CREATE)
    DELETE = Permission(ResourceType.RECURRING_WORKITEM, Action.DELETE)
    EDIT = Permission(ResourceType.RECURRING_WORKITEM, Action.EDIT)
    VIEW = Permission(ResourceType.RECURRING_WORKITEM, Action.VIEW)


class ProjectAssetPermissions:
    """Permissions for project_asset resources."""

    CREATE = Permission(ResourceType.PROJECT_ASSET, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT_ASSET, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT_ASSET, Action.EDIT)
    VIEW = Permission(ResourceType.PROJECT_ASSET, Action.VIEW)


class ProjectLinkPermissions:
    """Permissions for project_link resources."""

    CREATE = Permission(ResourceType.PROJECT_LINK, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT_LINK, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT_LINK, Action.EDIT)
    VIEW = Permission(ResourceType.PROJECT_LINK, Action.VIEW)


class ProjectWorkitemTypePermissions:
    """Permissions for project_workitem_type resources."""

    CREATE = Permission(ResourceType.PROJECT_WORKITEM_TYPE, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT_WORKITEM_TYPE, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT_WORKITEM_TYPE, Action.EDIT)
    VIEW = Permission(ResourceType.PROJECT_WORKITEM_TYPE, Action.VIEW)


# ---- Template resources ----


class WorkspaceWorkitemTemplatePermissions:
    """Permissions for workspace_workitem_template resources."""

    CREATE = Permission(ResourceType.WORKSPACE_WORKITEM_TEMPLATE, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_WORKITEM_TEMPLATE, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_WORKITEM_TEMPLATE, Action.EDIT)
    VIEW = Permission(ResourceType.WORKSPACE_WORKITEM_TEMPLATE, Action.VIEW)


class WorkspacePageTemplatePermissions:
    """Permissions for workspace_page_template resources."""

    CREATE = Permission(ResourceType.WORKSPACE_PAGE_TEMPLATE, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_PAGE_TEMPLATE, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_PAGE_TEMPLATE, Action.EDIT)
    VIEW = Permission(ResourceType.WORKSPACE_PAGE_TEMPLATE, Action.VIEW)


class WorkspaceProjectTemplatePermissions:
    """Permissions for workspace_project_template resources."""

    CREATE = Permission(ResourceType.WORKSPACE_PROJECT_TEMPLATE, Action.CREATE)
    DELETE = Permission(ResourceType.WORKSPACE_PROJECT_TEMPLATE, Action.DELETE)
    EDIT = Permission(ResourceType.WORKSPACE_PROJECT_TEMPLATE, Action.EDIT)
    PUBLISH = Permission(ResourceType.WORKSPACE_PROJECT_TEMPLATE, Action.PUBLISH)
    USE = Permission(ResourceType.WORKSPACE_PROJECT_TEMPLATE, Action.USE)
    VIEW = Permission(ResourceType.WORKSPACE_PROJECT_TEMPLATE, Action.VIEW)


class ProjectWorkitemTemplatePermissions:
    """Permissions for project_workitem_template resources."""

    CREATE = Permission(ResourceType.PROJECT_WORKITEM_TEMPLATE, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT_WORKITEM_TEMPLATE, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT_WORKITEM_TEMPLATE, Action.EDIT)
    VIEW = Permission(ResourceType.PROJECT_WORKITEM_TEMPLATE, Action.VIEW)


class ProjectPageTemplatePermissions:
    """Permissions for project_page_template resources."""

    CREATE = Permission(ResourceType.PROJECT_PAGE_TEMPLATE, Action.CREATE)
    DELETE = Permission(ResourceType.PROJECT_PAGE_TEMPLATE, Action.DELETE)
    EDIT = Permission(ResourceType.PROJECT_PAGE_TEMPLATE, Action.EDIT)
    VIEW = Permission(ResourceType.PROJECT_PAGE_TEMPLATE, Action.VIEW)


# =============================================================================
# PERMISSION CLASS REGISTRY — auto-built by introspecting module globals.
# Maps ResourceType → permission class. RESOURCE_ACTIONS and ALL_PERMISSIONS
# are derived from this registry.
# =============================================================================


def _build_permission_classes() -> dict[ResourceType, type]:
    """Auto-discover permission classes from module globals.

    Finds all classes in this module that have at least one Permission
    attribute, extracts the resource type from the first attribute,
    and builds the registry. Skips aliases (WorkitemPermissions, MemberPermissions).
    """
    import sys

    module = sys.modules[__name__]
    registry: dict[ResourceType, type] = {}
    # Track classes we've already registered to skip aliases
    seen_classes: set[int] = set()

    for name in dir(module):
        if not name.endswith("Permissions") or name.startswith("_"):
            continue
        cls = getattr(module, name)
        if not isinstance(cls, type) or id(cls) in seen_classes:
            continue
        # Check if it has Permission attributes
        perms = [
            getattr(cls, attr)
            for attr in dir(cls)
            if not attr.startswith("_") and isinstance(getattr(cls, attr), Permission)
        ]
        if not perms:
            continue
        # All permissions in a class share the same resource_type
        resource_type = perms[0].resource_type
        registry[resource_type] = cls
        seen_classes.add(id(cls))

    return registry


_PERMISSION_CLASSES: dict[ResourceType, type] = _build_permission_classes()


def _extract_actions(perm_class: type) -> FrozenSet[Action]:
    """Extract Action values from a permission class by introspecting its attributes."""
    return frozenset(
        getattr(perm_class, attr).action
        for attr in dir(perm_class)
        if not attr.startswith("_") and isinstance(getattr(perm_class, attr), Permission)
    )


# =============================================================================
# DERIVED CONFIGURATION (auto-generated from _PERMISSION_CLASSES)
# =============================================================================

# RESOURCE_ACTIONS: which actions are valid for each resource type.
# Derived from the static permission classes — no manual maintenance needed.
RESOURCE_ACTIONS: dict[ResourceType, FrozenSet[Action]] = {
    resource_type: _extract_actions(perm_class) for resource_type, perm_class in _PERMISSION_CLASSES.items()
}

# Flat list of all Permission objects across all resource types.
ALL_PERMISSIONS: list[Permission] = [
    Permission(resource_type, action)
    for resource_type, actions in RESOURCE_ACTIONS.items()
    for action in sorted(actions, key=lambda a: a.value)
]

# Permission string lookup for quick access
PERMISSION_MAP: dict[str, Permission] = {str(p): p for p in ALL_PERMISSIONS}


# =============================================================================
# RESOURCE TYPE GROUPINGS BY HIERARCHY LEVEL
# =============================================================================
# Auto-derived from the hierarchy in inheritance.py. Imported here for
# backward compatibility — existing code imports them from definitions or __init__.

# Lazy import to avoid circular dependency (inheritance.py imports from definitions.py).
# The groupings are computed once at first access and cached.


def __getattr__(name: str):
    """Lazy import of resource type groupings from inheritance.py."""
    if name in ("WORKSPACE_RESOURCE_TYPES", "TEAMSPACE_RESOURCE_TYPES", "PROJECT_RESOURCE_TYPES"):
        from . import inheritance as _inh

        # Cache on this module so __getattr__ is only called once per name
        globals()["WORKSPACE_RESOURCE_TYPES"] = _inh.WORKSPACE_RESOURCE_TYPES
        globals()["TEAMSPACE_RESOURCE_TYPES"] = _inh.TEAMSPACE_RESOURCE_TYPES
        globals()["PROJECT_RESOURCE_TYPES"] = _inh.PROJECT_RESOURCE_TYPES
        return globals()[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def get_permission(permission_str: str) -> Optional[Permission]:
    """Get a Permission object from a permission string."""
    return PERMISSION_MAP.get(permission_str) or Permission.from_string(permission_str)


def get_all_permissions_for_resource(
    resource_type: ResourceType,
) -> list[Permission]:
    """Get all permissions for a specific resource type."""
    return [p for p in ALL_PERMISSIONS if p.resource_type == resource_type]


def is_valid_permission(
    resource_type: ResourceType,
    action: Action,
) -> bool:
    """Check if an action is valid for a resource type."""
    return action in RESOURCE_ACTIONS.get(resource_type, frozenset())


def get_valid_actions(
    resource_type: ResourceType,
) -> FrozenSet[Action]:
    """Get all valid actions for a resource type."""
    return RESOURCE_ACTIONS.get(resource_type, frozenset())


def permission_pattern_matches(permission_str: str, patterns: Iterable[str]) -> bool:
    """
    Check if any pattern in the iterable grants the given permission.

    Skips conditional grants (patterns containing "+").
    Supports wildcards: "*" matches all, "workitem:*" matches all workitem actions.
    """
    for pattern in patterns:
        if "+" in pattern:
            continue
        if pattern == "*":
            return True
        if pattern == permission_str:
            return True
        if pattern.endswith(":*"):
            resource_pattern = pattern[:-2]
            if permission_str.startswith(f"{resource_pattern}:"):
                return True
    return False
