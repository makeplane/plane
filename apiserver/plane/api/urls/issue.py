from django.urls import path
from plane.api.views import (
    IssueAPIEndpoint,
    LabelAPIEndpoint,
    IssueLinkAPIEndpoint,
    IssueCommentAPIEndpoint,
    IssueActivityAPIEndpoint,
    WorkspaceIssueAPIEndpoint,
    IssueAttachmentV2Endpoint,
    IssueTypeAPIEndpoint
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/issues/<str:project__identifier>-<str:issue__identifier>/",
        WorkspaceIssueAPIEndpoint.as_view(),
        name="issue-by-identifier",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/",
        IssueAPIEndpoint.as_view(),
        name="issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:pk>/",
        IssueAPIEndpoint.as_view(),
        name="issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/labels/",
        LabelAPIEndpoint.as_view(),
        name="label",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/labels/<uuid:pk>/",
        LabelAPIEndpoint.as_view(),
        name="label",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:issue_id>/links/",
        IssueLinkAPIEndpoint.as_view(),
        name="link",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:issue_id>/links/<uuid:pk>/",
        IssueLinkAPIEndpoint.as_view(),
        name="link",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:issue_id>/comments/",
        IssueCommentAPIEndpoint.as_view(),
        name="comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:issue_id>/comments/<uuid:pk>/",
        IssueCommentAPIEndpoint.as_view(),
        name="comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:issue_id>/activities/",
        IssueActivityAPIEndpoint.as_view(),
        name="activity",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:issue_id>/activities/<uuid:pk>/",
        IssueActivityAPIEndpoint.as_view(),
        name="activity",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:issue_id>/issue-attachments/",
        IssueAttachmentV2Endpoint.as_view(),
        name="attachment",
    ),
    path(
        "workspaces/<str:slug>/projects/<str:project_id>/issues/<uuid:issue_id>/issue-attachments/<uuid:pk>/",
        IssueAttachmentV2Endpoint.as_view(),
        name="attachment",
    )
]
