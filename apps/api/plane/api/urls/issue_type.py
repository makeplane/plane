from django.urls import path

from plane.api.views import IssueTypeListCreateAPIEndpoint, IssueTypeDetailAPIEndpoint

urlpatterns = [
    # ======================== issue types start ========================
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/",
        IssueTypeListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="external-issue-type",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:type_id>/",
        IssueTypeDetailAPIEndpoint.as_view(
            http_method_names=["get", "patch", "delete"]
        ),
        name="external-issue-type-detail",
    ),
    # ======================== issue types end ========================
]
