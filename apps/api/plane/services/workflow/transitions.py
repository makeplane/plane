# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Transition service — spec §9, §10, §17.3, §17.4, §19, §20, §25 Phase 1.

The single authoritative path that mutates ``Issue.state`` once a
workflow governs the project (§34 invariant). Every existing state
mutation surface — serializer ``save()`` on create/update, intake
accept, importer, automation task, MCP, public API — must call into
this service (or pass through the no-op path when enforcement is
off).

Public surface:

- ``TransitionService.transition(...)`` — §10 transactional move.
- ``TransitionService.compute_allowed_actions(...)`` — §17.3
  allowed-actions response builder.
- ``TransitionService.validate_creation_state(...)`` — §9.2 creation
  gate.

When ``system_bypass=True`` is passed the service still runs the
§19 audit hook but skips the flow lookup + actor check. The bypass
caller is responsible for supplying ``bypass_reason`` (§19 rule).
"""

# Python imports
import logging
from dataclasses import dataclass, field
from typing import Iterable, Optional

# Django imports
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

# Module imports
from plane.db.models import (
    Issue,
    State,
    Workflow,
    WorkflowFlow,
    WorkflowFlowType,
    WorkflowState,
)

from .actors import authorize_actor
from .bindings import ensure_binding
from .errors import (
    WorkflowApprovalBlocksTransition,
    WorkflowBypassReasonRequired,
    WorkflowDisabled,
    WorkflowNoCreationState,
    WorkflowNoEffectiveWorkflow,
    WorkflowStateNotIncluded,
    WorkflowTransitionNotAllowed,
)
from .flags import workflows_active
from .resolver import EffectiveWorkflow, WorkflowResolver

logger = logging.getLogger("plane.workflow")


# ---------------------------------------------------------------------------
# Result data classes
# ---------------------------------------------------------------------------


@dataclass
class AllowedTransition:
    """One row of the §17.3 ``transitions`` list."""

    flow_id: str
    target_state_id: str
    target_state_name: str
    flow_type: str
    allowed: bool = True


@dataclass
class AllowedActions:
    """The full §17.3 actions payload for a Work Item."""

    workflow_id: Optional[str]
    workflow_revision_id: Optional[str]
    workflow_version: Optional[int]
    current_state_id: Optional[str]
    current_state_name: Optional[str]
    transitions: list[AllowedTransition] = field(default_factory=list)
    approval_pending: Optional[dict] = None

    def to_dict(self) -> dict:
        body = {
            "workflow": (
                {
                    "id": str(self.workflow_id),
                    "revision_id": str(self.workflow_revision_id),
                    "version": self.workflow_version,
                }
                if self.workflow_id
                else None
            ),
            "state": (
                {
                    "id": str(self.current_state_id),
                    "name": self.current_state_name,
                }
                if self.current_state_id
                else None
            ),
            "transitions": [
                {
                    "flow_id": str(t.flow_id),
                    "target_state_id": str(t.target_state_id),
                    "target_state_name": t.target_state_name,
                    "flow_type": t.flow_type,
                    "allowed": t.allowed,
                }
                for t in self.transitions
            ],
        }
        if self.approval_pending is not None:
            body["approval"] = self.approval_pending
        else:
            body["approval"] = None
        return body


# ---------------------------------------------------------------------------
# Transition service
# ---------------------------------------------------------------------------


class TransitionService:
    """Authoritative workflow transition entry point (§10, §34)."""

    # ------------------------------------------------------------------
    # Allowed-actions computation (§17.3)
    # ------------------------------------------------------------------

    @staticmethod
    def compute_allowed_actions(
        *,
        issue: Issue,
        actor_id: Optional[str] = None,
    ) -> AllowedActions:
        """Return the allowed-actions payload for an issue.

        No exceptions are raised — even when enforcement is off or
        the issue has no workflow, the caller gets a benign payload
        with ``transitions=[]``.
        """
        if issue.state_id is None:
            return AllowedActions(
                workflow_id=None,
                workflow_revision_id=None,
                workflow_version=None,
                current_state_id=None,
                current_state_name=None,
                transitions=[],
            )

        if not workflows_active(project=issue.project):
            return AllowedActions(
                workflow_id=None,
                workflow_revision_id=None,
                workflow_version=None,
                current_state_id=issue.state_id,
                current_state_name=issue.state.name if issue.state else None,
                transitions=[],
            )

        effective = WorkflowResolver.resolve(issue)
        if effective is None:
            return AllowedActions(
                workflow_id=None,
                workflow_revision_id=None,
                workflow_version=None,
                current_state_id=issue.state_id,
                current_state_name=issue.state.name if issue.state else None,
                transitions=[],
            )

        # Check that the issue's current state is part of the bound
        # revision; otherwise the issue has drifted (e.g. a state
        # deleted from a draft while a published revision was in
        # flight). Return an empty transitions list rather than
        # raising — the caller is reading for UI display.
        states = list(WorkflowState.objects.filter(revision=effective.revision))
        state_index = {str(s.state_id): s for s in states}
        current_wf_state = state_index.get(str(issue.state_id))
        if current_wf_state is None:
            return AllowedActions(
                workflow_id=effective.workflow_id,
                workflow_revision_id=effective.revision_id,
                workflow_version=effective.workflow_version,
                current_state_id=issue.state_id,
                current_state_name=issue.state.name if issue.state else None,
                transitions=[],
            )

        # V1: only transition flows may be exposed as "transitions".
        # Approval flows are exposed via the ``approval`` block, which
        # is filled in by the approvals child (P1.1).
        outgoing = list(
            WorkflowFlow.objects.filter(
                revision=effective.revision,
                source_state=current_wf_state,
                is_active=True,
                flow_type=WorkflowFlowType.TRANSITION,
            ).select_related("target_state__state")
        )

        transitions: list[AllowedTransition] = []
        for flow in outgoing:
            target = flow.target_state
            if target is None:
                continue
            transitions.append(
                AllowedTransition(
                    flow_id=str(flow.id),
                    target_state_id=str(target.state_id),
                    target_state_name=target.state.name,
                    flow_type=flow.flow_type,
                    allowed=True,
                )
            )

        return AllowedActions(
            workflow_id=effective.workflow_id,
            workflow_revision_id=effective.revision_id,
            workflow_version=effective.workflow_version,
            current_state_id=issue.state_id,
            current_state_name=issue.state.name if issue.state else None,
            transitions=transitions,
        )

    # ------------------------------------------------------------------
    # Creation gate (§9.2)
    # ------------------------------------------------------------------

    @staticmethod
    def validate_creation_state(
        *,
        project,
        issue_type_id: Optional[str],
        requested_state_id: Optional[str],
    ) -> Optional[Issue]:
        """Resolve / validate the initial state for a new issue.

        Returns the state instance to assign, or ``None`` if
        enforcement is off and the caller should fall back to the
        existing CE behavior. Raises a ``WorkflowError`` subclass
        (§9.2, §26) on rejection.

        The caller (typically ``IssueCreateSerializer.create``) is
        responsible for actually persisting the issue + binding; this
        method only resolves the state.
        """
        if not workflows_active(project=project):
            return None

        effective = _resolve_for_project(project=project, issue_type_id=issue_type_id)
        if effective is None:
            # §9.2 enforcement is on but no workflow exists — allow
            # creation with the project's existing default state (we
            # cannot bootstrap on the fly here without leaking that
            # the caller forgot to opt the project in).
            return None

        included_states = list(
            WorkflowState.objects.filter(revision=effective.revision).select_related(
                "state"
            )
        )
        if not included_states:
            raise WorkflowNoCreationState()

        eligible_states = [s for s in included_states if s.allow_new_work_items]
        if not eligible_states:
            raise WorkflowNoCreationState()

        if requested_state_id:
            requested_state_obj = next(
                (
                    s
                    for s in included_states
                    if str(s.state_id) == str(requested_state_id)
                ),
                None,
            )
            if requested_state_obj is None:
                raise WorkflowStateNotIncluded(
                    state_id=requested_state_id,
                    detail=(
                        "Requested state is not included in the workflow revision."
                    ),
                )
            if not requested_state_obj.allow_new_work_items:
                raise WorkflowNoCreationState(
                    detail=(
                        "Requested state does not allow new work items in the bound workflow."
                    ),
                )
            return requested_state_obj.state

        # No state supplied — first allowed state by sequence.
        eligible_states.sort(key=lambda s: (s.sequence, s.created_at))
        return eligible_states[0].state

    # ------------------------------------------------------------------
    # Transactional transition (§10)
    # ------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def transition(
        *,
        issue_id,
        target_state_id,
        actor,
        actor_id: Optional[str],
        origin: str = "api",
        idempotency_key: Optional[str] = None,
        system_bypass: bool = False,
        bypass_reason: Optional[str] = None,
    ) -> Issue:
        """Move ``issue_id`` to ``target_state_id`` under workflow control.

        Returns the updated ``Issue``. Raises a ``WorkflowError``
        subclass on validation failure (§10, §17.4, §18.2, §19).

        Parameters mirror §10 verbatim. ``actor`` may be ``None`` for
        service-token / system-bypass callers; ``actor_id`` is what
        is recorded in the audit and used for actor authorization
        (§18.2 + §18.3).
        """
        # §10.1 — same-state update is a no-op (no audit, no transition).
        issue = (
            Issue.objects.select_for_update()
            .select_related("state", "project", "workspace")
            .get(pk=issue_id)
        )
        if str(issue.state_id) == str(target_state_id):
            return issue

        # §17.4 + §25 Phase 1 — no enforcement, no service-layer
        # involvement. The caller still gets back the (unchanged)
        # issue; the underlying serializer/view handles the
        # user-supplied state_id update through the regular path.
        if not workflows_active(project=issue.project):
            return _bypass_update(
                issue=issue,
                target_state_id=target_state_id,
                actor_id=actor_id,
                origin=origin,
                reason=(
                    bypass_reason
                    or "workflows disabled — falling through to legacy path"
                ),
            )

        # §19 — every bypass must be explicit and audited.
        if system_bypass and not bypass_reason:
            raise WorkflowBypassReasonRequired()

        # Lazy-bind legacy items (§25 Phase 3) before resolving the
        # flow so the binding lookup hits.
        ensure_binding(issue=issue, actor_id=actor_id)

        effective = WorkflowResolver.resolve(issue)
        if effective is None:
            if system_bypass:
                return _bypass_update(
                    issue=issue,
                    target_state_id=target_state_id,
                    actor_id=actor_id,
                    origin=origin,
                    reason=bypass_reason,
                )
            raise WorkflowNoEffectiveWorkflow()

        current_state_id = str(issue.state_id)
        target_state_id = str(target_state_id)

        # Resolve the (revision, source_state) WorkflowState row.
        try:
            source_wf_state = WorkflowState.objects.get(
                revision=effective.revision,
                state_id=current_state_id,
            )
        except WorkflowState.DoesNotExist:
            # Issue has drifted out of the revision — cannot find a
            # valid flow.
            raise WorkflowStateNotIncluded(
                state_id=current_state_id,
                detail=(
                    "Current state is not part of the bound workflow revision; "
                    "cannot compute an allowed transition."
                ),
            )

        # §10.2 — if the source state has an active approval flow,
        # ordinary transitions are blocked unless the request is
        # itself a transition flow (we look only for TRANSITION flows
        # here, so this guard covers the spec rule).
        has_pending_approval = _has_pending_approval(effective, issue)
        if has_pending_approval and not system_bypass:
            raise WorkflowApprovalBlocksTransition(
                source_state_id=current_state_id,
                approval_id=_pending_approval_id(effective, issue),
            )

        # Validate the target state is part of the revision. For a
        # system-bypass caller we still want to enforce this so a
        # buggy automation can't write a deleted state.
        target_in_revision = WorkflowState.objects.filter(
            revision=effective.revision,
            state_id=target_state_id,
        ).exists()
        if not target_in_revision:
            raise WorkflowStateNotIncluded(state_id=target_state_id)

        # Find the matching transition flow. When the caller is
        # running with ``system_bypass=True`` (§19), the flow lookup
        # is informational only — the bypass applies even when no
        # transition flow exists, because the caller is operating
        # under an explicit reason and the audit captures it.
        flow = (
            WorkflowFlow.objects.select_related(
                "source_state__state", "target_state__state"
            )
            .filter(
                revision=effective.revision,
                source_state=source_wf_state,
                target_state__state_id=target_state_id,
                is_active=True,
                flow_type=WorkflowFlowType.TRANSITION,
            )
            .first()
        )

        if flow is None and not system_bypass:
            allowed_target_ids = list(
                WorkflowFlow.objects.filter(
                    revision=effective.revision,
                    source_state=source_wf_state,
                    is_active=True,
                    flow_type=WorkflowFlowType.TRANSITION,
                ).values_list("target_state__state_id", flat=True)
            )
            raise WorkflowTransitionNotAllowed(
                source_state_id=current_state_id,
                target_state_id=target_state_id,
                allowed_target_ids=[str(x) for x in allowed_target_ids],
            )

        if not system_bypass:
            # §18.2 — base Plane authorization (project membership)
            # is the caller's responsibility; here we enforce the
            # workflow actor rule on top.
            authorize_actor(
                flow=flow,
                issue=issue,
                actor_id=actor_id,
            )

        # §10 — apply the state change. ``completed_at`` follows
        # existing CE semantics (target state's group controls the
        # set/clear behavior). The serializer pattern already does
        # this in ``Issue.objects.filter(...).update(...)``; we
        # mirror that here.
        previous_state_id = current_state_id
        target_state = State.objects.get(pk=target_state_id)
        completed_at = _compute_completed_at(
            current_completed_at=issue.completed_at,
            target_state=target_state,
        )

        Issue.objects.filter(pk=issue.pk).update(
            state=target_state,
            completed_at=completed_at,
            updated_at=timezone.now(),
            updated_by_id=actor_id,
        )
        issue.refresh_from_db()

        # §20 — every state mutation is audited. The audit row is
        # best-effort here; the canonical activity/webhook fan-out
        # still runs through the existing ``issue_activity`` Celery
        # task triggered by the serializer/view.
        _write_state_mutation_audit(
            issue=issue,
            actor_id=actor_id,
            previous_state_id=previous_state_id,
            new_state_id=str(issue.state_id),
            origin=origin,
            bypass=system_bypass,
            bypass_reason=bypass_reason,
            idempotency_key=idempotency_key,
        )

        return issue


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_for_project(*, project, issue_type_id) -> Optional[EffectiveWorkflow]:
    """Resolve a workflow for a not-yet-created issue (§9.2 helper)."""
    # Construct a lightweight stand-in so the resolver can read its
    # ``project_id`` + ``type_id``. We never persist this; the
    # ``Issue`` model fields are sufficient for the resolver.
    class _Stub:
        pass

    stub = _Stub()
    stub.id = None
    stub.project_id = project.id
    stub.type_id = issue_type_id
    return WorkflowResolver.resolve(stub)


def _has_pending_approval(effective: EffectiveWorkflow, issue: Issue) -> bool:
    """Return ``True`` iff the issue has a pending approval on the bound revision.

    The approvals child (P1.1) will swap this out for a real
    ``WorkflowApproval.objects.filter(..., status='pending').exists()``
    query once that model ships. For now we treat absence of the
    model as "no pending approval" so the transition path is
    operational in P0.
    """
    try:
        from plane.db.models import WorkflowApproval  # type: ignore
    except ImportError:
        return False
    try:
        return WorkflowApproval.objects.filter(
            issue=issue,
            binding=effective.binding or _binding_for_issue(issue),
            status="pending",
        ).exists()
    except Exception:  # pragma: no cover - defensive against schema drift
        logger.warning("Pending-approval check failed; assuming none.", exc_info=True)
        return False


def _pending_approval_id(effective: EffectiveWorkflow, issue: Issue) -> Optional[str]:
    try:
        from plane.db.models import WorkflowApproval  # type: ignore
    except ImportError:
        return None
    try:
        pending = (
            WorkflowApproval.objects.filter(
                issue=issue,
                binding=effective.binding or _binding_for_issue(issue),
                status="pending",
            )
            .order_by("-created_at")
            .first()
        )
        return str(pending.id) if pending else None
    except Exception:  # pragma: no cover - defensive
        return None


def _binding_for_issue(issue: Issue):
    """Return the ``IssueWorkflowBinding`` for ``issue`` or ``None``."""
    from plane.db.models import IssueWorkflowBinding

    return IssueWorkflowBinding.objects.filter(issue_id=issue.id).first()


def _bypass_update(
    *,
    issue: Issue,
    target_state_id,
    actor_id: Optional[str],
    origin: str,
    reason: str,
) -> Issue:
    """Apply a state change through the legacy path + audit the bypass."""
    target_state = State.objects.get(pk=target_state_id)
    completed_at = _compute_completed_at(
        current_completed_at=issue.completed_at,
        target_state=target_state,
    )
    previous_state_id = str(issue.state_id)
    Issue.objects.filter(pk=issue.pk).update(
        state=target_state,
        completed_at=completed_at,
        updated_at=timezone.now(),
        updated_by_id=actor_id,
    )
    issue.refresh_from_db()
    _write_state_mutation_audit(
        issue=issue,
        actor_id=actor_id,
        previous_state_id=previous_state_id,
        new_state_id=str(issue.state_id),
        origin=origin,
        bypass=True,
        bypass_reason=reason,
        idempotency_key=None,
    )
    return issue


def _compute_completed_at(*, current_completed_at, target_state: State):
    """Mirror the CE ``completed_at`` semantics.

    - target group ``completed`` / ``cancelled``: set to now if not
      already set.
    - any other group: clear to ``None`` so a future transition can
      re-set it.
    """
    from plane.db.models import StateGroup

    target_group = getattr(target_state, "group", None)
    if target_group in (StateGroup.COMPLETED.value, StateGroup.CANCELLED.value):
        return current_completed_at or timezone.now()
    return None


def _write_state_mutation_audit(
    *,
    issue: Issue,
    actor_id: Optional[str],
    previous_state_id: str,
    new_state_id: str,
    origin: str,
    bypass: bool,
    bypass_reason: Optional[str],
    idempotency_key: Optional[str],
) -> None:
    """Persist a §20 audit row for the mutation.

    The audit table lives in the approvals child (P1.1). Until that
    model exists we log structured data through the project logger so
    operators can still trace every mutation. The Celery activity
    task — fired by the serializer/view — supplies the canonical
    IssueActivity row.
    """
    logger.info(
        "workflow.state_mutation",
        extra={
            "issue_id": str(issue.id),
            "project_id": str(issue.project_id),
            "actor_id": str(actor_id) if actor_id else None,
            "previous_state_id": previous_state_id,
            "new_state_id": new_state_id,
            "origin": origin,
            "bypass": bypass,
            "bypass_reason": bypass_reason,
            "idempotency_key": idempotency_key,
        },
    )


__all__ = ["TransitionService", "AllowedActions", "AllowedTransition"]
