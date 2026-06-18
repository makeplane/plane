# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    CustomFieldEndpoint,
    ProjectCustomFieldValueEndpoint,
    IssueCustomFieldValueEndpoint,
    WorkspaceActiveCustomFieldsEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/custom-fields/",
        CustomFieldEndpoint.as_view(),
        name="custom-fields",
    ),
    path(
        "workspaces/<str:slug>/custom-fields/active/",
        WorkspaceActiveCustomFieldsEndpoint.as_view(),
        name="custom-fields-active",
    ),
    path(
        "workspaces/<str:slug>/custom-fields/<uuid:pk>/",
        CustomFieldEndpoint.as_view(),
        name="custom-fields",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-field-values/",
        ProjectCustomFieldValueEndpoint.as_view(),
        name="custom-field-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/custom-field-values/",
        IssueCustomFieldValueEndpoint.as_view(),
        name="issue-custom-field-values",
    ),
]
