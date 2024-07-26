from django.urls import path


from plane.space.views import (
    IssueRetrievePublicEndpoint,
    IssueCommentPublicViewSet,
    IssueReactionPublicViewSet,
    CommentReactionPublicViewSet,
    IssueVotePublicViewSet,
)

urlpatterns = [
    path(
        "anchor/<str:anchor>/issues/<uuid:issue_id>/",
        IssueRetrievePublicEndpoint.as_view(),
        name="workspace-project-boards",
    ),
    path(
        "anchor/<str:anchor>/issues/<uuid:issue_id>/comments/",
        IssueCommentPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="issue-comments-project-board",
    ),
    path(
        "anchor/<str:anchor>/issues/<uuid:issue_id>/comments/<uuid:pk>/",
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
        "anchor/<str:anchor>/issues/<uuid:issue_id>/reactions/",
        IssueReactionPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="issue-reactions-project-board",
    ),
    path(
        "anchor/<str:anchor>/issues/<uuid:issue_id>/reactions/<str:reaction_code>/",
        IssueReactionPublicViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="issue-reactions-project-board",
    ),
    path(
        "anchor/<str:anchor>/comments/<uuid:comment_id>/reactions/",
        CommentReactionPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="comment-reactions-project-board",
    ),
    path(
        "anchor/<str:anchor>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        CommentReactionPublicViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="comment-reactions-project-board",
    ),
    path(
        "anchor/<str:anchor>/issues/<uuid:issue_id>/votes/",
        IssueVotePublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
                "delete": "destroy",
            }
        ),
        name="issue-vote-project-board",
    ),
]
