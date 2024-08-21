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
)
from .queries.page import PageQuery
from .queries.cycle import (
    CycleQuery,
    CycleIssuesInformationQuery,
    CycleIssueQuery,
)
from .queries.module import (
    ModuleQuery,
    ModuleIssuesInformationQuery,
    ModuleIssueQuery,
)
from .queries.search import ProjectSearchQuery
from .queries.attachment import IssueAttachmentQuery
from .queries.link import IssueLinkQuery

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
)
from .mutations.notification import NotificationMutation
from .mutations.user import ProfileMutation
from .mutations.page import PageFavoriteMutation
from .mutations.cycle import CycleIssueMutation
from .mutations.module import ModuleIssueMutation


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
    ProjectSearchQuery,
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
):
    pass


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    extensions=[DjangoOptimizerExtension],
)
