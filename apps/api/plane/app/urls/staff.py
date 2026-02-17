from django.urls import path

from plane.app.views.workspace.staff import (
    StaffEndpoint,
    StaffDetailEndpoint,
    StaffTransferEndpoint,
    StaffDeactivateEndpoint,
    StaffBulkImportEndpoint,
    StaffExportEndpoint,
    StaffStatsEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/staff/",
        StaffEndpoint.as_view(http_method_names=["get", "post"]),
        name="staff",
    ),
    path(
        "workspaces/<str:slug>/staff/bulk-import/",
        StaffBulkImportEndpoint.as_view(http_method_names=["post"]),
        name="staff-bulk-import",
    ),
    path(
        "workspaces/<str:slug>/staff/export/",
        StaffExportEndpoint.as_view(http_method_names=["get"]),
        name="staff-export",
    ),
    path(
        "workspaces/<str:slug>/staff/stats/",
        StaffStatsEndpoint.as_view(http_method_names=["get"]),
        name="staff-stats",
    ),
    path(
        "workspaces/<str:slug>/staff/<uuid:pk>/",
        StaffDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="staff-detail",
    ),
    path(
        "workspaces/<str:slug>/staff/<uuid:pk>/transfer/",
        StaffTransferEndpoint.as_view(http_method_names=["post"]),
        name="staff-transfer",
    ),
    path(
        "workspaces/<str:slug>/staff/<uuid:pk>/deactivate/",
        StaffDeactivateEndpoint.as_view(http_method_names=["post"]),
        name="staff-deactivate",
    ),
]
