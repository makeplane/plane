from django.urls import path

from plane.api.views import (
    WorkspaceInvitationsViewset,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/invitations/",
        WorkspaceInvitationsViewset.as_view({"get": "list", "post": "create"}),
        name="workspace-invitations",
    ),
    path(
        "workspaces/<str:slug>/invitations/<uuid:pk>/",
        WorkspaceInvitationsViewset.as_view({"get": "retrieve", "delete": "destroy", "patch": "partial_update"}),
        name="workspace-invitations",
    ),
]