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

# module imports
from plane.ee.views.app.template import (
    WorkitemTemplateEndpoint,
    WorkitemProjectTemplateEndpoint,
    ProjectTemplateEndpoint,
    PageTemplateEndpoint,
    PageProjectTemplateEndpoint,
    TemplateCategoryEndpoint,
    CopyProjectTemplateEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/workitems/templates/",
        WorkitemTemplateEndpoint.as_view(),
        name="workitem_templates",
    ),
    path(
        "workspaces/<str:slug>/workitems/templates/<uuid:pk>/",
        WorkitemTemplateEndpoint.as_view(),
        name="workitem_templates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workitems/templates/",
        WorkitemProjectTemplateEndpoint.as_view(),
        name="workitem_project_templates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workitems/templates/<uuid:pk>/",
        WorkitemProjectTemplateEndpoint.as_view(),
        name="workitem_project_templates",
    ),
    path(
        "workspaces/<str:slug>/projects/templates/",
        ProjectTemplateEndpoint.as_view(),
        name="project_templates",
    ),
    path(
        "workspaces/<str:slug>/projects/templates/copy/",
        CopyProjectTemplateEndpoint.as_view(),
        name="copy_project_templates",
    ),
    path(
        "workspaces/<str:slug>/projects/templates/<uuid:pk>/",
        ProjectTemplateEndpoint.as_view(),
        name="project_templates",
    ),
    path(
        "workspaces/<str:slug>/pages/templates/",
        PageTemplateEndpoint.as_view(),
        name="page_templates",
    ),
    path(
        "workspaces/<str:slug>/pages/templates/<uuid:pk>/",
        PageTemplateEndpoint.as_view(),
        name="page_templates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/templates/",
        PageProjectTemplateEndpoint.as_view(),
        name="page_project_templates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/templates/<uuid:pk>/",
        PageProjectTemplateEndpoint.as_view(),
        name="page_project_templates",
    ),
    # TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
    # path(
    #     "workspaces/<str:slug>/assets/copy/",
    #     AssetCopyEndpoint.as_view(),
    #     name="asset_copy",
    # ),
    path(
        "template-categories/",
        TemplateCategoryEndpoint.as_view(),
        name="template_categories",
    ),
]
