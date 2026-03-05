# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.workflow import (
    ProjectWorkflowViewSet,
    WorkflowStateConfigViewSet,
    WorkflowTransitionApproverViewSet,
    WorkflowTransitionViewSet,
)

urlpatterns = [
    # Project-scoped state configs (flat dict by state UUID)
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-states/",
        WorkflowStateConfigViewSet.as_view({"get": "list"}),
        name="workflow-state-configs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-states/<uuid:state_id>/",
        WorkflowStateConfigViewSet.as_view({"patch": "partial_update"}),
        name="workflow-state-config-detail",
    ),
    # Project workflow master toggle + reset + activity
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow/",
        ProjectWorkflowViewSet.as_view(),
        name="project-workflow",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow/reset/",
        ProjectWorkflowViewSet.as_view(),
        {"action": "reset"},
        name="project-workflow-reset",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow/activity/",
        ProjectWorkflowViewSet.as_view(),
        {"action": "activity"},
        name="project-workflow-activity",
    ),
    # Workflow transitions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-transitions/",
        WorkflowTransitionViewSet.as_view({"post": "create"}),
        name="workflow-transitions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-transitions/<uuid:pk>/",
        WorkflowTransitionViewSet.as_view({"delete": "destroy"}),
        name="workflow-transition-detail",
    ),
    # Workflow transition approvers
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-transitions/<uuid:transition_id>/approvers/",
        WorkflowTransitionApproverViewSet.as_view({"post": "create"}),
        name="workflow-transition-approvers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-transitions/<uuid:transition_id>/approvers/<uuid:pk>/",
        WorkflowTransitionApproverViewSet.as_view({"delete": "destroy"}),
        name="workflow-transition-approver-detail",
    ),
]
