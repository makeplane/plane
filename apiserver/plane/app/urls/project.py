from django.urls import path

from plane.app.views import (
    ProjectViewSet,
    ProjectInvitationsViewset,
    ProjectMemberViewSet,
    ProjectMemberUserEndpoint,
    ProjectJoinEndpoint,
    AddTeamToProjectEndpoint,
    ProjectUserViewsEndpoint,
    ProjectIdentifierEndpoint,
    ProjectFavoritesViewSet,
    UserProjectInvitationsViewset,
    ProjectPublicCoverImagesEndpoint,
    ProjectDeployBoardViewSet,
    UserProjectRolesEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/",
        ProjectViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:pk>/",
        ProjectViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/project-identifiers/",
        ProjectIdentifierEndpoint.as_view(),
        name="project-identifiers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/invitations/",
        ProjectInvitationsViewset.as_view(
            {
                "get": "list",
                "post": "create",
            },
        ),
        name="project-member-invite",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/invitations/<uuid:pk>/",
        ProjectInvitationsViewset.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
            }
        ),
        name="project-member-invite",
    ),
    path(
        "users/me/workspaces/<str:slug>/projects/invitations/",
        UserProjectInvitationsViewset.as_view(
            {
                "get": "list",
                "post": "create",
            },
        ),
        name="user-project-invitations",
    ),
    path(
        "users/me/workspaces/<str:slug>/project-roles/",
        UserProjectRolesEndpoint.as_view(),
        name="user-project-roles",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/join/<uuid:pk>/",
        ProjectJoinEndpoint.as_view(),
        name="project-join",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/",
        ProjectMemberViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/<uuid:pk>/",
        ProjectMemberViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/leave/",
        ProjectMemberViewSet.as_view(
            {
                "post": "leave",
            }
        ),
        name="project-member",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/team-invite/",
        AddTeamToProjectEndpoint.as_view(),
        name="projects",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-views/",
        ProjectUserViewsEndpoint.as_view(),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-members/me/",
        ProjectMemberUserEndpoint.as_view(),
        name="project-member-view",
    ),
    path(
        "workspaces/<str:slug>/user-favorite-projects/",
        ProjectFavoritesViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-favorite",
    ),
    path(
        "workspaces/<str:slug>/user-favorite-projects/<uuid:project_id>/",
        ProjectFavoritesViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="project-favorite",
    ),
    path(
        "project-covers/",
        ProjectPublicCoverImagesEndpoint.as_view(),
        name="project-covers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-deploy-boards/",
        ProjectDeployBoardViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-deploy-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-deploy-boards/<uuid:pk>/",
        ProjectDeployBoardViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-deploy-board",
    ),
]
