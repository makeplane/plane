# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.issue_property import (
    WorkspaceIssueTypeEndpoint,
    IssueTypeEndpoint,
    DefaultIssueTypeEndpoint,
)

urlpatterns = [
    # Issue types
    path(
        "workspaces/<str:slug>/issue-types/",
        WorkspaceIssueTypeEndpoint.as_view(),
        name="workspace-issue-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/",
        IssueTypeEndpoint.as_view(),
        name="issue-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:pk>/",
        IssueTypeEndpoint.as_view(),
        name="issue-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/default-issue-types/",
        DefaultIssueTypeEndpoint.as_view(),
        name="default-issue-types",
    ),
]
