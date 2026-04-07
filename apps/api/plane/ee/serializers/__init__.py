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

from plane.app.serializers import BaseSerializer, ProjectLiteSerializer, IssueSerializer

from .app.issue import IssueLiteSerializer, WorkItemPageSerializer
from .app.active_cycle import WorkspaceActiveCycleSerializer
from .app.page import (
    PageCommentSerializer,
    WorkspacePageSerializer,
    WorkspacePageLiteSerializer,
    PageCommentReactionSerializer,
    WorkspacePageDetailSerializer,
    WorkspacePageVersionSerializer,
    WorkspacePageVersionDetailSerializer,
)
from .app.update import UpdatesSerializer, UpdateReactionSerializer
from .app.issue_property import (
    IssueTypeSerializer,
    IssuePropertySerializer,
    IssuePropertyOptionSerializer,
    IssuePropertyActivitySerializer,
    WorkspaceWorkItemTypeSerializer,
)

from .app.customer import (
    CustomerSerializer,
    CustomerPropertySerializer,
    CustomerPropertyOptionSerializer,
    CustomerRequestSerializer,
    CustomerRequestAttachmentV2Serializer,
)
from .app.worklog import IssueWorkLogSerializer
from .app.exporter import ExporterHistorySerializer

from .app.workspace.feature import WorkspaceFeatureSerializer
from .app.workspace.project_state import ProjectStateSerializer
from .app.project import (
    ProjectLinkSerializer,
    ProjectAttachmentSerializer,
    ProjectReactionSerializer,
    ProjectFeatureSerializer,
    ProjectActivitySerializer,
    ProjectMemberActivitySerializer,
)

from .app.initiative import (
    InitiativeSerializer,
    InitiativeProjectSerializer,
    InitiativeLinkSerializer,
    InitiativeCommentSerializer,
    InitiativeAttachmentSerializer,
    IssueReactionSerializer,
    InitiativeCommentReactionSerializer,
    InitiativeReactionSerializer,
    InitiativeActivitySerializer,
    InitiativeEpicSerializer,
    InitiativeLabelSerializer,
    InitiativeWriteSerializer,
)

from .app.teamspace import (
    TeamspaceSerializer,
    TeamspaceMemberSerializer,
    TeamspaceCommentSerializer,
    TeamspaceViewSerializer,
    TeamspacePageSerializer,
    TeamspacePageDetailSerializer,
    TeamspacePageVersionSerializer,
    TeamspacePageVersionDetailSerializer,
    TeamspaceCommentReactionSerializer,
    TeamspaceUserPropertySerializer,
    TeamspaceActivitySerializer,
    TeamspacePageLiteSerializer,
)

from .app.epic import (
    EpicSerializer,
    EpicDetailSerializer,
    EpicCreateSerializer,
    EpicLinkSerializer,
    EpicCommentSerializer,
    EpicAttachmentSerializer,
    EpicActivitySerializer,
    EpicTypeSerializer,
    EpicUserPropertySerializer,
    EpicReactionSerializer,
    EpicSubscriberSerializer,
)

from .app.workflow import (
    WorkflowSerializer,
    WorkflowStateSerializer,
    WorkflowTransitionSerializer,
    WorkflowTransitionActorSerializer,
    WorkflowTransitionActivitySerializer,
)
from .app.dashboard import (
    DashboardSerializer,
    DashboardQuickFilterSerializer,
    WidgetSerializer,
)

from .app.template import (
    TemplateSerializer,
    WorkitemTemplateSerializer,
    TemplateDataSerializer,
    PageTemplateSerializer,
    ProjectTemplateSerializer,
)

from .app.automation import (
    AutomationWriteSerializer,
    AutomationReadSerializer,
    AutomationNodeReadSerializer,
    AutomationNodeWriteSerializer,
    AutomationEdgeWriteSerializer,
    AutomationEdgeReadSerializer,
    AutomationRunReadSerializer,
    AutomationDetailReadSerializer,
    AutomationActivityReadSerializer,
)

from .app.recurring_work_item import (
    RecurringWorkItemSerializer,
    RecurringWorkItemTaskActivitySerializer,
)

from .app.description import DescriptionSerializer

from .app.intake import (
    IntakeSettingSerializer,
    IntakeResponsibilitySerializer,
)

# Space imports
from .space.page import (
    PagePublicSerializer,
    PagePublicMetaSerializer,
    SubPagePublicSerializer,
)
from .space.views import ViewsPublicSerializer, ViewsPublicMetaSerializer
from .space.issue import IssueCreateSerializer
from .space.extended.issue import ExtendedIssueCreateSerializer as IssueCreateSerializer  # noqa: F811
from .space.intake_form import (
    IntakeFormSettingsSerializer,
    IntakeFormFieldSerializer,
    IntakeWorkItemTypeFormCreateSerializer,
)


# job
from .app.job import ImportReportSerializer, ImportJobSerializer

# app
from .app.workspace.credential import WorkspaceCredentialSerializer
from .app.workspace.connection import WorkspaceConnectionSerializer
from .app.workspace.entity_connection import WorkspaceEntityConnectionSerializer
from .app.cycle_schedule import AutomatedCycleSerializer

# api

from .app.workspace.workspace_member import WorkspaceMemberActivitySerializer

from .app.collection import (
    CollectionSerializer,
    CollectionMemberSerializer,
    PageCollectionSerializer,
)

# mobile app endpoints serializers
from .app.mobile import (
    MobileWorkspaceLiteSerializer,
    MobileInvitationDetailsSerializer,
)
