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

from plane.api.views import TeamspaceViewSet, TeamspaceProjectViewSet, TeamspaceMemberViewSet

urlpatterns = [
    path(
        "workspaces/<str:slug>/teamspaces/",
        TeamspaceViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-teamspaces",
    ),
    path(
        "workspaces/<str:slug>/teamspaces/<uuid:pk>/",
        TeamspaceViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workspace-teamspaces",
    ),
    path(
        "workspaces/<str:slug>/teamspaces/<uuid:teamspace_id>/projects/",
        TeamspaceProjectViewSet.as_view({"get": "get_projects", "post": "add_projects", "delete": "remove_projects"}),
        name="workspace-teamspaces-projects",
    ),
    path(
        "workspaces/<str:slug>/teamspaces/<uuid:teamspace_id>/members/",
        TeamspaceMemberViewSet.as_view({"get": "get_members", "post": "add_members", "delete": "remove_members"}),
        name="workspace-teamspaces-members",
    ),
]
