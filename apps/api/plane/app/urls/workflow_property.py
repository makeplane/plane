# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§17 — workflow property URL routing.

Endpoints register under the existing ``/api/`` surface
(``plane.app.urls``) next to the workflow admin routes. They mirror
the URL shape Pixel already wired for the workflow admin UI so the FE
can drop in a typed client without re-plumbing.

§17.3 — runtime property-value endpoints are nested under
``/issues/:issue_id/...`` and live in this file (not in
``apps/api/plane/app/urls/issue.py``) so the property feature has one
single home.
"""

from django.urls import path

from plane.app.views import (
    IssuePropertyPayloadEndpoint,
    IssuePropertyValueBulkEndpoint,
    IssuePropertyValueListEndpoint,
    IssueTypePropertyDetailEndpoint,
    IssueTypePropertyListEndpoint,
    WorkspacePropertyDetailEndpoint,
    WorkspacePropertyListEndpoint,
)


urlpatterns = [
    # §17 — workspace property catalog (admin surface).
    path(
        "workspaces/<str:slug>/properties/",
        WorkspacePropertyListEndpoint.as_view(),
        name="workspace-workflow-properties",
    ),
    path(
        "workspaces/<str:slug>/properties/<uuid:property_id>/",
        WorkspacePropertyDetailEndpoint.as_view(),
        name="workspace-workflow-property",
    ),
    # §14.3 — type-property attachments, scoped to a project.
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/properties/",
        IssueTypePropertyListEndpoint.as_view(),
        name="project-issue-type-workflow-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-types/<uuid:issue_type_id>/properties/<uuid:attachment_id>/",
        IssueTypePropertyDetailEndpoint.as_view(),
        name="project-issue-type-workflow-property",
    ),
    # §14 / §17.3 — per-issue property values + composite payload.
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/property-values/",
        IssuePropertyValueListEndpoint.as_view(),
        name="issue-workflow-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/property-values/bulk/",
        IssuePropertyValueBulkEndpoint.as_view(),
        name="issue-workflow-property-values-bulk",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/property-payload/",
        IssuePropertyPayloadEndpoint.as_view(),
        name="issue-workflow-property-payload",
    ),
]
