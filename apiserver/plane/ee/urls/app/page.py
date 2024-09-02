from django.urls import path

from plane.ee.views import (
    ProjectPagePublishEndpoint,
    WorkspacePagePublishEndpoint,
    WorkspacePageViewSet,
    WorkspacePagesDescriptionViewSet,
    WorkspacePageVersionEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/publish/",
        ProjectPagePublishEndpoint.as_view(),
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/publish/",
        WorkspacePagePublishEndpoint.as_view(),
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
    # private and public page
    path(
        "workspaces/<str:slug>/pages/<uuid:pk>/access/",
        WorkspacePageViewSet.as_view(
            {
                "post": "access",
            }
        ),
        name="project-pages-access",
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
        "workspaces/<str:slug>/pages/<uuid:pk>/description/",
        WorkspacePagesDescriptionViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
            }
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
]
