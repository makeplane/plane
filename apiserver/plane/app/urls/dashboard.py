from django.urls import path


from plane.app.views import DashboardEndpoint, WidgetsEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/dashboard/",
        DashboardEndpoint.as_view(),
        name="dashboard",
    ),
    path(
        "workspaces/<str:slug>/dashboard/<uuid:dashboard_id>/",
        DashboardEndpoint.as_view(),
        name="dashboard",
    ),
    path(
        "dashboard/<uuid:dashboard_id>/widgets/<uuid:widget_id>/",
        WidgetsEndpoint.as_view(),
        name="widgets",
    ),
]
