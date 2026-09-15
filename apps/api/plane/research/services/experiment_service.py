# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Experiment state machine, locking and the amendment workflow (P1-C1).

The rules are deliberately boring and explicit: which status may follow which,
which fields freeze when the run starts, and what an amendment has to contain
before an approver may accept it.
"""

from django.db import transaction
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    AMENDABLE_FIELDS,
    LOCKED_FIELDS,
    ExperimentAmendment,
    ExperimentRecord,
    ExperimentRecordVersion,
    Project,
)
from plane.research.services.stage_service import StageRuleError
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import ResearchErrorCode
from plane.research.utils.experiment_notifications import (
    notify_amendment_created,
    notify_amendment_reviewed,
    notify_experiment_submitted,
)

STATUS = ExperimentRecord.Status
ACTION = ExperimentRecordVersion.ChangeSource

STATUS_TRANSITIONS = {
    STATUS.PLANNED: {STATUS.RUNNING, STATUS.CANCELLED},
    STATUS.RUNNING: {STATUS.COMPLETED, STATUS.FAILED, STATUS.CANCELLED},
    STATUS.COMPLETED: {STATUS.ARCHIVED},
    STATUS.FAILED: {STATUS.ARCHIVED},
    STATUS.CANCELLED: {STATUS.ARCHIVED},
    STATUS.ARCHIVED: set(),
}

# Snapshot payload fields copied into every version (audit friendly, no files).
SNAPSHOT_FIELDS = (
    "title",
    "objective",
    "hypothesis",
    "molecular_system",
    "smiles",
    "system_composition",
    "method",
    "parameters",
    "environment",
    "result",
    "metrics",
    "conclusion",
    "failure_reason",
    "status_note",
    "status",
    "source",
    "started_at",
    "completed_at",
)


def can_transition(from_status, to_status) -> bool:
    return to_status in STATUS_TRANSITIONS.get(from_status, set())


def require_transition(record, to_status):
    if not can_transition(record.status, to_status):
        raise StageRuleError(
            ResearchErrorCode.EXPERIMENT_STATE_CONFLICT,
            f"The experiment status {record.status} does not allow this action.",
        )


def next_sequence_no(project_id) -> int:
    """Allocate the next project sequence under a project level lock (G-04)."""
    Project.objects.select_for_update().filter(pk=project_id).first()
    last = (
        ExperimentRecord.all_objects.filter(project_id=project_id, deleted_at__isnull=True)
        .order_by("-sequence_no")
        .values_list("sequence_no", flat=True)
        .first()
    )
    return (last or 0) + 1


def experiment_snapshot(record) -> dict:
    snapshot = {}
    for field in SNAPSHOT_FIELDS:
        value = getattr(record, field)
        snapshot[field] = value.isoformat() if hasattr(value, "isoformat") else value
    snapshot["sequence_no"] = record.sequence_no
    snapshot["version_no"] = record.current_version_no
    return snapshot


def editable_statuses():
    return (STATUS.PLANNED, STATUS.RUNNING)


def locked_field_changes(record, payload) -> list:
    """Locked fields a direct update tries to touch (P1-EXP-04)."""
    changed = []
    for field in LOCKED_FIELDS:
        if field in payload and payload[field] != getattr(record, field):
            changed.append(field)
    return changed


def require_writable(record):
    """Submitted records are read only; archived records are frozen (P1-EXP-05)."""
    if record.status == STATUS.ARCHIVED:
        raise StageRuleError(
            ResearchErrorCode.EXPERIMENT_ARCHIVED,
            "An archived experiment can no longer be changed.",
        )
    if record.submitted_at is not None:
        raise StageRuleError(
            ResearchErrorCode.EXPERIMENT_READ_ONLY,
            "A submitted experiment is read only. Raise an amendment to change it.",
            http_status=status.HTTP_409_CONFLICT,
        )


def append_version(record, actor, *, change_source, reason=""):
    # the first snapshot is always v1; every later snapshot increments
    version_no = (record.current_version_no or 0) + 1 if record.versions.exists() else 1
    record.current_version_no = version_no
    snapshot = experiment_snapshot(record)
    snapshot["version_no"] = version_no
    version = ExperimentRecordVersion.objects.create(
        record=record,
        version_no=version_no,
        snapshot=snapshot,
        change_source=change_source,
        reason=reason or "",
        created_by=actor,
    )
    return version


def submit_experiment(record, actor, request=None):
    """Lock the record and snapshot it (P1-EXP-04, P1-EXP-08)."""
    if record.submitted_at is not None:
        raise StageRuleError(
            ResearchErrorCode.EXPERIMENT_STATE_CONFLICT,
            "This experiment has already been submitted.",
        )
    if record.status == STATUS.ARCHIVED:
        raise StageRuleError(
            ResearchErrorCode.EXPERIMENT_ARCHIVED,
            "An archived experiment cannot be submitted.",
        )
    if record.status == STATUS.FAILED and not record.failure_reason.strip():
        raise StageRuleError(
            ResearchErrorCode.EXPERIMENT_STATE_CONFLICT,
            "A failed experiment needs a failure reason.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    now = timezone.now()
    with transaction.atomic():
        record.submitted_at = now
        record.is_locked = True
        if record.started_at is None and record.status in (STATUS.RUNNING, STATUS.COMPLETED, STATUS.FAILED):
            record.started_at = record.started_at or now
        record.save(
            update_fields=["submitted_at", "is_locked", "started_at", "current_version_no", "updated_at"]
        )
        version = append_version(record, actor, change_source=ACTION.SUBMIT, reason="submitted")
        record.save(update_fields=["current_version_no", "updated_at"])

    record_audit_event(
        workspace=record.workspace,
        action=ResearchAuditAction.EXPERIMENT_SUBMIT,
        resource_type=ResearchResourceType.EXPERIMENT,
        resource_id=record.id,
        actor=actor,
        metadata={"sequence_no": record.sequence_no, "version_no": version.version_no},
        request=request,
    )
    notify_experiment_submitted(record, actor)
    return record


def create_amendment(record, actor, *, reason, change_set, evidence_asset=None, request=None):
    """Validate and store a change request (P1-EXP-05, P1-EXP-06)."""
    if record.submitted_at is None or record.status == STATUS.ARCHIVED:
        raise StageRuleError(
            ResearchErrorCode.EXPERIMENT_STATE_CONFLICT,
            "Only a submitted, unarchived experiment can be amended.",
        )
    if not str(reason or "").strip():
        raise StageRuleError(
            ResearchErrorCode.AMENDMENT_REASON_REQUIRED,
            "An amendment needs a reason.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    entries = change_set if isinstance(change_set, list) else []
    if not entries:
        raise StageRuleError(
            ResearchErrorCode.AMENDMENT_CHANGE_SET_REQUIRED,
            "An amendment needs at least one field change.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    for entry in entries:
        field = str(entry.get("field") or "")
        if field not in AMENDABLE_FIELDS:
            raise StageRuleError(
                ResearchErrorCode.AMENDMENT_FIELD_NOT_ALLOWED,
                f"Field {field} cannot be amended.",
                http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
    if ExperimentAmendment.objects.filter(record=record, status=ExperimentAmendment.Status.PENDING).exists():
        raise StageRuleError(
            ResearchErrorCode.AMENDMENT_PENDING_EXISTS,
            "An amendment is already pending for this experiment.",
        )

    amendment = ExperimentAmendment.objects.create(
        record=record,
        requested_by=actor,
        reason=str(reason).strip(),
        change_set=entries,
        evidence_asset=evidence_asset,
        created_by=actor,
    )
    record_audit_event(
        workspace=record.workspace,
        action=ResearchAuditAction.EXPERIMENT_AMENDMENT_CREATE,
        resource_type=ResearchResourceType.EXPERIMENT_AMENDMENT,
        resource_id=amendment.id,
        actor=actor,
        metadata={
            "sequence_no": record.sequence_no,
            "fields": [entry.get("field") for entry in entries],
        },
        request=request,
    )
    notify_amendment_created(record, amendment, actor)
    return amendment


def apply_change_set(record, change_set):
    """Apply an approved change set to the record (values are JSON friendly)."""
    for entry in change_set or []:
        field = entry.get("field")
        if field not in AMENDABLE_FIELDS:
            continue
        value = entry.get("new")
        if field in ("started_at", "completed_at"):
            value = _parse_datetime(value)
        setattr(record, field, value)
    return record


def _parse_datetime(value):
    if value in (None, ""):
        return None
    from django.utils.dateparse import parse_datetime

    if hasattr(value, "isoformat"):
        return value
    return parse_datetime(str(value))


def approve_amendment(amendment, actor, comment="", request=None):
    """Apply the change set and append a new immutable version (P1-EXP-08)."""
    if amendment.status != ExperimentAmendment.Status.PENDING:
        raise StageRuleError(
            ResearchErrorCode.AMENDMENT_STATE_CONFLICT,
            "This amendment is no longer pending.",
        )
    record = amendment.record
    with transaction.atomic():
        apply_change_set(record, amendment.change_set)
        record.save()
        version = append_version(
            record,
            actor,
            change_source=ACTION.AMENDMENT,
            reason=amendment.reason,
        )
        record.save(update_fields=["current_version_no", "updated_at"])
        amendment.status = ExperimentAmendment.Status.APPROVED
        amendment.reviewed_by = actor
        amendment.reviewed_at = timezone.now()
        amendment.review_comment = str(comment or "")
        amendment.result_version = version
        amendment.save(
            update_fields=["status", "reviewed_by", "reviewed_at", "review_comment", "result_version", "updated_at"]
        )

    record_audit_event(
        workspace=record.workspace,
        action=ResearchAuditAction.EXPERIMENT_AMENDMENT_APPROVE,
        resource_type=ResearchResourceType.EXPERIMENT_AMENDMENT,
        resource_id=amendment.id,
        actor=actor,
        metadata={"sequence_no": record.sequence_no, "version_no": version.version_no},
        request=request,
    )
    notify_amendment_reviewed(record, amendment, actor, approved=True)
    return amendment


def reject_amendment(amendment, actor, comment="", request=None):
    if amendment.status != ExperimentAmendment.Status.PENDING:
        raise StageRuleError(
            ResearchErrorCode.AMENDMENT_STATE_CONFLICT,
            "This amendment is no longer pending.",
        )
    if not str(comment or "").strip():
        raise StageRuleError(
            ResearchErrorCode.AMENDMENT_COMMENT_REQUIRED,
            "A comment is required when rejecting an amendment.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    amendment.status = ExperimentAmendment.Status.REJECTED
    amendment.reviewed_by = actor
    amendment.reviewed_at = timezone.now()
    amendment.review_comment = str(comment)
    amendment.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment", "updated_at"])
    record_audit_event(
        workspace=amendment.record.workspace,
        action=ResearchAuditAction.EXPERIMENT_AMENDMENT_REJECT,
        resource_type=ResearchResourceType.EXPERIMENT_AMENDMENT,
        resource_id=amendment.id,
        actor=actor,
        metadata={"sequence_no": amendment.record.sequence_no},
        request=request,
    )
    notify_amendment_reviewed(amendment.record, amendment, actor, approved=False)
    return amendment


def cancel_amendment(amendment, actor, request=None):
    if amendment.status != ExperimentAmendment.Status.PENDING:
        raise StageRuleError(
            ResearchErrorCode.AMENDMENT_STATE_CONFLICT,
            "This amendment is no longer pending.",
        )
    if amendment.requested_by_id != actor.id:
        raise StageRuleError(
            ResearchErrorCode.PERMISSION_DENIED,
            "Only the requester can withdraw an amendment.",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    amendment.status = ExperimentAmendment.Status.CANCELLED
    amendment.save(update_fields=["status", "updated_at"])
    record_audit_event(
        workspace=amendment.record.workspace,
        action=ResearchAuditAction.EXPERIMENT_AMENDMENT_CANCEL,
        resource_type=ResearchResourceType.EXPERIMENT_AMENDMENT,
        resource_id=amendment.id,
        actor=actor,
        metadata={"sequence_no": amendment.record.sequence_no},
        request=request,
    )
    return amendment


def archive_experiment(record, actor, request=None):
    """Archive instead of deleting - failed experiments stay on record (P1-EXP-10)."""
    require_transition(record, STATUS.ARCHIVED)
    previous = record.status
    record.status = STATUS.ARCHIVED
    record.save(update_fields=["status", "updated_at"])
    record_audit_event(
        workspace=record.workspace,
        action=ResearchAuditAction.EXPERIMENT_ARCHIVE,
        resource_type=ResearchResourceType.EXPERIMENT,
        resource_id=record.id,
        actor=actor,
        metadata={"sequence_no": record.sequence_no, "from_status": previous},
        request=request,
    )
    return record
