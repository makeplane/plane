# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    MilestoneListCreateAPIEndpoint,
    MilestoneDetailAPIEndpoint,
    MilestoneIssueAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/milestones/",
        MilestoneListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="milestones",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/milestones/<uuid:milestone_id>/",
        MilestoneDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="milestones",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/milestones/<uuid:milestone_id>/work-items/",
        MilestoneIssueAPIEndpoint.as_view(http_method_names=["get", "post", "delete"]),
        name="milestone-work-items",
    ),
]
