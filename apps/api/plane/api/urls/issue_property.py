# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.api.views import (
    IssuePropertyListCreateAPIEndpoint,
    IssuePropertyDetailAPIEndpoint,
    IssuePropertyOptionListCreateAPIEndpoint,
    IssuePropertyOptionDetailAPIEndpoint,
    IssuePropertyValueListAPIEndpoint,
    IssuePropertyValueSetAPIEndpoint,
)

urlpatterns = [
    # Property definitions under a work item type
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-types/<uuid:type_id>/properties/",
        IssuePropertyListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-types/<uuid:type_id>/properties/<uuid:property_id>/",
        IssuePropertyDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-properties",
    ),
    # Options of an OPTION property
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/properties/<uuid:property_id>/options/",
        IssuePropertyOptionListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-property-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/properties/<uuid:property_id>/options/<uuid:option_id>/",
        IssuePropertyOptionDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-property-options",
    ),
    # Typed values on a work item
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/property-values/",
        IssuePropertyValueListAPIEndpoint.as_view(http_method_names=["get"]),
        name="work-item-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-items/<uuid:issue_id>/properties/<uuid:property_id>/values/",
        IssuePropertyValueSetAPIEndpoint.as_view(http_method_names=["get", "post", "patch", "delete"]),
        name="work-item-property-values",
    ),
]
