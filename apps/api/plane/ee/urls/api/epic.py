# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    EpicDetailAPIEndpoint,
    EpicListCreateAPIEndpoint,
)

urlpatterns = [
    # epic url patterns
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/",
        EpicListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="epic-list-create",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:pk>/",
        EpicDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="epic-detail",
    ),
]