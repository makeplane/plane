from django.urls import path

from plane.api.views import InboxIssueAPIEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/",
        InboxIssueAPIEndpoint.as_view(),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/<uuid:issue_id>/",
        InboxIssueAPIEndpoint.as_view(),
        name="inbox-issue",
    ),
]
