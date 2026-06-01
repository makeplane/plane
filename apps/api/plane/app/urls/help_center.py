# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.help_center import HelpArticleViewSet, HelpCategoryViewSet

# Global (instance-wide) READ endpoints — any authenticated user, no workspace
# scope. Authoring lives in the God Mode layer (plane/license/api).
urlpatterns = [
    path(
        "help/categories/",
        HelpCategoryViewSet.as_view({"get": "list"}),
        name="help-categories",
    ),
    path(
        "help/categories/<uuid:pk>/",
        HelpCategoryViewSet.as_view({"get": "retrieve"}),
        name="help-category-detail",
    ),
    path(
        "help/articles/",
        HelpArticleViewSet.as_view({"get": "list"}),
        name="help-articles",
    ),
    path(
        "help/articles/<uuid:pk>/",
        HelpArticleViewSet.as_view({"get": "retrieve"}),
        name="help-article-detail",
    ),
    path(
        "help/articles/slug/<slug:slug>/",
        HelpArticleViewSet.as_view({"get": "retrieve_by_slug"}),
        name="help-article-by-slug",
    ),
]
