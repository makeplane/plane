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

from plane.api.views import (
    MilestoneViewSet,
    MilestoneWorkItemsViewSet,
)

milestone_urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/milestones/",
        MilestoneViewSet.as_view({"get": "list", "post": "create"}),
        name="project-milestones",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/milestones/<uuid:milestone_id>/",
        MilestoneViewSet.as_view({"get": "retrieve", "patch": "patch", "delete": "destroy"}),
        name="project-milestone",
    ),
]

milestone_work_items_urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/milestones/<uuid:milestone_id>/work-items/",
        MilestoneWorkItemsViewSet.as_view({"get": "list", "post": "add_work_items", "delete": "remove_work_items"}),
        name="project-milestone-work-items",
    ),
]

urlpatterns = [
    *milestone_urlpatterns,
    *milestone_work_items_urlpatterns,
]
