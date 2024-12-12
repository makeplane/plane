from django.urls import path


from plane.ee.views import (
    IssueViewEEViewSet,
    WorkspaceViewEEViewSet,
    IssueViewsPublishEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/views/<uuid:pk>/access/",
        WorkspaceViewEEViewSet.as_view({"post": "access"}),
        name="workspace-views-access",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/access/",
        IssueViewEEViewSet.as_view({"post": "access"}),
        name="project-views-access",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/views/<uuid:pk>/lock/",
        WorkspaceViewEEViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="workspace-views-lock-unlock",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/lock/",
        IssueViewEEViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="project-views-lock-unlock",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/publish/",
        IssueViewsPublishEndpoint.as_view(),
    ),
]
