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


from plane.app.views import (
    WorkspaceIntegrationViewSet,
    SlackProjectSyncViewSet,
)


urlpatterns = [
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "integrations/",
    #     IntegrationViewSet.as_view({"get": "list", "post": "create"}),
    #     name="integrations",
    # ),
    # path(
    #     "integrations/<uuid:pk>/",
    #     IntegrationViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
    #     name="integrations",
    # ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/workspace-integrations/",
    #     WorkspaceIntegrationViewSet.as_view({"get": "list"}),
    #     name="workspace-integrations",
    # ),
    path(
        "workspaces/<str:slug>/workspace-integrations/<str:provider>/",
        WorkspaceIntegrationViewSet.as_view({"post": "create"}),
        name="workspace-integrations",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/workspace-integrations/<uuid:pk>/provider/",
    #     WorkspaceIntegrationViewSet.as_view({"get": "retrieve", "delete": "destroy"}),
    #     name="workspace-integrations",
    # ),
    # TODO: Unused endpoints — not called by FE. Migrate to @can before re-enabling.
    # SECURITY: BulkCreateGithubIssueSyncEndpoint has no permission_classes (only IsAuthenticated).
    # Github Integrations
    # path(
    #     "workspaces/<str:slug>/workspace-integrations/<uuid:workspace_integration_id>/github-repositories/",
    #     GithubRepositoriesEndpoint.as_view(),
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/workspace-integrations/<uuid:workspace_integration_id>/github-repository-sync/",  # noqa: E501
    #     GithubRepositorySyncViewSet.as_view({"get": "list", "post": "create"}),
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/workspace-integrations/<uuid:workspace_integration_id>/github-repository-sync/<uuid:pk>/",  # noqa: E501
    #     GithubRepositorySyncViewSet.as_view({"get": "retrieve", "delete": "destroy"}),
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/github-issue-sync/",  # noqa: E501
    #     GithubIssueSyncViewSet.as_view({"post": "create", "get": "list"}),
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/bulk-create-github-issue-sync/",  # noqa: E501
    #     BulkCreateGithubIssueSyncEndpoint.as_view(),
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/github-issue-sync/<uuid:pk>/",  # noqa: E501
    #     GithubIssueSyncViewSet.as_view({"get": "retrieve", "delete": "destroy"}),
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/github-issue-sync/<uuid:issue_sync_id>/github-comment-sync/",  # noqa: E501
    #     GithubCommentSyncViewSet.as_view({"post": "create", "get": "list"}),
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/github-issue-sync/<uuid:issue_sync_id>/github-comment-sync/<uuid:pk>/",  # noqa: E501
    #     GithubCommentSyncViewSet.as_view({"get": "retrieve", "delete": "destroy"}),
    # ),
    ## End Github Integrations
    # Slack Integration
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workspace-integrations/<uuid:workspace_integration_id>/project-slack-sync/",
        SlackProjectSyncViewSet.as_view({"post": "create"}),
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/workspace-integrations/<uuid:workspace_integration_id>/project-slack-sync/<uuid:pk>/",  # noqa: E501
    #     SlackProjectSyncViewSet.as_view({"delete": "destroy", "get": "retrieve"}),
    # ),
    ## End Slack Integration
]
