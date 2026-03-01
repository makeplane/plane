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

from plane.api.views import (
    ProjectMemberListCreateAPIEndpoint,
    ProjectMemberDetailAPIEndpoint,
    WorkspaceMemberAPIEndpoint,
    ProjectMemberSiloEndpoint,
    WorkspaceMemberRemoveEndpoint,
)

urlpatterns = [
    # Project members
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/",
        ProjectMemberSiloEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-members",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-members/",
        ProjectMemberListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-members",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-members/<uuid:pk>/",
        ProjectMemberDetailAPIEndpoint.as_view(http_method_names=["patch", "delete", "get"]),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-members/",
        ProjectMemberListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-members",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-members/<uuid:pk>/",
        ProjectMemberDetailAPIEndpoint.as_view(http_method_names=["patch", "delete", "get"]),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/members/",
        WorkspaceMemberAPIEndpoint.as_view(http_method_names=["get"]),
        name="workspace-members",
    ),
    path(
        "workspaces/<str:slug>/members/remove/",
        WorkspaceMemberRemoveEndpoint.as_view(http_method_names=["post"]),
        name="workspace-members",
    ),
]
