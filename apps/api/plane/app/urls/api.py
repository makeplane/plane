# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path
from plane.app.views import ApiTokenEndpoint, ServiceApiTokenEndpoint

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
    ## End API Tokens
]
