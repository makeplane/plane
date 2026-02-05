from django.urls import path

from plane.api.views import (
    ProjectMemberAPIEndpoint,
    ProjectMemberActivateEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/members/",
        ProjectMemberAPIEndpoint.as_view(),
        name="users",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/members/<str:member_id>/",
        ProjectMemberAPIEndpoint.as_view(),
        name="project_member_detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/members/<str:member_id>/activate/",
        ProjectMemberActivateEndpoint.as_view(),
        name="project_member_activate",
    ),
]
