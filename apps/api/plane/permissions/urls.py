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

"""
Permission API URLs

URL configuration for the permission API endpoints.
"""

from django.urls import path

from .views import (
    PermissionCheckView,
    ResourcePermissionsView,
    ResourceGrantsViewSet,
    AccessibleResourcesView,
    UserRelationView,
)

urlpatterns = [
    # TODO: RoleViewSet superseded by RoleEndpoint in app/views/permission/role.py
    # path(
    #     "workspaces/<str:slug>/roles/",
    #     RoleViewSet.as_view({"get": "list", "post": "create"}),
    #     name="workspace-roles",
    # ),
    # path(
    #     "workspaces/<str:slug>/roles/<uuid:pk>/",
    #     RoleViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
    #     name="workspace-role-detail",
    # ),
    # Permission checks
    path(
        "workspaces/<str:slug>/permissions/check/",
        PermissionCheckView.as_view(),
        name="permission-check",
    ),
    path(
        "workspaces/<str:slug>/permissions/resource/",
        ResourcePermissionsView.as_view(),
        name="resource-permissions",
    ),
    # Permission grants (GAC)
    path(
        "workspaces/<str:slug>/permissions/grants/",
        ResourceGrantsViewSet.as_view({"get": "list", "post": "create"}),
        name="permission-grants",
    ),
    path(
        "workspaces/<str:slug>/permissions/grants/<uuid:pk>/",
        ResourceGrantsViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="permission-grant-detail",
    ),
    # User permissions
    path(
        "workspaces/<str:slug>/permissions/accessible/",
        AccessibleResourcesView.as_view(),
        name="accessible-resources",
    ),
    path(
        "workspaces/<str:slug>/permissions/relation/",
        UserRelationView.as_view(),
        name="user-relation",
    ),
]
