from django.urls import path


from plane.space.views import (
    IssueRetrievePublicEndpoint,
    IssueCommentPublicViewSet,
    IssueReactionPublicViewSet,
    CommentReactionPublicViewSet,
    CommentAssetPublicEndpoint,
    IssueAttachmentPublicEndpoint
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/",
        IssueRetrievePublicEndpoint.as_view(),
        name="workspace-project-boards",
    ),
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/comments/",
        IssueCommentPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="issue-comments-project-board",
    ),
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/comments/<uuid:pk>/",
        IssueCommentPublicViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="issue-comments-project-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/attachments/",
        IssueAttachmentPublicEndpoint.as_view(),
        name="project-issue-attachments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/attachments/<uuid:workspace_id>/<str:asset_key>/",
        IssueAttachmentPublicEndpoint.as_view(),
        name="project-issue-attachments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/comments/<uuid:comment_id>/attachments/",
        CommentAssetPublicEndpoint.as_view(),
        name="issue-comments-project-board-attachments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/comments/<uuid:comment_id>/attachments/<uuid:workspace_id>/<str:asset_key>/",
        CommentAssetPublicEndpoint.as_view(),
        name="issue-comments-project-board-attachments",
    ),
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/reactions/",
        IssueReactionPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="issue-reactions-project-board",
    ),
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/reactions/<str:reaction_code>/",
        IssueReactionPublicViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="issue-reactions-project-board",
    ),
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/comments/<uuid:comment_id>/reactions/",
        CommentReactionPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="comment-reactions-project-board",
    ),
    path(
        "workspaces/<str:slug>/project-boards/<uuid:project_id>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        CommentReactionPublicViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="comment-reactions-project-board",
    ),
]
