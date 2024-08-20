# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    WorkspaceWorkLogsEndpoint,
    WorkspaceExportWorkLogsEndpoint,
    WorkspaceInviteCheckEndpoint,
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
    path(
        "workspaces/<str:slug>/invite-check/",
        WorkspaceInviteCheckEndpoint.as_view(),
        name="workspace-invite-check",
    ),
]
