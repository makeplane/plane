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
    PermissionSchemeListAPIEndpoint,
    RoleListAPIEndpoint,
    UserPermissionEndpoint,
)

urlpatterns = [
    # Calling user's effective permissions
    path(
        "workspaces/<str:slug>/permissions/",
        UserPermissionEndpoint.as_view(http_method_names=["get"]),
        name="external-user-workspace-permissions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/permissions/",
        UserPermissionEndpoint.as_view(http_method_names=["get"]),
        name="external-user-project-permissions",
    ),
    # Roles (system + custom)
    path(
        "workspaces/<str:slug>/roles/",
        RoleListAPIEndpoint.as_view(http_method_names=["get"]),
        name="external-workspace-roles",
    ),
    path(
        "workspaces/<str:slug>/roles/<uuid:pk>/",
        RoleListAPIEndpoint.as_view(http_method_names=["get"]),
        name="external-workspace-role-detail",
    ),
    # Permission schemes (system + custom)
    path(
        "workspaces/<str:slug>/permission-schemes/",
        PermissionSchemeListAPIEndpoint.as_view(http_method_names=["get"]),
        name="external-workspace-permission-schemes",
    ),
    path(
        "workspaces/<str:slug>/permission-schemes/<uuid:pk>/",
        PermissionSchemeListAPIEndpoint.as_view(http_method_names=["get"]),
        name="external-workspace-permission-scheme-detail",
    ),
]
