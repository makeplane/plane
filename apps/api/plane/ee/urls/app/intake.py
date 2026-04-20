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
from plane.ee.views.app.intake import ProjectInTakePublishViewSet, IntakeSettingEndpoint
from plane.ee.views.app.intake import IntakeResponsibilityEndpoint
from plane.ee.views.app.intake import (
    IntakeFormWorkitemTypeEndpoint,
    IntakeFormRegenerateViewSet,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/publish-intake-regenerate/<str:type>/",
        ProjectInTakePublishViewSet.as_view({"post": "regenerate"}),
        name="project-intake-regenerate",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-settings/",
        IntakeSettingEndpoint.as_view(),
        name="project-intake-settings",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-responsibilities/",
        IntakeResponsibilityEndpoint.as_view(),
        name="project-intake-responsibilities",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/projects/<uuid:project_id>/intake-responsibilities/<uuid:user_id>/",
    #     IntakeResponsibilityEndpoint.as_view(),
    #     name="project-intake-responsibilities",
    # ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-forms/",
        IntakeFormWorkitemTypeEndpoint.as_view(),
        name="project-intake-forms",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-forms/<uuid:pk>/",
        IntakeFormWorkitemTypeEndpoint.as_view(),
        name="project-intake-forms",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/intake-forms/<uuid:pk>/regenerate/",
        IntakeFormRegenerateViewSet.as_view(),
        name="project-intake-forms",
    ),
]
