# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from .views import (
    AIAccountDetailAPIEndpoint,
    AIAccountListCreateAPIEndpoint,
    AIScopePolicyAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/ai-accounts/",
        AIAccountListCreateAPIEndpoint.as_view(),
        name="ai-accounts",
    ),
    path(
        "workspaces/<str:slug>/ai-accounts/<uuid:pk>/",
        AIAccountDetailAPIEndpoint.as_view(),
        name="ai-accounts-detail",
    ),
    path(
        "workspaces/<str:slug>/ai-accounts/<uuid:pk>/scopes/",
        AIScopePolicyAPIEndpoint.as_view(),
        name="ai-accounts-scopes",
    ),
]
