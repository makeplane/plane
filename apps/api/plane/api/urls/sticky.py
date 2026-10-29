# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from plane.api.views import StickyViewSet


router = DefaultRouter()
# DRF appends ".<format>" variants of every route, which pass a `format` kwarg
# the viewset handlers do not accept, so those URLs raised TypeError (HTTP 500).
# Plane does not document format suffixes, so the routes are dropped entirely.
router.include_format_suffixes = False
router.register(r"stickies", StickyViewSet, basename="workspace-stickies")

urlpatterns = [
    path("workspaces/<str:slug>/", include(router.urls)),
]
