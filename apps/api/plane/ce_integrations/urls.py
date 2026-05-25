from django.urls import path

from .views import IntegrationListEndpoint, WorkspaceIntegrationEndpoint


# Mounted under /api/ by plane.urls — see ROOT_URLCONF.
urlpatterns = [
    path("integrations/", IntegrationListEndpoint.as_view(), name="ce-integrations-list"),
    path(
        "workspaces/<str:slug>/workspace-integrations/",
        WorkspaceIntegrationEndpoint.as_view(),
        name="ce-workspace-integrations-list",
    ),
    # Frontend's deleteWorkspaceIntegration calls .../<id>/provider/ — keep
    # the trailing /provider/ to match exactly.
    path(
        "workspaces/<str:slug>/workspace-integrations/<uuid:pk>/provider/",
        WorkspaceIntegrationEndpoint.as_view(),
        name="ce-workspace-integrations-detail",
    ),
]