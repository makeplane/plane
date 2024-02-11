from django.urls import path

from plane.app.views import (
    ## User
    UserEndpoint,
    UpdateUserOnBoardedEndpoint,
    UpdateUserTourCompletedEndpoint,
    UserActivityEndpoint,
    ChangePasswordEndpoint,
    SetUserPasswordEndpoint,
    ## End User
    ## Workspaces
    UserWorkSpacesEndpoint,
    UserActivityGraphEndpoint,
    UserIssueCompletedGraphEndpoint,
    UserWorkspaceDashboardEndpoint,
    UserWorkspaceViewViewSet,
    UserProjectViewViewSet,
    ## End Workspaces
)

urlpatterns = [
    # User Profile
    path(
        "users/me/",
        UserEndpoint.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "deactivate",
            }
        ),
        name="users",
    ),
    path(
        "users/me/settings/",
        UserEndpoint.as_view(
            {
                "get": "retrieve_user_settings",
            }
        ),
        name="users",
    ),
    path(
        "users/me/instance-admin/",
        UserEndpoint.as_view(
            {
                "get": "retrieve_instance_admin",
            }
        ),
        name="users",
    ),
    path(
        "users/me/change-password/",
        ChangePasswordEndpoint.as_view(),
        name="change-password",
    ),
    path(
        "users/me/onboard/",
        UpdateUserOnBoardedEndpoint.as_view(),
        name="user-onboard",
    ),
    path(
        "users/me/tour-completed/",
        UpdateUserTourCompletedEndpoint.as_view(),
        name="user-tour",
    ),
    path(
        "users/me/activities/",
        UserActivityEndpoint.as_view(),
        name="user-activities",
    ),
    # user workspaces
    path(
        "users/me/workspaces/",
        UserWorkSpacesEndpoint.as_view(),
        name="user-workspace",
    ),
    # User Graphs
    path(
        "users/me/workspaces/<str:slug>/activity-graph/",
        UserActivityGraphEndpoint.as_view(),
        name="user-activity-graph",
    ),
    path(
        "users/me/workspaces/<str:slug>/issues-completed-graph/",
        UserIssueCompletedGraphEndpoint.as_view(),
        name="completed-graph",
    ),
    ## End User Graph
    path(
        "users/me/workspaces/<str:slug>/dashboard/",
        UserWorkspaceDashboardEndpoint.as_view(),
        name="user-workspace-dashboard",
    ),
    path(
        "users/me/set-password/",
        SetUserPasswordEndpoint.as_view(),
        name="set-password",
    ),
    path(
        "users/me/workspaces/<str:slug>/views/",
        UserWorkspaceViewViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="user-workspace-views",
    ),
    path(
        "users/me/workspaces/<str:slug>/views/<uuid:pk>/",
        UserWorkspaceViewViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="user-workspace-views",
    ),
    path(
        "users/me/workspaces/<str:slug>/views/<uuid:pk>/duplicate/",
        UserWorkspaceViewViewSet.as_view(
            {
                "post": "duplicate",
            }
        ),
        name="user-workspace-views",
    ),
    path(
        "users/me/workspaces/<str:slug>/views/<uuid:pk>/lock/",
        UserWorkspaceViewViewSet.as_view(
            {
                "post": "toggle_lock",
            }
        ),
        name="user-workspace-views-lock",
    ),
    path(
        "users/me/workspaces/<str:slug>/projects/<uuid:project_id>/views/",
        UserProjectViewViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="user-project-views",
    ),
    path(
        "users/me/workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/",
        UserProjectViewViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="user-project-views",
    ),
    path(
        "users/me/workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/lock/",
        UserProjectViewViewSet.as_view(
            {
                "post": "toggle_lock",
            }
        ),
        name="user-project-lock-views",
    ),
    path(
        "users/me/workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/duplicate/",
        UserWorkspaceViewViewSet.as_view(
            {
                "post": "duplicate",
            }
        ),
        name="user-project-duplicate-views",
    ),

]
