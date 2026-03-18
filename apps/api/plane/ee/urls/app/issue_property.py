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
    ImportWorkItemTypesEndpoint,
    WorkspaceWorkItemTypeEndpoint,
    WorkspaceWorkItemPropertyEndpoint,
    IssuePropertyFormulaValidateEndpoint,
    WorkspaceWorkItemTypePropertyEndpoint,
    WorkspaceDefaultWorkItemTypeEndpoint,
    WorkspaceWorkItemPropertyOptionEndpoint,
    ProjectWorkItemTypeEndpoint,
    MergeWorkItemTypesEndpoint,
    WorkspaceWorkItemTypeFormulaValidateEndpoint,
)

urlpatterns = [
    # Workspace work item types
    path(
        "workspaces/<str:slug>/work-item-types/",
        WorkspaceWorkItemTypeEndpoint.as_view(),
        name="workspace-work-item-type-list",
    ),
    path(
        "workspaces/<str:slug>/work-item-types/<uuid:pk>/",
        WorkspaceWorkItemTypeEndpoint.as_view(),
        name="workspace-work-item-type-detail",
    ),
    # Project work item types (workspace-scoped)
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-types/",
        ProjectWorkItemTypeEndpoint.as_view(),
        name="project-work-item-types",
    ),
    # workspace work item properties
    path(
        "workspaces/<str:slug>/work-item-properties/",
        WorkspaceWorkItemPropertyEndpoint.as_view(),
        name="workspace-work-item-property-list",
    ),
    path(
        "workspaces/<str:slug>/work-item-properties/<uuid:pk>/",
        WorkspaceWorkItemPropertyEndpoint.as_view(),
        name="workspace-work-item-property-detail",
    ),
    # workspace work item type properties
    path(
        "workspaces/<str:slug>/work-item-types/<uuid:work_item_type_id>/work-item-properties/",
        WorkspaceWorkItemTypePropertyEndpoint.as_view(),
        name="workspace-work-item-type-property-list",
    ),
    path(
        "workspaces/<str:slug>/work-item-types/<uuid:work_item_type_id>/work-item-properties/<uuid:pk>/",
        WorkspaceWorkItemTypePropertyEndpoint.as_view(),
        name="workspace-work-item-type-property-detail",
    ),
    # import work item types
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/import-work-item-types/",
        ImportWorkItemTypesEndpoint.as_view(),
        name="import-work-item-types",
    ),
    path(
        "workspaces/<str:slug>/default-work-item-types/",
        WorkspaceDefaultWorkItemTypeEndpoint.as_view(),
        name="default-work-item-types",
    ),
    path(
        "workspaces/<str:slug>/work-item-property-options/",
        WorkspaceWorkItemPropertyOptionEndpoint.as_view(),
        name="workspace-work-item-property-option-all",
    ),
    path(
        "workspaces/<str:slug>/work-item-properties/<uuid:work_item_property_id>/options/",
        WorkspaceWorkItemPropertyOptionEndpoint.as_view(),
        name="workspace-work-item-property-option-list",
    ),
    path(
        "workspaces/<str:slug>/work-item-properties/<uuid:work_item_property_id>/options/<uuid:pk>/",
        WorkspaceWorkItemPropertyOptionEndpoint.as_view(),
        name="workspace-work-item-property-option-detail",
    ),
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
    # Merge project-level work item types to workspace level
    path(
        "workspaces/<str:slug>/merge-work-item-types/",
        MergeWorkItemTypesEndpoint.as_view(),
        name="merge-work-item-types",
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
        name="project-work-item-type-formula-validate",
    ),
    path(
        "workspaces/<str:slug>/issue-types/<uuid:issue_type_id>/issue-properties/formula-validate/",
        WorkspaceWorkItemTypeFormulaValidateEndpoint.as_view(),
        name="workspace-work-item-type-formula-validate",
    ),
]
