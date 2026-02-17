# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

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
