# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    WorkspaceWorkLogsEndpoint,
    WorkspaceExportWorkLogsEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/worklogs/",
        WorkspaceWorkLogsEndpoint.as_view(),
        name="workspace-work-logs",
    ),
    path(
        "workspaces/<str:slug>/export-worklogs/",
        WorkspaceExportWorkLogsEndpoint.as_view(),
        name="workspace-work-logs",
    ),
]
