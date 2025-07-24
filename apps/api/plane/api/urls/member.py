from django.urls import path

from plane.api.views import ProjectMemberAPIEndpoint, WorkspaceMemberAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/members/",
        ProjectMemberAPIEndpoint.as_view(http_method_names=["get"]),
        name="users",
    ),
    path(
        "workspaces/<str:slug>/members/",
        WorkspaceMemberAPIEndpoint.as_view(http_method_names=["get"]),
        name="users",
    ),
]
