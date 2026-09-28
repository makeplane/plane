# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.eraser import EraserConnectionEndpoint, EraserEmbedEndpoint, EraserMetadataEndpoint


urlpatterns = [
    path("workspaces/<str:slug>/eraser/", EraserConnectionEndpoint.as_view(), name="eraser-connection"),
    path("workspaces/<str:slug>/eraser/embed/", EraserEmbedEndpoint.as_view(), name="eraser-embed"),
    path("workspaces/<str:slug>/eraser/metadata/", EraserMetadataEndpoint.as_view(), name="eraser-metadata"),
]
