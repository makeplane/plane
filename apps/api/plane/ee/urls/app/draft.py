# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.issue_property import DraftIssuePropertyValueEndpoint

urlpatterns = [
    # Issue property values
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/draft-issues/<uuid:draft_issue_id>/values/",
        DraftIssuePropertyValueEndpoint.as_view(),
        name="draft-issue-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/draft-issues/<uuid:draft_issue_id>/values/<uuid:pk>/",
        DraftIssuePropertyValueEndpoint.as_view(),
        name="draft-issue-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/draft-issues/<uuid:draft_issue_id>/issue-properties/<uuid:property_id>/values/",
        DraftIssuePropertyValueEndpoint.as_view(),
        name="draft-issue-property-values",
    ),
]
