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
    ProjectViewSet,
    DeployBoardViewSet,
    ProjectMemberViewSet,
    ProjectJoinEndpoint,
    ProjectUserViewsEndpoint,
    ProjectIdentifierEndpoint,
    ProjectFavoritesViewSet,
    UserProjectJoinEndpoint,
    ProjectArchiveUnarchiveEndpoint,
    ProjectLabelsEndpoint,
    ProjectLabelDetailEndpoint,
    ProjectSubscriberEndpoint,
)


project_patterns = [
    path(
        "workspaces/<str:slug>/projects/",
        ProjectViewSet.as_view({"get": "list", "post": "create"}),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/details/",
        ProjectViewSet.as_view({"get": "list_detail"}),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:pk>/",
        ProjectViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/project-identifiers/",
        ProjectIdentifierEndpoint.as_view(),
        name="project-identifiers",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/invitations/",
    #     ProjectInvitationsViewset.as_view({"get": "list", "post": "create"}),
    #     name="project-member-invite",
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/invitations/<uuid:pk>/",
    #     ProjectInvitationsViewset.as_view({"get": "retrieve", "delete": "destroy"}),
    #     name="project-member-invite",
    # ),
    path(
        "users/me/workspaces/<str:slug>/projects/join/",
        UserProjectJoinEndpoint.as_view(),
        name="user-project-join",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/join/<uuid:pk>/",
        ProjectJoinEndpoint.as_view(),
        name="project-join",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/",
        ProjectMemberViewSet.as_view({"get": "list", "post": "create"}),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/<uuid:pk>/",
        ProjectMemberViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/leave/",
        ProjectMemberViewSet.as_view({"post": "leave"}),
        name="project-member",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/preferences/member/<uuid:member_id>/",
    #     ProjectMemberPreferenceEndpoint.as_view(),
    #     name="project-member-preference",
    # ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-views/",
        ProjectUserViewsEndpoint.as_view(),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/user-favorite-projects/",
        ProjectFavoritesViewSet.as_view({"get": "list", "post": "create"}),
        name="project-favorite",
    ),
    path(
        "workspaces/<str:slug>/user-favorite-projects/<uuid:project_id>/",
        ProjectFavoritesViewSet.as_view({"delete": "destroy"}),
        name="project-favorite",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-deploy-boards/",
        DeployBoardViewSet.as_view({"get": "list", "post": "create"}),
        name="project-deploy-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-deploy-boards/<uuid:pk>/",
        DeployBoardViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-deploy-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archive/",
        ProjectArchiveUnarchiveEndpoint.as_view(),
        name="project-archive-unarchive",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/preferences/member/<uuid:member_id>/",
    #     ProjectMemberPreferenceEndpoint.as_view(),
    #     name="project-member-preference",
    # ),
]

project_label_patterns = [
    # Project Labels
    path(
        "workspaces/<str:slug>/project-labels/",
        ProjectLabelsEndpoint.as_view(),
        name="project-labels",
    ),
    path(
        "workspaces/<str:slug>/project-labels/<uuid:project_label_id>/",
        ProjectLabelDetailEndpoint.as_view(),
        name="project-labels-detail",
    ),
]

project_subscriber_patterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/subscribers/",
        ProjectSubscriberEndpoint.as_view({"get": "list", "post": "create_or_update"}),
        name="project-subscribers",
    ),
]

urlpatterns = [
    *project_patterns,
    *project_label_patterns,
    *project_subscriber_patterns,
]
