from django.urls import path

from plane.ee.views import (
    IssuePropertyAPIEndpoint,
    IssuePropertyOptionAPIEndpoint,
    IssuePropertyValueAPIEndpoint,
)

urlpatterns = [
    # ======================== issue properties start ========================
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:type_id>/issue-properties/",
        IssuePropertyAPIEndpoint.as_view(),
        name="external-issue-property",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:type_id>/issue-properties/<uuid:property_id>/",
        IssuePropertyAPIEndpoint.as_view(),
        name="external-issue-property-detail",
    ),
    # ======================== issue properties ends ========================
    # ======================== issue property options start ========================
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:property_id>/options/",
        IssuePropertyOptionAPIEndpoint.as_view(),
        name="external-issue-property-option",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:property_id>/options/<uuid:option_id>/",
        IssuePropertyOptionAPIEndpoint.as_view(),
        name="external-issue-property-option-detail",
    ),
    # ======================== issue property options ends ========================
    # ======================== issue property values start ========================
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-properties/<uuid:property_id>/values/",
        IssuePropertyValueAPIEndpoint.as_view(),
        name="external-issue-property-value",
    ),
    # ======================== issue property values end ========================
]
