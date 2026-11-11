# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import WebhookAPIEndpoint, WebhookDetailAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/webhooks/",
        WebhookAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="webhooks",
    ),
    path(
        "workspaces/<str:slug>/webhooks/<uuid:pk>/",
        WebhookDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="webhook-detail",
    ),
]
