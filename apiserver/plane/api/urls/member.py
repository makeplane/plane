from django.urls import path

from plane.api.views import (
    WorkspaceMemberAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/members/",
        WorkspaceMemberAPIEndpoint.as_view(),
        name="users",
    ),
]
