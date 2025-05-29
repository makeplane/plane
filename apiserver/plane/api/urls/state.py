from django.urls import path

from plane.api.views import StateAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/states/",
        StateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="states",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/states/<uuid:state_id>/",
        StateAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="states",
    ),
]
