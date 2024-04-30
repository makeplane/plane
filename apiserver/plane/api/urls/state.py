from django.urls import path

from plane.api.views import StateAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/states/",
        StateAPIEndpoint.as_view(),
        name="states",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/states/<uuid:state_id>/",
        StateAPIEndpoint.as_view(),
        name="states",
    ),
]
