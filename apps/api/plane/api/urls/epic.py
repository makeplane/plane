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

# Django imports
from django.urls import path

# Module imports
from plane.api.views import (
    EpicDetailAPIEndpoint,
    EpicListCreateAPIEndpoint,
    EpicIssuesAPIEndpoint,
)

urlpatterns = [
    # epic url patterns
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/",
        EpicListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="epic-list-create",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:pk>/",
        EpicDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="epic-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/issues/",
        EpicIssuesAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="epic-issues",
    ),
]
