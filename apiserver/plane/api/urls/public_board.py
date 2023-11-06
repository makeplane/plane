from django.urls import path


from plane.api.views import (
    ProjectDeployBoardViewSet,
    ProjectDeployBoardPublicSettingsEndpoint,
    ProjectIssuesPublicEndpoint,
    IssueRetrievePublicEndpoint,
    IssueCommentPublicViewSet,
    IssueReactionPublicViewSet,
    CommentReactionPublicViewSet,
    InboxIssuePublicViewSet,
    IssueVotePublicViewSet,
    WorkspaceProjectDeployBoardEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-deploy-boards/",
        ProjectDeployBoardViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-deploy-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-deploy-boards/<uuid:pk>/",
        ProjectDeployBoardViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-deploy-board",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/settings/",
        ProjectDeployBoardPublicSettingsEndpoint.as_view(),
        name="project-deploy-board-settings",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/",
        ProjectIssuesPublicEndpoint.as_view(),
        name="project-deploy-board",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/",
        IssueRetrievePublicEndpoint.as_view(),
        name="workspace-project-boards",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/comments/",
        IssueCommentPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="issue-comments-project-board",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/comments/<uuid:pk>/",
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
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/reactions/",
        IssueReactionPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="issue-reactions-project-board",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/reactions/<str:reaction_code>/",
        IssueReactionPublicViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="issue-reactions-project-board",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/comments/<uuid:comment_id>/reactions/",
        CommentReactionPublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="comment-reactions-project-board",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        CommentReactionPublicViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="comment-reactions-project-board",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/inboxes/<uuid:inbox_id>/inbox-issues/",
        InboxIssuePublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="inbox-issue",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/inboxes/<uuid:inbox_id>/inbox-issues/<uuid:pk>/",
        InboxIssuePublicViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="inbox-issue",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/<uuid:project_id>/issues/<uuid:issue_id>/votes/",
        IssueVotePublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
                "delete": "destroy",
            }
        ),
        name="issue-vote-project-board",
    ),
    path(
        "public/workspaces/<str:slug>/project-boards/",
        WorkspaceProjectDeployBoardEndpoint.as_view(),
        name="workspace-project-boards",
    ),
]
