# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    IssueTypeViewSet,
    IssuePropertyViewSet,
    IssuePropertyOptionViewSet,
    IssuePropertyValueEndpoint,
)


urlpatterns = [
    # Work item types
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/",
        IssueTypeViewSet.as_view({"get": "list", "post": "create"}),
        name="project-issue-types",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/enable/",
        IssueTypeViewSet.as_view({"post": "enable"}),
        name="project-issue-types-enable",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:pk>/",
        IssueTypeViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-issue-type",
    ),
    # Properties (nested under a work item type)
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/issue-properties/",
        IssuePropertyViewSet.as_view({"get": "list", "post": "create"}),
        name="issue-type-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/issue-properties/<uuid:pk>/",
        IssuePropertyViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="issue-type-property",
    ),
    # Options (nested under a property)
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:issue_property_id>/options/",
        IssuePropertyOptionViewSet.as_view({"get": "list", "post": "create"}),
        name="issue-property-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:issue_property_id>/options/<uuid:pk>/",
        IssuePropertyOptionViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="issue-property-option",
    ),
    # Values on a work item
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-property-values/",
        IssuePropertyValueEndpoint.as_view(),
        name="issue-property-values",
    ),
]
