from django.urls import path

from plane.license.api.views.department import (
    InstanceDepartmentEndpoint,
    InstanceDepartmentDetailEndpoint,
    InstanceDepartmentTreeEndpoint,
    InstanceDepartmentStaffEndpoint,
    InstanceDepartmentLinkWorkspaceEndpoint,
)

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
]
