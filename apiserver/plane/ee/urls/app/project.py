from django.urls import path

from plane.ee.views.app import ProjectFeatureEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:pk>/features/",
        ProjectFeatureEndpoint.as_view(),
        name="project-features",
    ),
]
