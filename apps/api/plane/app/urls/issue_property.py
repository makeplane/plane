# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    IssuePropertyEndpoint,
    IssuePropertyOptionEndpoint,
    IssuePropertyValueEndpoint,
)


urlpatterns = [
    # Property definitions under a work item type
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:type_id>/properties/",
        IssuePropertyEndpoint.as_view(http_method_names=["get", "post"]),
        name="issue-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:type_id>/properties/<uuid:property_id>/",
        IssuePropertyEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="issue-property-detail",
    ),
    # Options of an OPTION property
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/properties/<uuid:property_id>/options/",
        IssuePropertyOptionEndpoint.as_view(http_method_names=["get", "post"]),
        name="issue-property-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/properties/<uuid:property_id>/options/<uuid:option_id>/",
        IssuePropertyOptionEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="issue-property-option-detail",
    ),
    # Typed values on a work item
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/property-values/",
        IssuePropertyValueEndpoint.as_view(http_method_names=["get"]),
        name="issue-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/properties/<uuid:property_id>/values/",
        IssuePropertyValueEndpoint.as_view(http_method_names=["get", "post", "patch", "delete"]),
        name="issue-property-value-set",
    ),
]
