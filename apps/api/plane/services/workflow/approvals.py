# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Approval lifecycle service — spec §11, §12, §26.

This is the authoritative runtime for workflow approvals. The three
operations exposed here are the only sanctioned ways to mutate
``WorkflowApproval`` rows:

- ``ApprovalService.open_approval(...)`` (§11.1) — called from
  ``TransitionService.transition`` when the destination state carries
  an ``approval`` flow edge. The function snapshots the eligible
  approvers, refuses to open an approval with zero resolvers (§12.8),
  and emits notifications via the existing Plane notification path
  (§22).
- ``ApprovalService.decide(...)`` (§11.2, §11.3) — one entry point
  for both approve and reject; the ``decision`` parameter selects
  which terminal state to apply. The function runs inside one
  ``transaction.atomic`` block with ``SELECT ... FOR UPDATE`` on
  the ``WorkflowApproval`` and ``Issue`` rows so concurrent
  approvers cannot both win (§11.4).
- ``ApprovalService.list_pending_approvals(...)`` — read helper used
  by the runtime actions endpoint and the decide views to look up
  the snapshotted approver list and the §11.2 ACL facts.

Idempotency (§11.5) is enforced at two levels:

1. The ``WorkflowApprovalDecision`` model has a partial-unique
   constraint on ``(approval, idempotency_key)`` (see
   ``db/models/workflow_approval.py``). A duplicate replay at the DB
   level raises ``IntegrityError`` which the service maps to the
   original outcome row.
2. The service first looks up the decision by idempotency key; on a
   hit it returns the existing decision without re-running the
   transition logic. The DB constraint is the safety net for the
   race-window between the lookup and the insert.

Notifications (§22) are emitted through ``plane.bgtasks.issue_activity``
for activity rows and the existing ``Notification`` model for inbox
entries. There is intentionally no second notification center (§4).
"""

# Python imports
import logging
from dataclasses import dataclass
from typing import Optional

# Django imports
from django.db import IntegrityError, transaction
from django.utils import timezone

# Module imports
from plane.db.models import (
    Issue,
    Notification,
    State,
    WorkflowApproval,
    WorkflowApprovalApprover,
    WorkflowApprovalDecision,
    WorkflowApprovalDecisionType,
    WorkflowApprovalStatus,
    WorkflowFlow,
    WorkflowFlowActor,
    WorkflowFlowType,
)

from .actors import resolve_actors
from .errors import (
    WorkflowActorNotAuthorized,
    WorkflowApprovalAlreadyResolved,
    WorkflowApproverNotResolved,
    WorkflowError,
    WorkflowFlowValidation,
    WorkflowNotFound,
)
from .resolver import EffectiveWorkflow

logger = logging.getLogger("plane.workflow")


# ---------------------------------------------------------------------------
# Result data classes
# ---------------------------------------------------------------------------


@dataclass
class ApprovalSummary:
    """Result of opening an approval (§11.1)."""

    approval_id: str
    approver_user_ids: list[str]
    source_type_summary: dict[str, int]

    def to_dict(self) -> dict:
        return {
            "approval_id": str(self.approval_id),
            "approver_user_ids": [str(u) for u in self.approver_user_ids],
            "source_type_summary": dict(self.source_type_summary),
        }


@dataclass
class DecisionResult:
    """Result of an approve/reject decision (§11.2/§11.3)."""

    approval_id: str
    decision: str
    decision_id: str
    new_state_id: str
    new_state_name: Optional[str]
    next_approval: Optional[dict]

    def to_dict(self) -> dict:
        body = {
            "approval_id": str(self.approval_id),
            "decision": self.decision,
            "decision_id": str(self.decision_id),
            "new_state_id": str(self.new_state_id),
            "new_state_name": self.new_state_name,
        }
        if self.next_approval is not None:
            body["next_approval"] = self.next_approval
        return body


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class ApprovalService:
    """Authoritative entry point for §11 approval lifecycle operations."""

    # ------------------------------------------------------------------
    # §11.1 — Open approval
    # ------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def open_approval(
        *,
        effective: EffectiveWorkflow,
        issue: Issue,
        flow: WorkflowFlow,
        actor_id: Optional[str],
    ) -> ApprovalSummary:
        """Open an approval on the bound issue (§11.1).

        The caller (``TransitionService.transition``) is expected to
        have already moved the issue to the approval source state and
        locked both rows. ``open_approval`` only handles the snapshot
        + notification side; the state move itself is the caller's
        responsibility so the transactional boundary covers everything.

        Returns an :class:`ApprovalSummary`. Raises
        ``WorkflowApproverNotResolved`` (§12.8) when no eligible user
        could be resolved — callers map this to ``422`` and roll back
        any caller-side state mutation.
        """
        if flow.flow_type != WorkflowFlowType.APPROVAL:
            raise WorkflowFlowValidation(
                detail="ApprovalService.open_approval requires an approval flow.",
            )

        binding = effective.binding
        if binding is None:
            # No binding means we're resolving fresh; lazy-bind now so
            # the approval row has a real ``binding_id``.
            from .bindings import ensure_binding

            binding = ensure_binding(issue=issue, actor_id=actor_id)
        if binding is None:
            raise WorkflowError(
                detail="Cannot open an approval without a workflow binding.",
            )

        # §11.1 step 1 — create the approval row. The partial-unique
        # constraint ``workflow_approvals_unique_pending_per_issue``
        # rejects a duplicate open with ``IntegrityError``, which the
        # caller maps to the existing pending approval. We pre-check
        # here to keep the error message friendly.
        existing_pending = (
            WorkflowApproval.objects.filter(
                issue=issue,
                binding=binding,
                status=WorkflowApprovalStatus.PENDING,
            )
            .select_for_update(of=("self",))
            .first()
        )
        if existing_pending is not None:
            return ApprovalService._summarize(existing_pending)

        approval = WorkflowApproval.objects.create(
            issue=issue,
            project=issue.project,
            workspace=issue.workspace,
            binding=binding,
            flow=flow,
            source_state_id=issue.state_id,
            status=WorkflowApprovalStatus.PENDING,
            requested_by_id=actor_id,
        )

        # §11.1 step 2 + 3 — resolve + snapshot approvers.
        snapshot_ids, source_summary = ApprovalService._snapshot_approvers(
            approval=approval,
            flow=flow,
            issue=issue,
        )
        if not snapshot_ids:
            # §12.8 / §26.4 — empty resolver result is a hard failure,
            # never an auto-approve. Roll back the entire transaction
            # so the caller's state move is undone.
            transaction.set_rollback(True)
            raise WorkflowApproverNotResolved(
                detail=(
                    "No eligible approvers could be resolved for the approval "
                    f"flow {flow.id}; rolling the transition back per §12.8."
                ),
            )

        # §11.1 step 5 — notify the snapshotted approvers through the
        # existing Plane notification path so we don't grow a second
        # notification center (§4, §22).
        ApprovalService._notify_approvers(
            approval=approval,
            issue=issue,
            actor_id=actor_id,
        )

        # §21 — emit a Work Item activity row so the transition
        # history interleaves with approval request / decision rows
        # chronologically. The row is persisted in the same atomic
        # block so a roll-back of the approval also rolls back the
        # activity entry.
        ApprovalService._emit_activity(
            issue=issue,
            actor_id=actor_id,
            verb="approval_requested",
            approval=approval,
            comment="requested approval on",
        )

        logger.info(
            "workflow.approval_opened",
            extra={
                "approval_id": str(approval.id),
                "issue_id": str(issue.id),
                "flow_id": str(flow.id),
                "approver_count": len(snapshot_ids),
            },
        )

        return ApprovalSummary(
            approval_id=str(approval.id),
            approver_user_ids=snapshot_ids,
            source_type_summary=source_summary,
        )

    # ------------------------------------------------------------------
    # §11.2 / §11.3 — Approve / Reject
    # ------------------------------------------------------------------

    @staticmethod
    def decide(
        *,
        approval_id: str,
        actor_id: Optional[str],
        decision: str,
        comment: str = "",
        idempotency_key: Optional[str] = None,
        origin: str = "api",
    ) -> DecisionResult:
        """Take an approve/reject decision on a pending approval.

        Wraps the entire critical section in ``transaction.atomic``
        and locks both ``WorkflowApproval`` and ``Issue`` rows
        (§11.4). Concurrent decisions cannot both succeed — the second
        request hits the partial-unique constraint or the locked
        approval status check and is rejected with
        ``WorkflowApprovalAlreadyResolved`` (HTTP 409).
        """
        decision = (decision or "").lower()
        if decision not in (
            WorkflowApprovalDecisionType.APPROVE.value,
            WorkflowApprovalDecisionType.REJECT.value,
        ):
            raise WorkflowError(
                detail="decision must be 'approve' or 'reject'.",
            )

        with transaction.atomic():
            # ``of=("self",)`` — Issue.state / Issue.project / Issue.workspace
            # are nullable FKs, so the default lock-target set would
            # include them and Postgres would refuse with "FOR
            # UPDATE cannot be applied to the nullable side of an
            # outer join".
            approval = (
                WorkflowApproval.objects.select_for_update(of=("self",))
                .select_related(
                    "issue",
                    "issue__state",
                    "issue__project",
                    "flow",
                    "flow__target_state__state",
                    "flow__reject_state__state",
                    "binding",
                )
                .filter(pk=approval_id)
                .first()
            )
            if approval is None:
                raise WorkflowNotFound(
                    detail=f"Approval {approval_id} not found.",
                )

            issue = approval.issue
            flow = approval.flow

            # §11.5 step 1 — idempotency lookup. The unique constraint
            # below is the safety net for the race between this check
            # and the insert.
            if idempotency_key:
                existing = WorkflowApprovalDecision.objects.filter(
                    approval=approval,
                    idempotency_key=idempotency_key,
                ).first()
                if existing is not None:
                    # Replay: the outcome must be the original one,
                    # not whatever the live approval status now says.
                    # ``target_state`` / ``reject_state`` are
                    # WorkflowState rows; project through ``.state_id``
                    # so the lookup hits the underlying State. Use
                    # ``all_state_objects`` because the reject
                    # destination can be a triage state which the
                    # default ``objects`` manager hides.
                    target_state_id = (
                        str(flow.target_state.state_id)
                        if existing.decision == WorkflowApprovalDecisionType.APPROVE.value
                        else str(flow.reject_state.state_id)
                    )
                    target_state = State.all_state_objects.filter(
                        pk=target_state_id
                    ).first()
                    return DecisionResult(
                        approval_id=str(approval.id),
                        decision=existing.decision,
                        decision_id=str(existing.id),
                        new_state_id=target_state_id,
                        new_state_name=target_state.name if target_state else None,
                        next_approval=None,
                    )

            # §11.4 — the row is already locked; double-check the
            # status so an already-resolved approval returns 409 even
            # if the idempotency key was different.
            if approval.status != WorkflowApprovalStatus.PENDING:
                raise WorkflowApprovalAlreadyResolved(approval_id=approval.id)

            # §11.2 + §18.2 — actor eligibility. The eligibility is
            # validated against the eligible set we snapshotted at
            # opening time, not against the live resolvers — that is
            # the whole point of §7.9 (org-chart changes after open do
            # not silently flip eligibility).
            approver_rows = list(
                WorkflowApprovalApprover.objects.filter(
                    approval=approval,
                    deleted_at__isnull=True,
                ).values_list("user_id", flat=True)
            )
            if not approver_rows:
                # §12.8 — empty snapshot. Treat as "not authorized"
                # rather than auto-approve.
                raise WorkflowApproverNotResolved(
                    detail="Approval has no snapshotted approvers.",
                )
            if actor_id is None or str(actor_id) not in {str(u) for u in approver_rows}:
                raise WorkflowActorNotAuthorized(
                    detail="You are not on the snapshotted approver list for this approval.",
                )

            # §10 — determine destination state. Approve targets the
            # flow's target_state; reject targets the reject_state.
            # ``flow.target_state`` / ``flow.reject_state`` are
            # ``WorkflowState`` rows so we reach the underlying State
            # via ``.state_id`` (NOT the WorkflowState PK).
            if decision == WorkflowApprovalDecisionType.APPROVE.value:
                # select_related so we don't lazy-load an extra row.
                if flow.target_state_id is None or flow.target_state is None:
                    raise WorkflowFlowValidation(
                        detail="Approval flow is missing a target_state.",
                    )
                destination_state_id = str(flow.target_state.state_id)
                terminal_status = WorkflowApprovalStatus.APPROVED
            else:
                if flow.reject_state_id is None:
                    # §7.5 — approval flows require a reject_state.
                    raise WorkflowFlowValidation(
                        detail="Approval flow is missing a reject_state.",
                    )
                if flow.reject_state is None:
                    raise WorkflowFlowValidation(
                        detail="Approval flow's reject_state row is missing.",
                    )
                destination_state_id = str(flow.reject_state.state_id)
                terminal_status = WorkflowApprovalStatus.REJECTED

            # Apply state mutation transactionally so §11.2 step 3
            # cannot leave the approval resolved but the issue in the
            # old state. The Issue row is locked via
            # ``select_for_update`` through the joined query above.
            # ``State.objects`` excludes triage states by design
            # (``StateManager.get_queryset``), but a reject can land
            # an item back in a triage bucket — so we read through
            # ``all_state_objects`` to include every valid
            # destination.
            destination_state = (
                State.all_state_objects.filter(pk=destination_state_id).first()
            )
            if destination_state is None:
                raise WorkflowNotFound(
                    detail=f"Destination state {destination_state_id} not found.",
                )

            previous_state_id = str(issue.state_id)
            completed_at = ApprovalService._compute_completed_at(
                current_completed_at=issue.completed_at,
                target_state=destination_state,
            )
            Issue.objects.filter(pk=issue.pk).update(
                state=destination_state,
                completed_at=completed_at,
                updated_at=timezone.now(),
                updated_by_id=actor_id,
            )
            issue.refresh_from_db()

            # Persist the decision audit row first; if this fails the
            # transaction rolls back the state update.
            try:
                decision_row = WorkflowApprovalDecision.objects.create(
                    approval=approval,
                    actor_id=actor_id,
                    decision=decision,
                    comment=comment or "",
                    idempotency_key=idempotency_key,
                    project=issue.project,
                    workspace=issue.workspace,
                    created_by_id=actor_id,
                    updated_by_id=actor_id,
                )
            except IntegrityError:
                # §11.5 — concurrent insert with the same idempotency
                # key. Map to a clean "replay" path.
                transaction.set_rollback(True)
                existing = WorkflowApprovalDecision.objects.filter(
                    approval_id=approval.id,
                    idempotency_key=idempotency_key,
                ).first()
                if existing is None:  # pragma: no cover - defensive
                    raise
                target_state_id_replay = (
                    str(flow.target_state_id)
                    if existing.decision == WorkflowApprovalDecisionType.APPROVE.value
                    else str(flow.reject_state_id)
                )
                replay_state = State.objects.filter(pk=target_state_id_replay).first()
                return DecisionResult(
                    approval_id=str(approval.id),
                    decision=existing.decision,
                    decision_id=str(existing.id),
                    new_state_id=target_state_id_replay,
                    new_state_name=replay_state.name if replay_state else None,
                    next_approval=None,
                )

            # Update approval status last so any failure above rolls
            # the whole transaction back.
            WorkflowApproval.objects.filter(pk=approval.pk).update(
                status=terminal_status,
                resolved_at=timezone.now(),
                resolved_by_id=actor_id,
                resolution_comment=comment or "",
                updated_at=timezone.now(),
                updated_by_id=actor_id,
            )

            logger.info(
                "workflow.approval_decided",
                extra={
                    "approval_id": str(approval.id),
                    "decision": decision,
                    "actor_id": str(actor_id) if actor_id else None,
                    "previous_state_id": previous_state_id,
                    "new_state_id": str(issue.state_id),
                    "idempotency_key": idempotency_key,
                },
            )

            # §11.2 step 4 — if the destination state itself has an
            # approval flow, open the next approval inside the same
            # transaction so the chain is atomic.
            next_approval_payload = None
            try:
                next_flow = (
                    WorkflowFlow.objects.filter(
                        revision=approval.flow.revision,
                        source_state__state_id=destination_state.id,
                        flow_type=WorkflowFlowType.APPROVAL,
                        is_active=True,
                    )
                    .select_related("source_state", "target_state", "reject_state")
                    .first()
                )
            except Exception:  # pragma: no cover - defensive
                next_flow = None

            if next_flow is not None:
                try:
                    next_summary = ApprovalService.open_approval(
                        effective=effective_for_approval(approval),
                        issue=issue,
                        flow=next_flow,
                        actor_id=actor_id,
                    )
                    next_approval_payload = next_summary.to_dict()
                except WorkflowApproverNotResolved:
                    # §11.2 — if the next step has no resolvers we
                    # still let the current decision succeed; the next
                    # transition attempt will surface the failure.
                    next_approval_payload = {
                        "error": "WORKFLOW_APPROVER_NOT_RESOLVED",
                        "detail": "Next approval could not be opened.",
                    }

            # §22 — resolve-side notifications.
            ApprovalService._notify_resolution(
                approval=approval,
                issue=issue,
                decision=decision,
                actor_id=actor_id,
            )

            # §21 — emit a Work Item activity row so the resolution
            # is recorded alongside the state transition. The verb
            # follows the spec naming ("approval_approved" /
            # "approval_rejected"); old/new carry the destination
            # state name so the UI history view can render the move
            # without re-resolving the state id.
            ApprovalService._emit_activity(
                issue=issue,
                actor_id=actor_id,
                verb=(
                    "approval_approved"
                    if decision == WorkflowApprovalDecisionType.APPROVE.value
                    else "approval_rejected"
                ),
                approval=approval,
                old_value=(
                    State.all_state_objects.filter(pk=previous_state_id).first().name
                    if previous_state_id
                    else None
                ),
                new_value=issue.state.name if issue.state else None,
                comment=(
                    "approved and moved to"
                    if decision == WorkflowApprovalDecisionType.APPROVE.value
                    else "rejected and moved to"
                ),
                extra_comment=comment or "",
            )

        return DecisionResult(
            approval_id=str(approval.id),
            decision=decision,
            decision_id=str(decision_row.id),
            new_state_id=str(issue.state_id),
            new_state_name=issue.state.name if issue.state else None,
            next_approval=next_approval_payload,
        )

    # ------------------------------------------------------------------
    # Read helpers
    # ------------------------------------------------------------------

    @staticmethod
    def get_pending_for_issue(issue_id) -> Optional[WorkflowApproval]:
        """Return the pending approval for an issue, if any."""
        return (
            WorkflowApproval.objects.filter(
                issue_id=issue_id,
                status=WorkflowApprovalStatus.PENDING,
            )
            .select_related("flow", "binding", "source_state", "issue")
            .first()
        )

    @staticmethod
    def get_approval_for_issue(approval_id, issue_id) -> Optional[WorkflowApproval]:
        """Return the approval if it belongs to the given issue, else ``None``."""
        return (
            WorkflowApproval.objects.filter(pk=approval_id, issue_id=issue_id)
            .select_related("flow", "binding", "source_state", "issue")
            .first()
        )

    @staticmethod
    def list_approvals_for_issue(issue_id) -> list[WorkflowApproval]:
        """§21 — return every approval bound to ``issue_id``.

        Newest first so the activity UI can render the history in
        reverse-chronological order. Includes resolved rows so a
        reload can replay prior decisions even after the issue has
        moved on.
        """
        return list(
            WorkflowApproval.objects.filter(issue_id=issue_id)
            .select_related(
                "flow",
                "flow__target_state__state",
                "flow__reject_state",
                "source_state",
                "issue",
                "binding",
            )
            .order_by("-created_at")
        )

    @staticmethod
    def is_actor_eligible(
        *,
        approval: WorkflowApproval,
        actor_id: Optional[str],
    ) -> bool:
        """Return ``True`` iff ``actor_id`` is on the snapshotted approver list."""
        if actor_id is None:
            return False
        actor_str = str(actor_id)
        return WorkflowApprovalApprover.objects.filter(
            approval=approval,
            user_id=actor_str,
            deleted_at__isnull=True,
        ).exists()

    # ------------------------------------------------------------------
    # Internals — snapshotting + notifications
    # ------------------------------------------------------------------

    @staticmethod
    def _snapshot_approvers(
        *,
        approval: WorkflowApproval,
        flow: WorkflowFlow,
        issue: Issue,
    ) -> tuple[list[str], dict[str, int]]:
        """Resolve every flow actor and snapshot the eligible user ids.

        Returns ``(user_ids, source_summary)``. The
        ``source_summary`` map counts how many users came from each
        resolver type — handy for diagnostics and for the response
        payload.
        """
        actor_rows = list(
            WorkflowFlowActor.objects.filter(flow=flow).order_by(
                "sequence", "created_at"
            )
        )
        if not actor_rows:
            # An actor-less approval flow is a misconfiguration; do
            # not auto-approve (§12.8).
            return [], {}

        user_ids: list[str] = []
        source_summary: dict[str, int] = {}
        now = timezone.now()

        for actor in actor_rows:
            try:
                resolved = resolve_actors(
                    flow=flow,
                    issue=issue,
                    actor_id=None,
                )
            except Exception:  # pragma: no cover - defensive
                logger.warning(
                    "workflow.approver_resolver_failed",
                    exc_info=True,
                    extra={
                        "approval_id": str(approval.id),
                        "actor_type": actor.actor_type,
                    },
                )
                # §26.4 — resolver failure is a hard failure for the
                # approval, but we continue with the rest so we can
                # still build a useful diagnostic if at least one
                # resolver succeeds. The empty-set check at the end
                # gates the final decision.
                continue

            # Snapshot deduplication per source. Note that
            # ``resolve_actors`` returns the *union* of all configured
            # resolvers (per the §18 actor rule), so we rely on the
            # ``source_metadata`` to retain provenance instead of
            # carving the eligible set per-resolver here.
            for uid in resolved:
                user_str = str(uid)
                if user_str in user_ids:
                    continue
                user_ids.append(user_str)
                source_summary[actor.actor_type] = (
                    source_summary.get(actor.actor_type, 0) + 1
                )
                # Snapshot metadata mirrors the example in §7.9 —
                # enough structured context for an admin to trace why
                # this user is on the approver list.
                WorkflowApprovalApprover.objects.create(
                    approval=approval,
                    user_id=user_str,
                    source_type=actor.actor_type,
                    source_metadata={
                        "resolved_at": now.isoformat(),
                        "actor_id": str(actor.id),
                        "flow_id": str(flow.id),
                        "issue_id": str(issue.id),
                    },
                    project=issue.project,
                    workspace=issue.workspace,
                    created_by_id=None,
                    updated_by_id=None,
                )

        return user_ids, source_summary

    @staticmethod
    def _summarize(approval: WorkflowApproval) -> ApprovalSummary:
        user_ids = list(
            WorkflowApprovalApprover.objects.filter(
                approval=approval, deleted_at__isnull=True
            ).values_list("user_id", flat=True)
        )
        source_rows = WorkflowApprovalApprover.objects.filter(
            approval=approval, deleted_at__isnull=True
        ).values_list("source_type", flat=True)
        summary: dict[str, int] = {}
        for st in source_rows:
            summary[st] = summary.get(st, 0) + 1
        return ApprovalSummary(
            approval_id=str(approval.id),
            approver_user_ids=[str(u) for u in user_ids],
            source_type_summary=summary,
        )

    @staticmethod
    def _compute_completed_at(*, current_completed_at, target_state: State):
        from plane.db.models import StateGroup

        target_group = getattr(target_state, "group", None)
        if target_group in (StateGroup.COMPLETED.value, StateGroup.CANCELLED.value):
            return current_completed_at or timezone.now()
        return None

    @staticmethod
    def _notify_approvers(
        *,
        approval: WorkflowApproval,
        issue: Issue,
        actor_id: Optional[str],
    ) -> None:
        """§22 — inbox notifications for the snapshotted approvers.

        We use the existing ``Notification`` model so we don't grow a
        second notification center. Failures here are logged but do
        not abort the approval — §26.3 says notification failure does
        not roll back process transition.
        """
        user_ids = list(
            WorkflowApprovalApprover.objects.filter(
                approval=approval, deleted_at__isnull=True
            ).values_list("user_id", flat=True)
        )
        if not user_ids:
            return
        try:
            payload = {
                "type": "workflow.approval_requested",
                "approval_id": str(approval.id),
                "issue_id": str(issue.id),
                "project_id": str(issue.project_id),
                "workspace_id": str(issue.workspace_id),
                "title": issue.name,
                "requested_by": str(actor_id) if actor_id else None,
            }
            sender_label = (
                actor_id if actor_id is not None else "workflow"
            )
            Notification.objects.bulk_create(
                [
                    Notification(
                        workspace_id=issue.workspace_id,
                        project_id=issue.project_id,
                        triggered_by_id=actor_id,
                        receiver_id=str(uid),
                        sender=str(sender_label),
                        entity_name="workflow_approval_requested",
                        entity_identifier=approval.id,
                        title="Approval requested",
                        message=payload,
                        message_html=(
                            f"<p>You have a pending approval on "
                            f"<strong>{issue.name}</strong>.</p>"
                        ),
                        message_stripped=(
                            f"You have a pending approval on '{issue.name}'."
                        ),
                    )
                    for uid in user_ids
                ]
            )
        except Exception:  # pragma: no cover - defensive
            logger.warning(
                "workflow.approval_notification_failed",
                exc_info=True,
                extra={"approval_id": str(approval.id)},
            )

    @staticmethod
    def _notify_resolution(
        *,
        approval: WorkflowApproval,
        issue: Issue,
        decision: str,
        actor_id: Optional[str],
    ) -> None:
        """§22 — notify the requester / assignees that the approval resolved.

        Reuses the existing ``Notification`` model. Best-effort; the
        caller has already committed when this runs (post-commit
        notifications are an explicit §22 rule).
        """
        # Notify requester first.
        recipient_ids: set[str] = set()
        if approval.requested_by_id:
            recipient_ids.add(str(approval.requested_by_id))
        # Then assignees.
        from plane.db.models import IssueAssignee

        assignee_ids = list(
            IssueAssignee.objects.filter(issue=issue).values_list(
                "assignee_id", flat=True
            )
        )
        for uid in assignee_ids:
            recipient_ids.add(str(uid))
        # Skip self-notify when the actor is also the requester.
        recipient_ids.discard(str(actor_id) if actor_id else "")
        if not recipient_ids:
            return

        try:
            payload = {
                "type": "workflow.approval_resolved",
                "approval_id": str(approval.id),
                "issue_id": str(issue.id),
                "project_id": str(issue.project_id),
                "workspace_id": str(issue.workspace_id),
                "decision": decision,
            }
            sender_label = (
                actor_id if actor_id is not None else "workflow"
            )
            Notification.objects.bulk_create(
                [
                    Notification(
                        workspace_id=issue.workspace_id,
                        project_id=issue.project_id,
                        triggered_by_id=actor_id,
                        receiver_id=str(uid),
                        sender=str(sender_label),
                        entity_name="workflow_approval_resolved",
                        entity_identifier=approval.id,
                        title=f"Approval {decision}",
                        message=payload,
                        message_html=(
                            f"<p>Approval <strong>{decision}</strong> "
                            f"on '{issue.name}'.</p>"
                        ),
                        message_stripped=(
                            f"Approval {decision} on '{issue.name}'."
                        ),
                    )
                    for uid in recipient_ids
                ]
            )
        except Exception:  # pragma: no cover - defensive
            logger.warning(
                "workflow.approval_resolution_notification_failed",
                exc_info=True,
                extra={"approval_id": str(approval.id)},
            )

    @staticmethod
    def _emit_activity(
        *,
        issue: Issue,
        actor_id: Optional[str],
        verb: str,
        approval: WorkflowApproval,
        comment: str,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        extra_comment: str = "",
    ) -> None:
        """§21 — emit a Work Item activity row for an approval event.

        Approval requests and decisions must surface in the same
        activity stream as state transitions so the UI can render a
        single chronological history without consulting a second
        table. The row is created in the caller's transaction; the
        caller is responsible for the surrounding ``atomic`` block.

        Field semantics:

        - ``verb`` — one of ``approval_requested`` / ``approval_approved``
          / ``approval_rejected``; the UI maps these to its history
          panel.
        - ``field`` — pinned to ``"approval"`` so the row groups with
          other workflow events.
        - ``old_value`` / ``new_value`` — the source / destination
          state name; ``None`` for the request verb (the issue has
          not moved yet).
        - ``comment`` — short user-facing verb phrase; ``extra_comment``
          is appended as the human-decision comment when present.
        """
        try:
            from plane.db.models import IssueActivity

            full_comment = comment
            if extra_comment:
                # Append the decision comment so the activity row
                # carries both the verb phrase and the user's note.
                full_comment = f"{comment}\n\n{extra_comment}" if comment else extra_comment
            # ``target_state`` / ``reject_state`` are WorkflowState
            # rows; the FE history renderer expects State IDs so we
            # project through ``.state_id``. ``source_state_id`` is
            # already a State FK so it stays as-is.
            new_identifier = None
            if verb == "approval_approved":
                target = approval.flow.target_state
                new_identifier = str(target.state_id) if target else None
            elif verb == "approval_rejected":
                reject = approval.flow.reject_state
                new_identifier = str(reject.state_id) if reject else None
            IssueActivity.objects.create(
                issue=issue,
                project=issue.project,
                workspace=issue.workspace,
                actor_id=actor_id,
                verb=verb,
                field="approval",
                old_value=old_value,
                new_value=new_value,
                old_identifier=approval.source_state_id,
                new_identifier=new_identifier,
                comment=full_comment,
            )
        except Exception:  # pragma: no cover - defensive
            # Activity emission must never break the approval
            # transaction — the audit row in WorkflowApprovalDecision
            # remains the source of truth, the activity row is a
            # convenience for the UI.
            logger.warning(
                "workflow.approval_activity_emit_failed",
                exc_info=True,
                extra={
                    "approval_id": str(approval.id),
                    "issue_id": str(issue.id),
                    "verb": verb,
                },
            )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def effective_for_approval(approval: WorkflowApproval) -> EffectiveWorkflow:
    """Build an :class:`EffectiveWorkflow` snapshot for a binding row.

    The approvals service receives an already-bound approval from
    ``TransitionService.transition``. When ``decide`` opens a chained
    approval, we re-derive the same ``EffectiveWorkflow`` shape from
    the binding + revision so the ``open_approval`` call site has a
    uniform signature.
    """
    return EffectiveWorkflow(
        workflow=approval.binding.workflow,
        revision=approval.binding.workflow_revision,
        binding=approval.binding,
        is_type_specific=False,
    )


__all__ = [
    "ApprovalService",
    "ApprovalSummary",
    "DecisionResult",
    "effective_for_approval",
]