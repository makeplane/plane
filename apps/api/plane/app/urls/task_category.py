# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path
from plane.app.views.task_category import (
    MainTaskCategoryEndpoint,
    SubTaskCategoryEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/task-categories/main/",
        MainTaskCategoryEndpoint.as_view(),
        name="workspace-main-task-categories",
    ),
    path(
        "workspaces/<str:slug>/task-categories/sub/",
        SubTaskCategoryEndpoint.as_view(),
        name="workspace-sub-task-categories",
    ),
]
