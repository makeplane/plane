from django.urls import path

from plane.api.views import IntakeIssueAPIEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/",
        IntakeIssueAPIEndpoint.as_view(),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/<uuid:issue_id>/",
        IntakeIssueAPIEndpoint.as_view(),
        name="inbox-issue",
    ),
]
