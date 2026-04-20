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

from django.urls import path

# Module imports
from plane.ee.views.app.exporter import (
    ProjectWorkItemExportEndpoint,
    ProjectCycleExportEndpoint,
    ProjectModuleExportEndpoint,
    ProjectViewExportEndpoint,
    WorkspaceViewExportEndpoint,
    ProjectIntakeExportEndpoint,
    ProjectEpicExportEndpoint,
    WorkspaceWorkItemExportEndpoint,
)

urlpatterns = [
    ## Export Work Item
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/export/",
        ProjectWorkItemExportEndpoint.as_view(),
        name="export-work-item",
    ),
    ## Export Cycle
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/export/",
        ProjectCycleExportEndpoint.as_view(),
        name="export-cycle",
    ),
    ## Export Module
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:module_id>/export/",
        ProjectModuleExportEndpoint.as_view(),
        name="export-module",
    ),
    ## Export View
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:view_id>/export/",
        ProjectViewExportEndpoint.as_view(),
        name="export-view",
    ),
    ## Export Workspace View
    path(
        "workspaces/<str:slug>/views/<uuid:view_id>/export/",
        WorkspaceViewExportEndpoint.as_view(),
        name="export-workspace-view",
    ),
    ## Export Intake
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intakes/export/",
        ProjectIntakeExportEndpoint.as_view(),
        name="export-intake",
    ),
    ## Export Epic
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/export/",
        ProjectEpicExportEndpoint.as_view(),
        name="export-epic",
    ),
    ## Workspace items
    path(
        "workspaces/<str:slug>/work-items/export/",
        WorkspaceWorkItemExportEndpoint.as_view(),
        name="export-workspace-work-items",
    ),
]
