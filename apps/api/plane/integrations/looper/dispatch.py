"""Transactional state machine for Plane-authoritative Looper dispatches."""

from datetime import timedelta
from uuid import uuid4

from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils import timezone

from plane.db.models import (
    LooperCollaborationEvent,
    LooperCollaborationSnapshot,
    LooperDispatch,
)


class DispatchConflict(ValueError):
    def __init__(self, code, detail, *, dispatch=None):
        super().__init__(detail)
        self.code = code
        self.detail = detail
        self.dispatch = dispatch


def _next_event_version(dispatch):
    return (
        LooperCollaborationEvent.objects.filter(dispatch=dispatch).aggregate(Max("event_version"))[
            "event_version__max"
        ]
        or 0
    ) + 1


def append_dispatch_event(dispatch, *, event_type, phase, actor=None, payload=None, source_event_key=None):
    event = LooperCollaborationEvent.objects.create(
        project_id=dispatch.project_id,
        workspace_id=dispatch.workspace_id,
        dispatch=dispatch,
        event_version=_next_event_version(dispatch),
        source_event_key=source_event_key or f"dispatch:{dispatch.id}:{dispatch.state_version}:{event_type}",
        event_type=event_type,
        phase=phase,
        actor_member=actor,
        role_policy_revision=dispatch.role_policy_revision,
        payload=payload or {},
        occurred_at=timezone.now(),
    )
    LooperCollaborationSnapshot.objects.update_or_create(
        dispatch=dispatch,
        defaults={
            "project_id": dispatch.project_id,
            "workspace_id": dispatch.workspace_id,
            "phase": phase,
            "phase_started_at": event.occurred_at,
            "snapshot_version": event.event_version,
        },
    )
    return event


def dispatch_phase(dispatch):
    if dispatch.state == "completed":
        return "complete"
    if dispatch.wait_kind == "role_decision":
        return "role_decisions"
    if dispatch.wait_kind == "technical_spec_approval":
        return "technical_spec"
    if dispatch.wait_kind == "qa":
        return "qa"
    return "implementation" if dispatch.active_role == "worker" else "research"


@transaction.atomic
def create_dispatch(*, issue, binding, role_policy, actor, requested_mode, idempotency_key):
    """Create one durable dispatch or replay the actor's identical request."""

    issue.__class__.objects.select_for_update().get(id=issue.id)
    existing = (
        LooperDispatch.objects.select_for_update()
        .filter(issue=issue, state__in=LooperDispatch.HOLDING_STATES)
        .first()
    )
    if existing is not None:
        if existing.idempotency_key == idempotency_key and existing.owner_member_id == actor.id:
            return existing, False
        raise DispatchConflict(
            "already_dispatched",
            "This work item already has an active Looper owner.",
            dispatch=existing,
        )

    replay = LooperDispatch.objects.filter(issue=issue, idempotency_key=idempotency_key).first()
    if replay is not None:
        if replay.owner_member_id == actor.id:
            return replay, False
        raise DispatchConflict("idempotency_conflict", "The idempotency key belongs to another dispatch.")

    revision = (
        LooperDispatch.all_objects.filter(issue=issue).aggregate(Max("revision"))["revision__max"] or 0
    ) + 1
    try:
        with transaction.atomic():
            dispatch = LooperDispatch.objects.create(
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                issue=issue,
                node_binding=binding,
                revision=revision,
                requested_mode=requested_mode,
                active_role="planner" if requested_mode == "auto" else "worker",
                owner_member=actor,
                dispatched_by_member=actor,
                node_id=binding.node_id,
                node_name_snapshot=binding.node_name_snapshot,
                node_binding_revision=binding.revision,
                role_policy_revision=role_policy.revision,
                product_member_snapshot=role_policy.product_member,
                design_member_snapshot=role_policy.design_member,
                qa_member_snapshot=role_policy.qa_member,
                state="queued",
                idempotency_key=idempotency_key,
            )
    except IntegrityError as exc:
        winner = (
            LooperDispatch.objects.filter(issue=issue, state__in=LooperDispatch.HOLDING_STATES)
            .order_by("-created_at")
            .first()
        )
        raise DispatchConflict(
            "already_dispatched",
            "Another owner won the concurrent dispatch.",
            dispatch=winner,
        ) from exc
    append_dispatch_event(
        dispatch,
        event_type="dispatch_created",
        phase=dispatch_phase(dispatch),
        actor=actor,
        payload={"requested_mode": requested_mode, "node_id": binding.node_id},
    )
    return dispatch, True


@transaction.atomic
def claim_dispatch(*, dispatch, binding, expected_revision, expected_state_version, idempotency_key):
    dispatch = LooperDispatch.objects.select_for_update().get(id=dispatch.id)
    if dispatch.node_binding_id != binding.id or dispatch.node_id != binding.node_id:
        raise DispatchConflict("wrong_node", "This dispatch belongs to another Node.")
    if dispatch.revision != expected_revision:
        raise DispatchConflict("stale_revision", "Dispatch revision has changed.", dispatch=dispatch)
    if dispatch.claim_idempotency_key == idempotency_key and dispatch.execution_attempt_id:
        return dispatch, False
    if dispatch.state != "queued" or dispatch.state_version != expected_state_version:
        raise DispatchConflict("stale_state", "Dispatch is no longer claimable.", dispatch=dispatch)
    dispatch.claim_idempotency_key = idempotency_key
    dispatch.execution_attempt_id = uuid4()
    dispatch.fencing_token += 1
    dispatch.state = "claimed"
    dispatch.state_version += 1
    dispatch.claim_lease_expires_at = timezone.now() + timedelta(minutes=5)
    dispatch.last_node_ack_at = timezone.now()
    dispatch.save(
        update_fields=(
            "claim_idempotency_key",
            "execution_attempt_id",
            "fencing_token",
            "state",
            "state_version",
            "claim_lease_expires_at",
            "last_node_ack_at",
            "updated_at",
        )
    )
    append_dispatch_event(dispatch, event_type="dispatch_claimed", phase=dispatch_phase(dispatch))
    return dispatch, True


NODE_TRANSITIONS = {
    "claimed": {"running", "failed"},
    "running": {"awaiting_human", "completed", "failed"},
    "awaiting_human": {"running", "completed", "failed"},
    "stop_requested": {"confirmed_stopped"},
}


@transaction.atomic
def transition_dispatch(
    *, dispatch, expected_revision, expected_state_version, execution_attempt_id, fencing_token, new_state, wait_kind
):
    dispatch = LooperDispatch.objects.select_for_update().get(id=dispatch.id)
    if dispatch.revision != expected_revision or dispatch.state_version != expected_state_version:
        raise DispatchConflict("stale_state", "Dispatch state changed before this transition.", dispatch=dispatch)
    if dispatch.execution_attempt_id != execution_attempt_id or dispatch.fencing_token != fencing_token:
        raise DispatchConflict("stale_fence", "Execution attempt or fencing token is stale.", dispatch=dispatch)
    if new_state not in NODE_TRANSITIONS.get(dispatch.state, set()):
        raise DispatchConflict("invalid_transition", f"Cannot transition {dispatch.state} to {new_state}.")
    allowed_wait_kinds = {None, "role_decision", "technical_spec_approval", "qa"}
    if wait_kind not in allowed_wait_kinds or (new_state != "awaiting_human" and wait_kind is not None):
        raise DispatchConflict("invalid_wait_kind", "wait_kind is invalid for this state.")
    dispatch.state = new_state
    dispatch.wait_kind = wait_kind
    dispatch.state_version += 1
    dispatch.last_node_ack_at = timezone.now()
    dispatch.save(update_fields=("state", "wait_kind", "state_version", "last_node_ack_at", "updated_at"))
    append_dispatch_event(
        dispatch,
        event_type=f"dispatch_{new_state}",
        phase=dispatch_phase(dispatch),
        payload={"wait_kind": wait_kind} if wait_kind else {},
    )
    return dispatch


@transaction.atomic
def request_stop(*, dispatch, actor):
    dispatch = LooperDispatch.objects.select_for_update().get(id=dispatch.id)
    if dispatch.owner_member_id != actor.id:
        raise DispatchConflict("not_dispatch_owner", "Only the dispatch owner can stop it.")
    if dispatch.state == "queued":
        dispatch.state = "confirmed_stopped"
    elif dispatch.state in {"claimed", "running", "awaiting_human"}:
        dispatch.state = "stop_requested"
    elif dispatch.state not in {"stop_requested", "confirmed_stopped"}:
        raise DispatchConflict("invalid_transition", f"Cannot stop a dispatch in {dispatch.state}.")
    else:
        return dispatch, False
    dispatch.state_version += 1
    dispatch.save(update_fields=("state", "state_version", "updated_at"))
    append_dispatch_event(dispatch, event_type="stop_requested", phase=dispatch_phase(dispatch), actor=actor)
    return dispatch, True


@transaction.atomic
def release_dispatch(*, dispatch, actor, reason):
    dispatch = LooperDispatch.objects.select_for_update().get(id=dispatch.id)
    if dispatch.owner_member_id != actor.id:
        raise DispatchConflict("not_dispatch_owner", "Only the dispatch owner can release it.")
    if dispatch.state == "released":
        return dispatch, False
    if dispatch.state not in {"queued", "confirmed_stopped"}:
        raise DispatchConflict("not_stopped", "Stop and confirm the local execution before release.")
    if not reason:
        raise DispatchConflict("release_reason_required", "A release reason is required.")
    dispatch.state = "released"
    dispatch.release_reason = reason
    dispatch.state_version += 1
    dispatch.save(update_fields=("state", "release_reason", "state_version", "updated_at"))
    append_dispatch_event(
        dispatch,
        event_type="dispatch_released",
        phase=dispatch_phase(dispatch),
        actor=actor,
        payload={"reason": reason},
    )
    return dispatch, True
