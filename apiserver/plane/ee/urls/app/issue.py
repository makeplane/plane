from django.urls import path

from plane.ee.views.app import (
    BulkIssueOperationsEndpoint,
    BulkArchiveIssuesEndpoint,
    BulkSubscribeIssuesEndpoint,
    IssueWorkLogsEndpoint,
    IssueTotalWorkLogEndpoint,
    IssueConvertEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-operation-issues/",
        BulkIssueOperationsEndpoint.as_view(),
        name="bulk-operations-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-archive-issues/",
        BulkArchiveIssuesEndpoint.as_view(),
        name="bulk-archive-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-subscribe-issues/",
        BulkSubscribeIssuesEndpoint.as_view(),
        name="bulk-subscribe-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/worklogs/",
        IssueWorkLogsEndpoint.as_view(),
        name="issue-work-logs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/worklogs/<uuid:pk>/",
        IssueWorkLogsEndpoint.as_view(),
        name="issue-work-logs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/total-worklogs/",
        IssueTotalWorkLogEndpoint.as_view(),
        name="issue-work-logs",
    ),
    # Issue Convertion Endpoint
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/conversion/<uuid:entity_id>/",
        IssueConvertEndpoint.as_view(),
        name="issue-conversion",
    ),
    # End Issue Convertion Endpoint
]
