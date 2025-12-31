from django.urls import path

from plane.api.views import (
    ProjectListCreateAPIEndpoint,
    ProjectDetailAPIEndpoint,
    ProjectArchiveUnarchiveAPIEndpoint,
)
from plane.app.views import (
    IssuePropertyViewSet,
    IssuePropertyValueViewSet,
    BulkIssuePropertyValueEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/",
        ProjectListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:pk>/",
        ProjectDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archive/",
        ProjectArchiveUnarchiveAPIEndpoint.as_view(http_method_names=["post", "delete"]),
        name="project-archive-unarchive",
    ),
    # ==========================================================================
    # CUSTOM FIELDS (Issue Properties)
    # ==========================================================================
    # Project-level property definitions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/properties/",
        IssuePropertyViewSet.as_view({"get": "list", "post": "create"}),
        name="project-issue-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/properties/<uuid:pk>/",
        IssuePropertyViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-property-detail",
    ),
    # Issue-level property values
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/property-values/",
        IssuePropertyValueViewSet.as_view({"get": "list", "post": "create"}),
        name="issue-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/property-values/<uuid:pk>/",
        IssuePropertyValueViewSet.as_view({"delete": "destroy"}),
        name="issue-property-value-detail",
    ),
    # Bulk custom fields endpoint - get/set all custom fields for an issue
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/custom-fields/",
        BulkIssuePropertyValueEndpoint.as_view(),
        name="issue-custom-fields",
    ),
]
