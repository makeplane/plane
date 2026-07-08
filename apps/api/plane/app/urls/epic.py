# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    EpicViewSet,
    EpicListEndpoint,
    EpicDetailEndpoint,
    EpicPaginatedViewSet,
    EpicIssuesEndpoint,
    IssueLinkViewSet,
    IssueCommentViewSet,
    IssueActivityEndpoint,
    IssueReactionViewSet,
    IssueSubscriberViewSet,
    IssuePageEndpoint,
    IssueAttachmentV2Endpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/list/",
        EpicListEndpoint.as_view(),
        name="project-epics",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/",
        EpicViewSet.as_view({"get": "list", "post": "create"}),
        name="project-epics",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics-detail/",
        EpicDetailEndpoint.as_view(),
        name="project-epics-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/v2/epics/",
        EpicPaginatedViewSet.as_view({"get": "list"}),
        name="project-epics-paginated",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:pk>/",
        EpicViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-epics",
    ),
    ## Epic work items (children)
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/issues/",
        EpicIssuesEndpoint.as_view(),
        name="epic-issues",
    ),
    ## Epic links
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/links/",
        IssueLinkViewSet.as_view({"get": "list", "post": "create"}),
        name="project-epic-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/links/<uuid:pk>/",
        IssueLinkViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-epic-links",
    ),
    ## Epic activity / history
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/history/",
        IssueActivityEndpoint.as_view(),
        name="project-epic-history",
    ),
    ## Epic comments
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/comments/",
        IssueCommentViewSet.as_view({"get": "list", "post": "create"}),
        name="project-epic-comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/comments/<uuid:pk>/",
        IssueCommentViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-epic-comment",
    ),
    ## Epic reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/reactions/",
        IssueReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="project-epic-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/reactions/<str:reaction_code>/",
        IssueReactionViewSet.as_view({"delete": "destroy"}),
        name="project-epic-reactions",
    ),
    ## Epic subscription
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/subscribe/",
        IssueSubscriberViewSet.as_view({"get": "subscription_status", "post": "subscribe", "delete": "unsubscribe"}),
        name="project-epic-subscribers",
    ),
    ## Epic pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/issue-pages/",
        IssuePageEndpoint.as_view(),
        name="project-epic-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/issue-pages/<uuid:page_id>/",
        IssuePageEndpoint.as_view(),
        name="project-epic-pages",
    ),
    ## Epic attachments (V2)
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/attachments/",
        IssueAttachmentV2Endpoint.as_view(),
        name="project-epic-attachments",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:issue_id>/attachments/<uuid:pk>/",
        IssueAttachmentV2Endpoint.as_view(),
        name="project-epic-attachments",
    ),
]
