from django.urls import path

from plane.api.views import InboxIssueAPIEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/<uuid:inbox_id>/inbox-issues/",
        InboxIssueAPIEndpoint.as_view(),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/<uuid:inbox_id>/inbox-issues/<uuid:pk>/",
        InboxIssueAPIEndpoint.as_view(),
        name="inbox-issue",
    ),
]