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


urlpatterns = [
    path(
        "workspaces/<str:slug>/analytics/",
        AnalyticsEndpoint.as_view(),
        name="plane-analytics",
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
