from django.urls import path


from plane.app.views import (
    IntakeViewSet,
    IntakeIssueViewSet,
    IntakeIssueDescriptionVersionEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intakes/",
        IntakeViewSet.as_view({"get": "list", "post": "create"}),
        name="intake",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intakes/<uuid:pk>/",
        IntakeViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="intake",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/",
        IntakeIssueViewSet.as_view({"get": "list", "post": "create"}),
        name="intake-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/<uuid:pk>/",
        IntakeIssueViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="intake-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/",
        IntakeViewSet.as_view({"get": "list", "post": "create"}),
        name="inbox",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/<uuid:pk>/",
        IntakeViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="inbox",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/",
        IntakeIssueViewSet.as_view({"get": "list", "post": "create"}),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/<uuid:pk>/",
        IntakeIssueViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/<uuid:issue_id>/description-versions/",
        IntakeIssueDescriptionVersionEndpoint.as_view(),
        name="intake-issue-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/<uuid:issue_id>/description-versions/<uuid:pk>/",
        IntakeIssueDescriptionVersionEndpoint.as_view(),
        name="intake-issue-versions",
    ),
]
