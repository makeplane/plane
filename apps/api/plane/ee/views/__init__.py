# Api imports
from plane.ee.views.api import (
    IssuePropertyListCreateAPIEndpoint,
    IssuePropertyDetailAPIEndpoint,
    IssuePropertyOptionListCreateAPIEndpoint,
    IssuePropertyOptionDetailAPIEndpoint,
    IssuePropertyValueAPIEndpoint,
)

# App imports
from plane.ee.views.app.project import (
    ProjectLinkViewSet,
    ProjectAnalyticsEndpoint,
    ProjectAttributesEndpoint,
    ProjectUpdatesViewSet,
    ProjectAttachmentV2Endpoint,
    ProjectReactionViewSet,
    ProjectActivityEndpoint,
)
from plane.ee.views.app.update import UpdatesReactionViewSet

from plane.ee.views.app.ai import RephraseGrammarEndpoint
from plane.ee.views.app.cycle import WorkspaceActiveCycleEndpoint
from plane.ee.views.app.issue import (
    BulkIssueOperationsEndpoint,
    BulkArchiveIssuesEndpoint,
    BulkSubscribeIssuesEndpoint,
    IssueWorkLogsEndpoint,
    IssueTotalWorkLogEndpoint,
)
from plane.ee.views.app.page import (
    ProjectPagePublishEndpoint,
    WorkspacePagePublishEndpoint,
    WorkspacePageViewSet,
    WorkspacePagesDescriptionViewSet,
    WorkspacePageVersionEndpoint,
    WorkspacePageFavoriteEndpoint,
    WorkspacePageDuplicateEndpoint,
    MovePageEndpoint,
    WorkspacePageRestoreEndpoint,
    WorkspacePageUserViewSet,
)
from plane.ee.views.app.views import (
    IssueViewEEViewSet,
    WorkspaceViewEEViewSet,
    IssueViewsPublishEndpoint,
)
from plane.ee.views.app.workspace import (
    WorkspaceWorkLogsEndpoint,
    WorkspaceExportWorkLogsEndpoint,
    WorkspaceFeaturesEndpoint,
    WorkspaceProjectStatesEndpoint,
    WorkspaceProjectStatesDefaultEndpoint,
    WorkspaceInviteCheckEndpoint,
)
from plane.ee.views.app.webhook import InternalWebhookEndpoint
from plane.ee.views.app.project import (
    WorkspaceProjectFeatureEndpoint,
    ProjectFeatureEndpoint,
)

from plane.ee.views.app.customer import CustomerPropertyEndpoint
from plane.ee.views.app.issue_property import IssuePropertyEndpoint
from plane.ee.views.app.intake import IntakeSettingEndpoint
from plane.ee.views.app.epic import EpicViewSet, EpicLinkViewSet
from plane.ee.views.app.inbox import InboxViewSet
from plane.ee.views.app.dashboard import DashboardViewSet, DashboardQuickFilterEndpoint

# Space imports
from plane.ee.views.space.page import (
    PagePublicEndpoint,
    SubPagePublicEndpoint,
    PagePublicIssuesEndpoint,
    PageMetaDataEndpoint,
)
from plane.ee.views.space.views import (
    ViewsPublicEndpoint,
    IssueViewsPublicEndpoint,
    ViewsMetaDataEndpoint,
)
from plane.ee.views.space.intake import (
    IntakePublishedIssueEndpoint,
    IntakeMetaPublishedIssueEndpoint,
)

# workspace connection views
from plane.ee.views.app.workspace.credential import (
    WorkspaceCredentialView,
    VerifyWorkspaceCredentialView,
)
from plane.ee.views.app.workspace.connection import (
    WorkspaceConnectionView,
    WorkspaceUserConnectionView,
)
from plane.ee.views.app.workspace.entity_connection import WorkspaceEntityConnectionView
from plane.ee.views.app.workspace.issue import (
    WorkspaceIssueDetailEndpoint,
    WorkspaceIssueBulkUpdateDateEndpoint,
)

from plane.ee.views.api.workspace.credential import (
    WorkspaceCredentialAPIView,
    VerifyWorkspaceCredentialAPIView,
)
from plane.ee.views.api.workspace.connection import (
    WorkspaceConnectionAPIView,
    WorkspaceUserConnectionAPIView,
)
from plane.ee.views.api.workspace.entity_connection import (
    WorkspaceEntityConnectionAPIView,
)

# jobs views
from plane.ee.views.app.job.base import ImportJobView
from plane.ee.views.app.job.report import ImportReportView

from plane.ee.views.api.job.base import ImportJobAPIView
from plane.ee.views.api.job.report import ImportReportAPIView
from plane.ee.views.api.job.report import ImportReportCountIncrementAPIView

from plane.ee.views.api.worklog import (
    IssueWorklogAPIEndpoint,
    ProjectWorklogAPIEndpoint,
)

from plane.ee.views.app.page.live import (
    PagesLiveServerDescriptionViewSet,
    PagesLiveServerSubPagesViewSet,
)

from plane.ee.views.app.search.base import EnhancedGlobalSearchEndpoint

from plane.ee.views.app.workspace.asset import WorkspaceBulkAssetEndpoint


# mobile views and endpoints
from plane.ee.views.app.mobile import MobileWorkspaceInvitationEndpoint
