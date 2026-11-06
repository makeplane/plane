# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.nexus.views.features import ProjectFeatureAPIEndpoint, WorkspaceFeatureAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/features/",
        WorkspaceFeatureAPIEndpoint.as_view(http_method_names=["get", "patch"]),
        name="nexus-workspace-features",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/features/",
        ProjectFeatureAPIEndpoint.as_view(http_method_names=["get", "patch"]),
        name="nexus-project-features",
    ),
]
