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

from plane.ee.views.app import (
    DashboardViewSet,
    # DashboardQuickFilterEndpoint,  # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    WidgetEndpoint,
    WidgetListEndpoint,
    BulkWidgetEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/dashboards/",
        DashboardViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-dashboard",
    ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:pk>/",
        DashboardViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workspace-dashboard",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/quick-filters/",
    #     DashboardQuickFilterEndpoint.as_view(),
    #     name="workspace-dashboard-filters",
    # ),
    # path(
    #     "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/quick-filters/<uuid:pk>/",
    #     DashboardQuickFilterEndpoint.as_view(),
    #     name="workspace-dashboard-filters",
    # ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/widgets/",
        WidgetEndpoint.as_view(),
        name="workspace-dashboard-widgets",
    ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/widgets/<uuid:pk>/",
        WidgetEndpoint.as_view(),
        name="workspace-dashboard-widgets",
    ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/widgets/<uuid:widget_id>/charts/",
        WidgetListEndpoint.as_view(),
        name="workspace-dashboard-widgets-chart",
    ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/bulk-update-widgets/",
        BulkWidgetEndpoint.as_view(),
        name="bulk-widget-updates",
    ),
]
