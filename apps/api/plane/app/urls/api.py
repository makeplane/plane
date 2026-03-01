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
from plane.app.views import ApiTokenEndpoint, ServiceApiTokenEndpoint, WorkspaceAPITokenEndpoint

urlpatterns = [
    # API Tokens
    path(
        "users/api-tokens/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens",
    ),
    path(
        "users/api-tokens/<uuid:pk>/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens-details",
    ),
    path(
        "workspaces/<str:slug>/service-api-tokens/",
        ServiceApiTokenEndpoint.as_view(),
        name="service-api-tokens",
    ),
    path(
        "workspaces/<str:slug>/api-tokens/",
        WorkspaceAPITokenEndpoint.as_view(),
        name="workspace-api-tokens",
    ),
    path(
        "workspaces/<str:slug>/api-tokens/<uuid:pk>/",
        WorkspaceAPITokenEndpoint.as_view(),
        name="workspace-api-tokens-details",
    ),
    ## End API Tokens
]
