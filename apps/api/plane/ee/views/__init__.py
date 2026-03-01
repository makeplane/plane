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
    ProjectPageUserViewSet,
    WorkspacePageRestoreEndpoint,
    WorkspacePageUserViewSet,
    WorkspacePageCommentViewSet,
    WorkspacePageCommentReactionViewSet,
    ProjectPageCommentViewSet,
    ProjectPageCommentReactionViewSet,
    ProjectPageRestoreEndpoint,
    WorkspacePageExportViewSet,
    ProjectPageExportViewSet,
    PageExtendedViewSet,
    PageFavoriteExtendedViewSet,
    PagesDescriptionExtendedViewSet,
    PageDuplicateExtendedEndpoint,
    PageVersionExtendedEndpoint,
    WorkspacePageLiveServerEndpoint,
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
    WorkspaceMembersImportEndpoint,
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
    PagePublicMentionEndpoint,
    PagePublicEmbedEndpoint,
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
from plane.ee.views.space.intake_form import (
    IntakeFormSettingsEndpoint,
    IntakeFormCreateWorkItemEndpoint,
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
    WorkspaceIssueRetrieveEndpoint,
    WorkspaceIssueBulkUpdateDateEndpoint,
)

# jobs views
from plane.ee.views.app.job.base import ImportJobView
from plane.ee.views.app.job.report import ImportReportView


from plane.ee.views.app.page.live import (
    PagesLiveServerDescriptionViewSet,
    PagesLiveServerSubPagesViewSet,
)
from plane.ee.views.app.page.move import MovePageEndpoint
from plane.ee.views.app.page.entities import PageEmbedEndpoint, PageMentionEndpoint, PageFetchMetadataEndpoint

from plane.ee.views.app.search.base import EnhancedGlobalSearchEndpoint

from plane.ee.views.app.workspace.asset import WorkspaceBulkAssetEndpoint


# mobile views and endpoints
from plane.ee.views.app.mobile import MobileWorkspaceInvitationEndpoint
