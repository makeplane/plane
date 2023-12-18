from django.urls import path


from plane.space.views import (
    ProjectDeployBoardPublicSettingsEndpoint,
    ProjectIssuesPublicEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/settings/",
        ProjectDeployBoardPublicSettingsEndpoint.as_view(),
        name="project-deploy-board-settings",
    ),
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/",
        ProjectIssuesPublicEndpoint.as_view(),
        name="project-deploy-board",
    ),
]
