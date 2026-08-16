# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    ImporterDeleteEndpoint,
    ImporterServiceEndpoint,
    JiraImporterCreateEndpoint,
    JiraImporterMetadataEndpoint,
)


urlpatterns = [
    path("workspaces/<str:slug>/importers/", ImporterServiceEndpoint.as_view(), name="importers"),
    path("workspaces/<str:slug>/importers/jira", JiraImporterMetadataEndpoint.as_view(), name="jira-importer-metadata"),
    path(
        "workspaces/<str:slug>/projects/importers/jira/",
        JiraImporterCreateEndpoint.as_view(),
        name="jira-importer-create",
    ),
    path(
        "workspaces/<str:slug>/importers/<str:service>/<uuid:importer_id>/",
        ImporterDeleteEndpoint.as_view(),
        name="importer-delete",
    ),
]
