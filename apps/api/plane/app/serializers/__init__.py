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

from .base import BaseSerializer, DynamicBaseSerializer
from .user import (
    UserSerializer,
    UserLiteSerializer,
    ChangePasswordSerializer,
    ResetPasswordSerializer,
    UserAdminLiteSerializer,
    UserMeSerializer,
    UserMeSettingsSerializer,
    ProfileSerializer,
    AccountSerializer,
)
from .workspace import (
    WorkSpaceSerializer,
    WorkSpaceMemberSerializer,
    WorkSpaceMemberInviteSerializer,
    WorkspaceLiteSerializer,
    WorkspaceThemeSerializer,
    WorkspaceMemberAdminSerializer,
    WorkspaceMemberMeSerializer,
    WorkspaceUserPropertiesSerializer,
    WorkspaceUserLinkSerializer,
    WorkspaceRecentVisitSerializer,
    WorkspaceHomePreferenceSerializer,
    StickySerializer,
    WorkspaceUserMeSerializer,
    WorkspaceMemberUserOnboardingSerializer,
)
from .project import (
    ProjectSerializer,
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectMemberSerializer,
    ProjectMemberInviteSerializer,
    ProjectIdentifierSerializer,
    ProjectLiteSerializer,
    ProjectMemberLiteSerializer,
    ProjectMemberAdminSerializer,
    ProjectPublicMemberSerializer,
    ProjectMemberRoleSerializer,
    ProjectMemberPreferenceSerializer,
    ProjectLabelSerializer,
    ProjectSubscriberSerializer,
)
from .state import StateSerializer, StateLiteSerializer
from .view import IssueViewSerializer, ViewIssueListSerializer
from .cycle import (
    CycleSerializer,
    CycleIssueSerializer,
    CycleWriteSerializer,
    CycleUserPropertiesSerializer,
    EntityProgressSerializer,
)
from .asset import FileAssetSerializer
from .issue import (
    IssueCreateSerializer,
    IssueActivitySerializer,
    IssueCommentSerializer,
    IssueCommentReplySerializer,
    ProjectUserPropertySerializer,
    IssueAssigneeSerializer,
    LabelSerializer,
    IssueSerializer,
    IssueFlatSerializer,
    IssueStateSerializer,
    IssueLinkSerializer,
    IssueIntakeSerializer,
    IssueLiteSerializer,
    IssueAttachmentSerializer,
    IssueSubscriberSerializer,
    IssueReactionSerializer,
    CommentReactionSerializer,
    IssueVoteSerializer,
    IssueRelationSerializer,
    RelatedIssueSerializer,
    IssuePublicSerializer,
    IssueDetailSerializer,
    IssueReactionLiteSerializer,
    IssueAttachmentLiteSerializer,
    IssueLinkLiteSerializer,
    IssueVersionDetailSerializer,
    IssueDescriptionVersionDetailSerializer,
    IssueListDetailSerializer,
    IssueDuplicateSerializer,
)

from .module import (
    ModuleDetailSerializer,
    ModuleWriteSerializer,
    ModuleSerializer,
    ModuleIssueSerializer,
    ModuleLinkSerializer,
    ModuleUserPropertiesSerializer,
)

from .api import APITokenSerializer, APITokenReadSerializer

from .importer import ImporterSerializer

from .page import (
    PageSerializer,
    PageLiteSerializer,
    PageDetailSerializer,
    PageVersionSerializer,
    PageBinaryUpdateSerializer,
    PageVersionDetailSerializer,
    PageUserSerializer,
)

from .estimate import (
    EstimateSerializer,
    EstimatePointSerializer,
    EstimateReadSerializer,
    WorkspaceEstimateSerializer,
)

from .intake import (
    IntakeSerializer,
    IntakeIssueSerializer,
    IssueStateIntakeSerializer,
    IntakeIssueLiteSerializer,
    IntakeIssueDetailSerializer,
)

from .analytic import AnalyticViewSerializer

from .notification import NotificationSerializer, UserNotificationPreferenceSerializer

from .exporter import ExporterHistorySerializer

from .webhook import WebhookSerializer, WebhookLogSerializer

from .favorite import UserFavoriteSerializer

from .draft import (
    DraftIssueCreateSerializer,
    DraftIssueSerializer,
    DraftIssueDetailSerializer,
)
from .integration import (
    IntegrationSerializer,
    WorkspaceIntegrationSerializer,
    GithubIssueSyncSerializer,
    GithubRepositorySerializer,
    GithubRepositorySyncSerializer,
    GithubCommentSyncSerializer,
    SlackProjectSyncSerializer,
)

from .deploy_board import DeployBoardSerializer


# Extended serializers
from .extended.issue import ExtendedIssueCreateSerializer as IssueCreateSerializer  # noqa: F811


__all__ = [
    # Base serializers
    "BaseSerializer",
    "DynamicBaseSerializer",
    # User serializers
    "UserSerializer",
    "UserLiteSerializer",
    "ChangePasswordSerializer",
    "ResetPasswordSerializer",
    "UserAdminLiteSerializer",
    "UserMeSerializer",
    "UserMeSettingsSerializer",
    "ProfileSerializer",
    "AccountSerializer",
    # Workspace serializers
    "WorkSpaceSerializer",
    "WorkSpaceMemberSerializer",
    "WorkSpaceMemberInviteSerializer",
    "WorkspaceLiteSerializer",
    "WorkspaceThemeSerializer",
    "WorkspaceMemberAdminSerializer",
    "WorkspaceMemberMeSerializer",
    "WorkspaceUserPropertiesSerializer",
    "WorkspaceUserLinkSerializer",
    "WorkspaceRecentVisitSerializer",
    "WorkspaceHomePreferenceSerializer",
    "StickySerializer",
    "WorkspaceUserMeSerializer",
    # Project serializers
    "ProjectSerializer",
    "ProjectListSerializer",
    "ProjectDetailSerializer",
    "ProjectMemberSerializer",
    "ProjectMemberInviteSerializer",
    "ProjectIdentifierSerializer",
    "ProjectLiteSerializer",
    "ProjectMemberLiteSerializer",
    "ProjectMemberAdminSerializer",
    "ProjectPublicMemberSerializer",
    "ProjectMemberRoleSerializer",
    "ProjectSubscriberSerializer",
    # State serializers
    "StateSerializer",
    "StateLiteSerializer",
    # View serializers
    "IssueViewSerializer",
    "ViewIssueListSerializer",
    # Cycle serializers
    "CycleSerializer",
    "CycleIssueSerializer",
    "CycleWriteSerializer",
    "CycleUserPropertiesSerializer",
    "EntityProgressSerializer",
    # Asset serializers
    "FileAssetSerializer",
    # Issue serializers
    "IssueCreateSerializer",
    "IssueActivitySerializer",
    "IssueCommentSerializer",
    "ProjectUserPropertySerializer",
    "IssueAssigneeSerializer",
    "LabelSerializer",
    "IssueSerializer",
    "IssueFlatSerializer",
    "IssueStateSerializer",
    "IssueLinkSerializer",
    "IssueIntakeSerializer",
    "IssueLiteSerializer",
    "IssueSubscriberSerializer",
    "IssueReactionSerializer",
    "CommentReactionSerializer",
    "IssueVoteSerializer",
    "IssueRelationSerializer",
    "RelatedIssueSerializer",
    "IssuePublicSerializer",
    "IssueDetailSerializer",
    "IssueReactionLiteSerializer",
    "IssueAttachmentLiteSerializer",
    "IssueLinkLiteSerializer",
    "IssueVersionDetailSerializer",
    "IssueDescriptionVersionDetailSerializer",
    "IssueListDetailSerializer",
    "IssueDuplicateSerializer",
    "IssueAttachmentSerializer",
    # Module serializers
    "ModuleDetailSerializer",
    "ModuleWriteSerializer",
    "ModuleSerializer",
    "ModuleIssueSerializer",
    "ModuleLinkSerializer",
    "ModuleUserPropertiesSerializer",
    # API serializers
    "APITokenSerializer",
    "APITokenReadSerializer",
    # Importer serializers
    "ImporterSerializer",
    # Page serializers
    "PageSerializer",
    "PageLiteSerializer",
    "PageDetailSerializer",
    "PageVersionSerializer",
    "PageBinaryUpdateSerializer",
    "PageVersionDetailSerializer",
    "PageUserSerializer",
    # Estimate serializers
    "EstimateSerializer",
    "EstimatePointSerializer",
    "EstimateReadSerializer",
    "WorkspaceEstimateSerializer",
    # Intake serializers
    "IntakeSerializer",
    "IntakeIssueSerializer",
    "IssueStateIntakeSerializer",
    "IntakeIssueLiteSerializer",
    "IntakeIssueDetailSerializer",
    # Analytic serializers
    "AnalyticViewSerializer",
    # Notification serializers
    "NotificationSerializer",
    "UserNotificationPreferenceSerializer",
    # Exporter serializers
    "ExporterHistorySerializer",
    # Webhook serializers
    "WebhookSerializer",
    "WebhookLogSerializer",
    # Favorite serializers
    "UserFavoriteSerializer",
    # Draft serializers
    "DraftIssueCreateSerializer",
    "DraftIssueSerializer",
    "DraftIssueDetailSerializer",
    # Integration serializers
    "IntegrationSerializer",
    "WorkspaceIntegrationSerializer",
    "GithubIssueSyncSerializer",
    "GithubRepositorySerializer",
    "GithubRepositorySyncSerializer",
    "GithubCommentSyncSerializer",
    "SlackProjectSyncSerializer",
    # Deploy board serializers
    "DeployBoardSerializer",
]
