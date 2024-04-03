from .project.base import (
    ProjectViewSet,
    ProjectIdentifierEndpoint,
    ProjectUserViewsEndpoint,
    ProjectFavoritesViewSet,
    ProjectPublicCoverImagesEndpoint,
    ProjectDeployBoardViewSet,
    ProjectArchiveUnarchiveEndpoint,
)

from .project.invite import (
    UserProjectInvitationsViewset,
    ProjectInvitationsViewset,
    ProjectJoinEndpoint,
)

from .project.member import (
    ProjectMemberViewSet,
    AddTeamToProjectEndpoint,
    ProjectMemberUserEndpoint,
    UserProjectRolesEndpoint,
)

from .user.base import (
    UserEndpoint,
    UpdateUserOnBoardedEndpoint,
    UpdateUserTourCompletedEndpoint,
    UserActivityEndpoint,
)

from .oauth import OauthEndpoint

from .base import BaseAPIView, BaseViewSet, WebhookMixin

from .workspace.base import (
    WorkSpaceViewSet,
    UserWorkSpacesEndpoint,
    WorkSpaceAvailabilityCheckEndpoint,
    UserWorkspaceDashboardEndpoint,
    WorkspaceThemeViewSet,
    ExportWorkspaceUserActivityEndpoint
)

from .workspace.member import (
    WorkSpaceMemberViewSet,
    TeamMemberViewSet,
    WorkspaceMemberUserEndpoint,
    WorkspaceProjectMemberEndpoint,
    WorkspaceMemberUserViewsEndpoint,
)
from .workspace.invite import (
    WorkspaceInvitationsViewset,
    WorkspaceJoinEndpoint,
    UserWorkspaceInvitationsViewSet,
)
from .workspace.label import (
    WorkspaceLabelsEndpoint,
)
from .workspace.state import (
    WorkspaceStatesEndpoint,
)
from .workspace.user import (
    UserLastProjectWithWorkspaceEndpoint,
    WorkspaceUserProfileIssuesEndpoint,
    WorkspaceUserPropertiesEndpoint,
    WorkspaceUserProfileEndpoint,
    WorkspaceUserActivityEndpoint,
    WorkspaceUserProfileStatsEndpoint,
    UserActivityGraphEndpoint,
    UserIssueCompletedGraphEndpoint,
)
from .workspace.estimate import (
    WorkspaceEstimatesEndpoint,
)
from .workspace.module import (
    WorkspaceModulesEndpoint,
)
from .workspace.cycle import (
    WorkspaceCyclesEndpoint,
)

from .state.base import StateViewSet
from .view.base import (
    GlobalViewViewSet,
    GlobalViewIssuesViewSet,
    IssueViewViewSet,
    IssueViewFavoriteViewSet,
)
from .cycle.base import (
    CycleViewSet,
    CycleDateCheckEndpoint,
    CycleFavoriteViewSet,
    TransferCycleIssueEndpoint,
    CycleArchiveUnarchiveEndpoint,
    CycleUserPropertiesEndpoint,
)
from .cycle.issue import (
    CycleIssueViewSet,
)

from .asset.base import FileAssetEndpoint, UserAssetsEndpoint, FileAssetViewSet
from .issue.base import (
    IssueListEndpoint,
    IssueViewSet,
    IssueUserDisplayPropertyEndpoint,
    BulkDeleteIssuesEndpoint,
)

from .issue.activity import (
    IssueActivityEndpoint,
)

from .issue.archive import (
    IssueArchiveViewSet,
)

from .issue.attachment import (
    IssueAttachmentEndpoint,
)

from .issue.comment import (
    IssueCommentViewSet,
    CommentReactionViewSet,
)

from .issue.draft import IssueDraftViewSet

from .issue.label import (
    LabelViewSet,
    BulkCreateIssueLabelsEndpoint,
)

from .issue.link import (
    IssueLinkViewSet,
)

from .issue.relation import (
    IssueRelationViewSet,
)

from .issue.reaction import (
    IssueReactionViewSet,
)

from .issue.sub_issue import (
    SubIssuesEndpoint,
)

from .issue.subscriber import (
    IssueSubscriberViewSet,
)

from .auth_extended import (
    ForgotPasswordEndpoint,
    ResetPasswordEndpoint,
    ChangePasswordEndpoint,
    SetUserPasswordEndpoint,
    EmailCheckEndpoint,
    MagicGenerateEndpoint,
)


from .authentication import (
    SignInEndpoint,
    SignOutEndpoint,
    MagicSignInEndpoint,
)

from .module.base import (
    ModuleViewSet,
    ModuleLinkViewSet,
    ModuleFavoriteViewSet,
    ModuleArchiveUnarchiveEndpoint,
    ModuleUserPropertiesEndpoint,
)

from .module.issue import (
    ModuleIssueViewSet,
)

from .api import ApiTokenEndpoint


from .page.base import (
    PageViewSet,
    PageFavoriteViewSet,
    PageLogEndpoint,
    SubPagesEndpoint,
)

from .search import GlobalSearchEndpoint, IssueSearchEndpoint


from .external.base import (
    GPTIntegrationEndpoint,
    UnsplashEndpoint,
)

from .estimate.base import (
    ProjectEstimatePointEndpoint,
    BulkEstimatePointEndpoint,
)

from .inbox.base import InboxViewSet, InboxIssueViewSet

from .analytic.base import (
    AnalyticsEndpoint,
    AnalyticViewViewset,
    SavedAnalyticEndpoint,
    ExportAnalyticsEndpoint,
    DefaultAnalyticsEndpoint,
)

from .notification.base import (
    NotificationViewSet,
    UnreadNotificationEndpoint,
    MarkAllReadNotificationViewSet,
    UserNotificationPreferenceEndpoint,
)

from .exporter.base import ExportIssuesEndpoint

from .config import ConfigurationEndpoint, MobileConfigurationEndpoint

from .webhook.base import (
    WebhookEndpoint,
    WebhookLogsEndpoint,
    WebhookSecretRegenerateEndpoint,
)

from .dashboard.base import DashboardEndpoint, WidgetsEndpoint

from .error_404 import custom_404_view
