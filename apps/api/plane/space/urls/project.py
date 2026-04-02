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


from plane.space.views import (
    DeployBoardPublicSettingsEndpoint,
    ProjectIssuesPublicEndpoint,
    WorkspaceProjectAnchorEndpoint,
    ProjectCyclesEndpoint,
    ProjectEpicsEndpoint,
    ProjectMilestonesEndpoint,
    ProjectModulesEndpoint,
    ProjectStatesEndpoint,
    ProjectLabelsEndpoint,
    ProjectMembersEndpoint,
    ProjectMetaDataEndpoint,
    ProjectWorkItemTypesEndpoint,
)

urlpatterns = [
    path(
        "anchor/<str:anchor>/meta/",
        ProjectMetaDataEndpoint.as_view(),
        name="project-meta",
    ),
    path(
        "anchor/<str:anchor>/settings/",
        DeployBoardPublicSettingsEndpoint.as_view(),
        name="project-deploy-board-settings",
    ),
    path(
        "anchor/<str:anchor>/issues/",
        ProjectIssuesPublicEndpoint.as_view(),
        name="project-deploy-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/anchor/",
        WorkspaceProjectAnchorEndpoint.as_view(),
        name="project-deploy-board",
    ),
    path(
        "anchor/<str:anchor>/cycles/",
        ProjectCyclesEndpoint.as_view(),
        name="project-cycles",
    ),
    path(
        "anchor/<str:anchor>/milestones/",
        ProjectMilestonesEndpoint.as_view(),
        name="project-milestones",
    ),
    path(
        "anchor/<str:anchor>/epics/",
        ProjectEpicsEndpoint.as_view(),
        name="project-epics",
    ),
    path(
        "anchor/<str:anchor>/modules/",
        ProjectModulesEndpoint.as_view(),
        name="project-modules",
    ),
    path(
        "anchor/<str:anchor>/states/",
        ProjectStatesEndpoint.as_view(),
        name="project-states",
    ),
    path(
        "anchor/<str:anchor>/labels/",
        ProjectLabelsEndpoint.as_view(),
        name="project-labels",
    ),
    path(
        "anchor/<str:anchor>/members/",
        ProjectMembersEndpoint.as_view(),
        name="project-members",
    ),
    path(
        "anchor/<str:anchor>/work-item-types/",
        ProjectWorkItemTypesEndpoint.as_view(),
        name="project-work-item-types",
    ),
]
