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
    WorkspacePageCommentViewSet,
    WorkspacePageCommentReactionViewSet,
    ProjectPageCommentViewSet,
    ProjectPageCommentReactionViewSet,
    ProjectPageUserViewSet,
    ProjectPageRestoreEndpoint,
    PageExtendedViewSet,
    PageFavoriteExtendedViewSet,
    PagesDescriptionExtendedViewSet,
    PageDuplicateExtendedEndpoint,
    PageVersionExtendedEndpoint,
    WorkspacePageLiveServerEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/pages/",
        WorkspacePageViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-pages",
    ),
    path(
        "workspaces/<str:slug>/pages-summary/",
        WorkspacePageViewSet.as_view({"get": "summary"}),
        name="api-pages-bulk-operation",
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
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/comments/",
        WorkspacePageCommentViewSet.as_view({"post": "create", "get": "list"}),
        name="workspace-page-comments",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/comments/<uuid:comment_id>/resolve/",
        WorkspacePageCommentViewSet.as_view({"post": "resolve"}),
        name="workspace-page-comments-resolve",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/comments/<uuid:comment_id>/un-resolve/",
        WorkspacePageCommentViewSet.as_view({"post": "un_resolve"}),
        name="workspace-page-comments-un-resolve",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/comments/<uuid:comment_id>/",
        WorkspacePageCommentViewSet.as_view(
            {"patch": "partial_update", "delete": "destroy", "get": "list"}
        ),
        name="workspace-page-comments",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/comments/<uuid:comment_id>/restore/",
        WorkspacePageCommentViewSet.as_view({"post": "restore"}),
        name="workspace-page-comments-restore",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/comments/<uuid:comment_id>/replies/",
        WorkspacePageCommentViewSet.as_view({"get": "replies"}),
        name="workspace-page-comments-replies",
    ),
    # Comment Reactions
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/comments/<uuid:comment_id>/reactions/",
        WorkspacePageCommentReactionViewSet.as_view({"post": "create"}),
        name="workspace-page-comment-reactions",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        WorkspacePageCommentReactionViewSet.as_view({"delete": "destroy"}),
        name="workspace-page-comment-reactions",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:page_id>/page-comments/",
        WorkspacePageLiveServerEndpoint.as_view({"get": "list"}),
        name="workspace-page-live-server",
    ),
    ## End Comment Reactions
    # community urls which are overwritten in EE
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageExtendedViewSet.as_view({"get": "list", "post": "create"}),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages-summary/",
        PageExtendedViewSet.as_view({"get": "summary"}),
        name="api-pages-bulk-operation",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/",
        PageExtendedViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-pages",
    ),
    # archived pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/archive/",
        PageExtendedViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="project-page-archive-unarchive",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/lock/",
        PageExtendedViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="project-pages-lock-unlock",
    ),
    # private and public page
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/access/",
        PageExtendedViewSet.as_view({"post": "access"}),
        name="project-pages-access",
    ),
    # favorite pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/favorite-pages/<uuid:page_id>/",
        PageFavoriteExtendedViewSet.as_view({"post": "create", "delete": "destroy"}),
        name="user-favorite-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/description/",
        PagesDescriptionExtendedViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update"}
        ),
        name="page-description",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/",
        PageVersionExtendedEndpoint.as_view(),
        name="page-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/<uuid:pk>/",
        PageVersionExtendedEndpoint.as_view(),
        name="page-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/duplicate/",
        PageDuplicateExtendedEndpoint.as_view(),
        name="page-duplicate",
    ),
    # Community urls which are overwritten in EE
    ## EE project level
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/sub-pages/",
        PageExtendedViewSet.as_view({"get": "sub_pages"}),
        name="project-sub-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/parent-pages/",
        PageExtendedViewSet.as_view({"get": "parent_pages"}),
        name="project-parent-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/<uuid:pk>/restore/",
        ProjectPageRestoreEndpoint.as_view(),
        name="project-page-restore",
    ),
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/comments/",
        ProjectPageCommentViewSet.as_view({"post": "create", "get": "list"}),
        name="project-page-comments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/comments/<uuid:comment_id>/",
        ProjectPageCommentViewSet.as_view(
            {"get": "list", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-page-comments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/comments/<uuid:comment_id>/resolve/",
        ProjectPageCommentViewSet.as_view({"post": "resolve"}),
        name="project-page-comments-resolve",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/comments/<uuid:comment_id>/un-resolve/",
        ProjectPageCommentViewSet.as_view({"post": "un_resolve"}),
        name="project-page-comments-un-resolve",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/comments/<uuid:comment_id>/restore/",
        ProjectPageCommentViewSet.as_view({"post": "restore"}),
        name="project-page-comments-restore",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/comments/<uuid:comment_id>/replies/",
        ProjectPageCommentViewSet.as_view({"get": "replies"}),
        name="project-page-comments-replies",
    ),
    # # Comment Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/comments/<uuid:comment_id>/reactions/",
        ProjectPageCommentReactionViewSet.as_view({"post": "create"}),
        name="project-page-comment-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        ProjectPageCommentReactionViewSet.as_view({"delete": "destroy"}),
        name="project-page-comment-reactions",
    ),
    ## End Comment
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
