from django.urls import path

from plane.ee.views.app import (
    DashboardViewSet,
    DashboardQuickFilterEndpoint,
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
        DashboardViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="workspace-dashboard",
    ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/quick-filters/",
        DashboardQuickFilterEndpoint.as_view(),
        name="workspace-dashboard-filters",
    ),
    path(
        "workspaces/<str:slug>/dashboards/<uuid:dashboard_id>/quick-filters/<uuid:pk>/",
        DashboardQuickFilterEndpoint.as_view(),
        name="workspace-dashboard-filters",
    ),
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
