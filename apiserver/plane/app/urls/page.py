from django.urls import path


from plane.app.views import (
    PageViewSet,
    PageFavoriteViewSet,
    PageLogEndpoint,
    SubPagesEndpoint,
    PagesDescriptionViewSet,
    PageVersionEndpoint,
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
    # lock and unlock
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/lock/",
        PageViewSet.as_view(
            {
                "post": "lock",
                "delete": "unlock",
            }
        ),
        name="project-pages-lock-unlock",
    ),
    # private and public page
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/access/",
        PageViewSet.as_view(
            {
                "post": "access",
            }
        ),
        name="project-pages-access",
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/",
        PageVersionEndpoint.as_view(),
        name="page-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/<uuid:pk>/",
        PageVersionEndpoint.as_view(),
        name="page-versions",
    ),
]
