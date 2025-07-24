from django.urls import path

from plane.ee.views.app.cycle import (
    WorkspaceActiveCycleEndpoint,
    CycleUpdatesViewSet,
    CycleStartStopEndpoint,
    CycleIssueStateAnalyticsEndpoint,
)
from plane.ee.views.app.update import UpdatesReactionViewSet

urlpatterns = [
    path(
        "workspaces/<str:slug>/active-cycles/",
        WorkspaceActiveCycleEndpoint.as_view(),
        name="workspace-active-cycle",
    ),
    # Cycle Updates
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/updates/",
        CycleUpdatesViewSet.as_view({"get": "list", "post": "create"}),
        name="cycle-updates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/updates/<uuid:pk>/",
        CycleUpdatesViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="cycle-updates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/updates/<uuid:update_id>/comments/",
        CycleUpdatesViewSet.as_view({"get": "comments_list"}),
        name="cycle-updates-comments",
    ),
    # End Cycle Updates
    # Updates Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/updates/<uuid:update_id>/reactions/",
        UpdatesReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="project-update-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/updates/<uuid:update_id>/reactions/<str:reaction_code>/",
        UpdatesReactionViewSet.as_view({"delete": "destroy"}),
        name="project-update-reactions",
    ),
    ## End Updates Reactions
    # cycle start and stop starts
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/start-stop/",
        CycleStartStopEndpoint.as_view(),
        name="cycle-start-stop",
    ),
    # cycle start and stop ends
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/cycle-progress/",
        CycleIssueStateAnalyticsEndpoint.as_view(),
        name="project-cycle-progress",
    ),
]
