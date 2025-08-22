from django.urls import path

from plane.ee.views import (
    ProjectPagePublishEndpoint,
    WorkspacePagePublishEndpoint,
    WorkspacePageViewSet,
    WorkspacePagesDescriptionViewSet,
    WorkspacePageVersionEndpoint,
    WorkspacePageFavoriteEndpoint,
    WorkspacePageDuplicateEndpoint,
    MovePageEndpoint,
    PagesLiveServerDescriptionViewSet,
    PagesLiveServerSubPagesViewSet,
    WorkspacePageRestoreEndpoint,
    WorkspacePageUserViewSet,
    ProjectPageUserViewSet,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/pages/",
        WorkspacePageViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-pages",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/",
        WorkspacePageViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="workspace-pages",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/duplicate/",
        WorkspacePageDuplicateEndpoint.as_view(),
        name="workspace-page-duplicate",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/publish/",
        WorkspacePagePublishEndpoint.as_view(),
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/archive/",
        WorkspacePageViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="workspace-page-archive-unarchive",
    ),
    # private and public page
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/access/",
        WorkspacePageViewSet.as_view({"post": "access"}),
        name="project-pages-access",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/lock/",
        WorkspacePageViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="workspace-pages-lock-unlock",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/description/",
        WorkspacePagesDescriptionViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update"}
        ),
        name="page-description",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/versions/",
        WorkspacePageVersionEndpoint.as_view(),
        name="workspace-page-version",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/versions/<uuid:pk>/",
        WorkspacePageVersionEndpoint.as_view(),
        name="workspace-page-version",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/versions/<uuid:pk>/restore/",
        WorkspacePageRestoreEndpoint.as_view(),
        name="workspace-pages-restore",
    ),
    path(
        "workspaces/<str:slug>/favorite-pages/<uuid:page_id>/",
        WorkspacePageFavoriteEndpoint.as_view(),
        name="page-favorites",
    ),
    path(
        "pages/<uuid:page_id>/sub-pages/",
        PagesLiveServerSubPagesViewSet.as_view({"get": "list"}),
        name="page-secret-sub-pages",
    ),
    path(
        "pages/<uuid:page_id>/description/",
        PagesLiveServerDescriptionViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update"}
        ),
        name="page-secret-description",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/sub-pages/",
        WorkspacePageViewSet.as_view({"get": "sub_pages"}),
        name="workspace-sub-pages",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/parent-pages/",
        WorkspacePageViewSet.as_view({"get": "parent_pages"}),
        name="workspace-parent-pages",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/share/",
        WorkspacePageUserViewSet.as_view({"post": "create", "get": "list"}),
        name="workspace-shared-page",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/share/<uuid:user_id>/",
        WorkspacePageUserViewSet.as_view(
            {"patch": "partial_update", "delete": "destroy"}
        ),
        name="workspace-shared-page",
    ),
    ## EE project level
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/publish/",
        ProjectPagePublishEndpoint.as_view(),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/move/",
        MovePageEndpoint.as_view(),
        name="move-page",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/share/",
        ProjectPageUserViewSet.as_view({"post": "create", "get": "list"}),
        name="project-page-shared",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/share/<uuid:user_id>/",
        ProjectPageUserViewSet.as_view(
            {"patch": "partial_update", "delete": "destroy"}
        ),
        name="project-page-shared",
    ),
]
