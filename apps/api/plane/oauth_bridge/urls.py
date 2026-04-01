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

from plane.oauth_bridge.views import (
    ExternalTokenProviderAPIEndpoint,
    ExternalTokenProviderTestAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/oauth-bridge/providers/",
        ExternalTokenProviderAPIEndpoint.as_view(),
        name="oauth-bridge-providers",
    ),
    path(
        "workspaces/<str:slug>/oauth-bridge/providers/<uuid:pk>/",
        ExternalTokenProviderAPIEndpoint.as_view(),
        name="oauth-bridge-provider-detail",
    ),
    path(
        "workspaces/<str:slug>/oauth-bridge/providers/<uuid:pk>/test/",
        ExternalTokenProviderTestAPIEndpoint.as_view(),
        name="oauth-bridge-provider-test",
    ),
]
