# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Mounted under /api/v1/ by plane/api/urls/__init__.py. The keyword is `page_id`
# because ProjectPagePermission reads it.

from django.urls import path

from .activity import (
    ProjectActivityEventsAPIEndpoint,
    ProjectActivityHeatmapAPIEndpoint,
    ProjectActivityLogDetailAPIEndpoint,
    ProjectActivityLogsAPIEndpoint,
    ProjectActivityReportAPIEndpoint,
    ProjectActivitySkipPeriodsAPIEndpoint,
    ProjectActivitySummariesAPIEndpoint,
    ProjectActivitySummaryDetailAPIEndpoint,
    ProjectActivitySettingsAPIEndpoint,
)
from .search import ContentSearchAPIEndpoint
from .views import PageArchiveUnarchiveAPIEndpoint, PageDetailAPIEndpoint, PageListCreateAPIEndpoint

from . import decisions as decision_views
from plane.liviere.decisions.routes import decision_patterns

DECISION_VIEWS = {
    "settings": decision_views.DecisionSettingsAPIEndpoint,
    "list": decision_views.DecisionsAPIEndpoint,
    "propose": decision_views.DecisionProposeAPIEndpoint,
    "search": decision_views.DecisionSearchAPIEndpoint,
    "queues": decision_views.DecisionQueuesAPIEndpoint,
    "inbox": decision_views.DecisionInboxAPIEndpoint,
    "areas": decision_views.DecisionAreasAPIEndpoint,
    "area": decision_views.DecisionAreaDetailAPIEndpoint,
    "import": decision_views.DecisionImportAPIEndpoint,
    "detail": decision_views.DecisionDetailAPIEndpoint,
    "action": decision_views.DecisionActionAPIEndpoint,
}

urlpatterns = [
    path(
        "workspaces/<str:slug>/liviere/search/",
        ContentSearchAPIEndpoint.as_view(http_method_names=["post"]),
        name="liviere-content-search-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="liviere-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/",
        PageDetailAPIEndpoint.as_view(http_method_names=["get", "put", "patch", "delete"]),
        name="liviere-page-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/archive/",
        PageArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["post", "delete"]),
        name="liviere-page-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/heatmap/",
        ProjectActivityHeatmapAPIEndpoint.as_view(http_method_names=["get"]),
        name="liviere-project-activity-heatmap-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/events/",
        ProjectActivityEventsAPIEndpoint.as_view(http_method_names=["get"]),
        name="liviere-project-activity-events-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/settings/",
        ProjectActivitySettingsAPIEndpoint.as_view(http_method_names=["get"]),
        name="liviere-project-activity-settings-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/summaries/",
        ProjectActivitySummariesAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="liviere-project-activity-summaries-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/summaries/<int:summary_id>/",
        ProjectActivitySummaryDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="liviere-project-activity-summary-detail-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/skipped-periods/",
        ProjectActivitySkipPeriodsAPIEndpoint.as_view(http_method_names=["get"]),
        name="liviere-project-activity-skipped-periods-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/report/",
        ProjectActivityReportAPIEndpoint.as_view(http_method_names=["get"]),
        name="liviere-project-activity-report-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/logs/",
        ProjectActivityLogsAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="liviere-project-activity-logs-v1",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/activity/logs/<int:log_id>/",
        ProjectActivityLogDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="liviere-project-activity-log-detail-v1",
    ),
]

# Decision register (plane/liviere/decisions)
urlpatterns += decision_patterns(DECISION_VIEWS, "-v1")
