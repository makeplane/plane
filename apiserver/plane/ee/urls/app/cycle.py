from django.urls import path

from plane.ee.views.app.cycle import (
    WorkspaceActiveCycleEndpoint,
    ActiveCycleProgressEndpoint,
    WorkspaceActiveAnalyticsCycleEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/active-cycles/",
        WorkspaceActiveCycleEndpoint.as_view(),
        name="workspace-active-cycle",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/progress/",
        ActiveCycleProgressEndpoint.as_view(),
        name="workspace-active-cycle",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/analytics/",
        WorkspaceActiveAnalyticsCycleEndpoint.as_view(),
        name="workspace-active-cycle",
    ),
]
