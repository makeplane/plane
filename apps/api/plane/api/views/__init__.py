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

from .asset import (
    UserAssetEndpoint,
    UserServerAssetEndpoint,
    GenericAssetEndpoint,
)

from .customer import (
    CustomerAPIEndpoint,
    CustomerDetailAPIEndpoint,
    CustomerRequestAPIEndpoint,
    CustomerRequestDetailAPIEndpoint,
    CustomerIssuesAPIEndpoint,
    CustomerIssueDetailAPIEndpoint,
    CustomerPropertiesAPIEndpoint,
    CustomerPropertyDetailAPIEndpoint,
    CustomerPropertyValuesAPIEndpoint,
    CustomerPropertyValueDetailAPIEndpoint,
)

from .cycle import (
    CycleListCreateAPIEndpoint,
    CycleDetailAPIEndpoint,
    CycleIssueListCreateAPIEndpoint,
    CycleIssueDetailAPIEndpoint,
    TransferCycleIssueAPIEndpoint,
    CycleArchiveUnarchiveAPIEndpoint,
)

from .epic import EpicListCreateAPIEndpoint, EpicDetailAPIEndpoint, EpicIssuesAPIEndpoint

from .intake import (
    IntakeIssueListCreateAPIEndpoint,
    IntakeIssueDetailAPIEndpoint,
)

from .invite import WorkspaceInvitationsViewset

from .initiative import InitiativeViewSet, InitiativeLabelViewSet, InitiativeEpicsViewSet, InitiativeProjectsViewSet

from .issue import (
    WorkspaceIssueAPIEndpoint,
    IssueAttachmentServerEndpoint,
    IssueListCreateAPIEndpoint,
    IssueDetailAPIEndpoint,
    LabelListCreateAPIEndpoint,
    LabelDetailAPIEndpoint,
    IssueLinkListCreateAPIEndpoint,
    IssueLinkDetailAPIEndpoint,
    IssueCommentListCreateAPIEndpoint,
    IssueCommentDetailAPIEndpoint,
    IssueActivityListAPIEndpoint,
    IssueActivityDetailAPIEndpoint,
    IssueAttachmentListCreateAPIEndpoint,
    IssueAttachmentDetailAPIEndpoint,
    IssueRelationListCreateAPIEndpoint,
    IssueRelationRemoveAPIEndpoint,
    IssueSearchEndpoint,
    IssueVoteAPIEndpoint,
)

from .issue_type import IssueTypeListCreateAPIEndpoint, IssueTypeDetailAPIEndpoint

from .workspace_work_item_type import (
    WorkspaceWorkItemTypeListCreateAPIEndpoint,
    WorkspaceWorkItemTypeDetailAPIEndpoint,
    WorkspaceWorkItemTypeImportAPIEndpoint,
    WorkspaceWorkItemTypePropertyListCreateAPIEndpoint,
    WorkspaceWorkItemTypePropertyDetailAPIEndpoint,
)

from .workspace_work_item_properties import (
    WorkspaceWorkItemPropertyListCreateAPIEndpoint,
    WorkspaceWorkItemPropertyDetailAPIEndpoint,
)

from .workspace_work_item_property_option import (
    WorkspaceWorkItemPropertyOptionListCreateAPIEndpoint,
    WorkspaceWorkItemPropertyOptionDetailAPIEndpoint,
)

from .member import (
    ProjectMemberListCreateAPIEndpoint,
    ProjectMemberDetailAPIEndpoint,
    WorkspaceMemberAPIEndpoint,
    ProjectMemberSiloEndpoint,
    WorkspaceMemberRemoveEndpoint,
)

from .milestone import MilestoneViewSet, MilestoneWorkItemsViewSet

from .module import (
    ModuleListCreateAPIEndpoint,
    ModuleDetailAPIEndpoint,
    ModuleIssueListCreateAPIEndpoint,
    ModuleIssueDetailAPIEndpoint,
    ModuleArchiveUnarchiveAPIEndpoint,
)

from .release import (
    ReleaseViewSet,
    ReleaseTagViewSet,
    ReleaseLabelViewSet,
    ReleaseWorkItemsViewSet,
    ReleaseCommentViewSet,
    ReleaseLinkViewSet,
)

from .project import (
    ProjectListCreateAPIEndpoint,
    ProjectDetailAPIEndpoint,
    ProjectArchiveUnarchiveAPIEndpoint,
    ProjectFeatureAPIEndpoint,
    ProjectSummaryAPIEndpoint,
)

from .project_page import (
    ProjectPageDetailAPIEndpoint,
    ProjectPageAPIEndpoint,
    PublishedPageDetailAPIEndpoint,
)

from .state import (
    StateListCreateAPIEndpoint,
    StateDetailAPIEndpoint,
)

from .sticky import StickyViewSet

from .teamspace import TeamspaceViewSet, TeamspaceProjectViewSet, TeamspaceMemberViewSet

from .user import UserEndpoint

from .worklog import (
    WorkItemWorklogEndpoint,
    ProjectWorklogAPIEndpoint,
)

from .work_item_property import (
    IssuePropertyListCreateAPIEndpoint,
    IssuePropertyDetailAPIEndpoint,
)

from .work_item_property_option import (
    IssuePropertyOptionListCreateAPIEndpoint,
    IssuePropertyOptionDetailAPIEndpoint,
)

from .work_item_property_value import (
    IssuePropertyValueAPIEndpoint,
    IssuePropertyValueListAPIEndpoint,
    WorkItemPropertyValueAPIEndpoint,
)

from .work_item_search import WorkItemAdvancedSearchEndpoint

from .work_item_properties import WorkItemPropertiesAPIEndpoint

from .workspace import (
    WorkspaceFeatureAPIEndpoint,
)

from .project_label import (
    ProjectLabelListCreateAPIEndpoint,
    ProjectLabelDetailAPIEndpoint,
)

from .workspace_page import (
    WorkspacePageDetailAPIEndpoint,
    WorkspacePageAPIEndpoint,
)

from .work_item_page import (
    WorkItemPageListCreateAPIEndpoint,
    WorkItemPageDetailAPIEndpoint,
)

from .work_item_type_schema import WorkItemTypeSchemaAPIEndpoint

from .work_item_type_create import WorkItemCreateAPIEndpoint

from .workflow import (
    WorkflowListCreateAPIEndpoint,
    WorkflowDetailAPIEndpoint,
    WorkflowStatesAPIEndpoint,
    WorkflowStateTransitionsAPIEndpoint,
    WorkflowStateTransferAPIEndpoint,
    WorkflowWorkItemApproverAPIEndpoint,
    WorkflowActivityAPIEndpoint,
)
