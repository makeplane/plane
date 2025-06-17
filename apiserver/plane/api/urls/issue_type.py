from django.urls import path

from plane.api.views import (
    IssueTypeAPIEndpoint,
    IssueTypeCustomPropertyAPIEndpoint
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/issue-type/",
        IssueTypeAPIEndpoint.as_view(),
        name="issue-type",
    ),
    path(
        "workspaces/<str:slug>/issue-type/<uuid:pk>/",
        IssueTypeAPIEndpoint.as_view(),
        name="issue-type",
    ),
    path(
        "workspaces/<str:slug>/issue-type/<uuid:issue_type>/custom-properties/",
        IssueTypeCustomPropertyAPIEndpoint.as_view(),
        name="issue-type-custom-property",
    ),
    path(
        "workspaces/<str:slug>/issue-type/<uuid:issue_type>/custom-properties/<uuid:pk>/",
        IssueTypeCustomPropertyAPIEndpoint.as_view(),
        name="issue-type-custom-property",
    )
]