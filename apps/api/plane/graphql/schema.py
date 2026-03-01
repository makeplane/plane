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

import strawberry
from strawberry_django.optimizer import DjangoOptimizerExtension

# mutations
from .mutations.asset import (
    ProjectAssetMutation,
    UserAssetMutation,
    WorkspaceAssetMutation,
)
from .mutations.auth import SetPasswordMutation
from .mutations.catch_up import CatchUpMarkAsReadMutation
from .mutations.cycle import (
    CycleFavoriteMutation,
    CycleIssueMutation,
    CycleIssueUserPropertyMutation,
)
from .mutations.device import DeviceInformationMutation
from .mutations.epics import (
    EpicAttachmentMutation,
    EpicCommentMutation,
    EpicCommentReactionMutation,
    EpicCommentReplyMutation,
    EpicLinkMutation,
    EpicMutation,
    EpicPageMutation,
    EpicRelationMutation,
    EpicUserPropertyMutation,
    EpicWorkItemsMutation,
)
from .mutations.favorite import UserFavoriteMutation
from .mutations.intake import (
    IntakeWorkItemAttachmentMutation,
    IntakeWorkItemCommentMutation,
    IntakeWorkItemCommentReactionMutation,
    IntakeWorkItemCommentReplyMutation,
    IntakeWorkItemMutation,
    IntakeWorkItemStatusMutation,
)
from .mutations.issue import (
    IssueSubscriptionMutation,
    IssueUserPropertyMutation,
)
from .mutations.issues import (
    IssueAttachmentMutation,
    IssueCommentMutation,
    IssueCycleMutation,
    IssueLinkMutation,
    IssueModuleMutation,
    IssueMutationV2,
    IssueRelationMutation,
    SubIssueMutation,
    WorkItemArchiveMutation,
    WorkItemCommentMutation,
    WorkItemCommentReactionMutation,
    WorkItemCommentReplyMutation,
    WorkItemMutation,
    WorkItemPageMutation,
)
from .mutations.module import (
    ModuleFavoriteMutation,
    ModuleIssueMutation,
    ModuleIssueUserPropertyMutation,
)
from .mutations.notification import NotificationMutation
from .mutations.page import (
    NestedChildArchivePageMutation,
    NestedChildDeletePageMutation,
    NestedChildRestorePageMutation,
    PageFavoriteMutation,
    PageMutation,
    ProjectPageCommentReactionsMutation,
    ProjectPageCommentsMutation,
    WorkspaceNestedChildArchivePageMutation,
    WorkspaceNestedChildDeletePageMutation,
    WorkspaceNestedChildRestorePageMutation,
    WorkspacePageCommentReactionsMutation,
    WorkspacePageCommentsMutation,
    WorkspacePageMutation,
)
from .mutations.project import (
    JoinProjectMutation,
    ProjectFavoriteMutation,
    ProjectInviteMutation,
    ProjectMutation,
)
from .mutations.stickies import WorkspaceStickiesMutation
from .mutations.user import ProfileMutation, UserDeleteMutation, UserMutation
from .mutations.workspace import (
    PublicWorkspaceInviteMutation,
    PublicWorkspaceInviteV2Mutation,
    WorkspaceInviteMutation,
    WorkspaceMutation,
)

# queries
from .queries.asset import ProjectAssetQuery, WorkspaceAssetQuery
from .queries.catch_up import CatchUpQuery
from .queries.cycle import (
    CycleIssueQuery,
    CycleIssuesInformationQuery,
    CycleIssueUserPropertyQuery,
    CycleQuery,
)
from .queries.dashboard import userInformationQuery
from .queries.epics import (
    EpicActivityQuery,
    EpicAttachmentQuery,
    EpicCommentQuery,
    EpicCommentReactionQuery,
    EpicCountQuery,
    EpicLinkQuery,
    EpicPageQuery,
    EpicPageSearchQuery,
    EpicQuery,
    EpicRelationQuery,
    EpicStatsQuery,
    EpicUserPropertyQuery,
    EpicWorkItemsQuery,
)
from .queries.estimate import EstimatePointQuery
from .queries.external import ProjectCoversQuery, UnsplashImagesQuery
from .queries.feature_flag import FeatureFlagQuery
from .queries.instance import InstanceQuery
from .queries.intake import (
    IntakeCountQuery,
    IntakeSearchQuery,
    IntakeStatsQuery,
    IntakeWorkItemActivityQuery,
    IntakeWorkItemAttachmentQuery,
    IntakeWorkItemCommentQuery,
    IntakeWorkItemCommentReactionQuery,
    IntakeWorkItemQuery,
)
from .queries.issue import (
    IssuePropertiesActivityQuery,
    IssueQuery,
    IssuesInformationQuery,
    IssueTypesTypeQuery,
    IssueUserPropertyQuery,
    RecentIssuesQuery,
)
from .queries.issues import (
    IssueAttachmentQuery,
    IssueLinkQuery,
    IssueRelationQuery,
    IssueShortenedMetaInfoQuery,
    IssuesSearchQuery,
    IssueStatsQuery,
    SubIssuesQuery,
    WorkItemCommentReactionQuery,
)
from .queries.label import LabelQuery, WorkspaceLabelQuery
from .queries.module import (
    ModuleIssueQuery,
    ModuleIssuesInformationQuery,
    ModuleIssueUserPropertyQuery,
    ModuleQuery,
)
from .queries.notification import NotificationCountQuery, NotificationQuery
from .queries.page import (
    NestedChildPagesQuery,
    NestedParentPagesQuery,
    PageQuery,
    ProjectPageCommentsQuery,
    ProjectPageMentionQuery,
    UserPageQuery,
    WorkspaceNestedChildPagesQuery,
    WorkspaceNestedParentPagesQuery,
    WorkspacePageCommentsQuery,
    WorkspacePageMentionQuery,
    WorkspacePageQuery,
)
from .queries.project import ProjectFeatureQuery, ProjectMembersQuery, ProjectQuery
from .queries.roles import UserProjectRolesQuery
from .queries.search import GlobalSearchQuery
from .queries.state import StateQuery, TriageStateQuery, WorkspaceStateQuery
from .queries.stickies import WorkspaceStickiesQuery
from .queries.teamspace import TeamspaceMemberQuery
from .queries.timezone import TimezoneListQuery
from .queries.users import (
    ProfileQuery,
    UserDeleteQuery,
    UserFavoritesQuery,
    UserQuery,
    UserRecentVisitQuery,
)
from .queries.version_check import VersionCheckQuery
from .queries.workitem import (
    IssueCommentActivityQuery,
    WorkItemPageQuery,
    WorkItemPageSearchQuery,
    WorkspaceWorkItemMentionQuery,
)
from .queries.workspace import (
    PublicWorkspaceInviteQuery,
    PublicWorkspaceInviteV2Query,
    WorkspaceFeatureQuery,
    WorkspaceInviteQuery,
    WorkspaceIssuesInformationQuery,
    WorkspaceIssuesQuery,
    WorkspaceLicenseQuery,
    WorkspaceMembersQuery,
    WorkspaceQuery,
    YourWorkQuery,
)


# combined query class for all
@strawberry.type
class Query(
    # instance
    InstanceQuery,
    # feature flag
    FeatureFlagQuery,
    # version check
    VersionCheckQuery,
    # external
    UnsplashImagesQuery,
    ProjectCoversQuery,
    # constants
    TimezoneListQuery,
    # asset
    WorkspaceAssetQuery,
    ProjectAssetQuery,
    # user
    UserQuery,
    ProfileQuery,
    YourWorkQuery,
    UserFavoritesQuery,
    UserRecentVisitQuery,
    userInformationQuery,
    UserDeleteQuery,
    # roles
    UserProjectRolesQuery,
    # notification
    NotificationQuery,
    NotificationCountQuery,
    # search
    GlobalSearchQuery,
    # workspace
    WorkspaceLicenseQuery,
    WorkspaceQuery,
    WorkspaceMembersQuery,
    WorkspaceInviteQuery,
    PublicWorkspaceInviteQuery,
    PublicWorkspaceInviteV2Query,
    WorkspaceFeatureQuery,
    # project
    ProjectQuery,
    ProjectMembersQuery,
    ProjectFeatureQuery,
    # workitem
    IssueShortenedMetaInfoQuery,
    WorkspaceIssuesInformationQuery,
    WorkspaceIssuesQuery,
    IssuesInformationQuery,
    IssueQuery,
    RecentIssuesQuery,
    IssueUserPropertyQuery,
    IssuePropertiesActivityQuery,
    IssueCommentActivityQuery,
    IssueLinkQuery,
    IssueAttachmentQuery,
    SubIssuesQuery,
    IssueRelationQuery,
    IssuesSearchQuery,
    WorkItemCommentReactionQuery,
    IssueStatsQuery,
    WorkspaceWorkItemMentionQuery,
    WorkItemPageQuery,
    WorkItemPageSearchQuery,
    # workitem type
    IssueTypesTypeQuery,
    # label
    WorkspaceLabelQuery,
    LabelQuery,
    # state
    WorkspaceStateQuery,
    StateQuery,
    TriageStateQuery,
    # estimate
    EstimatePointQuery,
    # cycle
    CycleQuery,
    CycleIssuesInformationQuery,
    CycleIssueQuery,
    CycleIssueUserPropertyQuery,
    # module
    ModuleQuery,
    ModuleIssuesInformationQuery,
    ModuleIssueQuery,
    ModuleIssueUserPropertyQuery,
    # page
    WorkspacePageQuery,
    WorkspaceNestedParentPagesQuery,
    WorkspaceNestedChildPagesQuery,
    UserPageQuery,
    PageQuery,
    NestedParentPagesQuery,
    NestedChildPagesQuery,
    ProjectPageCommentsQuery,
    WorkspacePageCommentsQuery,
    ProjectPageMentionQuery,
    WorkspacePageMentionQuery,
    # epics
    EpicUserPropertyQuery,
    EpicCountQuery,
    EpicQuery,
    EpicLinkQuery,
    EpicAttachmentQuery,
    EpicWorkItemsQuery,
    EpicRelationQuery,
    EpicActivityQuery,
    EpicCommentQuery,
    EpicCommentReactionQuery,
    EpicStatsQuery,
    EpicPageQuery,
    EpicPageSearchQuery,
    # sticky
    WorkspaceStickiesQuery,
    # teamspace
    TeamspaceMemberQuery,
    # intake
    IntakeCountQuery,
    IntakeWorkItemQuery,
    IntakeWorkItemActivityQuery,
    IntakeWorkItemCommentQuery,
    IntakeWorkItemCommentReactionQuery,
    IntakeWorkItemAttachmentQuery,
    IntakeSearchQuery,
    IntakeStatsQuery,
    # catch up
    CatchUpQuery,
):
    pass


# combined mutation class for all
@strawberry.type
class Mutation(
    # device
    DeviceInformationMutation,
    # asset
    WorkspaceAssetMutation,
    ProjectAssetMutation,
    # user
    UserMutation,
    ProfileMutation,
    UserFavoriteMutation,
    UserDeleteMutation,
    UserAssetMutation,
    # auth
    SetPasswordMutation,
    # notification
    NotificationMutation,
    # workspace
    WorkspaceMutation,
    WorkspaceInviteMutation,
    PublicWorkspaceInviteMutation,
    PublicWorkspaceInviteV2Mutation,
    # project
    ProjectMutation,
    ProjectInviteMutation,
    JoinProjectMutation,
    ProjectFavoriteMutation,
    # workitem
    IssueUserPropertyMutation,
    IssueMutationV2,
    IssueLinkMutation,
    IssueAttachmentMutation,
    IssueSubscriptionMutation,
    IssueRelationMutation,
    IssueCommentMutation,
    WorkItemCommentMutation,
    WorkItemCommentReplyMutation,
    SubIssueMutation,
    WorkItemCommentReactionMutation,
    WorkItemPageMutation,
    WorkItemMutation,
    WorkItemArchiveMutation,
    # workitem type
    # label
    # state
    # estimate
    # cycle
    CycleIssueUserPropertyMutation,
    CycleIssueMutation,
    IssueCycleMutation,
    CycleFavoriteMutation,
    # module
    ModuleIssueUserPropertyMutation,
    ModuleIssueMutation,
    IssueModuleMutation,
    ModuleFavoriteMutation,
    # page
    WorkspacePageMutation,
    PageMutation,
    PageFavoriteMutation,
    WorkspaceNestedChildArchivePageMutation,
    WorkspaceNestedChildRestorePageMutation,
    NestedChildArchivePageMutation,
    NestedChildRestorePageMutation,
    WorkspaceNestedChildDeletePageMutation,
    NestedChildDeletePageMutation,
    ProjectPageCommentsMutation,
    ProjectPageCommentReactionsMutation,
    WorkspacePageCommentsMutation,
    WorkspacePageCommentReactionsMutation,
    # epics
    EpicUserPropertyMutation,
    EpicMutation,
    EpicLinkMutation,
    EpicAttachmentMutation,
    EpicWorkItemsMutation,
    EpicRelationMutation,
    EpicCommentMutation,
    EpicCommentReplyMutation,
    EpicCommentReactionMutation,
    EpicPageMutation,
    # sticky
    WorkspaceStickiesMutation,
    # intake
    IntakeWorkItemMutation,
    IntakeWorkItemCommentMutation,
    IntakeWorkItemCommentReactionMutation,
    IntakeWorkItemCommentReplyMutation,
    IntakeWorkItemAttachmentMutation,
    IntakeWorkItemStatusMutation,
    # catch up
    CatchUpMarkAsReadMutation,
):
    pass


schema = strawberry.Schema(query=Query, mutation=Mutation, extensions=[DjangoOptimizerExtension])
