# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.importer import (
    EvaImporterCreateEndpoint,
    EvaImporterDetailEndpoint,
    EvaImporterListEndpoint,
    EvaImporterPreviewEndpoint,
    JiraImporterCreateEndpoint,
    JiraImporterPreviewEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/importers/",
        EvaImporterListEndpoint.as_view(http_method_names=["get"]),
        name="workspace-importers",
    ),
    path(
        "workspaces/<str:slug>/importers/eva/",
        EvaImporterPreviewEndpoint.as_view(http_method_names=["get"]),
        name="eva-importer-preview",
    ),
    path(
        "workspaces/<str:slug>/importers/<str:service>/<uuid:importer_id>/",
        EvaImporterDetailEndpoint.as_view(http_method_names=["get", "delete"]),
        name="importer-detail",
    ),
    path(
        "workspaces/<str:slug>/importers/eva/<uuid:importer_id>/",
        EvaImporterDetailEndpoint.as_view(http_method_names=["get", "delete"]),
        name="eva-importer-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/importers/eva/",
        EvaImporterCreateEndpoint.as_view(http_method_names=["post"]),
        name="eva-importer-create",
    ),
    path(
        "workspaces/<str:slug>/importers/jira/",
        JiraImporterPreviewEndpoint.as_view(http_method_names=["get"]),
        name="jira-importer-preview",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/importers/jira/",
        JiraImporterCreateEndpoint.as_view(http_method_names=["post"]),
        name="jira-importer-create",
    ),
]
