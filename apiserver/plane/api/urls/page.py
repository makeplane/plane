from django.urls import path


from plane.api.views import (
    PageViewSet,
    PageBlockViewSet,
    PageFavoriteViewSet,
    CreateIssueFromPageBlockEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/",
        PageViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/page-blocks/",
        PageBlockViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-page-blocks",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/page-blocks/<uuid:pk>/",
        PageBlockViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-page-blocks",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-pages/",
        PageFavoriteViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="user-favorite-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-pages/<uuid:page_id>/",
        PageFavoriteViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="user-favorite-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/page-blocks/<uuid:page_block_id>/issues/",
        CreateIssueFromPageBlockEndpoint.as_view(),
        name="page-block-issues",
    ),
]
