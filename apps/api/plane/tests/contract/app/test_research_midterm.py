# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Midterm stage: progress aggregation and its gate (P1-B3)."""

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    CodeArtifact,
    ExperimentRecord,
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    ProjectCodeRepository,
    ResearchOutcome,
    StageReview,
    StageTransition,
    WorkspaceResearchSetting,
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
        workspace=workspace, org_unit=group, user=owner, org_role=OrgUnitMember.OrgRole.PI
    )
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=root,
        user=admin,
        org_role=OrgUnitMember.OrgRole.OWNER,
        is_primary=True,
    )
    admin_client = client_for(admin)
    created = admin_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"owner": str(owner.id), "org_unit": str(group.id), "research_type": "PHD"},
        format="json",
    )
    project_id = created.json()["id"]
    return {
        "admin": admin,
        "owner": owner,
        "workspace": workspace,
        "project_id": project_id,
        "admin_client": admin_client,
        "owner_client": client_for(owner),
    }


def stages_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/stages/"


def stage_url(env, stage_id, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/stages/{stage_id}/{suffix}"


def progress_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/progress/"


def reach_midterm(env):
    """Drive the project to the midterm stage with the earlier gates configured off."""
    setting = WorkspaceResearchSetting.objects.get(workspace=env["workspace"])
    setting.stage_min_reviewers = 0
    setting.stage_pass_ratio = -1.0
    setting.save(update_fields=["stage_min_reviewers", "stage_pass_ratio"])
    pre_codes = (
        "material_set",
        "literature_min_included",
        "literature_max_entries",
        "literature_quality",
        "literature_cited_sources",
    )
    opening_codes = ("material_set", "experiment_linked", "code_repo")
    items = [
        {"stage": "PRE_OPENING", "code": code, "is_active": False} for code in pre_codes
    ] + [{"stage": "OPENING", "code": code, "is_active": False} for code in opening_codes]
    items += [
        {
            "stage": stage,
            "code": code,
            "requirement_type": "REVIEW_RULE",
            "threshold": 0,
        }
        for stage in ("PRE_OPENING", "OPENING")
        for code in ("stage_min_reviewers", "stage_advisor_required", "stage_pi_branch_required")
    ]
    configured = env["admin_client"].patch(
        f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
        {"items": items},
        format="json",
    )
    assert configured.status_code == 200, configured.json()

    stages = env["owner_client"].get(stages_url(env)).json()["results"]
    for code in ("PRE_OPENING", "OPENING"):
        stage = next(item for item in stages if item["stage"] == code)
        entered = env["owner_client"].post(stage_url(env, stage["id"], "enter/"), {}, format="json")
        assert entered.status_code == 200, (code, "enter", entered.json())
        submitted = env["owner_client"].post(stage_url(env, stage["id"], "submit/"), {}, format="json")
        assert submitted.status_code == 200, (code, "submit", submitted.json())
        StageReview.objects.create(
            stage_instance_id=stage["id"],
            reviewer=env["admin"],
            reviewer_role="REVIEWER",
            recommendation="PASS",
            submitted_at=timezone.now(),
            created_by=env["admin"],
        )
        passed = env["admin_client"].post(stage_url(env, stage["id"], "pass/"), {}, format="json")
        assert passed.status_code == 200, (code, "pass", passed.json())
    stages = env["owner_client"].get(stages_url(env)).json()["results"]
    midterm = next(item for item in stages if item["stage"] == "MIDTERM")
    env["owner_client"].post(stage_url(env, midterm["id"], "enter/"), {}, format="json")
    return midterm["id"]


def add_midterm_materials(env, stage_id):
    for material_type in MATERIAL_TYPES_BY_STAGE["MIDTERM"]:
        response = env["owner_client"].post(
            stage_url(env, stage_id, "materials/"),
            {"material_type": material_type},
            format="json",
        )
        assert response.status_code == 201, response.json()


@pytest.mark.django_db
class TestMidtermGate:
    def test_completed_experiment_is_required(self, env):
        midterm_id = reach_midterm(env)
        add_midterm_materials(env, midterm_id)
        blocked = env["owner_client"].post(stage_url(env, midterm_id, "submit/"), {}, format="json")
        assert blocked.status_code == 422
        assert {item["code"] for item in blocked.json()["blockers"]} == {"experiment_completed"}

        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Finished run",
            status="COMPLETED",
            owner=env["owner"],
            submitted_at=timezone.now(),
        )
        passed = env["owner_client"].post(stage_url(env, midterm_id, "submit/"), {}, format="json")
        assert passed.status_code == 200, passed.json()

    def test_unfinished_experiments_need_a_status_note(self, env):
        midterm_id = reach_midterm(env)
        add_midterm_materials(env, midterm_id)
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Finished run",
            status="COMPLETED",
            owner=env["owner"],
            submitted_at=timezone.now(),
        )
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=2,
            title="Still running",
            status="RUNNING",
            owner=env["owner"],
            submitted_at=timezone.now(),
        )
        blocked = env["owner_client"].post(stage_url(env, midterm_id, "submit/"), {}, format="json")
        assert blocked.status_code == 422
        blocker = next(item for item in blocked.json()["blockers"] if item["code"] == "experiment_status_notes")
        assert blocker["actual"] == 1
        assert blocker["unexplained"][0]["sequence_no"] == 2

        ExperimentRecord.objects.filter(project_id=env["project_id"], sequence_no=2).update(
            status_note="waiting for the instrument slot"
        )
        passed = env["owner_client"].post(stage_url(env, midterm_id, "submit/"), {}, format="json")
        assert passed.status_code == 200, passed.json()


@pytest.mark.django_db
class TestProgressSummary:
    def test_summary_matches_the_detail_lists(self, env):
        reach_midterm(env)
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Finished run",
            status="COMPLETED",
            owner=env["owner"],
            submitted_at=timezone.now(),
        )
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=2,
            title="Open run",
            status="RUNNING",
            owner=env["owner"],
            status_note="",
            submitted_at=timezone.now(),
        )
        summary = env["owner_client"].get(progress_url(env)).json()
        assert summary["experiments"]["total"] == 2
        assert summary["experiments"]["completed"] == 1
        assert summary["experiments"]["unfinished"] == 1
        assert len(summary["experiments"]["items"]) == 2
        assert summary["experiments"]["unexplained"][0]["sequence_no"] == 2

    def test_submission_snapshots_the_summary(self, env):
        midterm_id = reach_midterm(env)
        add_midterm_materials(env, midterm_id)
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Finished run",
            status="COMPLETED",
            owner=env["owner"],
            submitted_at=timezone.now(),
        )
        assert env["owner_client"].post(stage_url(env, midterm_id, "submit/"), {}, format="json").status_code == 200
        transition = StageTransition.objects.get(stage_instance_id=midterm_id, action="SUBMIT")
        assert transition.metadata["progress"]["experiments"]["completed"] == 1
        # the snapshot is frozen: adding an experiment later does not change it
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=2,
            title="Later run",
            status="COMPLETED",
            owner=env["owner"],
            submitted_at=timezone.now(),
        )
        transition.refresh_from_db()
        assert transition.metadata["progress"]["experiments"]["completed"] == 1

    def test_summary_is_read_only_projection(self, env):
        reach_midterm(env)
        summary = env["owner_client"].get(progress_url(env)).json()
        # the summary exposes identifiers only: editing goes through the source
        # endpoints, so a write attempt against it is not a route at all
        assert set(summary) == {"project", "experiments", "code", "literature", "reports", "outcomes"}


@pytest.mark.django_db
class TestProgressAcl:
    def test_summary_never_includes_objects_the_caller_cannot_read(self, env):
        reach_midterm(env)
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Private run",
            status="COMPLETED",
            owner=env["owner"],
            visibility="PRIVATE",
            submitted_at=timezone.now(),
        )
        repository = ProjectCodeRepository.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            provider="GITHUB",
            repository_url="https://github.com/example/private-progress",
            created_by=env["owner"],
        )
        CodeArtifact.objects.create(
            repository=repository,
            ref_type="COMMIT",
            ref_value="private123",
            created_by=env["owner"],
        )
        ResearchOutcome.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            output_type="PAPER",
            title="Private outcome",
            status="DRAFT",
            visibility="PRIVATE",
            created_by=env["owner"],
        )
        member = make_user(first_name="Member")
        add_workspace_member(env["workspace"], member)
        other_group = OrgUnit.objects.create(
            workspace=env["workspace"],
            name="Other group",
            parent=OrgUnit.objects.get(workspace=env["workspace"], unit_type=OrgUnit.UnitType.ROOT),
            unit_type=OrgUnit.UnitType.GROUP,
            depth=1,
            path="",
        )
        other_group.path = f"{other_group.parent.path}{str(other_group.id).replace('-', '')}/"
        other_group.save(update_fields=["path"])
        OrgUnitMember.objects.create(
            workspace=env["workspace"],
            org_unit=other_group,
            user=member,
            org_role=OrgUnitMember.OrgRole.REVIEWER,
            is_primary=True,
        )
        denied = client_for(member).get(progress_url(env))
        assert denied.status_code == 404
        owner_summary = env["owner_client"].get(progress_url(env)).json()
        assert owner_summary["experiments"]["total"] == 1
        assert len(owner_summary["code"]["repositories"]) == 1
        assert owner_summary["code"]["artifact_count"] == 1
        assert owner_summary["outcomes"]["count"] == 1

    def test_advisors_see_their_mentee_progress(self, env):
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Supervised run",
            status="COMPLETED",
            owner=env["owner"],
            submitted_at=timezone.now(),
        )
        mentor = make_user(first_name="Mentor")
        add_workspace_member(env["workspace"], mentor)
        MentorBinding.objects.create(workspace=env["workspace"], mentee=env["owner"], mentor=mentor)
        summary = client_for(mentor).get(progress_url(env)).json()
        assert summary["experiments"]["total"] == 1
        assert summary["experiments"]["completed"] == 1
