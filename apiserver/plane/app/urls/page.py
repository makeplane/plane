from django.urls import path


from plane.app.views import (
    PageViewSet,
    ProjectPageUserViewSet,
    PageFavoriteViewSet,
    PageLogEndpoint,
    PagesDescriptionViewSet,
    PageVersionEndpoint,
    PageDuplicateEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageViewSet.as_view({"get": "list", "post": "create"}),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/",
        PageViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/sub-pages/",
        PageViewSet.as_view({"get": "sub_pages"}),
        name="project-sub-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/parent-pages/",
        PageViewSet.as_view({"get": "parent_pages"}),
        name="project-parent-pages",
    ),
    # favorite pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/favorite-pages/<uuid:pk>/",
        PageFavoriteViewSet.as_view({"post": "create", "delete": "destroy"}),
        name="user-favorite-pages",
    ),
    # Lock
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/lock/",
        PageViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="project-page-lock-unlock",
    ),
    # archived pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/archive/",
        PageViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="project-page-archive-unarchive",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/lock/",
        PageViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="project-pages-lock-unlock",
    ),
    # private and public page
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/access/",
        PageViewSet.as_view({"post": "access"}),
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/description/",
        PagesDescriptionViewSet.as_view({"get": "retrieve", "patch": "partial_update"}),
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
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/duplicate/",
        PageDuplicateEndpoint.as_view(),
        name="page-duplicate",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/share/",
        ProjectPageUserViewSet.as_view({"post": "create", "get": "list"}),
        name="project-page-shared",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/share/<uuid:user_id>/",
        ProjectPageUserViewSet.as_view(
            {"patch": "partial_update", "delete": "destroy"}
        ),
        name="project-page-shared",
    ),
]
