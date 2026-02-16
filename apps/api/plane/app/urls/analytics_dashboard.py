# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.analytics_dashboard import (
    AnalyticsDashboardEndpoint,
    AnalyticsDashboardDetailEndpoint,
    AnalyticsDashboardWidgetEndpoint,
    AnalyticsDashboardWidgetDetailEndpoint,
    AnalyticsDashboardWidgetDataEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/analytics-dashboards/",
        AnalyticsDashboardEndpoint.as_view(http_method_names=["get", "post"]),
        name="analytics-dashboards",
    ),
    path(
        "workspaces/<str:slug>/analytics-dashboards/<uuid:dashboard_id>/",
        AnalyticsDashboardDetailEndpoint.as_view(
            http_method_names=["get", "patch", "delete"]
        ),
        name="analytics-dashboard-detail",
    ),
    path(
        "workspaces/<str:slug>/analytics-dashboards/<uuid:dashboard_id>/widgets/",
        AnalyticsDashboardWidgetEndpoint.as_view(
            http_method_names=["get", "post"]
        ),
        name="analytics-dashboard-widgets",
    ),
    path(
        "workspaces/<str:slug>/analytics-dashboards/<uuid:dashboard_id>/widgets/<uuid:widget_id>/",
        AnalyticsDashboardWidgetDetailEndpoint.as_view(
            http_method_names=["get", "patch", "delete"]
        ),
        name="analytics-dashboard-widget-detail",
    ),
    path(
        "workspaces/<str:slug>/analytics-dashboards/<uuid:dashboard_id>/widgets/<uuid:widget_id>/data/",
        AnalyticsDashboardWidgetDataEndpoint.as_view(
            http_method_names=["get"]
        ),
        name="analytics-dashboard-widget-data",
    ),
]
