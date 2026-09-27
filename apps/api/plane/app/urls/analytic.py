# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path


from plane.app.views import (
    AnalyticsEndpoint,
    AnalyticViewViewset,
    SavedAnalyticEndpoint,
    ExportAnalyticsEndpoint,
    AdvanceAnalyticsEndpoint,
    AdvanceAnalyticsStatsEndpoint,
    AdvanceAnalyticsChartEndpoint,
    DefaultAnalyticsEndpoint,
    ProjectStatsEndpoint,
    ProjectAdvanceAnalyticsEndpoint,
    ProjectAdvanceAnalyticsStatsEndpoint,
    ProjectAdvanceAnalyticsChartEndpoint,
)
from plane.app.views.analytic_v2 import (
    AnalyticsV2QueryEndpoint,
    AnalyticsV2StatsEndpoint,
    AnalyticsV2ChartsEndpoint,
    AnalyticsV2DrilldownEndpoint,
    AnalyticsV2BatchEndpoint,
)
from plane.app.views.dashboard import (
    DashboardAttentionEndpoint,
    DashboardItemsEndpoint,
    DashboardOverviewEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/analytics/",
        AnalyticsEndpoint.as_view(),
        name="plane-analytics",
    ),
    # Analytics Engine V2 — additive endpoints (RD-451). Legacy routes above
    # are untouched; V2 lives alongside them per §44.2.
    path(
        "workspaces/<str:slug>/analytics/v2/query/",
        AnalyticsV2QueryEndpoint.as_view(),
        name="analytics-v2-query",
    ),
    path(
        "workspaces/<str:slug>/analytics/v2/stats/",
        AnalyticsV2StatsEndpoint.as_view(),
        name="analytics-v2-stats",
    ),
    path(
        "workspaces/<str:slug>/analytics/v2/charts/",
        AnalyticsV2ChartsEndpoint.as_view(),
        name="analytics-v2-charts",
    ),
    path(
        "workspaces/<str:slug>/analytics/v2/drilldown/",
        AnalyticsV2DrilldownEndpoint.as_view(),
        name="analytics-v2-drilldown",
    ),
    path(
        "workspaces/<str:slug>/analytics/v2/batch/",
        AnalyticsV2BatchEndpoint.as_view(),
        name="analytics-v2-batch",
    ),
    # Team Operations Dashboard — additive singular /dashboard/ endpoints
    # (RD-484: retired builder routes stay 404). Each endpoint returns the
    # canonical envelope and is independently wrapped in @allow_permission.
    path(
        "workspaces/<str:slug>/dashboard/overview/",
        DashboardOverviewEndpoint.as_view(),
        name="dashboard-operations-overview",
    ),
    path(
        "workspaces/<str:slug>/dashboard/attention/",
        DashboardAttentionEndpoint.as_view(),
        name="dashboard-operations-attention",
    ),
    path(
        "workspaces/<str:slug>/dashboard/items/",
        DashboardItemsEndpoint.as_view(),
        name="dashboard-operations-items",
    ),
    path(
        "workspaces/<str:slug>/analytic-view/",
        AnalyticViewViewset.as_view({"get": "list", "post": "create"}),
        name="analytic-view",
    ),
    path(
        "workspaces/<str:slug>/analytic-view/<uuid:pk>/",
        AnalyticViewViewset.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="analytic-view",
    ),
    path(
        "workspaces/<str:slug>/saved-analytic-view/<uuid:analytic_id>/",
        SavedAnalyticEndpoint.as_view(),
        name="saved-analytic-view",
    ),
    path(
        "workspaces/<str:slug>/export-analytics/",
        ExportAnalyticsEndpoint.as_view(),
        name="export-analytics",
    ),
    path(
        "workspaces/<str:slug>/default-analytics/",
        DefaultAnalyticsEndpoint.as_view(),
        name="default-analytics",
    ),
    path(
        "workspaces/<str:slug>/project-stats/",
        ProjectStatsEndpoint.as_view(),
        name="project-analytics",
    ),
    path(
        "workspaces/<str:slug>/advance-analytics/",
        AdvanceAnalyticsEndpoint.as_view(),
        name="advance-analytics",
    ),
    path(
        "workspaces/<str:slug>/advance-analytics-stats/",
        AdvanceAnalyticsStatsEndpoint.as_view(),
        name="advance-analytics-stats",
    ),
    path(
        "workspaces/<str:slug>/advance-analytics-charts/",
        AdvanceAnalyticsChartEndpoint.as_view(),
        name="advance-analytics-chart",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/advance-analytics/",
        ProjectAdvanceAnalyticsEndpoint.as_view(),
        name="project-advance-analytics",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/advance-analytics-stats/",
        ProjectAdvanceAnalyticsStatsEndpoint.as_view(),
        name="project-advance-analytics-stats",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/advance-analytics-charts/",
        ProjectAdvanceAnalyticsChartEndpoint.as_view(),
        name="project-advance-analytics-chart",
    ),
]
