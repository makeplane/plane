# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Mounted under /api/ by plane/app/urls/__init__.py (session authentication).

from django.urls import path

from .activity import (
    ActivityEnabledProjectsEndpoint,
    ProjectActivityEventsEndpoint,
    ProjectActivityHeatmapEndpoint,
    ProjectActivityLogDetailEndpoint,
    ProjectActivityLogsEndpoint,
    ProjectActivitySettingsEndpoint,
)
from .unread import (
    NewWorkItemsCountEndpoint,
    NewWorkItemsEndpoint,
    NewWorkItemsMarkReadEndpoint,
    WorkItemOpenedEndpoint,
)
from .views import PageApiBlockEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/liviere/api-block/",
        PageApiBlockEndpoint.as_view(http_method_names=["post", "delete"]),
        name="liviere-page-api-block",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/liviere/activity/heatmap/",
        ProjectActivityHeatmapEndpoint.as_view(http_method_names=["get"]),
        name="liviere-project-activity-heatmap",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/liviere/activity/events/",
        ProjectActivityEventsEndpoint.as_view(http_method_names=["get"]),
        name="liviere-project-activity-events",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/liviere/activity/settings/",
        ProjectActivitySettingsEndpoint.as_view(http_method_names=["get", "patch"]),
        name="liviere-project-activity-settings",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/liviere/activity/logs/",
        ProjectActivityLogsEndpoint.as_view(http_method_names=["get", "post"]),
        name="liviere-project-activity-logs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/liviere/activity/logs/<int:log_id>/",
        ProjectActivityLogDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="liviere-project-activity-log-detail",
    ),
    path(
        "workspaces/<str:slug>/liviere/activity/enabled-projects/",
        ActivityEnabledProjectsEndpoint.as_view(http_method_names=["get"]),
        name="liviere-activity-enabled-projects",
    ),
    path(
        "workspaces/<str:slug>/liviere/new-work-items/",
        NewWorkItemsEndpoint.as_view(http_method_names=["get"]),
        name="liviere-new-work-items",
    ),
    path(
        "workspaces/<str:slug>/liviere/new-work-items/count/",
        NewWorkItemsCountEndpoint.as_view(http_method_names=["get"]),
        name="liviere-new-work-items-count",
    ),
    path(
        "workspaces/<str:slug>/liviere/new-work-items/mark-read/",
        NewWorkItemsMarkReadEndpoint.as_view(http_method_names=["post"]),
        name="liviere-new-work-items-mark-read",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/liviere/work-items/<uuid:issue_id>/opened/",
        WorkItemOpenedEndpoint.as_view(http_method_names=["post"]),
        name="liviere-work-item-opened",
    ),
]
