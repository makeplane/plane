from django.urls import path


from plane.space.views import (
    ProjectDeployBoardPublicSettingsEndpoint,
    ProjectIssuesPublicEndpoint,
    WorkspaceProjectAnchorEndpoint,
)

urlpatterns = [
    path(
        "anchor/<str:anchor>/settings/",
        ProjectDeployBoardPublicSettingsEndpoint.as_view(),
        name="project-deploy-board-settings",
    ),
    path(
        "anchor/<str:anchor>/issues/",
        ProjectIssuesPublicEndpoint.as_view(),
        name="project-deploy-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/anchor/",
        WorkspaceProjectAnchorEndpoint.as_view(),
        name="project-deploy-board",
    ),
]
