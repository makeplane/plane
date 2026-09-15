# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage state machine, append-only guarantees and material versioning (P1-A1)."""

import pytest

from django.utils import timezone

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    Project,
    ProjectIdentifier,
    ResearchProjectProfile,
    ResearchStageInstance,
    StageMaterial,
    StageMaterialVersion,
    StageTransition,
    StageType,
)
from plane.research.services.stage_service import (
    ACTION,
    STATE_TRANSITIONS,
    STATUS,
    StageRuleError,
    blocking_stage_for,
    can_transition,
    ensure_stage_instances,
    enter_stage,
    material_is_editable,
    pass_stage,
    record_transition,
    reopen_stage,
    return_stage,
    snapshot_material,
    submit_stage,
)
from plane.tests.research_fixtures import enable_research, make_user, make_workspace

pytestmark = pytest.mark.unit


@pytest.fixture
def project_env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")
    project = Project.objects.create(
        workspace=workspace,
        name="Machine project",
        identifier="MAC",
        created_by=owner,
    )
    ProjectIdentifier.objects.create(name=project.identifier, project=project, workspace=workspace)
    profile = ResearchProjectProfile.objects.create(
        project=project,
        workspace=workspace,
        owner=owner,
        created_by=owner,
    )
    return {"workspace": workspace, "owner": owner, "project": project, "profile": profile, "admin": admin}


def test_state_machine_matches_the_prd_edges():
    assert can_transition(STATUS.NOT_STARTED, STATUS.IN_PROGRESS)
    assert can_transition(STATUS.IN_PROGRESS, STATUS.SUBMITTED)
    assert can_transition(STATUS.SUBMITTED, STATUS.PASSED)
    assert can_transition(STATUS.SUBMITTED, STATUS.NEEDS_REVISION)
    assert can_transition(STATUS.NEEDS_REVISION, STATUS.IN_PROGRESS)
    # skipping and reversing are refused (P1-STG-03, P1-STG-04)
    assert not can_transition(STATUS.NOT_STARTED, STATUS.SUBMITTED)
    assert not can_transition(STATUS.IN_PROGRESS, STATUS.PASSED)
    assert not can_transition(STATUS.PASSED, STATUS.IN_PROGRESS)
    assert STATE_TRANSITIONS[STATUS.PASSED] == set()


@pytest.mark.django_db
def test_ensure_stage_instances_is_idempotent(project_env):
    instances, created = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    assert created is True
    assert [item.stage for item in instances] == list(StageType.values)
    assert [item.sort_order for item in instances] == [1, 2, 3, 4]
    again, created_again = ensure_stage_instances(
        project_env["workspace"], project_env["profile"], project_env["owner"]
    )
    assert created_again is False
    assert len(again) == 4
    assert ResearchStageInstance.objects.filter(project=project_env["project"]).count() == 4


@pytest.mark.django_db
def test_sequential_entry_is_enforced(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    opening = next(item for item in instances if item.stage == StageType.OPENING.value)
    with pytest.raises(StageRuleError) as excinfo:
        enter_stage(opening, project_env["owner"])
    assert excinfo.value.error_code == "stage_sequence_blocked"
    assert excinfo.value.extra["blocked_stage"] == StageType.PRE_OPENING.value


@pytest.mark.django_db
def test_single_active_stage_is_enforced(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    pre = next(item for item in instances if item.stage == StageType.PRE_OPENING.value)
    opening = next(item for item in instances if item.stage == StageType.OPENING.value)
    enter_stage(pre, project_env["owner"])
    assert blocking_stage_for(opening) is not None
    # even with the predecessor passed, the active instance stays unique
    pre.status = STATUS.PASSED
    pre.save(update_fields=["status"])
    enter_stage(opening, project_env["owner"])
    with pytest.raises(StageRuleError) as excinfo:
        enter_stage(pre, project_env["owner"])
    # a passed stage cannot be re-entered at all (P1-STG-03)
    assert excinfo.value.error_code in ("stage_state_conflict", "stage_already_active")


@pytest.mark.django_db
def test_submit_records_attempt_and_blocks_without_materials(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    pre = next(item for item in instances if item.stage == StageType.PRE_OPENING.value)
    enter_stage(pre, project_env["owner"])
    with pytest.raises(StageRuleError) as excinfo:
        submit_stage(pre, project_env["owner"])
    assert excinfo.value.error_code == "stage_gate_blocked"
    assert excinfo.value.http_status == 422
    assert excinfo.value.extra["blockers"]
    # P1-STG-06: a blocked submission produces no transition record
    assert StageTransition.objects.filter(stage_instance=pre, action=ACTION.SUBMIT).count() == 0


@pytest.mark.django_db
def test_full_pre_opening_cycle(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    pre = next(item for item in instances if item.stage == StageType.PRE_OPENING.value)
    for material_type in MATERIAL_TYPES_BY_STAGE["PRE_OPENING"]:
        StageMaterial.objects.create(
            stage_instance=pre,
            material_type=material_type,
            owner=project_env["owner"],
        )
    # literature counters are not part of this stage of the delivery (T-16):
    # disable them the way an administrator would, through configuration
    from plane.db.models import ResearchStageRequirement

    for code in ("literature_min_included", "literature_max_entries", "literature_quality"):
        ResearchStageRequirement.objects.create(
            workspace=project_env["workspace"],
            stage=StageType.PRE_OPENING.value,
            code=code,
            requirement_type=ResearchStageRequirement.RequirementType.MANUAL,
            is_active=False,
        )

    enter_stage(pre, project_env["owner"])
    submit_stage(pre, project_env["owner"])
    pre.refresh_from_db()
    assert pre.status == STATUS.SUBMITTED
    assert pre.attempt_count == 1

    with pytest.raises(StageRuleError) as excinfo:
        return_stage(pre, project_env["owner"], "")
    assert excinfo.value.error_code == "stage_reason_required"

    return_stage(pre, project_env["owner"], "补充 gap 分析")
    pre.refresh_from_db()
    assert pre.status == STATUS.NEEDS_REVISION

    enter_stage(pre, project_env["owner"])
    submit_stage(pre, project_env["owner"])
    pre.refresh_from_db()
    assert pre.attempt_count == 2
    assert StageTransition.objects.filter(stage_instance=pre).count() == 5


@pytest.mark.django_db
def test_reopen_requires_pass_and_reason(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    pre = next(item for item in instances if item.stage == StageType.PRE_OPENING.value)
    with pytest.raises(StageRuleError) as excinfo:
        reopen_stage(pre, project_env["admin"], "mistake")
    assert excinfo.value.error_code == "stage_state_conflict"

    pre.status = STATUS.PASSED
    pre.save(update_fields=["status"])
    with pytest.raises(StageRuleError) as reason_error:
        reopen_stage(pre, project_env["admin"], "")
    assert reason_error.value.error_code == "stage_reason_required"

    reopen_stage(pre, project_env["admin"], "材料事实有误")
    pre.refresh_from_db()
    assert pre.status == STATUS.NEEDS_REVISION
    assert pre.gate_result == ResearchStageInstance.GateResult.WAIVED


@pytest.mark.django_db
def test_final_reopen_needs_confirmation(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    final = next(item for item in instances if item.stage == StageType.FINAL.value)
    final.status = STATUS.PASSED
    final.save(update_fields=["status"])
    with pytest.raises(StageRuleError) as excinfo:
        reopen_stage(final, project_env["admin"], "重新归档")
    assert excinfo.value.error_code == "stage_confirm_required"
    reopen_stage(final, project_env["admin"], "重新归档", confirm=True)
    final.refresh_from_db()
    assert final.status == STATUS.NEEDS_REVISION


@pytest.mark.django_db
def test_pass_marks_project_completed_on_final(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    final = next(item for item in instances if item.stage == StageType.FINAL.value)
    final.status = STATUS.SUBMITTED
    final.save(update_fields=["status"])
    # the review gate is satisfied through the rule configuration (P1-A2 owns
    # the rule matrix; this test owns the project status linkage)
    from plane.db.models import ResearchStageRequirement, StageReview

    for code in ("stage_min_reviewers", "stage_advisor_required", "stage_pi_branch_required"):
        ResearchStageRequirement.objects.create(
            workspace=project_env["workspace"],
            stage=StageType.FINAL.value,
            code=code,
            requirement_type=ResearchStageRequirement.RequirementType.REVIEW_RULE,
            threshold=0,
        )
    for user, role in (
        (project_env["admin"], "DIRECT_ADVISOR"),
        (make_user(first_name="Pi"), "PI"),
        (make_user(first_name="Extra"), "REVIEWER"),
    ):
        StageReview.objects.create(
            stage_instance=final,
            reviewer=user,
            reviewer_role=role,
            recommendation="PASS",
            submitted_at=timezone.now(),
        )
    pass_stage(final, project_env["admin"])
    final.refresh_from_db()
    project_env["profile"].refresh_from_db()
    assert final.status == STATUS.PASSED
    assert project_env["profile"].workflow_status == ResearchProjectProfile.WorkflowStatus.COMPLETED
    assert project_env["profile"].completed_at is not None
    assert project_env["profile"].current_stage == StageType.FINAL.value


@pytest.mark.django_db
def test_stage_transitions_are_append_only(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    pre = next(item for item in instances if item.stage == StageType.PRE_OPENING.value)
    transition = record_transition(
        pre,
        action=ACTION.ENTER,
        from_status=STATUS.NOT_STARTED,
        to_status=STATUS.IN_PROGRESS,
        actor=project_env["owner"],
    )
    transition.reason = "edited afterwards"
    with pytest.raises(TypeError):
        transition.save()
    with pytest.raises(TypeError):
        transition.delete()
    with pytest.raises(TypeError):
        StageTransition.objects.filter(pk=transition.pk).update(reason="bulk edit")
    with pytest.raises(TypeError):
        StageTransition.objects.all().delete()
    assert StageTransition.objects.filter(pk=transition.pk).count() == 1


@pytest.mark.django_db
def test_material_versions_are_append_only_and_increasing(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    pre = next(item for item in instances if item.stage == StageType.PRE_OPENING.value)
    material = StageMaterial.objects.create(
        stage_instance=pre,
        material_type=MATERIAL_TYPES_BY_STAGE["PRE_OPENING"][0],
        owner=project_env["owner"],
    )
    first = snapshot_material(material, project_env["owner"], change_source="MANUAL")
    second = snapshot_material(material, project_env["owner"], change_source="MANUAL")
    material.refresh_from_db()
    assert (first.version_no, second.version_no) == (1, 2)
    assert material.last_version_no == 2
    with pytest.raises(TypeError):
        StageMaterialVersion.objects.filter(material=material).update(reason="nope")
    with pytest.raises(TypeError):
        second.delete()


@pytest.mark.django_db
def test_material_editability_follows_the_stage_status(project_env):
    instances, _ = ensure_stage_instances(project_env["workspace"], project_env["profile"], project_env["owner"])
    pre = next(item for item in instances if item.stage == StageType.PRE_OPENING.value)
    material = StageMaterial.objects.create(
        stage_instance=pre,
        material_type=MATERIAL_TYPES_BY_STAGE["PRE_OPENING"][0],
        owner=project_env["owner"],
    )
    assert material_is_editable(material) is False
    pre.status = STATUS.IN_PROGRESS
    pre.save(update_fields=["status"])
    material.refresh_from_db()
    assert material_is_editable(material) is True
    pre.status = STATUS.SUBMITTED
    pre.save(update_fields=["status"])
    material.refresh_from_db()
    assert material_is_editable(material) is False
