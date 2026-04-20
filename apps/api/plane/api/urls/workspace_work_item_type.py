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
    WorkspaceWorkItemTypeListCreateAPIEndpoint,
    WorkspaceWorkItemTypeDetailAPIEndpoint,
    WorkspaceWorkItemTypeImportAPIEndpoint,
    WorkspaceWorkItemTypePropertyListCreateAPIEndpoint,
    WorkspaceWorkItemTypePropertyDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/work-item-types/",
        WorkspaceWorkItemTypeListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-work-item-type",
    ),
    path(
        "workspaces/<str:slug>/work-item-types/<uuid:type_id>/",
        WorkspaceWorkItemTypeDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="workspace-work-item-type-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/import-work-item-types/",
        WorkspaceWorkItemTypeImportAPIEndpoint.as_view(http_method_names=["post"]),
        name="workspace-work-item-type-import",
    ),
    path(
        "workspaces/<str:slug>/work-item-types/<uuid:work_item_type_id>/properties/",
        WorkspaceWorkItemTypePropertyListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-work-item-type-property",
    ),
    path(
        "workspaces/<str:slug>/work-item-types/<uuid:work_item_type_id>/properties/<uuid:work_item_property_id>/",
        WorkspaceWorkItemTypePropertyDetailAPIEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="workspace-work-item-type-property-detail",
    ),
]
