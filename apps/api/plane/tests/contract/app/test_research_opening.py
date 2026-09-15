# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Opening stage, material templates and the administrator override (P1-B2)."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    CodeArtifact,
    ExperimentRecord,
    OrgUnit,
    OrgUnitMember,
    ProjectCodeRepository,
    StageMaterial,
    StageMaterialVersion,
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


def material_url(env, material_id, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/materials/{material_id}/{suffix}"


def pass_pre_opening(env):
    """Walk PRE_OPENING to PASSED so the OPENING stage becomes reachable.

    The review rule matrix is covered by test_research_reviews.py; here the
    workspace is configured to pass without collecting reviews so the test stays
    focused on the opening gate.
    """
    from django.utils import timezone

    from plane.db.models import StageReview, WorkspaceResearchSetting

    setting = WorkspaceResearchSetting.objects.get(workspace=env["workspace"])
    setting.stage_min_reviewers = 0
    setting.stage_pass_ratio = -1.0
    setting.save(update_fields=["stage_min_reviewers", "stage_pass_ratio"])

    stages = env["owner_client"].get(stages_url(env)).json()["results"]
    pre = next(item for item in stages if item["stage"] == "PRE_OPENING")
    opening = next(item for item in stages if item["stage"] == "OPENING")
    env["admin_client"].patch(
        f"/api/research/workspaces/{env['workspace'].slug}/stage-requirements/",
        {
            "items": [
                {"stage": "PRE_OPENING", "code": code, "is_active": False}
                for code in (
                    "literature_min_included",
                    "literature_max_entries",
                    "literature_quality",
                    "literature_cited_sources",
                    "material_set",
                )
            ]
            + [
                {"stage": "PRE_OPENING", "code": "stage_min_reviewers", "threshold": 0, "requirement_type": "REVIEW_RULE"},
                {"stage": "PRE_OPENING", "code": "stage_advisor_required", "threshold": 0, "requirement_type": "REVIEW_RULE"},
                {"stage": "PRE_OPENING", "code": "stage_pi_branch_required", "threshold": 0, "requirement_type": "REVIEW_RULE"},
            ]
        },
        format="json",
    )
    entered = env["owner_client"].post(stage_url(env, pre["id"], "enter/"), {}, format="json")
    assert entered.status_code == 200, ("enter", entered.json())
    submitted = env["owner_client"].post(stage_url(env, pre["id"], "submit/"), {}, format="json")
    assert submitted.status_code == 200, ("submit", submitted.json())
    StageReview.objects.create(
        stage_instance_id=pre["id"],
        reviewer=env["admin"],
        reviewer_role="REVIEWER",
        recommendation="PASS",
        submitted_at=timezone.now(),
        created_by=env["admin"],
    )
    passed = env["admin_client"].post(stage_url(env, pre["id"], "pass/"), {}, format="json")
    assert passed.status_code == 200, ("pass", passed.json())
    return opening["id"]


def add_opening_materials(env, stage_id):
    materials = []
    for material_type in MATERIAL_TYPES_BY_STAGE["OPENING"]:
        response = env["owner_client"].post(
            stage_url(env, stage_id, "materials/"),
            {"material_type": material_type, "title": material_type},
            format="json",
        )
        assert response.status_code == 201, response.json()
        materials.append(response.json())
    return materials


@pytest.mark.django_db
class TestOpeningGate:
    def test_experiments_and_code_are_required(self, env):
        opening_id = pass_pre_opening(env)
        env["owner_client"].post(stage_url(env, opening_id, "enter/"), {}, format="json")
        add_opening_materials(env, opening_id)

        blocked = env["owner_client"].post(stage_url(env, opening_id, "submit/"), {}, format="json")
        assert blocked.status_code == 422
        codes = {item["code"] for item in blocked.json()["blockers"]}
        assert codes == {"experiment_linked", "code_repo"}

        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Planned run",
            owner=env["owner"],
        )
        still_blocked = env["owner_client"].post(stage_url(env, opening_id, "submit/"), {}, format="json")
        assert still_blocked.status_code == 422
        assert {item["code"] for item in still_blocked.json()["blockers"]} == {"code_repo"}

        ProjectCodeRepository.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            provider="GITHUB",
            repository_url="https://github.com/example/analysis",
            created_by=env["owner"],
        )
        passed = env["owner_client"].post(stage_url(env, opening_id, "submit/"), {}, format="json")
        assert passed.status_code == 200, passed.json()
        assert passed.json()["status"] == "SUBMITTED"

    def test_material_set_must_be_complete(self, env):
        opening_id = pass_pre_opening(env)
        env["owner_client"].post(stage_url(env, opening_id, "enter/"), {}, format="json")
        materials = add_opening_materials(env, opening_id)
        StageMaterial.all_objects.filter(pk=materials[0]["id"]).update(deleted_at=None)
        # remove one material from the working set
        StageMaterial.all_objects.filter(pk=materials[0]["id"]).update(status="REJECTED")
        blocked = env["owner_client"].post(stage_url(env, opening_id, "submit/"), {}, format="json")
        assert blocked.status_code == 422
        material_blocker = next(item for item in blocked.json()["blockers"] if item["code"] == "material_set")
        assert material_blocker["required"] == 10
        assert material_blocker["actual"] == 9


@pytest.mark.django_db
class TestMaterialTemplates:
    def test_template_variables_are_resolved(self, env):
        created = env["admin_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/report-templates/",
            {
                "name": "Opening hypothesis",
                "scope": "STAGE_MATERIAL",
                "stage": "OPENING",
                "material_type": "HYPOTHESIS",
                "variables": ["project", "stage"],
                "content_json": {
                    "type": "doc",
                    "content": [{"type": "paragraph", "content": "{{project}} / {{stage}}"}],
                },
            },
            format="json",
        )
        assert created.status_code == 201, created.json()

        opening_id = pass_pre_opening(env)
        env["owner_client"].post(stage_url(env, opening_id, "enter/"), {}, format="json")
        material = env["owner_client"].post(
            stage_url(env, opening_id, "materials/"),
            {"material_type": "HYPOTHESIS"},
            format="json",
        )
        assert material.status_code == 201, material.json()
        body = material.json()
        assert "{{" not in str(body["page_detail"]["description_json"])
        assert "OPENING" in str(body["page_detail"]["description_json"])

    def test_unresolved_variables_block_the_material(self, env):
        env["admin_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/report-templates/",
            {
                "name": "Broken template",
                "scope": "STAGE_MATERIAL",
                "stage": "OPENING",
                "material_type": "RISK_AND_BACKUP",
                "content_json": {
                    "type": "doc",
                    "content": [{"type": "paragraph", "content": "{{unknown_variable}}"}],
                },
            },
            format="json",
        )
        opening_id = pass_pre_opening(env)
        env["owner_client"].post(stage_url(env, opening_id, "enter/"), {}, format="json")
        blocked = env["owner_client"].post(
            stage_url(env, opening_id, "materials/"),
            {"material_type": "RISK_AND_BACKUP"},
            format="json",
        )
        assert blocked.status_code == 422
        assert blocked.json()["error_code"] == "template_variables_unresolved"
        assert "unknown_variable" in blocked.json()["message"]


@pytest.mark.django_db
class TestAdminOverride:
    def test_override_requires_a_reason_and_writes_a_version(self, env):
        opening_id = pass_pre_opening(env)
        env["owner_client"].post(stage_url(env, opening_id, "enter/"), {}, format="json")
        materials = add_opening_materials(env, opening_id)
        material_id = materials[0]["id"]
        env["owner_client"].post(stage_url(env, opening_id, "submit/"), {}, format="json")

        no_reason = env["admin_client"].post(material_url(env, material_id, "override/"), {}, format="json")
        assert no_reason.status_code == 422
        assert no_reason.json()["error_code"] == "stage_reason_required"

        overridden = env["admin_client"].post(
            material_url(env, material_id, "override/"),
            {"title": "corrected title", "reason": "typo in the official submission"},
            format="json",
        )
        assert overridden.status_code == 200, overridden.json()
        assert overridden.json()["page_detail"]["name"] == "corrected title"

        versions = StageMaterialVersion.objects.filter(material_id=material_id).order_by("-version_no")
        assert versions.first().change_source == "ADMIN_OVERRIDE"
        assert versions.first().reason == "typo in the official submission"
        assert versions.count() >= 2

    def test_override_is_admin_only(self, env):
        opening_id = pass_pre_opening(env)
        env["owner_client"].post(stage_url(env, opening_id, "enter/"), {}, format="json")
        materials = add_opening_materials(env, opening_id)
        env["owner_client"].post(stage_url(env, opening_id, "submit/"), {}, format="json")
        response = env["owner_client"].post(
            material_url(env, materials[0]["id"], "override/"),
            {"title": "nope", "reason": "trying"},
            format="json",
        )
        assert response.status_code == 403
