from django.urls import path

from plane.api.views.cycle import (
    CycleAPIEndpoint,
    CycleIssueAPIEndpoint,
    TransferCycleIssueAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/",
        CycleAPIEndpoint.as_view(),
        name="cycles",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:pk>/",
        CycleAPIEndpoint.as_view(),
        name="cycles",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/cycle-issues/",
        CycleIssueAPIEndpoint.as_view(),
        name="cycle-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/cycle-issues/<uuid:issue_id>/",
        CycleIssueAPIEndpoint.as_view(),
        name="cycle-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/transfer-issues/",
        TransferCycleIssueAPIEndpoint.as_view(),
        name="transfer-issues",
    ),
]
