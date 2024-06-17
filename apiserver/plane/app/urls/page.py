from django.urls import path


from plane.app.views import (
    PageViewSet,
    PageFavoriteViewSet,
    PageLogEndpoint,
    SubPagesEndpoint,
    PagesDescriptionViewSet,
    WorkspacePageViewSet,
    WorkspacePagesDescriptionViewSet,
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
        "workspaces/<str:slug>/pages/",
        WorkspacePageViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="workspace-pages",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:pk>/",
        WorkspacePageViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="workspace-pages",
    ),
    # favorite pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/favorite-pages/<uuid:pk>/",
        PageFavoriteViewSet.as_view(
            {
                "post": "create",
                "delete": "destroy",
            }
        ),
        name="user-favorite-pages",
    ),
    # archived pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/archive/",
        PageViewSet.as_view(
            {
                "post": "archive",
                "delete": "unarchive",
            }
        ),
        name="project-page-archive-unarchive",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:pk>/archive/",
        WorkspacePageViewSet.as_view(
            {
                "post": "archive",
                "delete": "unarchive",
            }
        ),
        name="workspace-page-archive-unarchive",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/pages/<uuid:pk>/lock/",
        WorkspacePageViewSet.as_view(
            {
                "post": "lock",
                "delete": "unlock",
            }
        ),
        name="workspace-pages-lock-unlock",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/transactions/",
        PageLogEndpoint.as_view(),
        name="page-transactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/transactions/<uuid:transaction>/",
        PageLogEndpoint.as_view(),
        name="page-transactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/sub-pages/",
        SubPagesEndpoint.as_view(),
        name="sub-page",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/description/",
        PagesDescriptionViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
            }
        ),
        name="page-description",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:pk>/description/",
        WorkspacePagesDescriptionViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
            }
        ),
        name="page-description",
    ),
]
