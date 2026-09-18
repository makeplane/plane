# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage state machine and material versioning (P1-STG-01 ~ P1-STG-13).

Only the edges of §3.1 are allowed; everything else is a 409. The gate engine
decides whether a submission or a pass is acceptable, and every accepted
transition appends exactly one ``StageTransition`` record carrying the gate and
review snapshots, so the decision can be reproduced later (P1-STG-08).
"""

from django.db import transaction
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    STAGE_SEQUENCE,
    STAGE_SORT_ORDER,
    ResearchProjectProfile,
    ResearchStageInstance,
    StageMaterial,
    StageMaterialVersion,
    StageTransition,
)
from plane.research.services.stage_gate import PASS_PHASE, SUBMIT_PHASE, evaluate_stage_gate
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import ResearchErrorCode
from plane.research.utils.stage_notifications import (
    notify_stage_entered,
    notify_stage_passed,
    notify_stage_returned,
    notify_stage_submitted,
)

STATUS = ResearchStageInstance.Status
ACTION = StageTransition.Action
ACTIVE_STATUSES = (STATUS.IN_PROGRESS, STATUS.SUBMITTED, STATUS.NEEDS_REVISION)

# §3.1 P1-STG-03: exactly these edges exist.
STATE_TRANSITIONS = {
    STATUS.NOT_STARTED: {STATUS.IN_PROGRESS},
    STATUS.IN_PROGRESS: {STATUS.SUBMITTED},
    STATUS.SUBMITTED: {STATUS.PASSED, STATUS.NEEDS_REVISION},
    STATUS.NEEDS_REVISION: {STATUS.IN_PROGRESS},
    STATUS.PASSED: set(),
}

# Materials stay editable while the stage is being worked on (§3.4 P1-OPN-06).
EDITABLE_STAGE_STATUSES = (STATUS.IN_PROGRESS, STATUS.NEEDS_REVISION)


class StageRuleError(Exception):
    """A stage action violated a documented rule."""

    def __init__(self, error_code, message, http_status=status.HTTP_409_CONFLICT, **extra):
        self.error_code = error_code
        self.message = message
        self.http_status = http_status
        self.extra = extra
        super().__init__(message)


def can_transition(from_status, to_status) -> bool:
    return to_status in STATE_TRANSITIONS.get(from_status, set())


def require_transition(instance, to_status):
    if not can_transition(instance.status, to_status):
        raise StageRuleError(
            ResearchErrorCode.STAGE_STATE_CONFLICT,
            f"The stage status {instance.status} does not allow this action.",
        )


def stage_queryset_for_project(project_id):
    return ResearchStageInstance.objects.filter(
        project_id=project_id,
        deleted_at__isnull=True,
    ).order_by("sort_order")


def ensure_stage_instances(workspace, profile, actor=None):
    """Create the four fixed instances for a project; idempotent by design."""
    existing = list(stage_queryset_for_project(profile.project_id))
    if existing:
        return existing, False

    instances = []
    with transaction.atomic():
        for stage in STAGE_SEQUENCE:
            instances.append(
                ResearchStageInstance.objects.create(
                    workspace=workspace,
                    project_id=profile.project_id,
                    stage=stage,
                    sort_order=STAGE_SORT_ORDER[stage],
                    org_unit=profile.org_unit,
                    created_by=actor,
                )
            )
    return instances, True


def active_instance(project_id, exclude_id=None):
    query = ResearchStageInstance.objects.filter(
        project_id=project_id,
        status__in=ACTIVE_STATUSES,
        deleted_at__isnull=True,
    )
    if exclude_id:
        query = query.exclude(pk=exclude_id)
    return query.first()


def blocking_stage_for(instance):
    """The earlier stage that still blocks this one, if any (P1-STG-04)."""
    if instance.previous_stage is None:
        return None
    previous = (
        ResearchStageInstance.objects.filter(
            project_id=instance.project_id,
            stage=instance.previous_stage,
            deleted_at__isnull=True,
        )
        .order_by("sort_order")
        .first()
    )
    if previous is None:
        return None
    if previous.status != STATUS.PASSED:
        return previous
    return None


def record_transition(
    instance,
    *,
    action,
    from_status,
    to_status,
    actor=None,
    reason="",
    gate_snapshot=None,
    review_snapshot=None,
    metadata=None,
):
    return StageTransition.objects.create(
        stage_instance=instance,
        actor=actor,
        action=action,
        from_status=from_status,
        to_status=to_status,
        reason=reason or "",
        gate_snapshot=gate_snapshot or {},
        review_snapshot=review_snapshot or {},
        metadata=metadata or {},
    )


def project_owner_id(instance):
    return (
        ResearchProjectProfile.objects.filter(project_id=instance.project_id)
        .values_list("owner_id", flat=True)
        .first()
    )


def _supersede_reviews(instance, actor):
    """Invalidate collected reviews on re-submission or reopen (P1-REV-08)."""
    try:
        from plane.research.services.review_service import supersede_reviews
    except ImportError:  # pragma: no cover - arrives with P1-A2
        return 0
    return supersede_reviews(instance, actor)


def _review_snapshot(instance):
    try:
        from plane.research.services.review_rules import review_summary
    except ImportError:  # pragma: no cover - arrives with P1-A2
        return {}
    return review_summary(instance)


def enter_stage(instance, actor, request=None):
    """``NOT_STARTED -> IN_PROGRESS`` with the sequential and single-active rules."""
    require_transition(instance, STATUS.IN_PROGRESS)

    blocking = blocking_stage_for(instance)
    if blocking is not None:
        raise StageRuleError(
            ResearchErrorCode.STAGE_SEQUENCE_BLOCKED,
            "The previous stage has not passed yet.",
            blocked_stage=blocking.stage,
        )

    if active_instance(instance.project_id, exclude_id=instance.id) is not None:
        raise StageRuleError(
            ResearchErrorCode.STAGE_ALREADY_ACTIVE,
            "Another stage of this project is already in progress.",
        )

    previous = instance.status
    with transaction.atomic():
        instance.status = STATUS.IN_PROGRESS
        instance.entered_at = timezone.now()
        instance.save(update_fields=["status", "entered_at", "updated_at"])
        record_transition(
            instance,
            action=ACTION.ENTER,
            from_status=previous,
            to_status=instance.status,
            actor=actor,
            metadata={"source": "api"},
        )

    _sync_project_stage(instance)
    owner_id = project_owner_id(instance)
    record_audit_event(
        workspace=instance.workspace,
        action=ResearchAuditAction.STAGE_ENTER,
        resource_type=ResearchResourceType.STAGE,
        resource_id=instance.id,
        org_unit=instance.org_unit,
        actor=actor,
        metadata={"stage": instance.stage},
        request=request,
    )
    notify_stage_entered(instance, actor, owner_id)
    return instance


def _sync_project_stage(instance):
    profile = ResearchProjectProfile.objects.filter(project_id=instance.project_id).first()
    if profile is None:
        return None
    if profile.current_stage != instance.stage:
        profile.current_stage = instance.stage
        profile.save(update_fields=["current_stage", "updated_at"])
    return profile


def submit_stage(instance, actor, request=None):
    """``IN_PROGRESS -> SUBMITTED``; blocking gate items reject with 422 (P1-STG-06)."""
    require_transition(instance, STATUS.SUBMITTED)
    gate = evaluate_stage_gate(instance, SUBMIT_PHASE)
    if gate["blockers"]:
        instance.gate_result = ResearchStageInstance.GateResult.BLOCKED
        instance.save(update_fields=["gate_result", "updated_at"])
        raise StageRuleError(
            ResearchErrorCode.STAGE_GATE_BLOCKED,
            "The stage requirements are not satisfied.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            blockers=gate["blockers"],
            gate=gate,
        )

    # the midterm snapshot freezes the aggregated progress next to the gate
    # result so the reviewers see the same numbers the author submitted (§3.5)
    progress = {}
    if instance.stage == STAGE_SEQUENCE[2]:
        from plane.research.services.progress import build_progress

        progress = build_progress(instance.workspace, instance.project_id, actor)

    previous = instance.status
    now = timezone.now()
    with transaction.atomic():
        instance.status = STATUS.SUBMITTED
        instance.submitted_at = now
        instance.attempt_count = (instance.attempt_count or 0) + 1
        instance.gate_result = ResearchStageInstance.GateResult.PASS
        instance.save(
            update_fields=["status", "submitted_at", "attempt_count", "gate_result", "updated_at"]
        )
        materials_to_submit = list(StageMaterial.objects.select_for_update().filter(
            stage_instance=instance,
            deleted_at__isnull=True,
        ).exclude(status=StageMaterial.Status.SUBMITTED))
        for material in materials_to_submit:
            material.status = StageMaterial.Status.SUBMITTED
            material.submitted_at = now
            material.save(update_fields=["status", "submitted_at", "updated_at"])
            snapshot_material(
                material,
                actor,
                change_source=StageMaterialVersion.ChangeSource.MANUAL,
                reason="stage submitted",
            )
        _supersede_reviews(instance, actor)
        record_transition(
            instance,
            action=ACTION.SUBMIT,
            from_status=previous,
            to_status=instance.status,
            actor=actor,
            gate_snapshot=gate,
            metadata={"attempt": instance.attempt_count, "progress": progress},
        )

    owner_id = project_owner_id(instance)
    record_audit_event(
        workspace=instance.workspace,
        action=ResearchAuditAction.STAGE_SUBMIT,
        resource_type=ResearchResourceType.STAGE,
        resource_id=instance.id,
        org_unit=instance.org_unit,
        actor=actor,
        metadata={"stage": instance.stage, "rule_version": gate["rule_version"], "attempt": instance.attempt_count},
        request=request,
    )
    notify_stage_submitted(instance, actor, owner_id)
    return instance


def return_stage(instance, actor, reason, request=None):
    """``SUBMITTED -> NEEDS_REVISION``; the reason is mandatory."""
    require_transition(instance, STATUS.NEEDS_REVISION)
    if not str(reason or "").strip():
        raise StageRuleError(
            ResearchErrorCode.STAGE_REASON_REQUIRED,
            "A reason is required when returning a stage.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    previous = instance.status
    with transaction.atomic():
        instance.status = STATUS.NEEDS_REVISION
        instance.save(update_fields=["status", "updated_at"])
        # a returned stage hands the materials back to the author: they become
        # editable drafts again (D-06)
        StageMaterial.objects.filter(
            stage_instance=instance,
            deleted_at__isnull=True,
        ).filter(status=StageMaterial.Status.SUBMITTED).update(status=StageMaterial.Status.DRAFT)
        record_transition(
            instance,
            action=ACTION.RETURN,
            from_status=previous,
            to_status=instance.status,
            actor=actor,
            reason=str(reason).strip(),
        )

    owner_id = project_owner_id(instance)
    record_audit_event(
        workspace=instance.workspace,
        action=ResearchAuditAction.STAGE_RETURN,
        resource_type=ResearchResourceType.STAGE,
        resource_id=instance.id,
        org_unit=instance.org_unit,
        actor=actor,
        metadata={"stage": instance.stage, "reason": str(reason).strip()[:500]},
        request=request,
    )
    notify_stage_returned(instance, actor, owner_id, str(reason))
    return instance


def pass_stage(instance, actor, request=None):
    """``SUBMITTED -> PASSED`` after the review gate is satisfied (P1-REV-05)."""
    require_transition(instance, STATUS.PASSED)
    gate = evaluate_stage_gate(instance, PASS_PHASE)
    if gate["blockers"]:
        instance.gate_result = ResearchStageInstance.GateResult.BLOCKED
        instance.save(update_fields=["gate_result", "updated_at"])
        raise StageRuleError(
            ResearchErrorCode.STAGE_REVIEW_BLOCKED,
            "The review rules are not satisfied.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            blockers=gate["blockers"],
            gate=gate,
        )
    summary = _review_snapshot(instance)

    previous = instance.status
    now = timezone.now()
    with transaction.atomic():
        instance.status = STATUS.PASSED
        instance.passed_at = now
        instance.gate_result = ResearchStageInstance.GateResult.PASS
        instance.save(update_fields=["status", "passed_at", "gate_result", "updated_at"])
        StageMaterial.objects.filter(stage_instance=instance, deleted_at__isnull=True).update(
            status=StageMaterial.Status.ACCEPTED
        )
        record_transition(
            instance,
            action=ACTION.PASS,
            from_status=previous,
            to_status=instance.status,
            actor=actor,
            gate_snapshot=gate,
            review_snapshot=summary,
        )

    profile = _sync_project_stage(instance)
    if instance.stage == STAGE_SEQUENCE[-1] and profile is not None:
        profile.workflow_status = ResearchProjectProfile.WorkflowStatus.COMPLETED
        profile.completed_at = timezone.localdate()
        profile.save(update_fields=["workflow_status", "completed_at", "updated_at"])

    owner_id = project_owner_id(instance)
    record_audit_event(
        workspace=instance.workspace,
        action=ResearchAuditAction.STAGE_PASS,
        resource_type=ResearchResourceType.STAGE,
        resource_id=instance.id,
        org_unit=instance.org_unit,
        actor=actor,
        metadata={"stage": instance.stage, "review": summary},
        request=request,
    )
    notify_stage_passed(instance, actor, owner_id)
    return instance


def reopen_stage(instance, actor, reason, confirm=False, request=None):
    """Admin exception flow: ``PASSED -> NEEDS_REVISION`` (P1-STG-09)."""
    if instance.status != STATUS.PASSED:
        raise StageRuleError(
            ResearchErrorCode.STAGE_STATE_CONFLICT,
            "Only a passed stage can be reopened.",
        )
    if not str(reason or "").strip():
        raise StageRuleError(
            ResearchErrorCode.STAGE_REASON_REQUIRED,
            "A reason is required when reopening a stage.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    if instance.stage == STAGE_SEQUENCE[-1] and not confirm:
        raise StageRuleError(
            ResearchErrorCode.STAGE_CONFIRM_REQUIRED,
            "Reopening the final stage requires explicit confirmation.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    previous = instance.status
    with transaction.atomic():
        instance.status = STATUS.NEEDS_REVISION
        instance.passed_at = None
        instance.gate_result = ResearchStageInstance.GateResult.WAIVED
        instance.save(update_fields=["status", "passed_at", "gate_result", "updated_at"])
        materials = list(StageMaterial.objects.filter(stage_instance=instance, deleted_at__isnull=True))
        for material in materials:
            snapshot_material(
                material,
                actor,
                change_source=StageMaterialVersion.ChangeSource.STAGE_REOPEN,
                reason=str(reason).strip(),
            )
        StageMaterial.objects.filter(stage_instance=instance, deleted_at__isnull=True).update(
            status=StageMaterial.Status.DRAFT
        )
        _supersede_reviews(instance, actor)
        record_transition(
            instance,
            action=ACTION.REOPEN,
            from_status=previous,
            to_status=instance.status,
            actor=actor,
            reason=str(reason).strip(),
        )

    _sync_project_stage(instance)
    profile = ResearchProjectProfile.objects.filter(project_id=instance.project_id).first()
    if profile is not None and profile.workflow_status == ResearchProjectProfile.WorkflowStatus.COMPLETED:
        profile.workflow_status = ResearchProjectProfile.WorkflowStatus.ACTIVE
        profile.completed_at = None
        profile.save(update_fields=["workflow_status", "completed_at", "updated_at"])

    record_audit_event(
        workspace=instance.workspace,
        action=ResearchAuditAction.STAGE_REOPEN,
        resource_type=ResearchResourceType.STAGE,
        resource_id=instance.id,
        org_unit=instance.org_unit,
        actor=actor,
        metadata={"stage": instance.stage, "reason": str(reason).strip()[:500]},
        request=request,
    )
    return instance


def material_is_editable(material) -> bool:
    return material.stage_instance.status in EDITABLE_STAGE_STATUSES


def material_snapshot(material):
    """Minimal version snapshot: a summary, never file bytes (G-02)."""
    page = material.page
    attachments = []
    if page is not None:
        try:
            from plane.db.models import FileAsset

            attachments = [
                str(asset_id)
                for asset_id in FileAsset.objects.filter(page_id=page.id, is_deleted=False).values_list(
                    "id", flat=True
                )
            ]
        except Exception:  # pragma: no cover - defensive: assets are optional
            attachments = []
    return {
        "material_type": material.material_type,
        "status": material.status,
        "page_id": str(material.page_id) if material.page_id else None,
        "name": page.name if page is not None else "",
        "description_json": page.description_json if page is not None else {},
        "description_html": page.description_html if page is not None else "",
        "description_stripped": (page.description_stripped or "") if page is not None else "",
        "attachment_ids": attachments,
    }


def diff_against_previous(material, snapshot):
    previous = material.versions.order_by("-version_no").first()
    if previous is None:
        return {"changed": sorted(key for key in snapshot if key != "attachment_ids")}
    changed = []
    for key, value in snapshot.items():
        if previous.snapshot.get(key) != value:
            changed.append(key)
    return {"changed": sorted(changed), "previous_version": previous.version_no}


def snapshot_material(material, actor, *, change_source, reason=""):
    """Append a material version and bump the material's version counter."""
    snapshot = material_snapshot(material)
    diff = diff_against_previous(material, snapshot)
    version_no = (material.last_version_no or 0) + 1
    version = StageMaterialVersion.objects.create(
        material=material,
        version_no=version_no,
        snapshot=snapshot,
        change_source=change_source,
        reason=reason or "",
        diff_summary=diff,
        created_by=actor,
    )
    material.last_version_no = version_no
    material.save(update_fields=["last_version_no", "updated_at"])
    return version
