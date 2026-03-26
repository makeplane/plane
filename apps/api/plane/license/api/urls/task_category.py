# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path
from plane.license.api.views.task_category import (
    InstanceMainTaskCategoryEndpoint,
    InstanceMainTaskCategoryDetailEndpoint,
    InstanceSubTaskCategoryEndpoint,
    InstanceSubTaskCategoryDetailEndpoint,
)

urlpatterns = [
    path(
        "task-categories/main/",
        InstanceMainTaskCategoryEndpoint.as_view(),
        name="instance-main-task-categories",
    ),
    path(
        "task-categories/main/<uuid:pk>/",
        InstanceMainTaskCategoryDetailEndpoint.as_view(),
        name="instance-main-task-category-detail",
    ),
    path(
        "task-categories/sub/",
        InstanceSubTaskCategoryEndpoint.as_view(),
        name="instance-sub-task-categories",
    ),
    path(
        "task-categories/sub/<uuid:pk>/",
        InstanceSubTaskCategoryDetailEndpoint.as_view(),
        name="instance-sub-task-category-detail",
    ),
]
