# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    ServiceAccountAPIEndpoint,
    ServiceAccountDetailAPIEndpoint,
    ServiceAccountTokenAPIEndpoint,
    ServiceAccountTokenDetailAPIEndpoint,
    ServiceAccountTokenRotateAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/service-accounts/",
        ServiceAccountAPIEndpoint.as_view(http_method_names=["post"]),
        name="service-accounts",
    ),
    path(
        "workspaces/<str:slug>/service-accounts/<uuid:user_id>/",
        ServiceAccountDetailAPIEndpoint.as_view(http_method_names=["delete"]),
        name="service-account-detail",
    ),
    path(
        "workspaces/<str:slug>/service-accounts/<uuid:user_id>/tokens/",
        ServiceAccountTokenAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="service-account-tokens",
    ),
    path(
        "workspaces/<str:slug>/service-accounts/<uuid:user_id>/tokens/<uuid:token_id>/",
        ServiceAccountTokenDetailAPIEndpoint.as_view(http_method_names=["delete"]),
        name="service-account-token-detail",
    ),
    path(
        "workspaces/<str:slug>/service-accounts/<uuid:user_id>/tokens/<uuid:token_id>/rotate/",
        ServiceAccountTokenRotateAPIEndpoint.as_view(http_method_names=["post"]),
        name="service-account-token-rotate",
    ),
]
