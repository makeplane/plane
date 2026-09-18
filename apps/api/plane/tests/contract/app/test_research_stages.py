# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage workflow contract tests (P1-STG-01 ~ P1-STG-13)."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    OrgUnit,
    OrgUnitMember,
    ResearchProjectProfile,
    ResearchStageInstance,
    StageMaterial,
    StageTransition,
)
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")
    add_workspace_member(workspace, owner)
    stranger = make_user(first_name="Stranger")
    add_workspace_member(workspace, stranger)

    root = OrgUnit.objects.create(
        workspace=workspace,
        name=workspace.name,
        parent=None,
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
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=group,
        user=owner,
        org_role=OrgUnitMember.OrgRole.PI,
    )
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=root,
        user=admin,
        org_role=OrgUnitMember.OrgRole.OWNER,
        is_primary=True,
    )

    admin_client = client_for(admin)
    owner_client = client_for(owner)
    created = admin_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"owner": str(owner.id), "org_unit": str(group.id), "research_type": "PHD"},
        format="json",
    )
    project_id = created.json()["id"]
    return {
        "admin": admin,
        "owner": owner,
        "stranger": stranger,
        "workspace": workspace,
        "group": group,
        "project_id": project_id,
        "admin_client": admin_client,
        "owner_client": owner_client,
        "stranger_client": client_for(stranger),
    }


def stages_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/stages/"


def stage_url(env, stage_id, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/stages/{stage_id}/{suffix}"


def material_url(env, material_id, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/materials/{material_id}/{suffix}"


def satisfy_review_gate(env, stage_id, stage_code):
    """Configure a single-reviewer rule and let the administrator review.

    The review rule matrix itself is covered by test_research_reviews.py; this
    helper keeps the stage state machine tests focused on the transitions.
    """
    response = env["admin_client"].patch(
        f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
        {
            "items": [
                {
                    "stage": stage_code,
                    "code": "stage_min_reviewers",
                    "requirement_type": "REVIEW_RULE",
                    "threshold": 1,
                },
                {
                    "stage": stage_code,
                    "code": "stage_advisor_required",
                    "requirement_type": "REVIEW_RULE",
                    "threshold": 0,
                },
                {
                    "stage": stage_code,
                    "code": "stage_pi_branch_required",
                    "requirement_type": "REVIEW_RULE",
                    "threshold": 0,
                },
            ]
        },
        format="json",
    )
    assert response.status_code == 200, response.json()
    assigned = env["admin_client"].post(
        stage_url(env, stage_id, "reviewers/"),
        {"reviewer": str(env["admin"].id), "reviewer_role": "REVIEWER"},
        format="json",
    )
    assert assigned.status_code == 201, assigned.json()
    reviewed = env["admin_client"].post(
        stage_url(env, stage_id, "reviews/"),
        {"recommendation": "PASS"},
        format="json",
    )
    assert reviewed.status_code == 201, reviewed.json()


def disable_gate_items(env, stage, codes):
    """Administrators tune the gate through configuration (P1-STG-07)."""
    response = env["admin_client"].patch(
        f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
        {"items": [{"stage": stage, "code": code, "is_active": False} for code in codes]},
        format="json",
    )
    assert response.status_code == 200, response.json()
    return response.json()


def bootstrap(env):
    response = env["owner_client"].get(stages_url(env))
    assert response.status_code == 200
    return response.json()["results"]


def stage_by_code(stages, code):
    return next(item for item in stages if item["stage"] == code)


def add_materials(env, stage_id, stage_code):
    created = []
    for material_type in MATERIAL_TYPES_BY_STAGE[stage_code]:
        response = env["owner_client"].post(
            stage_url(env, stage_id, "materials/"),
            {"material_type": material_type, "title": f"{material_type} doc"},
            format="json",
        )
        assert response.status_code == 201, response.json()
        created.append(response.json())
    return created


@pytest.mark.django_db
class TestStageBootstrap:
    def test_creation_initializes_the_four_instances_and_reads_are_side_effect_free(self, env):
        before = ResearchStageInstance.objects.filter(project_id=env["project_id"]).count()
        stages = bootstrap(env)
        assert [item["stage"] for item in stages] == ["PRE_OPENING", "OPENING", "MIDTERM", "FINAL"]
        assert [item["sort_order"] for item in stages] == [1, 2, 3, 4]
        assert all(item["status"] == "NOT_STARTED" for item in stages)
        assert ResearchStageInstance.objects.filter(project_id=env["project_id"]).count() == 4
        assert before == 4

    def test_explicit_creation_activates_the_first_stage(self, env):
        ResearchStageInstance.objects.filter(project_id=env["project_id"]).delete(soft=False)
        response = env["admin_client"].post(stages_url(env), {}, format="json")
        assert response.status_code == 201
        first = stage_by_code(response.json()["results"], "PRE_OPENING")
        assert first["status"] == "IN_PROGRESS"
        assert first["entered_at"] is not None
        profile = ResearchProjectProfile.objects.get(project_id=env["project_id"])
        assert profile.current_stage == "PRE_OPENING"

    def test_duplicate_creation_returns_409(self, env):
        duplicate = env["admin_client"].post(stages_url(env), {}, format="json")
        assert duplicate.status_code == 409
        assert duplicate.json()["error_code"] == "stage_instances_exist"

    def test_non_member_cannot_read_stages(self, env):
        outsider = make_user(first_name="Outsider")
        response = client_for(outsider).get(stages_url(env))
        assert response.status_code == 404


@pytest.mark.django_db
class TestStageStateMachine:
    def test_sequence_is_enforced_with_the_blocking_stage(self, env):
        stages = bootstrap(env)
        opening = stage_by_code(stages, "OPENING")
        response = env["owner_client"].post(stage_url(env, opening["id"], "enter/"), {}, format="json")
        assert response.status_code == 409
        body = response.json()
        assert body["error_code"] == "stage_sequence_blocked"
        assert body["blocked_stage"] == "PRE_OPENING"

    def test_blocked_submission_returns_422_without_a_transition(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        assert env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json").status_code == 200
        response = env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")
        assert response.status_code == 422
        body = response.json()
        assert body["error_code"] == "stage_gate_blocked"
        assert body["blockers"]
        assert body["blockers"][0]["hint"]
        assert StageTransition.objects.filter(stage_instance_id=pre["id"], action="SUBMIT").count() == 0
        instance = ResearchStageInstance.objects.get(pk=pre["id"])
        assert instance.status == "IN_PROGRESS"
        assert instance.gate_result == "BLOCKED"

    def test_gate_precheck_matches_the_submission_decision(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        precheck = env["owner_client"].get(stage_url(env, pre["id"], "gate/"))
        assert precheck.status_code == 200
        assert precheck.json()["result"] == "BLOCKED"
        codes = {item["code"] for item in precheck.json()["blockers"]}
        assert "material_set" in codes
        submit = env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")
        assert submit.status_code == 422
        assert {item["code"] for item in submit.json()["blockers"]} == codes

    def test_return_requires_a_reason_and_resubmission_keeps_history(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        disable_gate_items(
            env, "PRE_OPENING", ["literature_min_included", "literature_max_entries", "literature_quality"]
        )
        assert env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json").status_code == 200
        add_materials(env, pre["id"], "PRE_OPENING")
        assert env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json").status_code == 200

        no_reason = env["admin_client"].post(stage_url(env, pre["id"], "return/"), {}, format="json")
        assert no_reason.status_code == 422
        assert no_reason.json()["error_code"] == "stage_reason_required"

        returned = env["admin_client"].post(
            stage_url(env, pre["id"], "return/"), {"reason": "gap analysis incomplete"}, format="json"
        )
        assert returned.status_code == 200
        assert returned.json()["status"] == "NEEDS_REVISION"

        assert env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json").status_code == 200
        assert env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json").status_code == 200
        instance = ResearchStageInstance.objects.get(pk=pre["id"])
        assert instance.attempt_count == 2
        transitions = env["owner_client"].get(stage_url(env, pre["id"], "transitions/")).json()
        actions = [item["action"] for item in transitions["results"]]
        assert actions.count("SUBMIT") == 2
        assert "RETURN" in actions

    def test_reopen_is_admin_only_and_keeps_history(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        disable_gate_items(
            env, "PRE_OPENING", ["literature_min_included", "literature_max_entries", "literature_quality"]
        )
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        add_materials(env, pre["id"], "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")
        satisfy_review_gate(env, pre["id"], "PRE_OPENING")
        assert env["admin_client"].post(stage_url(env, pre["id"], "pass/"), {}, format="json").status_code == 200

        forbidden = env["owner_client"].post(
            stage_url(env, pre["id"], "reopen/"), {"reason": "again"}, format="json"
        )
        assert forbidden.status_code == 403

        no_reason = env["admin_client"].post(stage_url(env, pre["id"], "reopen/"), {}, format="json")
        assert no_reason.status_code == 422

        reopened = env["admin_client"].post(
            stage_url(env, pre["id"], "reopen/"), {"reason": "material facts were wrong"}, format="json"
        )
        assert reopened.status_code == 200
        instance = ResearchStageInstance.objects.get(pk=pre["id"])
        assert instance.status == "NEEDS_REVISION"
        assert instance.gate_result == "WAIVED"
        assert StageTransition.objects.filter(stage_instance_id=pre["id"], action="REOPEN").count() == 1
        assert StageTransition.objects.filter(stage_instance_id=pre["id"], action="PASS").count() == 1

    def test_full_four_stage_walkthrough(self, env):
        """Enter, submit and pass all four stages (P1-STG-01, P1-STG-11)."""
        disable_gate_items(
            env, "PRE_OPENING", ["literature_min_included", "literature_max_entries", "literature_quality"]
        )
        # counters owned by later stages of the delivery are configured off here;
        # their own contract tests assert that they block when enabled (T-16)
        disable_gate_items(env, "OPENING", ["experiment_linked", "code_repo"])
        disable_gate_items(env, "MIDTERM", ["experiment_completed", "experiment_status_notes"])
        disable_gate_items(env, "FINAL", ["outcome_count", "experiment_summary", "code_snapshot"])

        stages = bootstrap(env)
        for stage_code in ("PRE_OPENING", "OPENING", "MIDTERM", "FINAL"):
            stage = stage_by_code(stages, stage_code)
            entered = env["owner_client"].post(stage_url(env, stage["id"], "enter/"), {}, format="json")
            assert entered.status_code == 200, (stage_code, entered.json())
            add_materials(env, stage["id"], stage_code)
            submitted = env["owner_client"].post(stage_url(env, stage["id"], "submit/"), {}, format="json")
            assert submitted.status_code == 200, (stage_code, submitted.json())
            satisfy_review_gate(env, stage["id"], stage_code)
            passed = env["admin_client"].post(stage_url(env, stage["id"], "pass/"), {}, format="json")
            assert passed.status_code == 200, (stage_code, passed.json())
            assert passed.json()["status"] == "PASSED"

        profile = ResearchProjectProfile.objects.get(project_id=env["project_id"])
        assert profile.workflow_status == "COMPLETED"
        assert profile.completed_at is not None
        assert profile.current_stage == "FINAL"
        assert StageTransition.objects.filter(stage_instance__project_id=env["project_id"]).count() == 12

    def test_stage_flow_does_not_touch_issue_states(self, env):
        from plane.db.models import Issue, State

        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        discharge = State.objects.filter(project_id=env["project_id"], group="completed").first()
        issue = Issue.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            name="Existing work item",
            state=discharge,
            created_by=env["owner"],
        )
        before = issue.state_id
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        issue.refresh_from_db()
        assert issue.state_id == before


@pytest.mark.django_db
class TestStageMaterials:
    def test_material_creation_and_versioning(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")

        created = env["owner_client"].post(
            stage_url(env, pre["id"], "materials/"),
            {"material_type": "TOPIC_DESCRIPTION", "title": "topic description"},
            format="json",
        )
        assert created.status_code == 201
        material = created.json()
        assert material["status"] == "DRAFT"
        assert material["page_detail"]["name"] == "topic description"
        assert material["last_version_no"] == 1

        updated = env["owner_client"].patch(
            material_url(env, material["id"]),
            {"title": "topic description v2", "reason": "clarified"},
            format="json",
        )
        assert updated.status_code == 200
        assert updated.json()["last_version_no"] == 2

        versions = env["owner_client"].get(material_url(env, material["id"], "versions/")).json()
        assert versions["count"] == 2
        assert {item["version_no"] for item in versions["results"]} == {1, 2}

    def test_material_type_must_belong_to_the_stage(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        response = env["owner_client"].post(
            stage_url(env, pre["id"], "materials/"),
            {"material_type": "FINAL_REPORT"},
            format="json",
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "stage_material_type_invalid"

    def test_materials_are_read_only_after_submission(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        disable_gate_items(
            env, "PRE_OPENING", ["literature_min_included", "literature_max_entries", "literature_quality"]
        )
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        materials = add_materials(env, pre["id"], "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")

        response = env["owner_client"].patch(
            material_url(env, materials[0]["id"]), {"title": "edited"}, format="json"
        )
        assert response.status_code == 409
        assert response.json()["error_code"] == "stage_material_read_only"
        material = StageMaterial.objects.get(pk=materials[0]["id"])
        assert material.status == "SUBMITTED"

    def test_reviewer_reads_submitted_snapshot_while_author_revises(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        disable_gate_items(
            env,
            "PRE_OPENING",
            ["literature_min_included", "literature_max_entries", "literature_quality"],
        )
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        materials = add_materials(env, pre["id"], "PRE_OPENING")
        material_id = materials[0]["id"]
        env["owner_client"].patch(
            material_url(env, material_id),
            {"description_html": "<p>Submitted version</p>"},
            format="json",
        )
        env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")
        env["admin_client"].post(
            stage_url(env, pre["id"], "return/"),
            {"reason": "revise"},
            format="json",
        )
        env["owner_client"].patch(
            material_url(env, material_id),
            {"description_html": "<p>Private revision</p>"},
            format="json",
        )

        detail = env["admin_client"].get(material_url(env, material_id))

        assert detail.status_code == 200
        assert "Submitted version" in detail.json()["page_detail"]["description_html"]
        assert "Private revision" not in str(detail.json()["page_detail"])

    def test_page_bypass_is_refused_for_submitted_materials(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        disable_gate_items(
            env, "PRE_OPENING", ["literature_min_included", "literature_max_entries", "literature_quality"]
        )
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        materials = add_materials(env, pre["id"], "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")

        page_id = materials[0]["page"]
        response = env["owner_client"].patch(
            f"/api/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/pages/{page_id}/",
            {"name": "bypass attempt"},
            format="json",
        )
        assert response.status_code == 403
        assert response.json()["error_code"] == "stage_material_read_only"

    def test_material_submit_locks_page_before_the_stage_is_submitted(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        created = env["owner_client"].post(
            stage_url(env, pre["id"], "materials/"),
            {"material_type": "TOPIC_DESCRIPTION"},
            format="json",
        ).json()
        submitted = env["owner_client"].post(
            material_url(env, created["id"], "submit/"),
            {},
            format="json",
        )
        assert submitted.status_code == 200

        response = env["owner_client"].patch(
            f"/api/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/pages/{created['page']}/",
            {"name": "bypass attempt"},
            format="json",
        )

        assert response.status_code == 403
        assert response.json()["error_code"] == "stage_material_read_only"

    def test_unrelated_member_cannot_read_a_material(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        created = env["owner_client"].post(
            stage_url(env, pre["id"], "materials/"),
            {"material_type": "TOPIC_DESCRIPTION"},
            format="json",
        )
        response = env["stranger_client"].get(material_url(env, created.json()["id"]))
        assert response.status_code == 404


@pytest.mark.django_db
class TestStageRequirements:
    def test_thresholds_are_configurable(self, env):
        bootstrap(env)
        updated = env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
            {
                "items": [
                    {
                        "stage": "PRE_OPENING",
                        "code": "literature_min_included",
                        "requirement_type": "LITERATURE_COUNT",
                        "threshold": 3,
                    }
                ]
            },
            format="json",
        )
        assert updated.status_code == 200
        listing = env["admin_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/?stage=PRE_OPENING"
        ).json()
        row = next(item for item in listing["results"] if item["code"] == "literature_min_included")
        assert row["threshold"] == 3
        assert row["source"] == "workspace"

    def test_rule_version_tracks_the_effective_thresholds(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        first = env["owner_client"].get(stage_url(env, pre["id"], "gate/")).json()
        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
            {
                "items": [
                    {
                        "stage": "PRE_OPENING",
                        "code": "literature_min_included",
                        "requirement_type": "LITERATURE_COUNT",
                        "threshold": 9,
                    }
                ]
            },
            format="json",
        )
        second = env["owner_client"].get(stage_url(env, pre["id"], "gate/")).json()
        assert first["rule_version"] != second["rule_version"]
        item = next(entry for entry in second["items"] if entry["code"] == "literature_min_included")
        assert item["required"] == 9

    def test_history_keeps_the_old_threshold_snapshot(self, env):
        stages = bootstrap(env)
        pre = stage_by_code(stages, "PRE_OPENING")
        disable_gate_items(
            env, "PRE_OPENING", ["literature_min_included", "literature_max_entries", "literature_quality"]
        )
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        add_materials(env, pre["id"], "PRE_OPENING")
        env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")
        first = StageTransition.objects.filter(stage_instance_id=pre["id"], action="SUBMIT").first()
        assert first.gate_snapshot["rule_version"]

        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
            {
                "items": [
                    {
                        "stage": "PRE_OPENING",
                        "code": "material_set",
                        "requirement_type": "MATERIAL_SET",
                        "threshold": 1,
                    }
                ]
            },
            format="json",
        )
        env["admin_client"].post(stage_url(env, pre["id"], "return/"), {"reason": "resubmit"}, format="json")
        env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
        env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")

        transitions = list(
            StageTransition.objects.filter(stage_instance_id=pre["id"], action="SUBMIT").order_by("created_at")
        )
        assert len(transitions) == 2
        # frozen history is reproduced, never recomputed (P1-STG-08)
        assert transitions[0].gate_snapshot["rule_version"] == first.gate_snapshot["rule_version"]
        assert transitions[0].gate_snapshot["rule_version"] != transitions[1].gate_snapshot["rule_version"]

    def test_requirement_changes_are_admin_only(self, env):
        response = env["owner_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
            {"items": [{"stage": "OPENING", "code": "code_repo", "threshold": 5}]},
            format="json",
        )
        assert response.status_code == 403
