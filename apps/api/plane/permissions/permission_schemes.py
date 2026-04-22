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
System Permission Scheme Definitions

A Permission Scheme (PS) is an ordered collection of permission grants that can be
assigned to one or more roles. Each system role maps 1:1 to a single system PS
containing all of that role's permissions.

Design:
- System PS entries mirror the permission lists in system_roles.py exactly.
- Custom PS can be created by users (stored in DB) and assigned to custom roles.
- When computing effective permissions for a role, the engine resolves the PS
  attached to that role and expands it into a frozenset of permission strings.

Namespaces:
- workspace: permissions for workspace-level resources
- project: permissions for project-level and child resources

Helper:
- deduplicate_conditionals(): used when unioning multiple PS (e.g., for custom
  roles that inherit from multiple schemes). Unconditional grants win over
  conditional grants for the same base permission.
"""

from typing import Union

# All permission classes are imported from definitions. This import block is
# unavoidably long because the scheme definitions below reference each class
# directly for readability (e.g., WorkitemPermissions.VIEW & Condition.CREATOR).
from .definitions import (  # noqa: E501
    ResourceType,
    Permission,
    Condition,
    ConditionalGrant,
    WildcardGrant,
    FULL_ACCESS,
    # Workspace scope
    WorkspacePermissions,
    WorkspaceMemberPermissions,
    WikiPermissions,
    WikiCollectionPermissions,
    WorkspaceWorkitemViewPermissions,
    IntegrationPermissions,
    ApiTokenPermissions,
    DashboardPermissions,
    AnalyticsPermissions,
    BillingPermissions,
    FavoritePermissions,
    WorkspaceDraftPermissions,
    WorkspaceAssetPermissions,
    WorkspaceActivityPermissions,
    WorkspaceUserActivityPermissions,
    WorkspaceProjectStatePermissions,
    WorkspaceFeaturePermissions,
    WorkspaceWorklogPermissions,
    ReleasePermissions,
    WorkspaceWorkitemTemplatePermissions,
    WorkspacePageTemplatePermissions,
    WorkspaceProjectTemplatePermissions,
    # Initiative scope
    InitiativePermissions,
    InitiativeCommentPermissions,
    InitiativeAttachmentPermissions,
    InitiativeLinkPermissions,
    InitiativeUpdatePermissions,
    InitiativeUpdateCommentPermissions,
    # Teamspace scope
    TeamspacePermissions,
    ProjectPermissions,
    ProjectMemberPermissions,
    ProjectActivityPermissions,
    ProjectAnalyticsPermissions,
    ProjectAssetPermissions,
    ProjectLinkPermissions,
    ProjectUpdatePermissions,
    ProjectUpdateCommentPermissions,
    # Project templates
    ProjectWorkitemTemplatePermissions,
    ProjectPageTemplatePermissions,
    # Work items & epics
    WorkitemPermissions,
    EpicPermissions,
    EpicUpdatePermissions,
    EpicUpdateCommentPermissions,
    EpicLinkPermissions,
    EpicPropertyPermissions,
    IssuePropertyPermissions,
    CommentPermissions,
    AttachmentPermissions,
    WorkitemLinkPermissions,
    WorkitemRelationPermissions,
    # Modules, cycles, pages, views
    ModulePermissions,
    CyclePermissions,
    CycleUpdatePermissions,
    PagePermissions,
    WorkitemViewPermissions,
    IntakePermissions,
    # Settings resources
    LabelPermissions,
    StatePermissions,
    EstimatePermissions,
    # Automation & workflow
    ProjectAutomationPermissions,
    WorkflowPermissions,
    MilestonePermissions,
    RecurringWorkitemPermissions,
)

# Import the sentinel type for the Union (not re-exported)
from .definitions import _FullAccessSentinel  # noqa: E402

# Type alias for permission entries in scheme definitions.
# All entries are typed — no raw strings. WildcardGrant replaces "resource:*",
# FULL_ACCESS replaces "*".
PermissionEntry = Union[Permission, ConditionalGrant, WildcardGrant, "_FullAccessSentinel"]

from typing import TypedDict  # noqa: E402


class SystemPermissionSchemeConfig(TypedDict):
    name: str
    namespace: str
    permissions: list[PermissionEntry]


# =============================================================================
# WORKSPACE PERMISSION SCHEMES
# One scheme per workspace system role. Permission lists are exact copies from
# WORKSPACE_ROLES in system_roles.py.
# =============================================================================
WORKSPACE_PERMISSION_SCHEMES: dict[str, SystemPermissionSchemeConfig] = {
    "owner": {
        "name": "Workspace Owner",
        "namespace": "workspace",
        "permissions": [FULL_ACCESS],  # Full control including workspace deletion and transfer
    },
    "admin": {
        "name": "Workspace Admin",
        "namespace": "workspace",
        "permissions": [
            # Workspace management - settings (not delete/transfer)
            WorkspacePermissions.VIEW,
            WorkspacePermissions.EDIT,
            WorkspacePermissions.MANAGE,
            WorkspacePermissions.INVITE,
            # NO: WorkspacePermissions.DELETE (owner only)
            # NO: WorkspacePermissions.TRANSFER (owner only)
            # Custom roles - full access
            WildcardGrant(ResourceType.CUSTOM_ROLE),
            # Workspace members - invite, remove, change roles
            WorkspaceMemberPermissions.VIEW,
            WorkspaceMemberPermissions.INVITE,
            WorkspaceMemberPermissions.REMOVE,
            WorkspaceMemberPermissions.CHANGE_ROLE,
            WorkspaceMemberPermissions.IMPORT,
            # Project collection - browse and create
            ProjectPermissions.BROWSE,
            ProjectPermissions.CREATE,
            # Wiki (workspace pages) - full access
            WildcardGrant(ResourceType.WIKI),
            # Wiki collections - full access
            WildcardGrant(ResourceType.WIKI_COLLECTION),
            # Workspace views - full access
            WildcardGrant(ResourceType.WORKSPACE_WORKITEM_VIEW),
            # Releases - full access
            WildcardGrant(ResourceType.RELEASE),
            # Initiatives - full access
            WildcardGrant(ResourceType.INITIATIVE),
            WildcardGrant(ResourceType.INITIATIVE_COMMENT),
            WildcardGrant(ResourceType.INITIATIVE_ATTACHMENT),
            WildcardGrant(ResourceType.INITIATIVE_LINK),
            WildcardGrant(ResourceType.INITIATIVE_UPDATE),
            WildcardGrant(ResourceType.INITIATIVE_UPDATE_COMMENT),
            # Teamspaces - full access (manage members, settings, view/edit/delete any teamspace)
            WildcardGrant(ResourceType.TEAMSPACE),
            # Teamspace content - full access (requires teamspace or workspace admin membership)
            WildcardGrant(ResourceType.TEAMSPACE_COMMENT),
            WildcardGrant(ResourceType.TEAMSPACE_WORKITEM_VIEW),
            WildcardGrant(ResourceType.TEAMSPACE_PAGE),
            WildcardGrant(ResourceType.TEAMSPACE_PAGE_COMMENT),
            # Integrations - full access (manage for admin-only operations like app uninstall)
            WildcardGrant(ResourceType.INTEGRATION),
            # Webhooks - full access
            WildcardGrant(ResourceType.WEBHOOK),
            # API tokens - full access
            WildcardGrant(ResourceType.API_TOKEN),
            # Analytics - full access
            AnalyticsPermissions.VIEW,
            AnalyticsPermissions.EXPORT,
            # Billing - view and manage
            BillingPermissions.VIEW,
            BillingPermissions.MANAGE,
            # AI - full access
            WildcardGrant(ResourceType.AI),
            # Workspace activity - view and export
            WorkspaceActivityPermissions.VIEW,
            WorkspaceActivityPermissions.EXPORT,
            # Workspace user activity - view and export
            WorkspaceUserActivityPermissions.VIEW,
            WorkspaceUserActivityPermissions.EXPORT,
            # Favorites - full access
            WildcardGrant(ResourceType.FAVORITE),
            # Workspace drafts - full access
            WildcardGrant(ResourceType.WORKSPACE_DRAFT),
            # Dashboards - full access
            WildcardGrant(ResourceType.DASHBOARD),
            # Customers - full access
            WildcardGrant(ResourceType.CUSTOMER),
            # Workspace assets - full access
            WildcardGrant(ResourceType.WORKSPACE_ASSET),
            # Workspace project states - full access
            WildcardGrant(ResourceType.WORKSPACE_PROJECT_STATE),
            # Workspace features - full access
            WildcardGrant(ResourceType.WORKSPACE_FEATURE),
            # Workspace worklogs - full access
            WildcardGrant(ResourceType.WORKSPACE_WORKLOG),
            # Templates - full access (workspace-level)
            WildcardGrant(ResourceType.WORKSPACE_WORKITEM_TEMPLATE),
            WildcardGrant(ResourceType.WORKSPACE_PAGE_TEMPLATE),
            WildcardGrant(ResourceType.WORKSPACE_PROJECT_TEMPLATE),
            # Templates - full access (project-level bypass)
            WildcardGrant(ResourceType.PROJECT_WORKITEM_TEMPLATE),
            WildcardGrant(ResourceType.PROJECT_PAGE_TEMPLATE),
            # Project-level bypass (full access to all project content)
            WildcardGrant(ResourceType.PROJECT),
            WildcardGrant(ResourceType.WORKITEM),
            WildcardGrant(ResourceType.EPIC),
            WildcardGrant(ResourceType.EPIC_UPDATE),
            WildcardGrant(ResourceType.EPIC_UPDATE_COMMENT),
            WildcardGrant(ResourceType.PROJECT_UPDATE),
            WildcardGrant(ResourceType.PROJECT_UPDATE_COMMENT),
            WildcardGrant(ResourceType.EPIC_LINK),
            WildcardGrant(ResourceType.EPIC_PROPERTY),
            WildcardGrant(ResourceType.ISSUE_PROPERTY),
            WildcardGrant(ResourceType.MODULE),
            WildcardGrant(ResourceType.CYCLE),
            WildcardGrant(ResourceType.CYCLE_UPDATE),
            WildcardGrant(ResourceType.PAGE),
            WildcardGrant(ResourceType.WORKITEM_VIEW),
            WildcardGrant(ResourceType.INTAKE),
            WildcardGrant(ResourceType.LABEL),
            WildcardGrant(ResourceType.STATE),
            WildcardGrant(ResourceType.ESTIMATE),
            WildcardGrant(ResourceType.COMMENT),
            WildcardGrant(ResourceType.ATTACHMENT),
            WildcardGrant(ResourceType.WORKITEM_LINK),
            WildcardGrant(ResourceType.WORKITEM_RELATION),
            WildcardGrant(ResourceType.PROJECT_MEMBER),
            WildcardGrant(ResourceType.PROJECT_ACTIVITY),
            WildcardGrant(ResourceType.PROJECT_MEMBER_ACTIVITY),
            WildcardGrant(ResourceType.PROJECT_ANALYTICS),
            WildcardGrant(ResourceType.PROJECT_AUTOMATION),
            WildcardGrant(ResourceType.WORKSPACE_AUTOMATION),
            WildcardGrant(ResourceType.WORKFLOW),
            WildcardGrant(ResourceType.MILESTONE),
            WildcardGrant(ResourceType.RECURRING_WORKITEM),
            WildcardGrant(ResourceType.PROJECT_ASSET),
            WildcardGrant(ResourceType.PROJECT_LINK),
        ],
    },
    "member": {
        "name": "Workspace Member",
        "namespace": "workspace",
        "permissions": [
            # Workspace - view only
            WorkspacePermissions.VIEW,
            # Workspace members - view only
            WorkspaceMemberPermissions.VIEW,
            # Projects - browse only (can list projects)
            ProjectPermissions.BROWSE,
            # Initiatives - view only
            InitiativePermissions.VIEW,
            InitiativePermissions.REACT,
            # Initiative comments — create, edit/delete own, react
            InitiativeCommentPermissions.VIEW,
            InitiativeCommentPermissions.CREATE,
            InitiativeCommentPermissions.EDIT & Condition.CREATOR,
            InitiativeCommentPermissions.DELETE & Condition.CREATOR,
            InitiativeCommentPermissions.REACT,
            # Initiative attachments — view only (create/edit/delete require initiative:edit,
            # which members don't have; matches the FE fold contract that keeps
            # initiative_attachment:create hidden under initiative:edit)
            InitiativeAttachmentPermissions.VIEW,
            # Initiative links — view only (same rationale as attachments)
            InitiativeLinkPermissions.VIEW,
            # Initiative updates — view and react
            InitiativeUpdatePermissions.VIEW,
            InitiativeUpdatePermissions.REACT,
            # Initiative update comments — create and react
            InitiativeUpdateCommentPermissions.CREATE,
            InitiativeUpdateCommentPermissions.REACT,
            # Teamspaces - browse only (content access requires teamspace membership)
            TeamspacePermissions.BROWSE,
            # Wiki - create, edit, delete (WorkspacePagePermission still gates per-page access)
            WikiPermissions.VIEW,
            WikiPermissions.CREATE,
            WikiPermissions.EDIT,
            WikiPermissions.DELETE,
            # Wiki collections - full CRUD for members
            WikiCollectionPermissions.VIEW,
            WikiCollectionPermissions.CREATE,
            WikiCollectionPermissions.EDIT & Condition.CREATOR,
            WikiCollectionPermissions.DELETE & Condition.CREATOR,
            # Workspace views - view, create, edit own, delete own, export
            WorkspaceWorkitemViewPermissions.VIEW,
            WorkspaceWorkitemViewPermissions.CREATE,
            WorkspaceWorkitemViewPermissions.EDIT & Condition.CREATOR,
            WorkspaceWorkitemViewPermissions.DELETE & Condition.CREATOR,
            WorkspaceWorkitemViewPermissions.EXPORT,
            # Analytics - view and export
            AnalyticsPermissions.VIEW,
            AnalyticsPermissions.EXPORT,
            # AI - full access
            WildcardGrant(ResourceType.AI),
            # Workspace activity - view and export
            WorkspaceActivityPermissions.VIEW,
            WorkspaceActivityPermissions.EXPORT,
            # Workspace user activity - view and export
            WorkspaceUserActivityPermissions.VIEW,
            WorkspaceUserActivityPermissions.EXPORT,
            # Favorites - full CRUD (personal user favorites)
            FavoritePermissions.VIEW,
            FavoritePermissions.CREATE,
            FavoritePermissions.EDIT,
            FavoritePermissions.DELETE,
            # Workspace drafts - full CRUD + convert
            WorkspaceDraftPermissions.VIEW,
            WorkspaceDraftPermissions.CREATE,
            WorkspaceDraftPermissions.EDIT,
            WorkspaceDraftPermissions.DELETE & Condition.CREATOR,
            WorkspaceDraftPermissions.MANAGE,
            # Integrations - view, create, edit, delete, connect (no manage — admin only)
            IntegrationPermissions.VIEW,
            IntegrationPermissions.CREATE,
            IntegrationPermissions.EDIT,
            IntegrationPermissions.DELETE,
            IntegrationPermissions.CONNECT,
            # API tokens - create, view, delete own tokens
            ApiTokenPermissions.VIEW,
            ApiTokenPermissions.CREATE,
            ApiTokenPermissions.DELETE,
            # Dashboards - view only
            DashboardPermissions.VIEW,
            # Workspace assets - view and create
            WorkspaceAssetPermissions.VIEW,
            WorkspaceAssetPermissions.CREATE,
            # Workspace project states - full CRUD
            WorkspaceProjectStatePermissions.VIEW,
            WorkspaceProjectStatePermissions.CREATE,
            WorkspaceProjectStatePermissions.EDIT,
            WorkspaceProjectStatePermissions.DELETE,
            # Workspace features - view and edit
            WorkspaceFeaturePermissions.VIEW,
            WorkspaceFeaturePermissions.EDIT,
            # Workspace worklogs - view and export
            WorkspaceWorklogPermissions.VIEW,
            WorkspaceWorklogPermissions.EXPORT,
            # Templates - view only (workspace-level)
            WorkspaceWorkitemTemplatePermissions.VIEW,
            WorkspacePageTemplatePermissions.VIEW,
            WorkspaceProjectTemplatePermissions.VIEW,
            WorkspaceProjectTemplatePermissions.USE,
            # Work item relation definitions - full CRUD
            WorkitemRelationPermissions.VIEW,
            WorkitemRelationPermissions.CREATE,
            WorkitemRelationPermissions.EDIT,
            WorkitemRelationPermissions.DELETE,
            # Releases - view only
            ReleasePermissions.VIEW,
        ],
    },
    "guest": {
        "name": "Workspace Guest",
        "namespace": "workspace",
        "permissions": [
            # Workspace - view only
            WorkspacePermissions.VIEW,
            # Workspace members - view only (FE fetches member list on workspace init)
            WorkspaceMemberPermissions.VIEW,
            # NO project:browse — guests only see projects they have explicit membership on
            # Workspace views - view only (filtered to own views via inline check)
            WorkspaceWorkitemViewPermissions.VIEW,
            # Workspace assets - view only
            WorkspaceAssetPermissions.VIEW,
            # Workspace project states - view only
            WorkspaceProjectStatePermissions.VIEW,
            # Workspace features - view only
            WorkspaceFeaturePermissions.VIEW,
            # Work item relation definitions - view only
            WorkitemRelationPermissions.VIEW,
        ],
    },
}


# =============================================================================
# PROJECT PERMISSION SCHEMES
# One scheme per project system role. Permission lists are exact copies from
# PROJECT_ROLES in system_roles.py.
# =============================================================================
PROJECT_PERMISSION_SCHEMES: dict[str, SystemPermissionSchemeConfig] = {
    "admin": {
        "name": "Project Admin",
        "namespace": "project",
        "permissions": [
            # Project - full control (settings, workflows, states, custom fields, automation)
            ProjectPermissions.VIEW,
            ProjectPermissions.EDIT,
            ProjectPermissions.MANAGE,
            ProjectPermissions.DELETE,
            ProjectPermissions.ARCHIVE,
            ProjectPermissions.REACT,
            ProjectPermissions.PUBLISH,
            # Issues - full control (wildcard)
            WildcardGrant(ResourceType.WORKITEM),
            # Epics - full control (wildcard)
            WildcardGrant(ResourceType.EPIC),
            # Epic updates - full control (wildcard)
            WildcardGrant(ResourceType.EPIC_UPDATE),
            WildcardGrant(ResourceType.EPIC_UPDATE_COMMENT),
            # Project updates - full control (wildcard)
            WildcardGrant(ResourceType.PROJECT_UPDATE),
            WildcardGrant(ResourceType.PROJECT_UPDATE_COMMENT),
            # Epic links - full control (wildcard)
            WildcardGrant(ResourceType.EPIC_LINK),
            # Epic properties - full control (wildcard)
            WildcardGrant(ResourceType.EPIC_PROPERTY),
            # Issue properties - full control (wildcard)
            WildcardGrant(ResourceType.ISSUE_PROPERTY),
            # Comments - full control (wildcard)
            WildcardGrant(ResourceType.COMMENT),
            # Modules - full control (wildcard)
            WildcardGrant(ResourceType.MODULE),
            # Cycles - full control (wildcard)
            WildcardGrant(ResourceType.CYCLE),
            # Cycle updates - full control (wildcard)
            WildcardGrant(ResourceType.CYCLE_UPDATE),
            # Pages - full control (wildcard)
            WildcardGrant(ResourceType.PAGE),
            # Views - full control (wildcard)
            WildcardGrant(ResourceType.WORKITEM_VIEW),
            # Intake - full control including configure (wildcard)
            WildcardGrant(ResourceType.INTAKE),
            # Labels, States, Estimates - full control (wildcards)
            WildcardGrant(ResourceType.LABEL),
            WildcardGrant(ResourceType.STATE),
            WildcardGrant(ResourceType.ESTIMATE),
            # Attachments - full control (wildcard)
            WildcardGrant(ResourceType.ATTACHMENT),
            # Links - full control (wildcard)
            WildcardGrant(ResourceType.WORKITEM_LINK),
            # Reactions - covered by parent wildcards (workitem:*, epic:*, comment:*, project:*)
            # Project members - full control (add/remove/assign roles)
            WildcardGrant(ResourceType.PROJECT_MEMBER),
            # Activity logs - full control
            WildcardGrant(ResourceType.PROJECT_ACTIVITY),
            WildcardGrant(ResourceType.PROJECT_MEMBER_ACTIVITY),
            # Project analytics - full access
            WildcardGrant(ResourceType.PROJECT_ANALYTICS),
            # Automations - full control (wildcard)
            WildcardGrant(ResourceType.PROJECT_AUTOMATION),
            # Workflows - full control (wildcard)
            WildcardGrant(ResourceType.WORKFLOW),
            # Milestones - full control (wildcard)
            WildcardGrant(ResourceType.MILESTONE),
            # Recurring work items - full control (wildcard)
            WildcardGrant(ResourceType.RECURRING_WORKITEM),
            # Project assets - full control (wildcard)
            WildcardGrant(ResourceType.PROJECT_ASSET),
            # Project links - full control (wildcard)
            WildcardGrant(ResourceType.PROJECT_LINK),
            # Templates - full control (wildcards)
            WildcardGrant(ResourceType.PROJECT_WORKITEM_TEMPLATE),
            WildcardGrant(ResourceType.PROJECT_PAGE_TEMPLATE),
        ],
    },
    "contributor": {
        "name": "Project Contributor",
        "namespace": "project",
        "permissions": [
            # Project - view only (no edit/manage/delete)
            ProjectPermissions.VIEW,
            # Issues - create, edit, assign, archive, bulk_edit, delete own, export
            WorkitemPermissions.VIEW,
            WorkitemPermissions.CREATE,
            WorkitemPermissions.EDIT,
            WorkitemPermissions.ASSIGN,
            WorkitemPermissions.ARCHIVE,
            WorkitemPermissions.BULK_EDIT,
            WorkitemPermissions.DELETE & Condition.CREATOR,
            WorkitemPermissions.EXPORT,
            # Reactions on issues
            WorkitemPermissions.REACT,
            # Epics - view, create, edit, delete own, export
            EpicPermissions.VIEW,
            EpicPermissions.CREATE,
            EpicPermissions.EDIT,
            EpicPermissions.DELETE & Condition.CREATOR,
            EpicPermissions.ARCHIVE,
            EpicPermissions.EXPORT,
            # Reactions on epics
            EpicPermissions.REACT,
            # Epic links - full CRUD
            EpicLinkPermissions.VIEW,
            EpicLinkPermissions.CREATE,
            EpicLinkPermissions.EDIT,
            EpicLinkPermissions.DELETE,
            # Epic properties - full CRUD
            EpicPropertyPermissions.VIEW,
            EpicPropertyPermissions.CREATE,
            EpicPropertyPermissions.EDIT,
            EpicPropertyPermissions.DELETE,
            # Issue properties - full CRUD
            IssuePropertyPermissions.VIEW,
            IssuePropertyPermissions.CREATE,
            IssuePropertyPermissions.EDIT,
            IssuePropertyPermissions.DELETE,
            # Epic updates - view, create, edit/delete own, react
            EpicUpdatePermissions.VIEW,
            EpicUpdatePermissions.CREATE,
            EpicUpdatePermissions.EDIT & Condition.CREATOR,
            EpicUpdatePermissions.DELETE & Condition.CREATOR,
            EpicUpdatePermissions.REACT,
            # Epic update comments - create, edit/delete own, react
            EpicUpdateCommentPermissions.CREATE,
            EpicUpdateCommentPermissions.EDIT & Condition.CREATOR,
            EpicUpdateCommentPermissions.DELETE & Condition.CREATOR,
            EpicUpdateCommentPermissions.REACT,
            # Project updates - view, create, edit/delete own
            ProjectUpdatePermissions.VIEW,
            ProjectUpdatePermissions.CREATE,
            ProjectUpdatePermissions.EDIT & Condition.CREATOR,
            ProjectUpdatePermissions.DELETE & Condition.CREATOR,
            ProjectUpdatePermissions.REACT,
            # Project update comments - view, create, edit/delete own, react
            ProjectUpdateCommentPermissions.VIEW,
            ProjectUpdateCommentPermissions.CREATE,
            ProjectUpdateCommentPermissions.EDIT & Condition.CREATOR,
            ProjectUpdateCommentPermissions.DELETE & Condition.CREATOR,
            ProjectUpdateCommentPermissions.REACT,
            # Modules - create, edit, archive, delete own, export
            ModulePermissions.VIEW,
            ModulePermissions.CREATE,
            ModulePermissions.EDIT,
            ModulePermissions.ARCHIVE,
            ModulePermissions.DELETE & Condition.CREATOR,
            ModulePermissions.EXPORT,
            # Cycles - create, edit, archive, delete own, export
            CyclePermissions.VIEW,
            CyclePermissions.CREATE,
            CyclePermissions.EDIT,
            CyclePermissions.ARCHIVE,
            CyclePermissions.DELETE & Condition.CREATOR,
            CyclePermissions.EXPORT,
            # Cycle updates - view, create, edit/delete own, react
            CycleUpdatePermissions.VIEW,
            CycleUpdatePermissions.CREATE,
            CycleUpdatePermissions.EDIT & Condition.CREATOR,
            CycleUpdatePermissions.DELETE & Condition.CREATOR,
            CycleUpdatePermissions.REACT,
            # Pages - create, edit, share (no delete)
            PagePermissions.VIEW,
            PagePermissions.CREATE,
            PagePermissions.EDIT,
            PagePermissions.SHARE,
            # Views - view, create, edit, share, publish, delete own, export
            WorkitemViewPermissions.VIEW,
            WorkitemViewPermissions.CREATE,
            WorkitemViewPermissions.EDIT & Condition.CREATOR,
            WorkitemViewPermissions.SHARE & Condition.CREATOR,
            WorkitemViewPermissions.PUBLISH & Condition.CREATOR,
            WorkitemViewPermissions.DELETE & Condition.CREATOR,
            WorkitemViewPermissions.EXPORT,
            # Intake - view, create, edit own, delete own, submit, export
            IntakePermissions.VIEW,
            IntakePermissions.CREATE,
            IntakePermissions.EDIT & Condition.CREATOR,
            IntakePermissions.DELETE & Condition.CREATOR,
            IntakePermissions.SUBMIT,
            IntakePermissions.EXPORT,
            IntakePermissions.REACT,
            # Labels - view only (admin controls)
            LabelPermissions.VIEW,
            # States & Estimates - view only (admin controls)
            StatePermissions.VIEW,
            EstimatePermissions.VIEW,
            # Comments - create, edit own, delete own (via conditional grants)
            CommentPermissions.CREATE,
            CommentPermissions.EDIT & Condition.CREATOR,
            CommentPermissions.DELETE & Condition.CREATOR,
            # Reactions on comments and projects
            CommentPermissions.REACT,
            ProjectPermissions.REACT,
            # Attachments - view, create, edit own, delete own
            AttachmentPermissions.VIEW,
            AttachmentPermissions.CREATE,
            AttachmentPermissions.EDIT & Condition.CREATOR,
            AttachmentPermissions.DELETE & Condition.CREATOR,
            # Links - full CRUD
            WorkitemLinkPermissions.VIEW,
            WorkitemLinkPermissions.CREATE,
            WorkitemLinkPermissions.EDIT,
            WorkitemLinkPermissions.DELETE,
            # Members - view only (project scope)
            ProjectMemberPermissions.VIEW,
            # Activity logs - view only
            ProjectActivityPermissions.VIEW,
            # Project analytics - view and export
            ProjectAnalyticsPermissions.VIEW,
            ProjectAnalyticsPermissions.EXPORT,
            # Automations - view only
            ProjectAutomationPermissions.VIEW,
            # Workflows - view only
            WorkflowPermissions.VIEW,
            # Milestones - full CRUD
            MilestonePermissions.VIEW,
            MilestonePermissions.CREATE,
            MilestonePermissions.EDIT,
            MilestonePermissions.DELETE,
            # Recurring work items - full CRUD
            RecurringWorkitemPermissions.VIEW,
            RecurringWorkitemPermissions.CREATE,
            RecurringWorkitemPermissions.EDIT,
            RecurringWorkitemPermissions.DELETE,
            # Project assets - view, create, edit own, delete own (full upload flow)
            ProjectAssetPermissions.VIEW,
            ProjectAssetPermissions.CREATE,
            ProjectAssetPermissions.EDIT & Condition.CREATOR,
            ProjectAssetPermissions.DELETE & Condition.CREATOR,
            # Project links - view, create, edit (no delete — admin only)
            ProjectLinkPermissions.VIEW,
            ProjectLinkPermissions.CREATE,
            ProjectLinkPermissions.EDIT,
            # Templates - view only
            ProjectWorkitemTemplatePermissions.VIEW,
            ProjectPageTemplatePermissions.VIEW,
        ],
    },
    "commenter": {
        "name": "Project Commenter",
        "namespace": "project",
        "permissions": [
            # Project - view only
            ProjectPermissions.VIEW,
            # Issues - view only, cannot create; edit/delete own intake issues
            WorkitemPermissions.VIEW,
            WorkitemPermissions.EDIT & Condition.CREATOR,
            WorkitemPermissions.DELETE & Condition.CREATOR,
            # Reactions on issues
            WorkitemPermissions.REACT,
            # Epics - view only
            EpicPermissions.VIEW,
            # Epic updates - view only
            EpicUpdatePermissions.VIEW,
            # Project updates - view and react
            ProjectUpdatePermissions.VIEW,
            ProjectUpdatePermissions.REACT,
            ProjectUpdateCommentPermissions.VIEW,
            ProjectUpdateCommentPermissions.REACT,
            # Epic links - view only
            EpicLinkPermissions.VIEW,
            # Epic properties - view only
            EpicPropertyPermissions.VIEW,
            # Issue properties - view only
            IssuePropertyPermissions.VIEW,
            # Modules - view only
            ModulePermissions.VIEW,
            # Cycles - view only
            CyclePermissions.VIEW,
            # Cycle updates - view and react
            CycleUpdatePermissions.VIEW,
            CycleUpdatePermissions.REACT,
            # Pages - view only
            PagePermissions.VIEW,
            # Views - view only (parity: commenter must not have less access than guest)
            WorkitemViewPermissions.VIEW,
            # Intake - view, create, edit own, delete own, submit
            IntakePermissions.VIEW,
            IntakePermissions.CREATE,
            IntakePermissions.EDIT & Condition.CREATOR,
            IntakePermissions.DELETE & Condition.CREATOR,
            IntakePermissions.SUBMIT,
            IntakePermissions.REACT,
            # Labels, States, Estimates - view only
            LabelPermissions.VIEW,
            StatePermissions.VIEW,
            EstimatePermissions.VIEW,
            # Comments - create, edit own, delete own (via conditional grants)
            CommentPermissions.CREATE,
            CommentPermissions.EDIT & Condition.CREATOR,
            CommentPermissions.DELETE & Condition.CREATOR,
            # Reactions on comments
            CommentPermissions.REACT,
            # Attachments - view and create (commenter can attach files to comments)
            AttachmentPermissions.VIEW,
            AttachmentPermissions.CREATE,
            # Links - view only
            WorkitemLinkPermissions.VIEW,
            # Members - view only (project scope)
            ProjectMemberPermissions.VIEW,
            # Activity logs - view only
            ProjectActivityPermissions.VIEW,
            # Project analytics - view only
            ProjectAnalyticsPermissions.VIEW,
            # Workflows - view only
            WorkflowPermissions.VIEW,
            # Milestones - view only
            MilestonePermissions.VIEW,
            # Project assets - view, create, edit own, delete own (upload flow for comment images)
            ProjectAssetPermissions.VIEW,
            ProjectAssetPermissions.CREATE,
            ProjectAssetPermissions.EDIT & Condition.CREATOR,
            ProjectAssetPermissions.DELETE & Condition.CREATOR,
            # Project links - view only
            ProjectLinkPermissions.VIEW,
        ],
    },
    "guest": {
        "name": "Project Guest",
        "namespace": "project",
        "permissions": [
            # Project - view only
            ProjectPermissions.VIEW,
            # Project updates - view only
            ProjectUpdatePermissions.VIEW,
            ProjectUpdateCommentPermissions.VIEW,
            # Issues - view/edit/delete own intake issues (via conditional grants)
            WorkitemPermissions.VIEW & Condition.CREATOR,
            WorkitemPermissions.EDIT & Condition.CREATOR,
            WorkitemPermissions.DELETE & Condition.CREATOR,
            # Modules - no access
            # Cycles - no access
            # Pages - view only
            PagePermissions.VIEW,
            # Views - view only
            WorkitemViewPermissions.VIEW,
            # Intake - view own, create, edit own, delete own, submit
            IntakePermissions.VIEW & Condition.CREATOR,
            IntakePermissions.CREATE,
            IntakePermissions.EDIT & Condition.CREATOR,
            IntakePermissions.DELETE & Condition.CREATOR,
            IntakePermissions.SUBMIT,
            # Labels - view only
            LabelPermissions.VIEW,
            # Estimates - view only (parity: old ProjectEntityPermission allowed guest GET)
            EstimatePermissions.VIEW,
            # States - view only
            StatePermissions.VIEW,
            # Reactions on comments (for page comment reactions; guest can view pages)
            CommentPermissions.REACT,
            # Attachments - view only (no create — guests cannot create attachments)
            AttachmentPermissions.VIEW,
            # Members - view only (project scope)
            ProjectMemberPermissions.VIEW,
            # Activity logs - view only
            ProjectActivityPermissions.VIEW,
            # Workflows - view only
            WorkflowPermissions.VIEW,
            # Project assets - view only (download, serve)
            ProjectAssetPermissions.VIEW,
        ],
    },
}


# =============================================================================
# COMBINED SYSTEM PERMISSION SCHEMES REGISTRY
# =============================================================================
SYSTEM_PERMISSION_SCHEMES: dict[str, dict[str, SystemPermissionSchemeConfig]] = {
    "workspace": WORKSPACE_PERMISSION_SCHEMES,
    "project": PROJECT_PERMISSION_SCHEMES,
}


def deduplicate_conditionals(perms: set[str]) -> frozenset[str]:
    """
    Deduplicate conditional permissions when unioning across Permission Schemes.
    When the same base permission appears both with and without a condition,
    the unconditional form wins (it's strictly more permissive).
    Example: {"workitem:delete", "workitem:delete+creator"} -> {"workitem:delete"}
    """
    has_unconditional: dict[str, bool] = {}
    for p in perms:
        if "+" in p:
            base = p.split("+", 1)[0]
            has_unconditional.setdefault(base, False)
        else:
            has_unconditional[p] = True

    result: set[str] = set()
    for p in perms:
        if "+" in p:
            base = p.split("+", 1)[0]
            if has_unconditional.get(base, False):
                continue
        result.add(p)
    return frozenset(result)
