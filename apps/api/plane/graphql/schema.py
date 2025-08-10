import strawberry
from strawberry_django.optimizer import DjangoOptimizerExtension

# mutations
from .mutations.asset import (
    ProjectAssetMutation,
    UserAssetMutation,
    WorkspaceAssetMutation,
)
from .mutations.auth import SetPasswordMutation
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
    EpicLinkMutation,
    EpicMutation,
    EpicRelationMutation,
    EpicUserPropertyMutation,
    EpicWorkItemsMutation,
)
from .mutations.favorite import UserFavoriteMutation
from .mutations.intake import (
    IntakeWorkItemAttachmentMutation,
    IntakeWorkItemCommentMutation,
    IntakeWorkItemCommentReactionMutation,
    IntakeWorkItemMutation,
    IntakeWorkItemStatusMutation,
)
from .mutations.issue import (
    IssueMutation,
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
    WorkItemCommentReactionMutation,
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
    WorkspaceNestedChildArchivePageMutation,
    WorkspaceNestedChildDeletePageMutation,
    WorkspaceNestedChildRestorePageMutation,
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
    WorkspaceInviteMutation,
    WorkspaceMutation,
)

# queries
from .queries.asset import ProjectAssetQuery, WorkspaceAssetQuery
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
    EpicQuery,
    EpicRelationQuery,
    EpicUserPropertyQuery,
    EpicWorkItemsQuery,
)
from .queries.estimate import EstimatePointQuery
from .queries.external import ProjectCoversQuery, UnsplashImagesQuery
from .queries.feature_flag import FeatureFlagQuery
from .queries.instance import InstanceQuery
from .queries.intake import (
    IntakeCountQuery,
    IntakeWorkItemActivityQuery,
    IntakeWorkItemAttachmentQuery,
    IntakeWorkItemCommentQuery,
    IntakeWorkItemCommentReactionQuery,
    IntakeWorkItemQuery,
    IntakeSearchQuery,
)
from .queries.issue import (
    IssueCommentActivityQuery,
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
from .queries.notification import NotificationQuery
from .queries.page import (
    NestedChildPagesQuery,
    NestedParentPagesQuery,
    PageQuery,
    UserPageQuery,
    WorkspaceNestedChildPagesQuery,
    WorkspaceNestedParentPagesQuery,
    WorkspacePageQuery,
)
from .queries.project import ProjectFeatureQuery, ProjectMembersQuery, ProjectQuery
from .queries.roles import UserProjectRolesQuery
from .queries.search import GlobalSearchQuery
from .queries.state import StateQuery, WorkspaceStateQuery
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
from .queries.workspace import (
    PublicWorkspaceInviteQuery,
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
    # search
    GlobalSearchQuery,
    # workspace
    WorkspaceLicenseQuery,
    WorkspaceQuery,
    WorkspaceMembersQuery,
    WorkspaceInviteQuery,
    PublicWorkspaceInviteQuery,
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
    # workitem type
    IssueTypesTypeQuery,
    # label
    WorkspaceLabelQuery,
    LabelQuery,
    # state
    WorkspaceStateQuery,
    StateQuery,
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
    # project
    ProjectMutation,
    ProjectInviteMutation,
    JoinProjectMutation,
    ProjectFavoriteMutation,
    # workitem
    IssueUserPropertyMutation,
    IssueMutation,  # old
    IssueMutationV2,  # new
    IssueLinkMutation,
    IssueAttachmentMutation,
    IssueSubscriptionMutation,
    IssueRelationMutation,
    IssueCommentMutation,
    SubIssueMutation,
    WorkItemCommentReactionMutation,
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
    # epics
    EpicUserPropertyMutation,
    EpicMutation,
    EpicLinkMutation,
    EpicAttachmentMutation,
    EpicWorkItemsMutation,
    EpicRelationMutation,
    EpicCommentMutation,
    EpicCommentReactionMutation,
    # sticky
    WorkspaceStickiesMutation,
    # intake
    IntakeWorkItemMutation,
    IntakeWorkItemCommentMutation,
    IntakeWorkItemCommentReactionMutation,
    IntakeWorkItemAttachmentMutation,
    IntakeWorkItemStatusMutation,
):
    pass


schema = strawberry.Schema(
    query=Query, mutation=Mutation, extensions=[DjangoOptimizerExtension]
)
