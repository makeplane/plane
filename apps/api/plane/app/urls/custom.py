from django.urls import path

from plane.app.views.custom.project_analytics import CustomProjectAdvanceAnalyticsEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/analytics/",
        CustomProjectAdvanceAnalyticsEndpoint.as_view(),
        name="analytics",
    ),
]