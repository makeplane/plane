# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    IssueListCreateAPIEndpoint,
    IssueDetailAPIEndpoint,
    IssueLinkListCreateAPIEndpoint,
    IssueLinkDetailAPIEndpoint,
    IssueCommentListCreateAPIEndpoint,
    IssueCommentDetailAPIEndpoint,
    IssueActivityListAPIEndpoint,
    IssueActivityDetailAPIEndpoint,
    IssueAttachmentListCreateAPIEndpoint,
    IssueAttachmentDetailAPIEndpoint,
    WorkspaceIssueAPIEndpoint,
    IssueSearchEndpoint,
    IssueCountEndpoint,
    IssueRelationListCreateAPIEndpoint,
    WorkItemDependencyListCreateAPIEndpoint,
    WorkItemDependencyDetailAPIEndpoint,
    WorkItemCustomRelationListAPIEndpoint,
    WorkItemCustomRelationDetailAPIEndpoint,
    WorkItemRelationDefinitionListAPIEndpoint,
    IssueArchiveUnarchiveAPIEndpoint,
)

# Deprecated url patterns
old_url_patterns = [
    path(
        "workspaces/<str:slug>/issues/search/",
        IssueSearchEndpoint.as_view(http_method_names=["get"]),
        name="issue-search",
    ),
    path(
        "workspaces/<str:slug>/issues/<str:project_identifier>-<str:issue_identifier>/",
        WorkspaceIssueAPIEndpoint.as_view(http_method_names=["get"]),
        name="issue-by-identifier",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/",
        IssueListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:pk>/",
        IssueDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/links/",
        IssueLinkListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="link",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/links/<uuid:pk>/",
        IssueLinkDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="link",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/",
        IssueCommentListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/<uuid:pk>/",
        IssueCommentDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/activities/",
        IssueActivityListAPIEndpoint.as_view(http_method_names=["get"]),
        name="activity",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/activities/<uuid:pk>/",
        IssueActivityDetailAPIEndpoint.as_view(http_method_names=["get"]),
        name="activity",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-attachments/",
        IssueAttachmentListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="attachment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-attachments/<uuid:pk>/",
        IssueAttachmentDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="issue-attachment",
    ),
]

# New url patterns with work-items as the prefix
new_url_patterns = [
    path(
        "workspaces/<str:slug>/work-items/search/",
        IssueSearchEndpoint.as_view(http_method_names=["get"]),
        name="work-item-search",
    ),
    path(
        "workspaces/<str:slug>/work-items/count/",
        IssueCountEndpoint.as_view(http_method_names=["get"]),
        name="work-item-count",
    ),
    path(
        "workspaces/<str:slug>/work-item-relation-definitions/",
        WorkItemRelationDefinitionListAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-relation-definition-list",
    ),
    path(
        "workspaces/<str:slug>/work-items/<str:project_identifier>-<str:issue_identifier>/",
        WorkspaceIssueAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-by-identifier",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/",
        IssueListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-work-items/",
        IssueArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-archived-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:pk>/",
        IssueDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:pk>/archive/",
        IssueArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["post"]),
        name="work-item-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:pk>/unarchive/",
        IssueArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["delete"]),
        name="work-item-unarchive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/links/",
        IssueLinkListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-link-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/links/<uuid:pk>/",
        IssueLinkDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-link-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/comments/",
        IssueCommentListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-comment-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/comments/<uuid:pk>/",
        IssueCommentDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-comment-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/activities/",
        IssueActivityListAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-activity-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/activities/<uuid:pk>/",
        IssueActivityDetailAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-activity-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/attachments/",
        IssueAttachmentListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-attachment-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/attachments/<uuid:pk>/",
        IssueAttachmentDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-attachment-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/relations/",
        IssueRelationListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-relation-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/dependencies/",
        WorkItemDependencyListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-dependency-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/dependencies/<uuid:related_issue_id>/",
        WorkItemDependencyDetailAPIEndpoint.as_view(http_method_names=["delete"]),
        name="work-item-dependency-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/work-item-relations/",
        WorkItemCustomRelationListAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-custom-relation-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/work-item-relations/<uuid:related_issue_id>/",
        WorkItemCustomRelationDetailAPIEndpoint.as_view(http_method_names=["delete"]),
        name="work-item-custom-relation-detail",
    ),
]

urlpatterns = old_url_patterns + new_url_patterns
