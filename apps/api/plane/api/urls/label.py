from django.urls import path

from plane.api.views import LabelListCreateAPIEndpoint, LabelDetailAPIEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/labels/",
        LabelListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="label",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/labels/<uuid:pk>/",
        LabelDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="label",
    ),
]
