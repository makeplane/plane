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


def _is_project_admin(user, slug, project_id) -> bool:
    """§23.3 — used to decide whether ``approver_user_ids`` is revealed.

    Mirrors the same predicate the actions endpoint uses so the two
    surfaces redact consistently.
    """
    if user is None or getattr(user, "id", None) is None:
        return False
    from plane.db.models import ProjectMember, WorkspaceMember

    if ProjectMember.objects.filter(
        member=user,
        workspace__slug=slug,
        project_id=project_id,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists():
        return True
    return WorkspaceMember.objects.filter(
        member=user,
        workspace__slug=slug,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


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
        # §23.3 — redact the approver list unless the caller is on
        # the snapshotted approver roster or is a project / workspace
        # admin. ``approver_count`` is the non-identifying substitute
        # for the UI badge.
        is_admin = _is_project_admin(request.user, slug, project_id)
        show_approvers = can_decide or is_admin

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

        target_state_row = approval.flow.target_state
        reject_state_row = approval.flow.reject_state
        target_state_name = (
            target_state_row.state.name if target_state_row and target_state_row.state else None
        )
        reject_state_name = reject_state_row.name if reject_state_row else None

        return Response(
            {
                "id": str(approval.id),
                "issue_id": str(approval.issue_id),
                "flow_id": str(approval.flow_id),
                "source_state_id": str(approval.source_state_id),
                "source_state_name": (
                    approval.source_state.name if approval.source_state else None
                ),
                "target_state_id": (
                    str(target_state_row.state_id)
                    if target_state_row
                    else None
                ),
                "target_state_name": target_state_name,
                "reject_state_id": (
                    str(reject_state_row.state_id)
                    if reject_state_row
                    else None
                ),
                "reject_state_name": reject_state_name,
                "status": approval.status,
                "requested_at": (
                    approval.requested_at.isoformat()
                    if approval.requested_at
                    else None
                ),
                "requested_by": (
                    str(approval.requested_by_id)
                    if approval.requested_by_id
                    else None
                ),
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
                "approver_count": len(approver_ids),
                "approver_user_ids": (
                    [str(u) for u in approver_ids] if show_approvers else None
                ),
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


class IssueApprovalListEndpoint(BaseAPIView):
    """§17.3, §21 — ``GET`` the full approval history for an issue.

    Returns every ``WorkflowApproval`` row bound to the issue, newest
    first. The endpoint exists so the Work Item activity UI can
    render "Approval requested / Approved / Rejected" rows after a
    reload even when the underlying approval row has already moved
    out of the pending state.

    The response reuses the same redaction rules as the detail
    endpoint: ``approver_user_ids`` is ``None`` for non-eligible
    non-admin actors (§23.3); ``approver_count`` is always present.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue = _get_issue_for_request(slug, project_id, issue_id)
        if issue is None:
            return Response(
                {"error": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        actor_id = str(request.user.id) if request.user else None
        is_admin = _is_project_admin(request.user, slug, project_id)

        approvals = list(
            ApprovalService.list_approvals_for_issue(issue_id=issue.id)
        )

        history = []
        for approval in approvals:
            approver_ids = list(
                approval.approvers.filter(deleted_at__isnull=True).values_list(
                    "user_id", flat=True
                )
            )
            can_decide = bool(actor_id) and actor_id in {
                str(u) for u in approver_ids
            }
            show_approvers = can_decide or is_admin
            target_state_row = approval.flow.target_state
            reject_state_row = approval.flow.reject_state
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
                d["actor_id"] = (
                    str(d["actor_id"]) if d["actor_id"] else None
                )
                d["created_at"] = (
                    d["created_at"].isoformat() if d["created_at"] else None
                )
            history.append(
                {
                    "id": str(approval.id),
                    "issue_id": str(approval.issue_id),
                    "flow_id": str(approval.flow_id),
                    "source_state_id": str(approval.source_state_id),
                    "source_state_name": (
                        approval.source_state.name
                        if approval.source_state
                        else None
                    ),
                    # ``target_state`` / ``reject_state`` are
                    # WorkflowState rows; the FE acts on State IDs so
                    # we project through ``.state_id``.
                    "target_state_id": (
                        str(target_state_row.state_id)
                        if target_state_row
                        else None
                    ),
                    "target_state_name": (
                        target_state_row.state.name
                        if target_state_row and target_state_row.state
                        else None
                    ),
                    "reject_state_id": (
                        str(reject_state_row.state_id)
                        if reject_state_row
                        else None
                    ),
                    "reject_state_name": (
                        reject_state_row.state.name
                        if reject_state_row and reject_state_row.state
                        else None
                    ),
                    "status": approval.status,
                    "requested_at": (
                        approval.requested_at.isoformat()
                        if approval.requested_at
                        else None
                    ),
                    "requested_by": (
                        str(approval.requested_by_id)
                        if approval.requested_by_id
                        else None
                    ),
                    "resolved_at": (
                        approval.resolved_at.isoformat()
                        if approval.resolved_at
                        else None
                    ),
                    "resolved_by": (
                        str(approval.resolved_by_id)
                        if approval.resolved_by_id
                        else None
                    ),
                    "resolution_comment": approval.resolution_comment or "",
                    "can_decide": can_decide,
                    "approver_count": len(approver_ids),
                    "approver_user_ids": (
                        [str(u) for u in approver_ids]
                        if show_approvers
                        else None
                    ),
                    "decisions": decisions,
                }
            )

        return Response(
            {"approvals": history},
            status=status.HTTP_200_OK,
        )