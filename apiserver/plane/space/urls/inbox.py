from django.urls import path


from plane.space.views import (
    InboxIssuePublicViewSet,
    WorkspaceProjectDeployBoardEndpoint,
)


urlpatterns = [
    path(
        "anchor/<str:anchor>/inboxes/<uuid:inbox_id>/inbox-issues/",
        InboxIssuePublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="inbox-issue",
    ),
    path(
        "anchor/<str:anchor>/inboxes/<uuid:inbox_id>/inbox-issues/<uuid:pk>/",
        InboxIssuePublicViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/project-boards/",
        WorkspaceProjectDeployBoardEndpoint.as_view(),
        name="workspace-project-boards",
    ),
]
