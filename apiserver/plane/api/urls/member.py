from django.urls import path

from plane.api.views import (
    ProjectMemberAPIEndpoint,
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
]
