# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import MeetingTaskEndpoint, ProjectMeetingListEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/meetings/",
        ProjectMeetingListEndpoint.as_view(),
        name="project-meetings",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/create-task/",
        MeetingTaskEndpoint.as_view(),
        name="meeting-task",
    ),
]
