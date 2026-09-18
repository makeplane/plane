# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Review rule matrix (P1-REV-02 ~ P1-REV-06)."""

from datetime import timedelta

import pytest
from django.utils import timezone

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    Project,
    ProjectIdentifier,
    ResearchProjectProfile,
    ResearchStageInstance,
    ResearchStageRequirement,
    StageMaterial,
    StageReview,
    StageReviewerAssignment,
    StageType,
)
from plane.research.services.review_rules import (
    effective_assignments,
    evaluate_review_rule,
    is_effective,
    resolve_review_rules,
    review_summary,
)
from plane.research.services.stage_gate import PASS_PHASE, evaluate_stage_gate
from plane.tests.research_fixtures import enable_research, make_user, make_workspace

pytestmark = pytest.mark.unit


@pytest.fixture
def review_env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")
    mentor = make_user(first_name="Mentor")
    pi = make_user(first_name="PI")
    reviewer = make_user(first_name="Reviewer")

    root = OrgUnit.objects.create(
        workspace=workspace,
        name=workspace.name,
        unit_type=OrgUnit.UnitType.ROOT,
        depth=0,
        path="",
    )
    root.path = f"/{str(root.id).replace('-', '')}/"
    root.save(update_fields=["path"])
    group = OrgUnit.objects.create(
        workspace=workspace,
        name="Group",
        parent=root,
        unit_type=OrgUnit.UnitType.GROUP,
        depth=1,
        path="",
    )
    group.path = f"{root.path}{str(group.id).replace('-', '')}/"
    group.save(update_fields=["path"])
    OrgUnitMember.objects.create(workspace=workspace, org_unit=group, user=pi, org_role=OrgUnitMember.OrgRole.PI)
    MentorBinding.objects.create(workspace=workspace, mentee=owner, mentor=mentor)

    project = Project.objects.create(workspace=workspace, name="Review project", identifier="REV", created_by=owner)
    ProjectIdentifier.objects.create(name=project.identifier, project=project, workspace=workspace)
    ResearchProjectProfile.objects.create(
        project=project,
        workspace=workspace,
        owner=owner,
        org_unit=group,
        created_by=owner,
    )
    instance = ResearchStageInstance.objects.create(
        workspace=workspace,
        project=project,
        stage=StageType.PRE_OPENING.value,
        sort_order=1,
        status=ResearchStageInstance.Status.SUBMITTED,
        org_unit=group,
        created_by=owner,
    )
    return {
        "workspace": workspace,
        "instance": instance,
        "owner": owner,
        "mentor": mentor,
        "pi": pi,
        "reviewer": reviewer,
        "admin": admin,
        "group": group,
    }


def add_review(env, user, role, recommendation, comment="looks fine"):
    return StageReview.objects.create(
        stage_instance=env["instance"],
        reviewer=user,
        reviewer_role=role,
        recommendation=recommendation,
        comment=comment,
        submitted_at=timezone.now(),
        created_by=user,
    )


def add_assignment(env, user, role, **kwargs):
    return StageReviewerAssignment.objects.create(
        stage_instance=env["instance"],
        reviewer=user,
        reviewer_role=role,
        **kwargs,
    )


@pytest.mark.django_db
def test_default_rules(review_env):
    rules, sources = resolve_review_rules(review_env["workspace"], StageType.PRE_OPENING.value)
    assert rules["min_reviewers"] == 3
    assert rules["pass_ratio"] == 0.5
    assert rules["advisor_required"] is True
    assert rules["pi_branch_required"] is True
    assert rules["advisor_veto"] is True
    assert sources["min_reviewers"] == "workspace"


@pytest.mark.django_db
def test_requirement_overrides_switch_rules_off(review_env):
    for code, value in (("stage_min_reviewers", 2), ("stage_advisor_veto", 0)):
        ResearchStageRequirement.objects.create(
            workspace=review_env["workspace"],
            stage=StageType.PRE_OPENING.value,
            code=code,
            requirement_type=ResearchStageRequirement.RequirementType.REVIEW_RULE,
            threshold=value,
        )
    rules, sources = resolve_review_rules(review_env["workspace"], StageType.PRE_OPENING.value)
    assert rules["min_reviewers"] == 2
    assert rules["advisor_veto"] is False
    assert sources["min_reviewers"] == "workspace"


@pytest.mark.django_db
def test_empty_review_set_is_blocked_with_pending_roles(review_env):
    outcome = evaluate_review_rule(review_env["instance"])
    assert outcome["passed"] is False
    assert outcome["actual"] == 0
    assert set(outcome["detail"]["pending_required_roles"]) == {"DIRECT_ADVISOR", "PI_BRANCH"}


@pytest.mark.django_db
def test_three_passes_with_both_mandatory_roles_pass(review_env):
    add_review(review_env, review_env["mentor"], "DIRECT_ADVISOR", "PASS")
    add_review(review_env, review_env["pi"], "PI", "PASS")
    add_review(review_env, review_env["reviewer"], "REVIEWER", "PASS")
    outcome = evaluate_review_rule(review_env["instance"])
    assert outcome["passed"] is True
    assert outcome["actual"] == 3
    assert outcome["detail"]["distribution"] == {"PASS": 3, "REJECT": 0, "REVISE": 0}


@pytest.mark.django_db
def test_direct_advisor_reject_vetoes_even_with_other_passes(review_env):
    add_review(review_env, review_env["mentor"], "DIRECT_ADVISOR", "REJECT", "not ready")
    add_review(review_env, review_env["pi"], "PI", "PASS")
    add_review(review_env, review_env["reviewer"], "REVIEWER", "PASS")
    outcome = evaluate_review_rule(review_env["instance"])
    assert outcome["passed"] is False
    assert outcome["detail"]["vetoed_by"] == str(review_env["mentor"].id)


@pytest.mark.django_db
def test_missing_direct_advisor_blocks(review_env):
    add_review(review_env, review_env["pi"], "PI", "PASS")
    add_review(review_env, review_env["reviewer"], "REVIEWER", "PASS")
    add_review(review_env, review_env["admin"], "UNIT_ADMIN", "PASS")
    outcome = evaluate_review_rule(review_env["instance"])
    assert outcome["passed"] is False
    assert outcome["detail"]["pending_required_roles"] == ["DIRECT_ADVISOR"]


@pytest.mark.django_db
def test_missing_pi_branch_blocks(review_env):
    add_review(review_env, review_env["mentor"], "DIRECT_ADVISOR", "PASS")
    add_review(review_env, review_env["reviewer"], "REVIEWER", "PASS")
    add_review(review_env, review_env["admin"], "UNIT_ADMIN", "PASS")
    outcome = evaluate_review_rule(review_env["instance"])
    assert outcome["passed"] is False
    assert outcome["detail"]["pending_required_roles"] == ["PI_BRANCH"]


@pytest.mark.django_db
def test_reviewer_count_threshold_blocks(review_env):
    add_review(review_env, review_env["mentor"], "DIRECT_ADVISOR", "PASS")
    add_review(review_env, review_env["pi"], "PI", "PASS")
    outcome = evaluate_review_rule(review_env["instance"])
    assert outcome["passed"] is False
    assert outcome["actual"] == 2
    assert outcome["required"] == 3


@pytest.mark.django_db
def test_pass_ratio_must_be_strictly_greater_than_the_threshold(review_env):
    add_review(review_env, review_env["mentor"], "DIRECT_ADVISOR", "PASS")
    add_review(review_env, review_env["pi"], "PI", "REVISE", "needs work")
    add_review(review_env, review_env["reviewer"], "REVIEWER", "REJECT", "no")
    outcome = evaluate_review_rule(review_env["instance"])
    assert outcome["passed"] is False
    assert outcome["detail"]["pass_count"] == 1
    assert outcome["detail"]["review_count"] == 3


@pytest.mark.django_db
def test_revise_does_not_count_as_pass(review_env):
    add_review(review_env, review_env["mentor"], "DIRECT_ADVISOR", "PASS")
    add_review(review_env, review_env["pi"], "PI", "PASS")
    add_review(review_env, review_env["reviewer"], "REVIEWER", "REVISE", "minor")
    outcome = evaluate_review_rule(review_env["instance"])
    assert outcome["passed"] is True  # 2/3 > 0.5 and no veto
    assert outcome["detail"]["distribution"]["REVISE"] == 1


@pytest.mark.django_db
def test_expired_delegation_is_not_effective(review_env):
    assignment = add_assignment(
        review_env,
        review_env["reviewer"],
        "REVIEWER",
        assignment_kind=StageReviewerAssignment.AssignmentKind.DELEGATED,
        valid_until=timezone.now() - timedelta(days=1),
    )
    assert is_effective(assignment) is False
    assert effective_assignments(review_env["instance"]) == []


@pytest.mark.django_db
def test_review_summary_freezes_the_distribution(review_env):
    add_review(review_env, review_env["mentor"], "DIRECT_ADVISOR", "PASS")
    add_review(review_env, review_env["pi"], "PI", "PASS")
    summary = review_summary(review_env["instance"])
    assert summary["reviewer_count"] == 2
    assert summary["distribution"]["PASS"] == 2
    assert summary["rules"]["min_reviewers"] == 3
    assert summary["rule_version"]
    assert summary["frozen_at"]
    assert len(summary["reviews"]) == 2


@pytest.mark.django_db
def test_review_gate_appears_in_the_pass_phase_only(review_env):
    for material_type in MATERIAL_TYPES_BY_STAGE["PRE_OPENING"]:
        StageMaterial.objects.create(
            stage_instance=review_env["instance"],
            material_type=material_type,
            owner=review_env["owner"],
        )
    submit_gate = evaluate_stage_gate(review_env["instance"], "submit")
    assert all(item["code"] != "review_rule" for item in submit_gate["blockers"])

    pass_gate = evaluate_stage_gate(review_env["instance"], PASS_PHASE)
    item = next(entry for entry in pass_gate["items"] if entry["code"] == "review_rule")
    assert item["passed"] is False
    assert "review_rule" in {blocker["code"] for blocker in pass_gate["blockers"]}
    assert item["pending_required_roles"] == ["DIRECT_ADVISOR", "PI_BRANCH"]

    add_review(review_env, review_env["mentor"], "DIRECT_ADVISOR", "PASS")
    add_review(review_env, review_env["pi"], "PI", "PASS")
    add_review(review_env, review_env["reviewer"], "REVIEWER", "PASS")
    satisfied = evaluate_stage_gate(review_env["instance"], PASS_PHASE)
    assert satisfied["result"] == "PASS"
