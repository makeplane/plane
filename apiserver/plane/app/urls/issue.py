from django.urls import path


from plane.app.views import (
    IssueViewSet,
    LabelViewSet,
    BulkCreateIssueLabelsEndpoint,
    BulkDeleteIssuesEndpoint,
    BulkImportIssuesEndpoint,
    UserWorkSpaceIssues,
    SubIssuesEndpoint,
    IssueLinkViewSet,
    IssueAttachmentEndpoint,
    ExportIssuesEndpoint,
    IssueActivityEndpoint,
    IssueCommentViewSet,
    IssueSubscriberViewSet,
    IssueReactionViewSet,
    CommentReactionViewSet,
    IssueUserDisplayPropertyEndpoint,
    IssueArchiveViewSet,
    IssueRelationViewSet,
    IssueDraftViewSet,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/",
        IssueViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:pk>/",
        IssueViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-labels/",
        LabelViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-labels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-labels/<uuid:pk>/",
        LabelViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-labels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-create-labels/",
        BulkCreateIssueLabelsEndpoint.as_view(),
        name="project-bulk-labels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-delete-issues/",
        BulkDeleteIssuesEndpoint.as_view(),
        name="project-issues-bulk",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-import-issues/<str:service>/",
        BulkImportIssuesEndpoint.as_view(),
        name="project-issues-bulk",
    ),
    path(
        "workspaces/<str:slug>/my-issues/",
        UserWorkSpaceIssues.as_view(),
        name="workspace-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/sub-issues/",
        SubIssuesEndpoint.as_view(),
        name="sub-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-links/",
        IssueLinkViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-links/<uuid:pk>/",
        IssueLinkViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-attachments/",
        IssueAttachmentEndpoint.as_view(),
        name="project-issue-attachments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-attachments/<uuid:pk>/",
        IssueAttachmentEndpoint.as_view(),
        name="project-issue-attachments",
    ),
    path(
        "workspaces/<str:slug>/export-issues/",
        ExportIssuesEndpoint.as_view(),
        name="export-issues",
    ),
    ## End Issues
    ## Issue Activity
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/history/",
        IssueActivityEndpoint.as_view(),
        name="project-issue-history",
    ),
    ## Issue Activity
    ## IssueComments
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/",
        IssueCommentViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/<uuid:pk>/",
        IssueCommentViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-comment",
    ),
    ## End IssueComments
    # Issue Subscribers
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-subscribers/",
        IssueSubscriberViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-subscribers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-subscribers/<uuid:subscriber_id>/",
        IssueSubscriberViewSet.as_view({"delete": "destroy"}),
        name="project-issue-subscribers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/subscribe/",
        IssueSubscriberViewSet.as_view(
            {
                "get": "subscription_status",
                "post": "subscribe",
                "delete": "unsubscribe",
            }
        ),
        name="project-issue-subscribers",
    ),
    ## End Issue Subscribers
    # Issue Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/reactions/",
        IssueReactionViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/reactions/<str:reaction_code>/",
        IssueReactionViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="project-issue-reactions",
    ),
    ## End Issue Reactions
    # Comment Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/comments/<uuid:comment_id>/reactions/",
        CommentReactionViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-comment-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        CommentReactionViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="project-issue-comment-reactions",
    ),
    ## End Comment Reactions
    ## IssueProperty
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-properties/",
        IssueUserDisplayPropertyEndpoint.as_view(),
        name="project-issue-display-properties",
    ),
    ## IssueProperty End
    ## Issue Archives
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-issues/",
        IssueArchiveViewSet.as_view(
            {
                "get": "list",
            }
        ),
        name="project-issue-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-issues/<uuid:pk>/",
        IssueArchiveViewSet.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
            }
        ),
        name="project-issue-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/unarchive/<uuid:pk>/",
        IssueArchiveViewSet.as_view(
            {
                "post": "unarchive",
            }
        ),
        name="project-issue-archive",
    ),
    ## End Issue Archives
    ## Issue Relation
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-relation/",
        IssueRelationViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="issue-relation",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/remove-relation/",
        IssueRelationViewSet.as_view(
            {
                "post": "remove_relation",
            }
        ),
        name="issue-relation",
    ),
    ## End Issue Relation
    ## Issue Drafts
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-drafts/",
        IssueDraftViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-draft",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-drafts/<uuid:pk>/",
        IssueDraftViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-draft",
    ),
]
