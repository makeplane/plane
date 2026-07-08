# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path


from plane.space.views import (
    ViewMetaDataEndpoint,
    ViewPublicSettingsEndpoint,
)

urlpatterns = [
    path(
        "anchor/<str:anchor>/views/meta/",
        ViewMetaDataEndpoint.as_view(),
        name="view-meta",
    ),
    path(
        "anchor/<str:anchor>/views/settings/",
        ViewPublicSettingsEndpoint.as_view(),
        name="view-settings",
    ),
]
