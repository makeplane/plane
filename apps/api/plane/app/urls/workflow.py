# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§17.1, §17.2 — workflow admin URL routing.

Endpoints register under the existing ``/api/`` surface
(``plane.app.urls``), not the legacy ``/api/v1/``
(``plane.api.urls``). They live next to the existing
``Project Settings`` API surface and use the same RBAC wrapper
(``@allow_permission``) that other admin endpoints use.

§17.3 runtime endpoints (work-item-scoped) live in
``apps/api/plane/app/urls/issue.py`` so they stay grouped with the
rest of the issue endpoints.
"""

from django.urls import path

from plane.app.views import (
    ProjectWorkflowDetailEndpoint,
    ProjectWorkflowListEndpoint,
    WorkflowDraftEndpoint,
    WorkflowFlowActorDetailEndpoint,
    WorkflowFlowActorListEndpoint,
    WorkflowPublishEndpoint,
    WorkflowRevisionFlowDetailEndpoint,
    WorkflowRevisionFlowListEndpoint,
    WorkflowRevisionListEndpoint,
    WorkflowRevisionStateDetailEndpoint,
    WorkflowRevisionStateListEndpoint,
    WorkflowTypeAssignmentDetailEndpoint,
    WorkflowTypeAssignmentListEndpoint,
)

urlpatterns = [
    # Project-scoped workflow type assignments (read list / create / delete).
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-type-assignments/",
        WorkflowTypeAssignmentListEndpoint.as_view(),
        name="project-workflow-type-assignments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-type-assignments/<uuid:assignment_id>/",
        WorkflowTypeAssignmentDetailEndpoint.as_view(),
        name="project-workflow-type-assignment",
    ),
    # §17.1 — Workflow CRUD + draft lifecycle.
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/",
        ProjectWorkflowListEndpoint.as_view(),
        name="project-workflows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/",
        ProjectWorkflowDetailEndpoint.as_view(),
        name="project-workflow",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/draft/",
        WorkflowDraftEndpoint.as_view(),
        name="project-workflow-draft",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/publish/",
        WorkflowPublishEndpoint.as_view(),
        name="project-workflow-publish",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflows/<uuid:workflow_id>/revisions/",
        WorkflowRevisionListEndpoint.as_view(),
        name="project-workflow-revisions",
    ),
    # §17.2 — Revision-scoped state inclusion CRUD.
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-revisions/<uuid:revision_id>/states/",
        WorkflowRevisionStateListEndpoint.as_view(),
        name="project-workflow-revision-states",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-revisions/<uuid:revision_id>/states/<uuid:state_id>/",
        WorkflowRevisionStateDetailEndpoint.as_view(),
        name="project-workflow-revision-state",
    ),
    # §17.2 — Revision-scoped flow CRUD.
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-revisions/<uuid:revision_id>/flows/",
        WorkflowRevisionFlowListEndpoint.as_view(),
        name="project-workflow-revision-flows",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-revisions/<uuid:revision_id>/flows/<uuid:flow_id>/",
        WorkflowRevisionFlowDetailEndpoint.as_view(),
        name="project-workflow-revision-flow",
    ),
    # §17.2 — Flow-scoped actor CRUD.
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-revisions/<uuid:revision_id>/flows/<uuid:flow_id>/actors/",
        WorkflowFlowActorListEndpoint.as_view(),
        name="project-workflow-flow-actors",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workflow-revisions/<uuid:revision_id>/flows/<uuid:flow_id>/actors/<uuid:actor_id>/",
        WorkflowFlowActorDetailEndpoint.as_view(),
        name="project-workflow-flow-actor",
    ),
]
