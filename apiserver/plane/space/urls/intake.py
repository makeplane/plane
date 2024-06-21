from django.urls import path


from plane.space.views import (
    IntakeIssuePublicViewSet,
    IssueVotePublicViewSet,
    WorkspaceProjectDeployBoardEndpoint,
)


urlpatterns = [
    path(
        "anchor/<str:anchor>/intakes/<uuid:intake_id>/intake-issues/",
        IntakeIssuePublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="intake-issue",
    ),
    path(
        "anchor/<str:anchor>/intakes/<uuid:intake_id>/intake-issues/<uuid:pk>/",
        IntakeIssuePublicViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="intake-issue",
    ),
    path(
        "anchor/<str:anchor>/issues/<uuid:issue_id>/votes/",
        IssueVotePublicViewSet.as_view(
            {
                "get": "list",
                "post": "create",
                "delete": "destroy",
            }
        ),
        name="issue-vote-project-board",
    ),
    path(
        "workspaces/<str:slug>/project-boards/",
        WorkspaceProjectDeployBoardEndpoint.as_view(),
        name="workspace-project-boards",
    ),
]
