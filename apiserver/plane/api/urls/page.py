from plane.api.views import PageAPIEndpoint
from django.urls import path

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageAPIEndpoint.as_view(),
        name="page",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/",
        PageAPIEndpoint.as_view(),
        name="page",
    ),
]
