from django.urls import path

from plane.ee.views import (
    IssuePropertyListCreateAPIEndpoint,
    IssuePropertyDetailAPIEndpoint,
    IssuePropertyOptionListCreateAPIEndpoint,
    IssuePropertyOptionDetailAPIEndpoint,
    IssuePropertyValueAPIEndpoint,
    IssuePropertyValueListAPIEndpoint,
)

urlpatterns = [
    # ======================== issue properties start ========================
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:type_id>/issue-properties/",
        IssuePropertyListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="external-issue-property",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:type_id>/issue-properties/<uuid:property_id>/",
        IssuePropertyDetailAPIEndpoint.as_view(
            http_method_names=["get", "patch", "delete"]
        ),
        name="external-issue-property-detail",
    ),
    # ======================== issue properties ends ========================
    # ======================== issue property options start ========================
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:property_id>/options/",
        IssuePropertyOptionListCreateAPIEndpoint.as_view(
            http_method_names=["get", "post"]
        ),
        name="external-issue-property-option",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:property_id>/options/<uuid:option_id>/",
        IssuePropertyOptionDetailAPIEndpoint.as_view(
            http_method_names=["get", "patch", "delete"]
        ),
        name="external-issue-property-option-detail",
    ),
    # ======================== issue property options ends ========================
    # ======================== issue property values start ========================
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-properties/<uuid:property_id>/values/",
        IssuePropertyValueAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="external-issue-property-value",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-properties/values/",
        IssuePropertyValueListAPIEndpoint.as_view(http_method_names=["get"]),
        name="external-issue-property-value-list",
    ),
    # ======================== issue property values end ========================
]
