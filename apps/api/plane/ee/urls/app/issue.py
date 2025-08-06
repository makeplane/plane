from django.urls import path

from plane.ee.views.app import (
    BulkIssueOperationsEndpoint,
    BulkArchiveIssuesEndpoint,
    BulkSubscribeIssuesEndpoint,
    IssueWorkLogsEndpoint,
    IssueTotalWorkLogEndpoint,
    IssueConvertEndpoint,
    IssueDuplicateEndpoint,
    IssuePageViewSet,
    PageSearchViewSet,
    SubWorkitemTemplateEndpoint,
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
    # Issue Duplicate Endpoint
    path(
        "workspaces/<str:slug>/issues/<uuid:issue_id>/duplicate/",
        IssueDuplicateEndpoint.as_view(),
        name="issue-duplicate",
    ),
    # End Issue Duplicate Endpoint
    # Issue Page Endpoint
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/pages/",
        IssuePageViewSet.as_view(),
        name="issue-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/pages/<uuid:page_id>/",
        IssuePageViewSet.as_view(),
        name="issue-page",
    ),
    # End Issue Page Endpoint
    # Page List Endpoint
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages-search/",
        PageSearchViewSet.as_view(),
        name="issue-page-search",
    ),
    # End Page List Endpoint
    # Sub-workitem Template Endpoint
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:workitem_id>/sub-workitem-template/",
        SubWorkitemTemplateEndpoint.as_view(),
        name="sub-workitem-template",
    ),
    # End Sub-workitem Template Endpoint
]
