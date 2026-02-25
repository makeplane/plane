from django.urls import path

from plane.app.views.workspace.department import (
    DepartmentEndpoint,
    DepartmentDetailEndpoint,
    DepartmentTreeEndpoint,
    DepartmentStaffEndpoint,
    DepartmentLinkProjectEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/departments/",
        DepartmentEndpoint.as_view(http_method_names=["get", "post"]),
        name="departments",
    ),
    path(
        "workspaces/<str:slug>/departments/tree/",
        DepartmentTreeEndpoint.as_view(http_method_names=["get"]),
        name="department-tree",
    ),
    path(
        "workspaces/<str:slug>/departments/<uuid:pk>/",
        DepartmentDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="department-detail",
    ),
    path(
        "workspaces/<str:slug>/departments/<uuid:pk>/staff/",
        DepartmentStaffEndpoint.as_view(http_method_names=["get"]),
        name="department-staff",
    ),
    path(
        "workspaces/<str:slug>/departments/<uuid:pk>/link-project/",
        DepartmentLinkProjectEndpoint.as_view(http_method_names=["post", "delete"]),
        name="department-link-project",
    ),
]
