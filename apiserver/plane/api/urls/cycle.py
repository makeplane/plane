from django.urls import path

from plane.api.views.cycle import (
    CycleListCreateAPIEndpoint,
    CycleDetailAPIEndpoint,
    CycleIssueListCreateAPIEndpoint,
    CycleIssueDetailAPIEndpoint,
    TransferCycleIssueAPIEndpoint,
    CycleArchiveUnarchiveAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/",
        CycleListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="cycles",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:pk>/",
        CycleDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="cycles",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/cycle-issues/",
        CycleIssueListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="cycle-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/cycle-issues/<uuid:issue_id>/",
        CycleIssueDetailAPIEndpoint.as_view(http_method_names=["get", "delete"]),
        name="cycle-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/transfer-issues/",
        TransferCycleIssueAPIEndpoint.as_view(http_method_names=["post"]),
        name="transfer-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/archive/",
        CycleArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["post"]),
        name="cycle-archive-unarchive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-cycles/",
        CycleArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["get"]),
        name="cycle-archive-unarchive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-cycles/<uuid:pk>/unarchive/",
        CycleArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["delete"]),
        name="cycle-archive-unarchive",
    ),
]
