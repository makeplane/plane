# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    IssueWorkflowStatusEndpoint,
    IssueWorkflowTransitionEndpoint,
    ProjectWorkflowEnableEndpoint,
    ProjectWorkflowStatesEndpoint,
    WorkflowApprovalActionEndpoint,
    WorkflowBulkConfigEndpoint,
    WorkflowHistoryEndpoint,
    WorkflowViewSet,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/",
        WorkflowViewSet.as_view({"get": "list", "post": "create"}),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:pk>/",
        WorkflowViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-workflow",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:pk>/toggle-pause/",
        WorkflowViewSet.as_view({"post": "toggle_pause"}),
        name="project-workflow-toggle-pause",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/configure/",
        WorkflowBulkConfigEndpoint.as_view(),
        name="project-workflow-configure",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/history/",
        WorkflowHistoryEndpoint.as_view(),
        name="project-workflow-history",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-states/",
        ProjectWorkflowStatesEndpoint.as_view(),
        name="project-workflow-states",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-enabled/",
        ProjectWorkflowEnableEndpoint.as_view(),
        name="project-workflow-enabled",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/workflow-status/",
        IssueWorkflowStatusEndpoint.as_view(),
        name="issue-workflow-status",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/workflow-transition/",
        IssueWorkflowTransitionEndpoint.as_view(),
        name="issue-workflow-transition",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/approvals/<uuid:approval_id>/<str:action>/",
        WorkflowApprovalActionEndpoint.as_view(),
        name="issue-workflow-approval-action",
    ),
]
