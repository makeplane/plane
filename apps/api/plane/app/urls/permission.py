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

from plane.app.views.permission import (
    ResourcePermissionEndpoint,
    RoleEndpoint,
    UserPermissionEndpoint,
    PermissionSchemeEndpoint,
    PermissionSchemeImpactEndpoint,
)


urlpatterns = [
    # Workspace-level resource permissions
    path(
        "workspaces/<str:slug>/resources/permissions/",
        ResourcePermissionEndpoint.as_view(),
        name="workspace-resource-permissions",
    ),
    # Role management endpoints
    path(
        "workspaces/<str:slug>/roles/",
        RoleEndpoint.as_view(),
        name="workspace-roles",
    ),
    path(
        "workspaces/<str:slug>/roles/<uuid:pk>/",
        RoleEndpoint.as_view(),
        name="workspace-role-detail",
    ),
    # User permission endpoints
    path(
        "workspaces/<str:slug>/permissions/",
        UserPermissionEndpoint.as_view(),
        name="workspace-user-permissions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/permissions/",
        UserPermissionEndpoint.as_view(),
        name="project-user-permissions",
    ),
    path(
        "workspaces/<str:slug>/teamspaces/<uuid:team_space_id>/permissions/",
        UserPermissionEndpoint.as_view(),
        name="teamspace-user-permissions",
    ),
    # Permission scheme endpoints
    path(
        "workspaces/<str:slug>/permission-schemes/",
        PermissionSchemeEndpoint.as_view(),
        name="workspace-permission-schemes",
    ),
    path(
        "workspaces/<str:slug>/permission-schemes/<uuid:pk>/",
        PermissionSchemeEndpoint.as_view(),
        name="workspace-permission-scheme-detail",
    ),
    path(
        "workspaces/<str:slug>/permission-schemes/<uuid:pk>/impact/",
        PermissionSchemeImpactEndpoint.as_view(),
        name="workspace-permission-scheme-impact",
    ),
]
