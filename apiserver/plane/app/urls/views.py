from django.urls import path


from plane.app.views import (
    ProjectViewViewSet,
    WorkspaceViewViewSet,
    WorkspaceViewFavoriteViewSet,
    ProjectViewFavoriteViewSet,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/",
        ProjectViewViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/",
        ProjectViewViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/views/",
        WorkspaceViewViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="global-view",
    ),
    path(
        "workspaces/<str:slug>/views/<uuid:pk>/",
        WorkspaceViewViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="global-view",
    ),
    path(
        "workspaces/<str:slug>/issues/",
        WorkspaceViewViewSet.as_view(
            {
                "get": "list",
            }
        ),
        name="global-view-issues",
    ),
    path(
        "workspaces/<str:slug>/views/<uuid:view_id>/favorite/",
        WorkspaceViewFavoriteViewSet.as_view(
            {
                "get": "list",
                "post": "create",
                "delete": "destroy",
            }
        ),
        name="user-workspace-favorite-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:view_id>/favorite/",
        ProjectViewFavoriteViewSet.as_view(
            {
                "get": "list",
                "post": "create",
                "delete": "destroy",
            }
        ),
        name="user-project-favorite-view",
    ),
]
