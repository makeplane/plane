from django.urls import path

from plane.license.api.views.department import (
    DepartmentExportView,
    InstanceDepartmentAutoJoinEndpoint,
    InstanceDepartmentEndpoint,
    InstanceDepartmentDetailEndpoint,
    InstanceDepartmentTreeEndpoint,
    InstanceDepartmentStaffEndpoint,
    InstanceDepartmentLinkWorkspaceEndpoint,
    RejoinAllEndpoint,
)
from plane.license.api.views.department_bulk_import import DepartmentBulkImportView
from plane.license.api.views.department_bulk_link import DepartmentBulkLinkWorkspaceView

urlpatterns = [
    path(
        "departments/",
        InstanceDepartmentEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-departments",
    ),
    path(
        "departments/tree/",
        InstanceDepartmentTreeEndpoint.as_view(http_method_names=["get"]),
        name="instance-department-tree",
    ),
    # Static paths before <uuid:pk> to avoid routing conflict
    path(
        "departments/export/",
        DepartmentExportView.as_view(http_method_names=["get"]),
        name="instance-department-export",
    ),
    path(
        "departments/bulk-import/",
        DepartmentBulkImportView.as_view(http_method_names=["post"]),
        name="instance-department-bulk-import",
    ),
    path(
        "departments/bulk-link-workspace/",
        DepartmentBulkLinkWorkspaceView.as_view(http_method_names=["post"]),
        name="instance-department-bulk-link-workspace",
    ),
    path(
        "departments/rejoin-all/",
        RejoinAllEndpoint.as_view(http_method_names=["post"]),
        name="instance-department-rejoin-all",
    ),
    path(
        "departments/<uuid:pk>/",
        InstanceDepartmentDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="instance-department-detail",
    ),
    path(
        "departments/<uuid:pk>/staff/",
        InstanceDepartmentStaffEndpoint.as_view(http_method_names=["get"]),
        name="instance-department-staff",
    ),
    path(
        "departments/<uuid:pk>/link-workspace/",
        InstanceDepartmentLinkWorkspaceEndpoint.as_view(http_method_names=["post", "delete"]),
        name="instance-department-link-workspace",
    ),
    path(
        "departments/<uuid:pk>/auto-join/",
        InstanceDepartmentAutoJoinEndpoint.as_view(http_method_names=["post"]),
        name="instance-department-auto-join",
    ),
]
