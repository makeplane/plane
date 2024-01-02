from django.urls import path


from plane.app.views import (
    InboxViewSet,
    InboxIssueViewSet,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/",
        InboxViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="inbox",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/<uuid:pk>/",
        InboxViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="inbox",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/<uuid:inbox_id>/inbox-issues/",
        InboxIssueViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/<uuid:inbox_id>/inbox-issues/<uuid:issue_id>/",
        InboxIssueViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="inbox-issue",
    ),
]
