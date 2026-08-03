# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    GitLabWebhookEndpoint,
    IssueGitLabMetaEndpoint,
    ProjectGitLabConfigEndpoint,
)

urlpatterns = [
    path(
        "hooks/gitlab/<str:slug>/",
        GitLabWebhookEndpoint.as_view(),
        name="gitlab-webhook",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/gitlab-config/",
        ProjectGitLabConfigEndpoint.as_view(),
        name="project-gitlab-config",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/gitlab/",
        IssueGitLabMetaEndpoint.as_view(),
        name="issue-gitlab-meta",
    ),
]
