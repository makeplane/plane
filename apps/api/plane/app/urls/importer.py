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

# TODO: All old importer endpoints below are unused — not called by FE.
# Migrate to @can before re-enabling any of them.

# from plane.app.views import (
#     ServiceIssueImportSummaryEndpoint,
#     ImportServiceEndpoint,
#     UpdateServiceImportStatusEndpoint,
#     BulkImportIssuesEndpoint,
# )


urlpatterns = [
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/importers/<str:service>/",
    #     ServiceIssueImportSummaryEndpoint.as_view(),
    #     name="importer-summary",
    # ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/importers/<str:service>/",
    #     ImportServiceEndpoint.as_view(),
    #     name="importer",
    # ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/importers/",
    #     ImportServiceEndpoint.as_view(),
    #     name="importer",
    # ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/importers/<str:service>/<uuid:pk>/",
    #     ImportServiceEndpoint.as_view(),
    #     name="importer",
    # ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/service/<str:service>/importers/<uuid:importer_id>/",
    #     UpdateServiceImportStatusEndpoint.as_view(),
    #     name="importer-status",
    # ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-import-issues/<str:service>/",
    #     BulkImportIssuesEndpoint.as_view(),
    #     name="bulk-import-issues",
    # ),
]
