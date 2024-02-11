from django.urls import path


from plane.app.views import (
    ProjectViewViewSet,
    WorkspaceViewViewSet,
    WorkspaceViewFavoriteViewSet,
    ProjectViewFavoriteViewSet,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/issues/",
        WorkspaceViewViewSet.as_view(
            {
                "get": "list",
            }
        ),
        name="workspace-view-issues",
    ),
    path(
        "workspaces/<str:slug>/views/",
        WorkspaceViewViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="workspace-view",
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
        name="workspace-view",
    ),
    path(
        "workspaces/<str:slug>/views/<uuid:view_id>/duplicate/",
        WorkspaceViewFavoriteViewSet.as_view(
            {
                "post": "duplicate",
            }
        ),
        name="workspace-duplicate-view",
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
        name="workspace-favorite-view",
    ),
    path(
        "workspaces/<str:slug>/views/<uuid:pk>/visibility/",
        WorkspaceViewViewSet.as_view(
            {
                "post": "visibility",
            }
        ),
        name="workspace-duplicate-view",
    ),
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/duplicate/",
        ProjectViewViewSet.as_view(
            {
                "post": "duplicate",
            }
        ),
        name="project-duplicate-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/visibility/",
        ProjectViewViewSet.as_view(
            {
                "post": "visibility",
            }
        ),
        name="project-duplicate-view",
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
        name="project-favorite-view",
    ),
]
