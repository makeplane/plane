from django.urls import path

from plane.app.views import (
    ChangeRequestViewSet,
    AssignmentGroupViewSet,
    AssignmentGroupMemberViewSet,
    CabGroupViewSet,
)

urlpatterns = [
    # List + Create
    path(
        "workspaces/<str:slug>/changes/",
        ChangeRequestViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-changes",
    ),
    # Overview dashboard
    path(
        "workspaces/<str:slug>/changes/overview/",
        ChangeRequestViewSet.as_view({"get": "overview"}),
        name="workspace-changes-overview",
    ),
    # Detail (retrieve, update, delete)
    path(
        "workspaces/<str:slug>/changes/<str:number>/",
        ChangeRequestViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="workspace-change-detail",
    ),
    # State transition
    path(
        "workspaces/<str:slug>/changes/<str:number>/transition/",
        ChangeRequestViewSet.as_view({"post": "transition"}),
        name="workspace-change-transition",
    ),
    # Approvals - list
    path(
        "workspaces/<str:slug>/changes/<str:number>/approvals/",
        ChangeRequestViewSet.as_view({"get": "list_approvals"}),
        name="workspace-change-approvals",
    ),
    # Approve
    path(
        "workspaces/<str:slug>/changes/<str:number>/approve/",
        ChangeRequestViewSet.as_view({"post": "approve"}),
        name="workspace-change-approve",
    ),
    # Reject
    path(
        "workspaces/<str:slug>/changes/<str:number>/reject/",
        ChangeRequestViewSet.as_view({"post": "reject"}),
        name="workspace-change-reject",
    ),
    # Tasks - list + create
    path(
        "workspaces/<str:slug>/changes/<str:number>/tasks/",
        ChangeRequestViewSet.as_view({"get": "list_tasks", "post": "create_task"}),
        name="workspace-change-tasks",
    ),
    # Tasks - update + delete
    path(
        "workspaces/<str:slug>/changes/<str:number>/tasks/<uuid:task_id>/",
        ChangeRequestViewSet.as_view({"patch": "update_task", "delete": "delete_task"}),
        name="workspace-change-task-detail",
    ),
    # Activity
    path(
        "workspaces/<str:slug>/changes/<str:number>/activity/",
        ChangeRequestViewSet.as_view({"get": "list_activity"}),
        name="workspace-change-activity",
    ),
    # Comment (add note)
    path(
        "workspaces/<str:slug>/changes/<str:number>/comment/",
        ChangeRequestViewSet.as_view({"post": "add_comment"}),
        name="workspace-change-comment",
    ),
    # Assignment Groups — READ ONLY from workspace context
    # (full CRUD is in God Mode: api/instances/...)
    path(
        "workspaces/<str:slug>/assignment-groups/",
        AssignmentGroupViewSet.as_view({"get": "list"}),
        name="workspace-assignment-groups",
    ),
    # CAB Groups — READ ONLY from workspace context
    path(
        "workspaces/<str:slug>/cab-groups/",
        CabGroupViewSet.as_view({"get": "list"}),
        name="workspace-cab-groups",
    ),
]
