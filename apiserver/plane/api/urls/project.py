from django.urls import path

from plane.api.views import (
    ProjectAPIEndpoint,
    ProjectArchiveUnarchiveAPIEndpoint,
    ProjectCustomPropertyAPIEndpoint
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/",
        ProjectAPIEndpoint.as_view(),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:pk>/",
        ProjectAPIEndpoint.as_view(),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/custom-properties/",
        ProjectCustomPropertyAPIEndpoint.as_view(),
        name="project-custom-property",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/archive/",
        ProjectArchiveUnarchiveAPIEndpoint.as_view(),
        name="project-archive-unarchive",
    ),
]
