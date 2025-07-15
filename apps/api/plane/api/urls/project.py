from django.urls import path

from plane.api.views import ProjectAPIEndpoint, ProjectArchiveUnarchiveAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/", ProjectAPIEndpoint.as_view(), name="project"
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:pk>/",
        ProjectAPIEndpoint.as_view(),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archive/",
        ProjectArchiveUnarchiveAPIEndpoint.as_view(),
        name="project-archive-unarchive",
    ),
]
