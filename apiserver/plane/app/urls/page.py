from django.urls import path


from plane.app.views import (
    PageViewSet,
    PageFavoriteViewSet,
    PageLogEndpoint,
    SubPagesEndpoint,
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/archive/",
        PageViewSet.as_view(
            {
                "post": "archive",
            }
        ),
        name="project-page-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/unarchive/",
        PageViewSet.as_view(
            {
                "post": "unarchive",
            }
        ),
        name="project-page-unarchive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-pages/",
        PageViewSet.as_view(
            {
                "get": "archive_list",
            }
        ),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/lock/",
        PageViewSet.as_view(
            {
                "post": "lock",
            }
        ),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/unlock/",
        PageViewSet.as_view(
            {
                "post": "unlock",
            }
        ),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/transactions/",
        PageLogEndpoint.as_view(),
        name="page-transactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/transactions/<uuid:transaction>/",
        PageLogEndpoint.as_view(),
        name="page-transactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/sub-pages/",
        SubPagesEndpoint.as_view(),
        name="sub-page",
    ),
]
