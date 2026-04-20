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

from django.urls import path

from plane.api.views.workflow import (
    WorkflowListCreateAPIEndpoint,
    WorkflowDetailAPIEndpoint,
    WorkflowStatesAPIEndpoint,
    WorkflowStateTransitionsAPIEndpoint,
    WorkflowStateTransferAPIEndpoint,
    WorkflowWorkItemApproverAPIEndpoint,
    WorkflowActivityAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/",
        WorkflowListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:pk>/",
        WorkflowDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="project-workflow-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/states/",
        WorkflowStatesAPIEndpoint.as_view(http_method_names=["post"]),
        name="project-workflow-states",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/states/<uuid:state_id>/",
        WorkflowStatesAPIEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="project-workflow-state-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/states/<uuid:state_id>/transfer/",
        WorkflowStateTransferAPIEndpoint.as_view(http_method_names=["post"]),
        name="project-workflow-state-transfer",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/state-transitions/",
        WorkflowStateTransitionsAPIEndpoint.as_view(http_method_names=["post"]),
        name="project-workflow-state-transitions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/state-transitions/<uuid:transition_id>/",
        WorkflowStateTransitionsAPIEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="project-workflow-state-transition-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:work_item_id>/workflow-approval/",
        WorkflowWorkItemApproverAPIEndpoint.as_view(http_method_names=["post"]),
        name="project-work-item-workflow-approval",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/activities/",
        WorkflowActivityAPIEndpoint.as_view(http_method_names=["get"]),
        name="project-workflow-activities",
    ),
]
