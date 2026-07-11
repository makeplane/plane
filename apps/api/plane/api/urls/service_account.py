# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import ServiceAccountAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/service-accounts/",
        ServiceAccountAPIEndpoint.as_view(http_method_names=["post"]),
        name="service-accounts",
    ),
]
