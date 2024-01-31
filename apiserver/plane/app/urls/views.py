from django.urls import path


from plane.app.views import (
    ProjectViewViewSet,
    WorkspaceViewViewSet,
    ViewFavoriteViewSet,
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-views/",
        ViewFavoriteViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="user-favorite-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-views/<uuid:view_id>/",
        ViewFavoriteViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="user-favorite-view",
    ),
]
