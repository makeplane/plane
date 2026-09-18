# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Gate engine rules (P1-STG-06, P1-STG-07, P1-STG-08)."""

import pytest

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    ResearchStageInstance,
    ResearchStageRequirement,
    StageMaterial,
    StageType,
)
from plane.research.services.stage_gate import (
    PASS_PHASE,
    SUBMIT_PHASE,
    evaluate_stage_gate,
    gate_rule_version,
    resolve_requirements,
)
from plane.tests.research_fixtures import enable_research, make_user, make_workspace

pytestmark = pytest.mark.unit


@pytest.fixture
def stage_env(db):
    from plane.db.models import Project, ProjectIdentifier

    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")

    project = Project.objects.create(
        workspace=workspace,
        name="Stage project",
        identifier="STG",
        created_by=owner,
    )
    ProjectIdentifier.objects.create(name=project.identifier, project=project, workspace=workspace)
    instance = ResearchStageInstance.objects.create(
        workspace=workspace,
        project=project,
        stage=StageType.PRE_OPENING.value,
        sort_order=1,
        created_by=owner,
    )
    return {"workspace": workspace, "owner": owner, "project": project, "instance": instance}


@pytest.mark.django_db
def test_default_thresholds_come_from_settings(stage_env):
    effective = resolve_requirements(stage_env["workspace"], StageType.PRE_OPENING.value)
    assert effective["literature_min_included"].threshold == 20
    assert effective["literature_max_entries"].threshold == 100
    assert effective["literature_max_entries"].direction == "max"
    assert effective["material_set"].threshold == len(MATERIAL_TYPES_BY_STAGE["PRE_OPENING"])
    assert effective["review_rule"].phases == (PASS_PHASE,)
    assert effective["material_set"].phases == (SUBMIT_PHASE,)


@pytest.mark.django_db
def test_workspace_level_override_wins_over_defaults(stage_env):
    ResearchStageRequirement.objects.create(
        workspace=stage_env["workspace"],
        stage=StageType.PRE_OPENING.value,
        code="literature_min_included",
        requirement_type=ResearchStageRequirement.RequirementType.LITERATURE_COUNT,
        threshold=5,
    )
    effective = resolve_requirements(stage_env["workspace"], StageType.PRE_OPENING.value)
    assert effective["literature_min_included"].threshold == 5
    assert effective["literature_min_included"].source == "workspace"


@pytest.mark.django_db
def test_org_unit_override_wins_over_workspace(stage_env):
    from plane.db.models import OrgUnit

    unit = OrgUnit.objects.create(
        workspace=stage_env["workspace"],
        name="Group",
        unit_type=OrgUnit.UnitType.GROUP,
        depth=1,
        path="",
    )
    ResearchStageRequirement.objects.create(
        workspace=stage_env["workspace"],
        stage=StageType.PRE_OPENING.value,
        code="literature_min_included",
        requirement_type=ResearchStageRequirement.RequirementType.LITERATURE_COUNT,
        threshold=8,
    )
    ResearchStageRequirement.objects.create(
        workspace=stage_env["workspace"],
        stage=StageType.PRE_OPENING.value,
        code="literature_min_included",
        requirement_type=ResearchStageRequirement.RequirementType.LITERATURE_COUNT,
        threshold=3,
        org_unit=unit,
    )
    effective = resolve_requirements(stage_env["workspace"], StageType.PRE_OPENING.value, unit.id)
    assert effective["literature_min_included"].threshold == 3
    assert effective["literature_min_included"].source == "org_unit"


@pytest.mark.django_db
def test_inactive_requirement_is_excluded_from_the_gate(stage_env):
    ResearchStageRequirement.objects.create(
        workspace=stage_env["workspace"],
        stage=StageType.PRE_OPENING.value,
        code="literature_min_included",
        requirement_type=ResearchStageRequirement.RequirementType.LITERATURE_COUNT,
        is_active=False,
    )
    gate = evaluate_stage_gate(stage_env["instance"], SUBMIT_PHASE)
    codes = [item["code"] for item in gate["items"]]
    assert "literature_min_included" not in codes


@pytest.mark.django_db
def test_rule_version_follows_thresholds(stage_env):
    before = gate_rule_version(resolve_requirements(stage_env["workspace"], StageType.PRE_OPENING.value))
    ResearchStageRequirement.objects.create(
        workspace=stage_env["workspace"],
        stage=StageType.PRE_OPENING.value,
        code="literature_min_included",
        requirement_type=ResearchStageRequirement.RequirementType.LITERATURE_COUNT,
        threshold=25,
    )
    after = gate_rule_version(resolve_requirements(stage_env["workspace"], StageType.PRE_OPENING.value))
    assert before != after
    # the version is deterministic for unchanged inputs (P1-STG-08)
    again = gate_rule_version(resolve_requirements(stage_env["workspace"], StageType.PRE_OPENING.value))
    assert after == again


@pytest.mark.django_db
def test_blocked_gate_lists_every_blocker_with_a_hint(stage_env):
    gate = evaluate_stage_gate(stage_env["instance"], SUBMIT_PHASE)
    assert gate["result"] == "BLOCKED"
    blockers = {item["code"]: item for item in gate["blockers"]}
    assert "material_set" in blockers
    assert blockers["material_set"]["required"] == len(MATERIAL_TYPES_BY_STAGE["PRE_OPENING"])
    assert blockers["material_set"]["actual"] == 0
    assert blockers["material_set"]["hint"]
    assert blockers["material_set"]["applies_to"] == [SUBMIT_PHASE]


@pytest.mark.django_db
def test_material_requirement_is_satisfied_by_complete_materials(stage_env):
    instance = stage_env["instance"]
    for material_type in MATERIAL_TYPES_BY_STAGE["PRE_OPENING"]:
        StageMaterial.objects.create(
            stage_instance=instance,
            material_type=material_type,
            status=StageMaterial.Status.DRAFT,
            owner=stage_env["owner"],
        )
    gate = evaluate_stage_gate(instance, SUBMIT_PHASE)
    material_item = next(item for item in gate["items"] if item["code"] == "material_set")
    assert material_item["passed"] is True
    assert material_item["actual"] == material_item["required"]


@pytest.mark.django_db
def test_review_rule_never_blocks_a_submission(stage_env):
    """Review rules gate the pass action, not the submit action (D-15)."""
    gate = evaluate_stage_gate(stage_env["instance"], SUBMIT_PHASE)
    review_items = [item for item in gate["items"] if item["code"] == "review_rule"]
    for item in review_items:
        assert SUBMIT_PHASE not in item["applies_to"]
        assert item not in gate["blockers"]


@pytest.mark.django_db
def test_unavailable_requirements_do_not_block(stage_env):
    """Counters for models shipped in a later stage report available=false."""
    instance = stage_env["instance"]
    StageMaterial.objects.create(
        stage_instance=instance,
        material_type=MATERIAL_TYPES_BY_STAGE["PRE_OPENING"][0],
        status=StageMaterial.Status.DRAFT,
        owner=stage_env["owner"],
    )
    StageMaterial.objects.create(
        stage_instance=instance,
        material_type=MATERIAL_TYPES_BY_STAGE["PRE_OPENING"][1],
        status=StageMaterial.Status.DRAFT,
        owner=stage_env["owner"],
    )
    gate = evaluate_stage_gate(instance, SUBMIT_PHASE)
    unavailable = [item for item in gate["items"] if item["available"] is False]
    for item in unavailable:
        assert item["blocking"] is False
        assert item not in gate["blockers"]
