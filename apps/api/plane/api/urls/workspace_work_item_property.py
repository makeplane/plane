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
    WorkspaceWorkItemPropertyListCreateAPIEndpoint,
    WorkspaceWorkItemPropertyDetailAPIEndpoint,
    WorkspaceWorkItemPropertyOptionListCreateAPIEndpoint,
    WorkspaceWorkItemPropertyOptionDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/work-item-properties/",
        WorkspaceWorkItemPropertyListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-work-item-property",
    ),
    path(
        "workspaces/<str:slug>/work-item-properties/<uuid:property_id>/",
        WorkspaceWorkItemPropertyDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="workspace-work-item-property-detail",
    ),
    path(
        "workspaces/<str:slug>/work-item-properties/<uuid:property_id>/options/",
        WorkspaceWorkItemPropertyOptionListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-work-item-property-option",
    ),
    path(
        "workspaces/<str:slug>/work-item-properties/<uuid:property_id>/options/<uuid:option_id>/",
        WorkspaceWorkItemPropertyOptionDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="workspace-work-item-property-option-detail",
    ),
]
