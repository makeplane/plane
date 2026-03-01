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

from plane.api.views import InitiativeViewSet, InitiativeLabelViewSet, InitiativeEpicsViewSet, InitiativeProjectsViewSet
from django.urls import path


urlpatterns = [
    # Initiative urls - manage initiatives, and its associated labels, projects, and epics
    path(
        "workspaces/<str:slug>/initiatives/",
        InitiativeViewSet.as_view({"get": "list", "post": "create"}),
        name="initiatives",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:pk>/",
        InitiativeViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="initiatives",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/labels/",
        InitiativeViewSet.as_view({"get": "get_labels", "post": "add_labels", "delete": "remove_labels"}),
        name="initiative-labels-manage",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/projects/",
        InitiativeProjectsViewSet.as_view({"get": "get_projects", "post": "add_projects", "delete": "remove_projects"}),
        name="initiative-projects-manage",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/epics/",
        InitiativeEpicsViewSet.as_view({"get": "get_epics", "post": "add_epics", "delete": "remove_epics"}),
        name="initiative-epics-manage",
    ),
    # initiative labels endpoints
    path(
        "workspaces/<str:slug>/initiatives/labels/",
        InitiativeLabelViewSet.as_view({"get": "list", "post": "create"}),
        name="initiative-labels",
    ),
    path(
        "workspaces/<str:slug>/initiatives/labels/<uuid:pk>/",
        InitiativeLabelViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="initiative-label-detail",
    ),
]
