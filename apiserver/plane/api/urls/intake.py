from django.urls import path

from plane.api.views import IntakeIssueAPIEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/",
        IntakeIssueAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="intake-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/<uuid:issue_id>/",
        IntakeIssueAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="intake-issue",
    ),
]
