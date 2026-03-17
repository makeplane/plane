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

from plane.api.views import (
    IssueActivityDetailAPIEndpoint,
    IssueActivityListAPIEndpoint,
    IssueAttachmentDetailAPIEndpoint,
    IssueAttachmentListCreateAPIEndpoint,
    IssueAttachmentServerEndpoint,
    IssueCommentDetailAPIEndpoint,
    IssueCommentListCreateAPIEndpoint,
    IssueDetailAPIEndpoint,
    IssueLinkDetailAPIEndpoint,
    IssueLinkListCreateAPIEndpoint,
    IssueListCreateAPIEndpoint,
    IssueRelationListCreateAPIEndpoint,
    IssueRelationRemoveAPIEndpoint,
    IssueSearchEndpoint,
    IssueVoteAPIEndpoint,
    WorkItemAdvancedSearchEndpoint,
    WorkItemCreateAPIEndpoint,
    WorkItemPageListCreateAPIEndpoint,
    WorkItemPageDetailAPIEndpoint,
    WorkItemPropertiesAPIEndpoint,
    WorkItemTypeSchemaAPIEndpoint,
    WorkspaceIssueAPIEndpoint,
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
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-attachments/server/",
        IssueAttachmentServerEndpoint.as_view(),
        name="attachment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-attachments/<uuid:pk>/server/",
        IssueAttachmentServerEndpoint.as_view(),
        name="attachment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/relations/",
        IssueRelationListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="relation",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/relations/remove/",
        IssueRelationRemoveAPIEndpoint.as_view(http_method_names=["post"]),
        name="relation",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/votes/",
        IssueVoteAPIEndpoint.as_view(http_method_names=["get", "post", "delete"]),
        name="issue-vote",
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
        "workspaces/<str:slug>/work-items/<str:project_identifier>-<int:issue_identifier>/",
        WorkspaceIssueAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-by-identifier",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/",
        IssueListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:pk>/",
        IssueDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-detail",
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/attachments/server/",
        IssueAttachmentServerEndpoint.as_view(),
        name="work-item-attachment-server",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/attachments/<uuid:pk>/server/",
        IssueAttachmentServerEndpoint.as_view(),
        name="work-item-attachment-server",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/relations/",
        IssueRelationListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-relation-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/relations/remove/",
        IssueRelationRemoveAPIEndpoint.as_view(http_method_names=["post"]),
        name="work-item-relation-remove",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/votes/",
        IssueVoteAPIEndpoint.as_view(http_method_names=["get", "post", "delete"]),
        name="work-item-vote",
    ),
]

work_item_page_url_patterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:work_item_id>/pages/",
        WorkItemPageListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-page-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:work_item_id>/pages/<uuid:pk>/",
        WorkItemPageDetailAPIEndpoint.as_view(http_method_names=["get", "delete"]),
        name="work-item-page-detail",
    ),
]

advanced_search_url_patterns = [
    path(
        "workspaces/<str:slug>/work-items/advanced-search/",
        WorkItemAdvancedSearchEndpoint.as_view(http_method_names=["post"]),
        name="work-item-advanced-search",
    ),
]

work_item_properties_url_patterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:pk>/properties/",
        WorkItemPropertiesAPIEndpoint.as_view(http_method_names=["get", "patch"]),
        name="work-item-properties",
    ),
]

work_item_type_schema_url_patterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-types/schema/",
        WorkItemTypeSchemaAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-type-schema",
    ),
]

work_item_create_url_patterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/create/",
        WorkItemCreateAPIEndpoint.as_view(http_method_names=["post"]),
        name="work-item-create",
    ),
]

urlpatterns = (
    old_url_patterns
    + new_url_patterns
    + work_item_page_url_patterns
    + advanced_search_url_patterns
    + work_item_properties_url_patterns
    + work_item_type_schema_url_patterns
    + work_item_create_url_patterns
)
