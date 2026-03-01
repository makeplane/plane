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

from plane.api.views import (
    ProjectLabelListCreateAPIEndpoint,
    ProjectLabelDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/project-labels/",
        ProjectLabelListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-labels",
    ),
    path(
        "workspaces/<str:slug>/project-labels/<uuid:pk>/",
        ProjectLabelDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="project-labels-detail",
    ),
]
