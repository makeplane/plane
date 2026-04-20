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

# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.workflow import (
    WorkflowEndpoint,
    WorkflowStatesEndpoint,
    WorkflowActivityEndpoint,
    WorkspaceWorkflowEndpoint,
    DefaultWorkflowEndpoint,
    WorkflowStateTransitionsEndpoint,
    WorkflowWorkItemApproverEndpoint,
    WorkflowStateTransferEndpoint,
    WorkflowWorkItemTypeWorkItemsCheckEndpoint,
    WorkflowDefaultStateEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/workflows/",
        WorkspaceWorkflowEndpoint.as_view(),
        name="workspace-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/",
        WorkflowEndpoint.as_view(),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/default-workflow/",
        DefaultWorkflowEndpoint.as_view(),
        name="project-default-workflow",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:pk>/",
        WorkflowEndpoint.as_view(),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/work-item-type-check/",
        WorkflowWorkItemTypeWorkItemsCheckEndpoint.as_view(),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/states/",
        WorkflowStatesEndpoint.as_view(),
        name="project-workflow-states",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/states/<uuid:state_id>/",
        WorkflowStatesEndpoint.as_view(),
        name="project-workflow-states",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/states/<uuid:state_id>/mark-default/",
        WorkflowDefaultStateEndpoint.as_view(),
        name="project-workflow-state-mark-default",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/states/<uuid:state_id>/transfer/",
        WorkflowStateTransferEndpoint.as_view(),
        name="project-workflow-state-transfer",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/state-transitions/",
        WorkflowStateTransitionsEndpoint.as_view(),
        name="project-workflow-state-transitions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/state-transitions/<uuid:transition_id>/",
        WorkflowStateTransitionsEndpoint.as_view(),
        name="project-workflow-state-transition",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:work_item_id>/workflow-approval/",
        WorkflowWorkItemApproverEndpoint.as_view(),
        name="project-work-item-approvers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/activities/",
        WorkflowActivityEndpoint.as_view(),
        name="workflow-activity",
    ),
]
