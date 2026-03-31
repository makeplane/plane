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

# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.automation import (
    AutomationEndpoint,
    AutomationNodeEndpoint,
    AutomationEdgeEndpoint,
    AutomationActivityEndpoint,
    AutomationStatusEndpoint,
    WorkspaceAutomationsEndpoint,
    WorkspaceAutomationStatusEndpoint,
    WorkspaceAutomationNodeEndpoint,
    WorkspaceAutomationEdgeEndpoint,
    WorkspaceAutomationActivityEndpoint,
)

urlpatterns = [
    ## Automation endpoints
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/",
        AutomationEndpoint.as_view(),
        name="automations",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:pk>/",
        AutomationEndpoint.as_view(),
        name="automations",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:pk>/status/",
        AutomationStatusEndpoint.as_view(),
        name="automation-status",
    ),
    ### Automation Node endpoints
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/nodes/",
        AutomationNodeEndpoint.as_view(),
        name="automation-nodes",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/nodes/<uuid:pk>/",
        AutomationNodeEndpoint.as_view(),
        name="automation-nodes",
    ),
    ### Automation Edge endpoints
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/edges/",
        AutomationEdgeEndpoint.as_view(),
        name="automation-edges",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/edges/<uuid:pk>/",
        AutomationEdgeEndpoint.as_view(),
        name="automation-edges",
    ),
    ### Automation Activity endpoints
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/activities/",
        AutomationActivityEndpoint.as_view(),
        name="automation-activities",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/activities/<uuid:pk>/",
        AutomationActivityEndpoint.as_view(),
        name="automation-activities",
    ),

    ########################### Workspace-level endpoints #############################
    path(
        "workspaces/<str:slug>/automations/",
        WorkspaceAutomationsEndpoint.as_view(),
        name="workspace-automations",
    ),
    path(
        "workspaces/<str:slug>/automations/<uuid:pk>/",
        WorkspaceAutomationsEndpoint.as_view(),
        name="workspace-automations",
    ),
    path(
        "workspaces/<str:slug>/automations/<uuid:pk>/status/",
        WorkspaceAutomationStatusEndpoint.as_view(),
        name="workspace-automation-status",
    ),
    ### Workspace-level Automation Node endpoints
    path(
        "workspaces/<str:slug>/automations/<uuid:automation_id>/nodes/",
        WorkspaceAutomationNodeEndpoint.as_view(),
        name="workspace-automation-nodes",
    ),
    path(
        "workspaces/<str:slug>/automations/<uuid:automation_id>/nodes/<uuid:pk>/",
        WorkspaceAutomationNodeEndpoint.as_view(),
        name="workspace-automation-nodes",
    ),
    ### Workspace-level Automation Edge endpoints
    path(
        "workspaces/<str:slug>/automations/<uuid:automation_id>/edges/",
        WorkspaceAutomationEdgeEndpoint.as_view(),
        name="workspace-automation-edges",
    ),
    path(
        "workspaces/<str:slug>/automations/<uuid:automation_id>/edges/<uuid:pk>/",
        WorkspaceAutomationEdgeEndpoint.as_view(),
        name="workspace-automation-edges",
    ),
    ### Workspace-level Automation Activity endpoints
    path(
        "workspaces/<str:slug>/automations/<uuid:automation_id>/activities/",
        WorkspaceAutomationActivityEndpoint.as_view(),
        name="workspace-automation-activities",
    ),
    path(
        "workspaces/<str:slug>/automations/<uuid:automation_id>/activities/<uuid:pk>/",
        WorkspaceAutomationActivityEndpoint.as_view(),
        name="workspace-automation-activities",
    ),
]
