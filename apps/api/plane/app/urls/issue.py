# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from django.urls import path

from plane.app.views import (
    BulkCreateIssueLabelsEndpoint,
    BulkDeleteIssuesEndpoint,
    SubIssuesEndpoint,
    IssueLinkViewSet,
    IssueAttachmentEndpoint,
    CommentReactionViewSet,
    IssueActivityEndpoint,
    IssueArchiveViewSet,
    IssueCommentViewSet,
    IssueListEndpoint,
    IssueReactionViewSet,
    IssueSubscriberViewSet,
    ProjectUserDisplayPropertyEndpoint,
    IssueViewSet,
    LabelViewSet,
    DeletedIssuesListViewSet,
    IssuePaginatedViewSet,
    IssueDetailEndpoint,
    IssueAttachmentV2Endpoint,
    IssueBulkUpdateDateEndpoint,
    IssueVersionEndpoint,
    WorkItemDescriptionVersionEndpoint,
    IssueMetaEndpoint,
    IssueDetailIdentifierEndpoint,
    IssueCommentRepliesEndpoint,
    IssueListMetaEndpoint,
    # relation definitions
    WorkItemRelationDefinitionViewSet,
    # relations
    IssueRelationViewSet,  # deprecated
    WorkItemRelationDependencyViewSet,
    WorkItemRelationRelationViewSet,
)

all_urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/list/",
        IssueListEndpoint.as_view(),
        name="project-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/",
        IssueViewSet.as_view({"get": "list", "post": "create"}),
        name="project-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues-detail/",
        IssueDetailEndpoint.as_view(),
        name="project-issue-detail",
    ),
    # updated v1 paginated issues
    # updated v2 paginated issues
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/v2/issues/",
        IssuePaginatedViewSet.as_view({"get": "list"}),
        name="project-issues-paginated",
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
        LabelViewSet.as_view({"get": "list", "post": "create"}),
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
    ##
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/sub-issues/",
        SubIssuesEndpoint.as_view(),
        name="sub-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-links/",
        IssueLinkViewSet.as_view({"get": "list", "post": "create"}),
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
    # V2 Attachments
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/attachments/",
        IssueAttachmentV2Endpoint.as_view(),
        name="project-issue-attachments",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/attachments/<uuid:pk>/",
        IssueAttachmentV2Endpoint.as_view(),
        name="project-issue-attachments",
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
        IssueCommentViewSet.as_view({"get": "list", "post": "create"}),
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
    ## Issue comment reply
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/<uuid:pk>/replies/",
        IssueCommentRepliesEndpoint.as_view(),
        name="issue-comment-replies",
    ),
    ## End Issue comment reply
    # Issue Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/reactions/",
        IssueReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="project-issue-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/reactions/<str:reaction_code>/",
        IssueReactionViewSet.as_view({"delete": "destroy"}),
        name="project-issue-reactions",
    ),
    ## End Issue Reactions
    # Comment Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/comments/<uuid:comment_id>/reactions/",
        CommentReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="project-issue-comment-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        CommentReactionViewSet.as_view({"delete": "destroy"}),
        name="project-issue-comment-reactions",
    ),
    ## End Comment Reactions
    ## ProjectUserProperty
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-properties/",
        ProjectUserDisplayPropertyEndpoint.as_view(),
        name="project-user-display-properties",
    ),
    ## ProjectUserProperty End
    ## Issue Archives
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-issues/",
        IssueArchiveViewSet.as_view({"get": "list"}),
        name="project-issue-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:pk>/archive/",
        IssueArchiveViewSet.as_view({"get": "retrieve", "post": "archive", "delete": "unarchive"}),
        name="project-issue-archive-unarchive",
    ),
    ## End Issue Archives
    ## Issue Relation
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-relation/",
        IssueRelationViewSet.as_view({"get": "list", "post": "create"}),
        name="issue-relation",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/remove-relation/",
        IssueRelationViewSet.as_view({"post": "remove_relation"}),
        name="issue-relation",
    ),
    ## End Issue Relation
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/deleted-issues/",
        DeletedIssuesListViewSet.as_view(),
        name="deleted-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-dates/",
        IssueBulkUpdateDateEndpoint.as_view(),
        name="project-issue-dates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/versions/",
        IssueVersionEndpoint.as_view(),
        name="issue-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/versions/<uuid:pk>/",
        IssueVersionEndpoint.as_view(),
        name="issue-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:work_item_id>/description-versions/",
        WorkItemDescriptionVersionEndpoint.as_view(),
        name="work-item-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:work_item_id>/description-versions/<uuid:pk>/",
        WorkItemDescriptionVersionEndpoint.as_view(),
        name="work-item-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/meta/",
        IssueListMetaEndpoint.as_view(),
        name="issue-meta",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/meta/",
        IssueMetaEndpoint.as_view(),
        name="issue-meta",
    ),
    path(
        "workspaces/<str:slug>/work-items/<str:project_identifier>-<str:issue_identifier>/",
        IssueDetailIdentifierEndpoint.as_view(),
        name="issue-detail-identifier",
    ),
    # work item relation definitions
    path(
        "workspaces/<str:slug>/work-item-relation-definitions/",
        WorkItemRelationDefinitionViewSet.as_view({"get": "list", "post": "create"}),
        name="work-item-relation-definition-list",
    ),
    path(
        "workspaces/<str:slug>/work-item-relation-definitions/<uuid:pk>/",
        WorkItemRelationDefinitionViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="work-item-relation-definition-detail",
    ),
    # work item relations
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:work_item_id>/relation-dependencies/",
        WorkItemRelationDependencyViewSet.as_view(
            {"get": "list", "post": "create_relation", "delete": "remove_relation"}
        ),
        name="work-item-relation-dependency",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:work_item_id>/relations/",
        WorkItemRelationRelationViewSet.as_view(
            {"get": "list", "post": "create_relation", "delete": "remove_relation"}
        ),
        name="work-item-relation-relation",
    ),
]

issue_subscriber_urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/subscribers/",
        IssueSubscriberViewSet.as_view({"get": "list", "patch": "update"}),
        name="project-issue-subscribers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/subscribers/me/",
        IssueSubscriberViewSet.as_view({"get": "subscription_status", "post": "subscribe", "delete": "unsubscribe"}),
        name="project-issue-subscribers",
    ),
]

urlpatterns = all_urlpatterns + issue_subscriber_urlpatterns
