from django.urls import path

from plane.api.views import IssueTypeAPIEndpoint

urlpatterns = [
    # ======================== issue types start ========================
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/",
        IssueTypeAPIEndpoint.as_view(),
        name="external-issue-type",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:type_id>/",
        IssueTypeAPIEndpoint.as_view(),
        name="external-issue-type-detail",
    ),
    # ======================== issue types end ========================
]
