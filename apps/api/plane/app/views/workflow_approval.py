# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§17.3 — approval runtime endpoints.

These endpoints live next to the existing transition views
(``plane.app.views.issue.workflow_runtime``) so the UI keeps a single
cluster of runtime calls per Work Item. The two ``POST`` endpoints
both accept an optional ``Idempotency-Key`` header (mapped to
``request.data['idempotency_key']``); the GET endpoint returns the
current pending approval + the snapshotted approver list.
"""

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views import BaseAPIView
from plane.db.models import Issue
from plane.services.workflow.approvals import ApprovalService
from plane.services.workflow.errors import WorkflowError


def _get_issue_for_request(slug, project_id, issue_id) -> Issue | None:
    return (
        Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=issue_id
        )
        .select_related("project", "state")
        .first()
    )


class IssueApprovalDetailEndpoint(BaseAPIView):
    """§17.3 — ``GET`` the pending approval + approver snapshot."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id, approval_id):
        approval = ApprovalService.get_approval_for_issue(
            approval_id=approval_id, issue_id=issue_id
        )
        if approval is None:
            return Response(
                {"error": "Approval not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        actor_id = str(request.user.id) if request.user else None
        approver_ids = list(
            approval.approvers.filter(deleted_at__isnull=True).values_list(
                "user_id", flat=True
            )
        )
        can_decide = bool(actor_id) and actor_id in {str(u) for u in approver_ids}

        decisions = list(
            approval.decisions.filter(deleted_at__isnull=True).order_by(
                "created_at"
            ).values(
                "id",
                "decision",
                "actor_id",
                "comment",
                "idempotency_key",
                "created_at",
            )
        )
        for d in decisions:
            d["id"] = str(d["id"])
            d["actor_id"] = str(d["actor_id"]) if d["actor_id"] else None
            d["created_at"] = d["created_at"].isoformat() if d["created_at"] else None

        return Response(
            {
                "id": str(approval.id),
                "issue_id": str(approval.issue_id),
                "flow_id": str(approval.flow_id),
                "source_state_id": str(approval.source_state_id),
                "source_state_name": (
                    approval.source_state.name if approval.source_state else None
                ),
                "target_state_id": str(approval.flow.target_state_id),
                "reject_state_id": (
                    str(approval.flow.reject_state_id)
                    if approval.flow.reject_state_id
                    else None
                ),
                "status": approval.status,
                "requested_at": (
                    approval.requested_at.isoformat()
                    if approval.requested_at
                    else None
                ),
                "requested_by": str(approval.requested_by_id) if approval.requested_by_id else None,
                "resolved_at": (
                    approval.resolved_at.isoformat()
                    if approval.resolved_at
                    else None
                ),
                "resolved_by": (
                    str(approval.resolved_by_id) if approval.resolved_by_id else None
                ),
                "resolution_comment": approval.resolution_comment or "",
                "can_decide": can_decide,
                "approver_user_ids": [str(u) for u in approver_ids],
                "decisions": decisions,
            },
            status=status.HTTP_200_OK,
        )


class IssueApprovalApproveEndpoint(BaseAPIView):
    """§17.3, §11.2 — ``POST /issues/:issue_id/approvals/:approval_id/approve/``."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, issue_id, approval_id):
        issue = _get_issue_for_request(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        idempotency_key = (
            request.headers.get("Idempotency-Key")
            or request.data.get("idempotency_key")
        )
        comment = request.data.get("comment", "")
        try:
            result = ApprovalService.decide(
                approval_id=approval_id,
                actor_id=str(request.user.id) if request.user else None,
                decision="approve",
                comment=comment,
                idempotency_key=idempotency_key,
                origin="api",
            )
        except WorkflowError as exc:
            return Response(exc.to_payload(), status=exc.status_code)
        return Response(result.to_dict(), status=status.HTTP_200_OK)


class IssueApprovalRejectEndpoint(BaseAPIView):
    """§17.3, §11.3 — ``POST /issues/:issue_id/approvals/:approval_id/reject/``."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, issue_id, approval_id):
        issue = _get_issue_for_request(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        idempotency_key = (
            request.headers.get("Idempotency-Key")
            or request.data.get("idempotency_key")
        )
        comment = request.data.get("comment", "")
        try:
            result = ApprovalService.decide(
                approval_id=approval_id,
                actor_id=str(request.user.id) if request.user else None,
                decision="reject",
                comment=comment,
                idempotency_key=idempotency_key,
                origin="api",
            )
        except WorkflowError as exc:
            return Response(exc.to_payload(), status=exc.status_code)
        return Response(result.to_dict(), status=status.HTTP_200_OK)