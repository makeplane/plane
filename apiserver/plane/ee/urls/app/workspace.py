# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    WorkspaceWorkLogsEndpoint,
    WorkspaceExportWorkLogsEndpoint,
    WorkspaceFeaturesEndpoint,
    WorkspaceProjectStatesEndpoint,
    WorkspaceProjectStatesDefaultEndpoint,
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
        "workspaces/<str:slug>/features/",
        WorkspaceFeaturesEndpoint.as_view(),
        name="workspace-features",
    ),
    path(
        "workspaces/<str:slug>/project-states/",
        WorkspaceProjectStatesEndpoint.as_view(),
        name="workspace-project-states",
    ),
    path(
        "workspaces/<str:slug>/project-states/<uuid:pk>/",
        WorkspaceProjectStatesEndpoint.as_view(),
        name="workspace-project-states",
    ),
    path(
        "workspaces/<str:slug>/project-states/<uuid:pk>/default/",
        WorkspaceProjectStatesDefaultEndpoint.as_view(),
        name="workspace-project-states-default",
    ),
]
