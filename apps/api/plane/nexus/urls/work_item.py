# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""URL routes for the work_item feature group, mounted under /api/v1/."""

from django.urls import path

from plane.nexus.views.work_item import (
    ArchivedWorkItemListEndpoint,
    IntakeStatusEndpoint,
    ProjectWorklogSummaryEndpoint,
    RoleEndpoint,
    WorkItemArchiveEndpoint,
    WorkItemDependencyEndpoint,
    WorkItemRelationEndpoint,
    WorkLogEndpoint,
    WorkspaceStateEndpoint,
    WorkspaceWorkItemCountEndpoint,
    WorkspaceWorkItemListEndpoint,
)

WS = "workspaces/<str:slug>/"
PROJECT = WS + "projects/<uuid:project_id>/"
WORK_ITEM = PROJECT + "work-items/<uuid:issue_id>/"

urlpatterns = [
    path(WS + "work-items/", WorkspaceWorkItemListEndpoint.as_view(http_method_names=["get"]), name="nexus-work-items"),
    path(
        WS + "work-items/count/",
        WorkspaceWorkItemCountEndpoint.as_view(http_method_names=["get"]),
        name="nexus-work-items-count",
    ),
    path(
        PROJECT + "archived-work-items/",
        ArchivedWorkItemListEndpoint.as_view(http_method_names=["get"]),
        name="nexus-archived-work-items",
    ),
    path(
        WORK_ITEM + "archive/",
        WorkItemArchiveEndpoint.as_view(http_method_names=["post"]),
        name="nexus-work-item-archive",
    ),
    path(
        WORK_ITEM + "unarchive/",
        WorkItemArchiveEndpoint.as_view(http_method_names=["delete"]),
        name="nexus-work-item-unarchive",
    ),
    path(
        WORK_ITEM + "dependencies/",
        WorkItemDependencyEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-work-item-dependencies",
    ),
    path(
        WORK_ITEM + "dependencies/<uuid:related_issue_id>/",
        WorkItemDependencyEndpoint.as_view(http_method_names=["delete"]),
        name="nexus-work-item-dependency",
    ),
    path(
        WORK_ITEM + "work-item-relations/",
        WorkItemRelationEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-work-item-relations",
    ),
    path(
        WORK_ITEM + "work-item-relations/<uuid:related_issue_id>/",
        WorkItemRelationEndpoint.as_view(http_method_names=["delete"]),
        name="nexus-work-item-relation",
    ),
    path(
        WORK_ITEM + "worklogs/",
        WorkLogEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-work-logs",
    ),
    path(
        WORK_ITEM + "worklogs/<uuid:pk>/",
        WorkLogEndpoint.as_view(http_method_names=["patch", "delete"]),
        name="nexus-work-log",
    ),
    path(
        PROJECT + "total-worklogs/",
        ProjectWorklogSummaryEndpoint.as_view(http_method_names=["get"]),
        name="nexus-project-worklog-summary",
    ),
    path(
        PROJECT + "intake-issues/<uuid:issue_id>/status/",
        IntakeStatusEndpoint.as_view(http_method_names=["patch"]),
        name="nexus-intake-status",
    ),
    path(WS + "roles/", RoleEndpoint.as_view(http_method_names=["get"]), name="nexus-roles"),
    path(WS + "roles/<uuid:role_id>/", RoleEndpoint.as_view(http_method_names=["get"]), name="nexus-role"),
    path(
        WS + "states/",
        WorkspaceStateEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-workspace-states",
    ),
    path(
        WS + "states/<str:state_id>/",
        WorkspaceStateEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="nexus-workspace-state",
    ),
]
