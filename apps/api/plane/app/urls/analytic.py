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


from plane.app.views import (
    AnalyticsEndpoint,
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


urlpatterns = [
    path(
        "workspaces/<str:slug>/analytics/",
        AnalyticsEndpoint.as_view(),
        name="plane-analytics",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/analytic-view/",
    #     AnalyticViewViewset.as_view({"get": "list", "post": "create"}),
    #     name="analytic-view",
    # ),
    # path(
    #     "workspaces/<str:slug>/analytic-view/<uuid:pk>/",
    #     AnalyticViewViewset.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
    #     name="analytic-view",
    # ),
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
