# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.license.api.views.help_center import (
    InstanceHelpArticleDetailEndpoint,
    InstanceHelpArticleEndpoint,
    InstanceHelpArticleTranslationEndpoint,
    InstanceHelpCategoryDetailEndpoint,
    InstanceHelpCategoryEndpoint,
)

# God Mode authoring of the shared (instance-global) Help Center.
# Mounted under /api/instances/ -> /api/instances/help/...
urlpatterns = [
    path(
        "help/categories/",
        InstanceHelpCategoryEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-help-categories",
    ),
    path(
        "help/categories/<uuid:pk>/",
        InstanceHelpCategoryDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="instance-help-category-detail",
    ),
    path(
        "help/articles/",
        InstanceHelpArticleEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-help-articles",
    ),
    path(
        "help/articles/<uuid:pk>/",
        InstanceHelpArticleDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="instance-help-article-detail",
    ),
    path(
        "help/articles/<uuid:pk>/translations/<str:locale>/",
        InstanceHelpArticleTranslationEndpoint.as_view(http_method_names=["put", "patch"]),
        name="instance-help-article-translation",
    ),
]
