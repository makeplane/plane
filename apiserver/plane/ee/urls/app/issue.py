from django.urls import path

from plane.ee.views.app import (
    BulkIssueOperationsEndpoint,
    BulkArchiveIssuesEndpoint,
    BulkSubscribeIssuesEndpoint,
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
]
