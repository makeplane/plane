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

from plane.ee.views.app.ai import RephraseGrammarEndpoint
from plane.ee.views.app.cycle import WorkspaceActiveCycleEndpoint
from plane.ee.views.app.issue import (
    BulkIssueOperationsEndpoint,
    BulkArchiveIssuesEndpoint,
    BulkSubscribeIssuesEndpoint,
    IssueWorkLogsEndpoint,
    IssueTotalWorkLogEndpoint,
    IssueConvertEndpoint,
    IssueDuplicateEndpoint,
    IssuePageViewSet,
    PageSearchViewSet,
    RecurringWorkItemViewSet,
    SubWorkitemTemplateEndpoint,
    RecurringWorkItemActivitiesEndpoint,
)
from plane.ee.views.app.assets import DuplicateAssetEndpoint
from plane.ee.views.app.intake import ProjectInTakePublishViewSet
from plane.ee.views.app.intake.base import IntakeSettingEndpoint
from plane.ee.views.app.project import ProjectFeatureEndpoint
from plane.ee.views.app.initiative import (
    InitiativeEndpoint,
    InitiativeProjectEndpoint,
    InitiativeUpdateViewSet,
    InitiativeUpdateCommentsViewSet,
    InitiativeUpdatesReactionViewSet,
)

from plane.ee.views.app.webhook import InternalWebhookEndpoint
from plane.ee.views.app.epic import (
    EpicViewSet,
    EpicLinkViewSet,
    EpicArchiveViewSet,
    EpicCommentViewSet,
    EpicActivityEndpoint,
    EpicReactionViewSet,
    EpicDetailEndpoint,
)
from plane.ee.views.app.epic_property import (
    EpicPropertyEndpoint,
    EpicPropertyOptionEndpoint,
    EpicPropertyValueEndpoint,
    EpicPropertyActivityEndpoint,
    WorkspaceEpicTypeEndpoint,
    ProjectEpicTypeEndpoint,
)

from plane.ee.views.app.search import EnhancedGlobalSearchEndpoint

from plane.ee.views.app.dashboard import (
    DashboardViewSet,
    DashboardQuickFilterEndpoint,
    WidgetEndpoint,
    WidgetListEndpoint,
    BulkWidgetEndpoint,
)

from plane.ee.views.app.page import (
    WorkspacePageCommentViewSet,
    WorkspacePageCommentReactionViewSet,
    ProjectPageCommentViewSet,
    ProjectPageCommentReactionViewSet,
    WorkspacePageLiveServerEndpoint,
)

from plane.ee.views.app.milestone import (
    MilestoneViewSet,
    MilestoneWorkItemsEndpoint,
    MilestoneWorkItemsSearchEndpoint,
    WorkItemMilestoneEndpoint,
)

from plane.ee.views.app.importer import ProjectWorkItemImportEndpoint
