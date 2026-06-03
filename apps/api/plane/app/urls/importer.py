# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    JiraConnectEndpoint,
    JiraBoardsEndpoint,
    JiraMetadataEndpoint,
    ImportJobEndpoint,
    ImportJobReRunEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/jira-import/test-connection/",
        JiraConnectEndpoint.as_view(),
        name="jira-test-connection",
    ),
    path(
        "workspaces/<str:slug>/jira-import/boards/",
        JiraBoardsEndpoint.as_view(),
        name="jira-boards",
    ),
    path(
        "workspaces/<str:slug>/jira-import/metadata/",
        JiraMetadataEndpoint.as_view(),
        name="jira-metadata",
    ),
    path(
        "workspaces/<str:slug>/jira-import/",
        ImportJobEndpoint.as_view(),
        name="import-jobs",
    ),
    path(
        "workspaces/<str:slug>/jira-import/<uuid:pk>/re-run/",
        ImportJobReRunEndpoint.as_view(),
        name="import-job-rerun",
    ),
]
