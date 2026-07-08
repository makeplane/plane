# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    FileCategoryDetailEndpoint,
    FileCategoryEndpoint,
    FileCategoryLinkEndpoint,
    FileLibraryAssetDetailEndpoint,
    FileLibraryAssetDownloadEndpoint,
    FileLibraryAssetEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/file-categories/",
        FileCategoryEndpoint.as_view(),
        name="file-categories",
    ),
    path(
        "workspaces/<str:slug>/file-categories/<uuid:category_id>/",
        FileCategoryDetailEndpoint.as_view(),
        name="file-category-detail",
    ),
    path(
        "workspaces/<str:slug>/file-library/files/",
        FileLibraryAssetEndpoint.as_view(),
        name="file-library-assets",
    ),
    path(
        "workspaces/<str:slug>/file-library/files/<uuid:asset_id>/",
        FileLibraryAssetDetailEndpoint.as_view(),
        name="file-library-asset-detail",
    ),
    path(
        "workspaces/<str:slug>/file-library/files/<uuid:asset_id>/download/",
        FileLibraryAssetDownloadEndpoint.as_view(),
        name="file-library-asset-download",
    ),
    path(
        "workspaces/<str:slug>/file-library/files/<uuid:asset_id>/categories/",
        FileCategoryLinkEndpoint.as_view(),
        name="file-library-asset-categories",
    ),
    path(
        "workspaces/<str:slug>/file-library/files/<uuid:asset_id>/categories/<uuid:category_id>/",
        FileCategoryLinkEndpoint.as_view(),
        name="file-library-asset-category-detail",
    ),
]
