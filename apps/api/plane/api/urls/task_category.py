# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views.task_category import MainTaskCategoryListEndpoint, SubTaskCategoryListEndpoint

urlpatterns = [
    path(
        "task-categories/main/",
        MainTaskCategoryListEndpoint.as_view(http_method_names=["get"]),
        name="task-categories-main-list",
    ),
    path(
        "task-categories/sub/",
        SubTaskCategoryListEndpoint.as_view(http_method_names=["get"]),
        name="task-categories-sub-list",
    ),
]
