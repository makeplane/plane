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
from plane.ee.views.app.issue_property import (
    WorkspaceIssueTypeEndpoint,
    IssueTypeEndpoint,
    DefaultIssueTypeEndpoint,
    IssuePropertyValueEndpoint,
    IssuePropertyEndpoint,
    IssuePropertyOptionEndpoint,
    IssuePropertyActivityEndpoint,
    IssuePropertyFormulaValidateEndpoint,
)

urlpatterns = [
    # Issue types
    path(
        "workspaces/<str:slug>/issue-types/",
        WorkspaceIssueTypeEndpoint.as_view(),
        name="workspace-issue-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/",
        IssueTypeEndpoint.as_view(),
        name="issue-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:pk>/",
        IssueTypeEndpoint.as_view(),
        name="issue-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/default-issue-types/",
        DefaultIssueTypeEndpoint.as_view(),
        name="default-issue-types",
    ),
    ## Issue type
    # Issue properties
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/",
        IssuePropertyEndpoint.as_view(),
        name="issue-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:pk>/",
        IssuePropertyEndpoint.as_view(),
        name="issue-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/issue-properties/",
        IssuePropertyEndpoint.as_view(),
        name="issue-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/issue-properties/<uuid:pk>/",
        IssuePropertyEndpoint.as_view(),
        name="issue-properties",
    ),
    # End of issue properties
    # Issue property options
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-property-options/",
        IssuePropertyOptionEndpoint.as_view(),
        name="issue-property-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:issue_property_id>/options/",
        IssuePropertyOptionEndpoint.as_view(),
        name="issue-property-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:issue_property_id>/options/<uuid:pk>/",
        IssuePropertyOptionEndpoint.as_view(),
        name="issue-property-options",
    ),
    # Issue property values
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/values/",
        IssuePropertyValueEndpoint.as_view(),
        name="issue-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/values/<uuid:pk>/",
        IssuePropertyValueEndpoint.as_view(),
        name="issue-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-properties/<uuid:property_id>/values/",
        IssuePropertyValueEndpoint.as_view(),
        name="issue-property-values",
    ),
    ## Issue property activity
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/property-activity/",
        IssuePropertyActivityEndpoint.as_view(),
        name="issue-property-activity",
    ),
    # validating the formula property in issue type
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/issue-properties/formula-validate/",
        IssuePropertyFormulaValidateEndpoint.as_view(),
        name="issue-property-formula-validate",
    ),
]
