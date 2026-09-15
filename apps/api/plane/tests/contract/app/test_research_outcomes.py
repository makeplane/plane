# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Final stage outcomes, links and the exported reference list (P1-B4)."""

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    CodeArtifact,
    ExperimentRecord,
    OrgUnit,
    OrgUnitMember,
    ProjectCodeRepository,
    ResearchOutcome,
    ResearchOutcomeLink,
    StageReview,
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


def outcomes_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/outcomes/"


def export_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/chain/export/"


def reach_final(env):
    """Configure the earlier gates off and drive the project to the final stage."""
    setting = WorkspaceResearchSetting.objects.get(workspace=env["workspace"])
    setting.stage_min_reviewers = 0
    setting.stage_pass_ratio = -1.0
    setting.save(update_fields=["stage_min_reviewers", "stage_pass_ratio"])
    codes = {
        "PRE_OPENING": ("material_set", "literature_min_included", "literature_max_entries", "literature_quality", "literature_cited_sources"),
        "OPENING": ("material_set", "experiment_linked", "code_repo"),
        "MIDTERM": ("material_set", "experiment_completed", "experiment_status_notes"),
    }
    items = [{"stage": stage, "code": code, "is_active": False} for stage, values in codes.items() for code in values]
    items += [
        {"stage": stage, "code": code, "requirement_type": "REVIEW_RULE", "threshold": 0}
        for stage in ("PRE_OPENING", "OPENING", "MIDTERM", "FINAL")
        for code in ("stage_min_reviewers", "stage_advisor_required", "stage_pi_branch_required")
    ]
    configured = env["admin_client"].patch(
        f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
        {"items": items},
        format="json",
    )
    assert configured.status_code == 200, configured.json()

    stages = env["owner_client"].get(stages_url(env)).json()["results"]
    for code in ("PRE_OPENING", "OPENING", "MIDTERM"):
        stage = next(item for item in stages if item["stage"] == code)
        env["owner_client"].post(stage_url(env, stage["id"], "enter/"), {}, format="json")
        submitted = env["owner_client"].post(stage_url(env, stage["id"], "submit/"), {}, format="json")
        assert submitted.status_code == 200, (code, submitted.json())
        StageReview.objects.create(
            stage_instance_id=stage["id"],
            reviewer=env["admin"],
            reviewer_role="REVIEWER",
            recommendation="PASS",
            submitted_at=timezone.now(),
            created_by=env["admin"],
        )
        passed = env["admin_client"].post(stage_url(env, stage["id"], "pass/"), {}, format="json")
        assert passed.status_code == 200, (code, passed.json())
    stages = env["owner_client"].get(stages_url(env)).json()["results"]
    final = next(item for item in stages if item["stage"] == "FINAL")
    env["owner_client"].post(stage_url(env, final["id"], "enter/"), {}, format="json")
    return final["id"]


def add_final_materials(env, stage_id):
    for material_type in MATERIAL_TYPES_BY_STAGE["FINAL"]:
        response = env["owner_client"].post(
            stage_url(env, stage_id, "materials/"),
            {"material_type": material_type},
            format="json",
        )
        assert response.status_code == 201, response.json()


@pytest.mark.django_db
class TestOutcomeRegistration:
    def test_register_and_update_an_outcome(self, env):
        created = env["owner_client"].post(
            outcomes_url(env),
            {
                "output_type": "PAPER",
                "title": "A study of polymer blends",
                "venue": "Journal of Testing",
                "doi": "10.1000/outcome1",
                "authors": ["Owner"],
                "status": "SUBMITTED",
            },
            format="json",
        )
        assert created.status_code == 201, created.json()
        body = created.json()
        assert body["output_type"] == "PAPER"
        assert body["status"] == "SUBMITTED"

        updated = env["owner_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/outcomes/{body['id']}/",
            {"status": "PUBLISHED", "published_at": "2026-01-15"},
            format="json",
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "PUBLISHED"

        listed = env["owner_client"].get(outcomes_url(env)).json()
        assert listed["count"] == 1

    def test_invalid_output_type_is_rejected(self, env):
        response = env["owner_client"].post(
            outcomes_url(env), {"title": "x", "output_type": "NOVEL"}, format="json"
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "research_outcome_invalid"

    def test_links_to_experiments_and_artifacts(self, env):
        outcome_id = env["owner_client"].post(
            outcomes_url(env), {"title": "Dataset release", "output_type": "DATASET"}, format="json"
        ).json()["id"]
        record = ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Run 1",
            status="COMPLETED",
            owner=env["owner"],
        )
        repository = ProjectCodeRepository.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            provider="GITHUB",
            repository_url="https://github.com/example/analysis",
            created_by=env["owner"],
        )
        artifact = CodeArtifact.objects.create(
            repository=repository, ref_type="COMMIT", ref_value="abc1234", created_by=env["owner"]
        )
        for target_type, target_id in (
            ("EXPERIMENT_RECORD", str(record.id)),
            ("CODE_ARTIFACT", str(artifact.id)),
        ):
            linked = env["owner_client"].post(
                f"/api/research/workspaces/{env['workspace'].slug}/outcomes/{outcome_id}/links/",
                {"target_type": target_type, "target_id": target_id},
                format="json",
            )
            assert linked.status_code == 201, linked.json()

        detail = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/outcomes/{outcome_id}/"
        ).json()
        assert {link["target_type"] for link in detail["links"]} == {"EXPERIMENT_RECORD", "CODE_ARTIFACT"}
        assert ResearchOutcomeLink.objects.filter(outcome_id=outcome_id).count() == 2

    def test_unknown_link_target_is_rejected(self, env):
        outcome_id = env["owner_client"].post(outcomes_url(env), {"title": "x"}, format="json").json()["id"]
        response = env["owner_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/outcomes/{outcome_id}/links/",
            {"target_type": "EXPERIMENT_RECORD", "target_id": "11111111-1111-1111-1111-111111111111"},
            format="json",
        )
        assert response.status_code == 404
        assert response.json()["error_code"] == "research_outcome_target_not_found"


@pytest.mark.django_db
class TestFinalStage:
    def test_outcome_is_required_to_submit(self, env):
        final_id = reach_final(env)
        add_final_materials(env, final_id)
        blocked = env["owner_client"].post(stage_url(env, final_id, "submit/"), {}, format="json")
        assert blocked.status_code == 422
        # the final gate also requires an experiment summary and a code snapshot
        assert {item["code"] for item in blocked.json()["blockers"]} == {
            "outcome_count",
            "experiment_summary",
            "code_snapshot",
        }

        ResearchOutcome.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            output_type="PAPER",
            title="Final paper",
            status="ACCEPTED",
            created_by=env["owner"],
        )
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Final run",
            status="COMPLETED",
            owner=env["owner"],
        )
        repository = ProjectCodeRepository.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            provider="GITHUB",
            repository_url="https://github.com/example/final",
            created_by=env["owner"],
        )
        CodeArtifact.objects.create(
            repository=repository,
            ref_type="SNAPSHOT",
            ref_value="0.1.0",
            created_by=env["owner"],
        )
        passed = env["owner_client"].post(stage_url(env, final_id, "submit/"), {}, format="json")
        assert passed.status_code == 200, passed.json()

    def test_final_pass_completes_the_project_and_freezes_materials(self, env):
        final_id = reach_final(env)
        add_final_materials(env, final_id)
        ResearchOutcome.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            output_type="PAPER",
            title="Final paper",
            status="PUBLISHED",
            created_by=env["owner"],
        )
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Final run",
            status="COMPLETED",
            owner=env["owner"],
        )
        repository = ProjectCodeRepository.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            provider="GITHUB",
            repository_url="https://github.com/example/final",
            created_by=env["owner"],
        )
        CodeArtifact.objects.create(
            repository=repository,
            ref_type="SNAPSHOT",
            ref_value="0.1.0",
            created_by=env["owner"],
        )
        assert env["owner_client"].post(stage_url(env, final_id, "submit/"), {}, format="json").status_code == 200
        StageReview.objects.create(
            stage_instance_id=final_id,
            reviewer=env["admin"],
            reviewer_role="REVIEWER",
            recommendation="PASS",
            submitted_at=timezone.now(),
            created_by=env["admin"],
        )
        passed = env["admin_client"].post(stage_url(env, final_id, "pass/"), {}, format="json")
        assert passed.status_code == 200, passed.json()

        profile = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/"
        ).json()
        assert profile["research"]["workflow_status"] == "COMPLETED"
        assert profile["research"]["completed_at"] is not None

        materials = env["owner_client"].get(stage_url(env, final_id, "materials/")).json()["results"]
        assert all(material["status"] == "ACCEPTED" for material in materials)
        blocked = env["owner_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/materials/{materials[0]['id']}/",
            {"title": "after completion"},
            format="json",
        )
        assert blocked.status_code == 409


@pytest.mark.django_db
class TestChainExport:
    def test_export_contains_references_only(self, env):
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Published run",
            status="COMPLETED",
            owner=env["owner"],
        )
        env["owner_client"].post(
            outcomes_url(env),
            {"title": "Final paper", "output_type": "PAPER", "status": "PUBLISHED"},
            format="json",
        )
        response = env["owner_client"].get(export_url(env))
        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/markdown")
        body = response.content.decode("utf-8")
        assert "Published run" in body
        assert "Final paper" in body
        assert "## Experiments" in body
        assert response["Content-Disposition"].startswith("attachment;")

    def test_export_respects_the_caller_acl(self, env):
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Private run",
            status="COMPLETED",
            owner=env["owner"],
            visibility="PRIVATE",
        )
        member = make_user(first_name="Member")
        add_workspace_member(env["workspace"], member)
        body = client_for(member).get(export_url(env)).content.decode("utf-8")
        assert "Private run" not in body
