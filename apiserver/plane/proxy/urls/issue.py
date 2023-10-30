from django.urls import path

from plane.proxy.views import (
    IssueAPIEndpoint,
    LabelAPIEndpoint,
    IssueLinkAPIEndpoint,
    IssueCommentAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/",
        IssueAPIEndpoint.as_view(),
        name="issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/",
        IssueAPIEndpoint.as_view(),
        name="issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-labels/",
        LabelAPIEndpoint.as_view(),
        name="labels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-labels/<uuid:pk>/",
        LabelAPIEndpoint.as_view(),
        name="labels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-links/",
        IssueLinkAPIEndpoint.as_view(),
        name="issue-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-links/<uuid:pk>/",
        IssueLinkAPIEndpoint.as_view(),
        name="issue-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/",
        IssueCommentAPIEndpoint.as_view(), 
        name="project-issue-comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/<uuid:pk>/",
        IssueCommentAPIEndpoint.as_view(),
        name="project-issue-comment",
    ),
]
