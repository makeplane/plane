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

# Permission system exports
from .definitions import (
    # Core types
    ResourceType,
    Action,
    Permission,
    Condition,
    ConditionalGrant,
    WildcardGrant,
    FULL_ACCESS,
    # Permission classes — all statically defined for IDE support
    WorkspacePermissions,
    WorkspaceMemberPermissions,
    WikiPermissions,
    WikiCollectionPermissions,
    WorkspaceWorkitemViewPermissions,
    InitiativePermissions,
    InitiativeCommentPermissions,
    InitiativeAttachmentPermissions,
    InitiativeLinkPermissions,
    InitiativeUpdatePermissions,
    InitiativeUpdateCommentPermissions,
    TeamspacePermissions,
    TeamspaceCommentPermissions,
    TeamspaceWorkitemViewPermissions,
    TeamspacePagePermissions,
    TeamspacePageCommentPermissions,
    IntegrationPermissions,
    WebhookPermissions,
    ApiTokenPermissions,
    CustomRolePermissions,
    DashboardPermissions,
    AnalyticsPermissions,
    BillingPermissions,
    ProjectAnalyticsPermissions,
    AIPermissions,
    WorkspaceActivityPermissions,
    WorkspaceUserActivityPermissions,
    FavoritePermissions,
    WorkspaceDraftPermissions,
    CustomerPermissions,
    CustomerAttachmentPermissions,
    WorkspaceAssetPermissions,
    WorkspaceProjectStatePermissions,
    WorkspaceFeaturePermissions,
    WorkspaceWorklogPermissions,
    WorkspaceCustomPropertyPermissions,
    WorkspaceWorkitemTypePermissions,
    ProjectPermissions,
    ProjectMemberPermissions,
    WorkitemPermissions,
    EpicPermissions,
    EpicUpdatePermissions,
    EpicUpdateCommentPermissions,
    ProjectUpdatePermissions,
    ProjectUpdateCommentPermissions,
    ModulePermissions,
    CyclePermissions,
    CycleUpdatePermissions,
    PagePermissions,
    WorkitemViewPermissions,
    IntakePermissions,
    LabelPermissions,
    StatePermissions,
    EstimatePermissions,
    CommentPermissions,
    AttachmentPermissions,
    WorkitemLinkPermissions,
    WorkitemRelationPermissions,
    ProjectActivityPermissions,
    ProjectMemberActivityPermissions,
    EpicLinkPermissions,
    EpicPropertyPermissions,
    IssuePropertyPermissions,
    ProjectAutomationPermissions,
    WorkspaceAutomationPermissions,
    WorkflowPermissions,
    ReleasePermissions,
    MilestonePermissions,
    RecurringWorkitemPermissions,
    ProjectAssetPermissions,
    ProjectLinkPermissions,
    ProjectWorkitemTypePermissions,
    WorkspaceWorkitemTemplatePermissions,
    WorkspacePageTemplatePermissions,
    WorkspaceProjectTemplatePermissions,
    ProjectWorkitemTemplatePermissions,
    ProjectPageTemplatePermissions,
    # Validation helpers
    is_valid_permission,
    get_valid_actions,
    get_permission,
    get_all_permissions_for_resource,
    # Configuration and generated lists
    RESOURCE_ACTIONS,
    ALL_PERMISSIONS,
    PERMISSION_MAP,
)
from .inheritance import (
    # Resource type groupings (auto-derived from hierarchy)
    WORKSPACE_RESOURCE_TYPES,
    TEAMSPACE_RESOURCE_TYPES,
    PROJECT_RESOURCE_TYPES,
)
from .engine import permission_engine, PermissionEngine
from .grants import Grant
from .context import AccessResult, PermissionContext, PermissionScopeType
from .sync import PermissionSyncMixin
from .decorators import can, require_permission, PermissionMixin, get_permission_conditions, HasResourcePermission
from .system_roles import (
    SYSTEM_ROLES,
    SYSTEM_ROLE_SLUGS,
    get_system_role_permissions,
    get_system_role_permission_set,
)
from .permission_schemes import (
    SYSTEM_PERMISSION_SCHEMES,
    WORKSPACE_PERMISSION_SCHEMES,
    PROJECT_PERMISSION_SCHEMES,
    deduplicate_conditionals,
)

# __all__ is auto-generated from _PERMISSION_CLASSES to stay in sync.
# Non-permission-class exports are listed explicitly.
from .definitions import _PERMISSION_CLASSES as _pc

__all__ = [
    # Core types
    "ResourceType",
    "Action",
    "Permission",
    "Condition",
    "ConditionalGrant",
    # All permission classes (auto-generated from registry)
    *[cls.__name__ for cls in _pc.values()],
    # Validation helpers
    "is_valid_permission",
    "get_valid_actions",
    "get_permission",
    "get_all_permissions_for_resource",
    # Configuration
    "RESOURCE_ACTIONS",
    "ALL_PERMISSIONS",
    "PERMISSION_MAP",
    "WORKSPACE_RESOURCE_TYPES",
    "TEAMSPACE_RESOURCE_TYPES",
    "PROJECT_RESOURCE_TYPES",
    # Engine
    "permission_engine",
    "PermissionEngine",
    "AccessResult",
    "PermissionContext",
    "PermissionScopeType",
    # Grants
    "Grant",
    # Sync
    "PermissionSyncMixin",
    # Decorators & Mixins
    "can",
    "require_permission",
    "PermissionMixin",
    "get_permission_conditions",
    "HasResourcePermission",
    # System roles
    "SYSTEM_ROLES",
    "SYSTEM_ROLE_SLUGS",
    "get_system_role_permissions",
    "get_system_role_permission_set",
    # Permission schemes
    "SYSTEM_PERMISSION_SCHEMES",
    "WORKSPACE_PERMISSION_SCHEMES",
    "PROJECT_PERMISSION_SCHEMES",
    "deduplicate_conditionals",
]

del _pc
