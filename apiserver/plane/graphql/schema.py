import strawberry
from strawberry_django.optimizer import DjangoOptimizerExtension

# queries
from .queries.workspace import (
    WorkspaceQuery,
    WorkspaceMembersQuery,
    WorkspaceIssuesInformationQuery,
    WorkspaceIssuesQuery,
    YourWorkQuery,
)
from .queries.users import UserQuery, UserFavoritesQuery, UserRecentVisitQuery
from .queries.users import ProfileQuery
from .queries.project import ProjectQuery, ProjectMembersQuery
from .queries.label import LabelQuery, WorkspaceLabelQuery
from .queries.state import StateQuery, WorkspaceStateQuery
from .queries.notification import NotificationQuery
from .queries.issue import (
    IssuesInformationQuery,
    IssueQuery,
    RecentIssuesQuery,
    IssueUserPropertyQuery,
    IssuePropertiesActivityQuery,
    IssueCommentActivityQuery,
    IssueTypesTypeQuery,
)
from .queries.page import PageQuery, UserPageQuery
from .queries.cycle import (
    CycleQuery,
    CycleIssuesInformationQuery,
    CycleIssueQuery,
    CycleIssueUserPropertyQuery,
)
from .queries.module import (
    ModuleQuery,
    ModuleIssuesInformationQuery,
    ModuleIssueQuery,
    ModuleIssueUserPropertyQuery,
)
from .queries.search import GlobalSearchQuery
from .queries.link import IssueLinkQuery
from .queries.estimate import EstimatePointQuery
from .queries.issues import (
    IssueRelationQuery,
    IssuesSearchQuery,
    SubIssuesQuery,
    IssueAttachmentQuery,
)
from .queries.dashboard import userInformationQuery
from .queries.external import UnsplashImagesQuery, ProjectCoversQuery
from .queries.version_check import VersionCheckQuery

# mutations
from .mutations.workspace import WorkspaceMutation, WorkspaceInviteMutation
from .mutations.project import (
    ProjectMutation,
    ProjectInviteMutation,
    ProjectFavoriteMutation,
)
from .mutations.issue import (
    IssueMutation,
    IssueUserPropertyMutation,
    IssueAttachmentMutation,
    IssueSubscriptionMutation,
)
from .mutations.notification import NotificationMutation
from .mutations.user import ProfileMutation
from .mutations.page import PageMutation, PageFavoriteMutation
from .mutations.cycle import (
    CycleIssueMutation,
    CycleFavoriteMutation,
    CycleIssueUserPropertyMutation,
)
from .mutations.module import (
    ModuleIssueMutation,
    ModuleFavoriteMutation,
    ModuleIssueUserPropertyMutation,
)
from .mutations.link import IssueLinkMutation
from .mutations.favorite import UserFavoriteMutation
from .mutations.issues import (
    IssueRelationMutation,
    IssueCommentMutation,
    SubIssueMutation,
)


# combined query class for all
@strawberry.type
class Query(
    WorkspaceQuery,
    WorkspaceMembersQuery,
    UserQuery,
    ProfileQuery,
    ProjectQuery,
    ProjectMembersQuery,
    IssueQuery,
    RecentIssuesQuery,
    LabelQuery,
    StateQuery,
    IssueUserPropertyQuery,
    NotificationQuery,
    IssuePropertiesActivityQuery,
    IssueCommentActivityQuery,
    WorkspaceIssuesQuery,
    PageQuery,
    WorkspaceLabelQuery,
    WorkspaceStateQuery,
    GlobalSearchQuery,
    IssueAttachmentQuery,
    CycleQuery,
    CycleIssueQuery,
    ModuleQuery,
    ModuleIssueQuery,
    YourWorkQuery,
    UserFavoritesQuery,
    UserRecentVisitQuery,
    IssueLinkQuery,
    IssuesInformationQuery,
    WorkspaceIssuesInformationQuery,
    CycleIssuesInformationQuery,
    ModuleIssuesInformationQuery,
    SubIssuesQuery,
    IssueTypesTypeQuery,
    EstimatePointQuery,
    UserPageQuery,
    CycleIssueUserPropertyQuery,
    ModuleIssueUserPropertyQuery,
    IssueRelationQuery,
    IssuesSearchQuery,
    userInformationQuery,
    UnsplashImagesQuery,
    ProjectCoversQuery,
    VersionCheckQuery,
):
    pass


# combined mutation class for all
@strawberry.type
class Mutation(
    WorkspaceMutation,
    WorkspaceInviteMutation,
    ProjectMutation,
    ProjectInviteMutation,
    IssueMutation,
    ProjectFavoriteMutation,
    IssueUserPropertyMutation,
    NotificationMutation,
    ProfileMutation,
    PageFavoriteMutation,
    IssueAttachmentMutation,
    CycleIssueMutation,
    ModuleIssueMutation,
    IssueLinkMutation,
    IssueSubscriptionMutation,
    CycleFavoriteMutation,
    ModuleFavoriteMutation,
    UserFavoriteMutation,
    CycleIssueUserPropertyMutation,
    ModuleIssueUserPropertyMutation,
    IssueRelationMutation,
    IssueCommentMutation,
    SubIssueMutation,
    PageMutation,
):
    pass


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    extensions=[DjangoOptimizerExtension],
)
