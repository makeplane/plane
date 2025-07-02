# Django imports
from django.urls import path

# Module imports
from plane.ee.views import IssueWorklogAPIEndpoint, ProjectWorklogAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/worklogs/",
        IssueWorklogAPIEndpoint.as_view(),
        name="worklogs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/worklogs/<uuid:pk>/",
        IssueWorklogAPIEndpoint.as_view(),
        name="worklogs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/total-worklogs/",
        ProjectWorklogAPIEndpoint.as_view(),
        name="project-worklogs",
    ),
]
