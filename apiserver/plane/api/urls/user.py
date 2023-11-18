from django.urls import path

from plane.api.views import (
    ## User
    UserEndpoint,
    UpdateUserOnBoardedEndpoint,
    UpdateUserTourCompletedEndpoint,
    UserActivityEndpoint,
    ChangePasswordEndpoint,
    ## End User
    ## Workspaces
    UserWorkSpacesEndpoint,
    UserActivityGraphEndpoint,
    UserIssueCompletedGraphEndpoint,
    UserWorkspaceDashboardEndpoint,
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
        "users/workspaces/<str:slug>/activities/",
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
    path(
        "users/me/workspaces/<str:slug>/dashboard/",
        UserWorkspaceDashboardEndpoint.as_view(),
        name="user-workspace-dashboard",
    ),
    ## End User Graph
]
