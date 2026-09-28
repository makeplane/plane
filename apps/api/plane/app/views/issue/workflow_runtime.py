# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§17.3 — workflow runtime endpoints.

These three endpoints expose the workflow runtime to the UI:

- ``GET  /issues/:issue_id/workflow/`` — bound workflow + revision.
- ``GET  /issues/:issue_id/workflow/actions/`` — allowed actions.
- ``POST /issues/:issue_id/transitions/`` — perform a transition.

They are intentionally separate from the admin endpoints (which
live under ``/workflows/...``) so the UI can keep both surfaces
disjoint. The runtime endpoints rely on the same
``TransitionService`` as the rest of the fork (§34 invariant).
"""

# Python imports
import logging

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views import BaseAPIView
from plane.db.models import Issue
from plane.services.workflow.errors import WorkflowError
from plane.services.workflow.resolver import WorkflowResolver
from plane.services.workflow.transitions import TransitionService

logger = logging.getLogger("plane.workflow")


def _get_issue_for_request(slug, project_id, issue_id) -> Issue | None:
    return (
        Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=issue_id
        )
        .select_related("project", "state")
        .first()
    )


class IssueWorkflowEndpoint(BaseAPIView):
    """§17.3 — ``GET`` bound workflow + revision snapshot."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue = _get_issue_for_request(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        effective = WorkflowResolver.resolve(issue)
        if effective is None:
            return Response(
                {
                    "workflow": None,
                    "binding": None,
                    "reason": "no_effective_workflow",
                },
                status=status.HTTP_200_OK,
            )
        binding = effective.binding
        return Response(
            {
                "workflow": {
                    "id": str(effective.workflow.id),
                    "name": effective.workflow.name,
                    "is_default": effective.workflow.is_default,
                    "is_active": effective.workflow.is_active,
                    "is_type_specific": effective.is_type_specific,
                },
                "revision": {
                    "id": str(effective.revision.id),
                    "version": effective.revision.version,
                    "status": effective.revision.status,
                },
                "binding": (
                    {
                        "id": str(binding.id),
                        "issue_id": str(binding.issue_id),
                        "bound_at": binding.bound_at,
                    }
                    if binding is not None
                    else None
                ),
            },
            status=status.HTTP_200_OK,
        )


class IssueWorkflowActionsEndpoint(BaseAPIView):
    """§17.3 — ``GET`` allowed actions for an issue."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue = _get_issue_for_request(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        actions = TransitionService.compute_allowed_actions(
            issue=issue,
            actor_id=str(request.user.id),
        )
        return Response(actions.to_dict(), status=status.HTTP_200_OK)


class IssueTransitionEndpoint(BaseAPIView):
    """§17.3 — ``POST`` execute a transition.

    Body:
        ``{"target_state_id": "<uuid>", "idempotency_key": "..."}``

    Same-state update is a no-op (§10.1) — the endpoint returns 200
    with the unchanged issue.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, issue_id):
        issue = _get_issue_for_request(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        target_state_id = request.data.get("target_state_id")
        if not target_state_id:
            return Response(
                {"error": "target_state_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            issue = TransitionService.transition(
                issue_id=issue.id,
                target_state_id=target_state_id,
                actor=request.user,
                actor_id=str(request.user.id),
                origin="api",
                idempotency_key=request.data.get("idempotency_key"),
            )
        except WorkflowError as exc:
            return Response(exc.to_payload(), status=exc.status_code)
        return Response(
            {
                "issue_id": str(issue.id),
                "state_id": str(issue.state_id),
                "state_name": issue.state.name if issue.state else None,
            },
            status=status.HTTP_200_OK,
        )
