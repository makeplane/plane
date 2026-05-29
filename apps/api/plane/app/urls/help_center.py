# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.help_center import HelpArticleViewSet, HelpCategoryViewSet

urlpatterns = [
    path(
        "workspaces/<str:slug>/help/categories/",
        HelpCategoryViewSet.as_view({"get": "list", "post": "create"}),
        name="help-categories",
    ),
    path(
        "workspaces/<str:slug>/help/categories/<uuid:pk>/",
        HelpCategoryViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="help-category-detail",
    ),
    path(
        "workspaces/<str:slug>/help/articles/",
        HelpArticleViewSet.as_view({"get": "list", "post": "create"}),
        name="help-articles",
    ),
    path(
        "workspaces/<str:slug>/help/articles/<uuid:pk>/",
        HelpArticleViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="help-article-detail",
    ),
    path(
        "workspaces/<str:slug>/help/articles/<uuid:pk>/translations/<str:locale>/",
        HelpArticleViewSet.as_view({"put": "translation", "patch": "translation"}),
        name="help-article-translation",
    ),
]
