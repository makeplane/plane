from django.urls import path

from plane.api.views import ProjectAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/",
        ProjectAPIEndpoint.as_view(),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/",
        ProjectAPIEndpoint.as_view(),
        name="project",
    ),
]
