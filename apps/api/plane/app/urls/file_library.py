# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    FileCategoryDetailEndpoint,
    FileCategoryEndpoint,
    FileCategoryLinkEndpoint,
    FileFolderDetailEndpoint,
    FileFolderEndpoint,
    FileLibraryAssetDetailEndpoint,
    FileLibraryAssetDownloadEndpoint,
    FileLibraryAssetEndpoint,
    FileLibraryBulkActionEndpoint,
    FileTagDetailEndpoint,
    FileTagEndpoint,
    FileTagLinkEndpoint,
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
        "workspaces/<str:slug>/file-folders/",
        FileFolderEndpoint.as_view(),
        name="file-folders",
    ),
    path(
        "workspaces/<str:slug>/file-folders/<uuid:folder_id>/",
        FileFolderDetailEndpoint.as_view(),
        name="file-folder-detail",
    ),
    path(
        "workspaces/<str:slug>/file-tags/",
        FileTagEndpoint.as_view(),
        name="file-tags",
    ),
    path(
        "workspaces/<str:slug>/file-tags/<uuid:tag_id>/",
        FileTagDetailEndpoint.as_view(),
        name="file-tag-detail",
    ),
    path(
        "workspaces/<str:slug>/file-library/files/",
        FileLibraryAssetEndpoint.as_view(),
        name="file-library-assets",
    ),
    path(
        "workspaces/<str:slug>/file-library/files/bulk/",
        FileLibraryBulkActionEndpoint.as_view(),
        name="file-library-bulk",
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
    path(
        "workspaces/<str:slug>/file-library/files/<uuid:asset_id>/tags/",
        FileTagLinkEndpoint.as_view(),
        name="file-library-asset-tags",
    ),
    path(
        "workspaces/<str:slug>/file-library/files/<uuid:asset_id>/tags/<uuid:tag_id>/",
        FileTagLinkEndpoint.as_view(),
        name="file-library-asset-tag-detail",
    ),
]
