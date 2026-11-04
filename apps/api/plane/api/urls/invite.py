# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.urls import path, include

# Third party imports
from rest_framework.routers import DefaultRouter

# Module imports
from plane.api.views import WorkspaceInvitationsViewset


# Create router with just the invitations prefix (no workspace slug)
router = DefaultRouter()
# DRF appends ".<format>" variants of every route, which pass a `format` kwarg
# the viewset handlers do not accept, so those URLs raised TypeError (HTTP 500).
# Plane does not document format suffixes, so the routes are dropped entirely.
router.include_format_suffixes = False
router.register(r"invitations", WorkspaceInvitationsViewset, basename="workspace-invitations")

# Wrap the router URLs with the workspace slug path
urlpatterns = [
    path("workspaces/<str:slug>/", include(router.urls)),
]
