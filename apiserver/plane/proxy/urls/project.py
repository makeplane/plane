from django.urls import path

from plane.proxy.views import ProjectAPIEndpoint

urlpatterns = [
        path(
        "workspaces/<str:slug>/projects/",
        ProjectAPIEndpoint.as_view(),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:pk>/",
        ProjectAPIEndpoint.as_view(),
        name="project",
    ),
]
