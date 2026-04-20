# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from django.urls import path


from plane.app.views import (
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # IntakeViewSet,
    IntakeIssueViewSet,
    IntakeWorkItemDescriptionVersionEndpoint,
)


urlpatterns = [
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/intakes/",
    #     IntakeViewSet.as_view({"get": "list", "post": "create"}),
    #     name="intake",
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/intakes/<uuid:pk>/",
    #     IntakeViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
    #     name="intake",
    # ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/",
        IntakeIssueViewSet.as_view({"get": "list", "post": "create"}),
        name="intake-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/<uuid:pk>/",
        IntakeIssueViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="intake-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-issues/<uuid:pk>/status/",
        IntakeIssueViewSet.as_view({"patch": "update_status"}),
        name="intake-issue-status",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/",
    #     IntakeViewSet.as_view({"get": "list", "post": "create"}),
    #     name="inbox",
    # ),
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/inboxes/<uuid:pk>/",
    #     IntakeViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
    #     name="inbox",
    # ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/",
        IntakeIssueViewSet.as_view({"get": "list", "post": "create"}),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/<uuid:pk>/",
        IntakeIssueViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="inbox-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/inbox-issues/<uuid:pk>/status/",
        IntakeIssueViewSet.as_view({"patch": "update_status"}),
        name="inbox-issue-status",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-work-items/<uuid:work_item_id>/description-versions/",
        IntakeWorkItemDescriptionVersionEndpoint.as_view(),
        name="intake-work-item-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-work-items/<uuid:work_item_id>/description-versions/<uuid:pk>/",
        IntakeWorkItemDescriptionVersionEndpoint.as_view(),
        name="intake-work-item-versions",
    ),
]
