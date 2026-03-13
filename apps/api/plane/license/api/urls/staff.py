from django.urls import path

from plane.license.api.views.staff import (
    InstanceStaffEndpoint,
    InstanceStaffDetailEndpoint,
    InstanceStaffTransferEndpoint,
    InstanceStaffDeactivateEndpoint,
    InstanceStaffBulkImportEndpoint,
    InstanceStaffBulkActionEndpoint,
    InstanceStaffExportEndpoint,
    InstanceStaffStatsEndpoint,
)

urlpatterns = [
    path(
        "staff/",
        InstanceStaffEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-staff",
    ),
    path(
        "staff/bulk-import/",
        InstanceStaffBulkImportEndpoint.as_view(http_method_names=["post"]),
        name="instance-staff-bulk-import",
    ),
    path(
        "staff/bulk-actions/",
        InstanceStaffBulkActionEndpoint.as_view(http_method_names=["post"]),
        name="instance-staff-bulk-actions",
    ),
    path(
        "staff/export/",
        InstanceStaffExportEndpoint.as_view(http_method_names=["get"]),
        name="instance-staff-export",
    ),
    path(
        "staff/stats/",
        InstanceStaffStatsEndpoint.as_view(http_method_names=["get"]),
        name="instance-staff-stats",
    ),
    path(
        "staff/<uuid:pk>/",
        InstanceStaffDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="instance-staff-detail",
    ),
    path(
        "staff/<uuid:pk>/transfer/",
        InstanceStaffTransferEndpoint.as_view(http_method_names=["post"]),
        name="instance-staff-transfer",
    ),
    path(
        "staff/<uuid:pk>/deactivate/",
        InstanceStaffDeactivateEndpoint.as_view(http_method_names=["post"]),
        name="instance-staff-deactivate",
    ),
]
