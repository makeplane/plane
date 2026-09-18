# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Experiment contract tests (P1-EXP-01 ~ P1-EXP-14)."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    ExperimentAmendment,
    ExperimentAssetLink,
    ExperimentRecord,
    ExperimentRecordVersion,
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
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
    mentor = make_user(first_name="Mentor")
    add_workspace_member(workspace, mentor)
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
        workspace=workspace, org_unit=group, user=owner, org_role=OrgUnitMember.OrgRole.PI
    )
    MentorBinding.objects.create(
        workspace=workspace,
        mentee=owner,
        mentor=mentor,
        is_primary_advisor=True,
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
        "mentor": mentor,
        "stranger": stranger,
        "workspace": workspace,
        "project_id": project_id,
        "admin_client": admin_client,
        "owner_client": client_for(owner),
        "mentor_client": client_for(mentor),
        "stranger_client": client_for(stranger),
    }


def experiments_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/experiments/"


def record_url(env, record_id, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/experiments/{record_id}/{suffix}"


def amendment_url(env, amendment_id, action="", ):
    base = f"/api/research/workspaces/{env['workspace'].slug}/amendments/{amendment_id}/"
    return f"{base}{action}" if action else base


def create_record(env, title="Run 1", **overrides):
    payload = {"title": title, "molecular_system": "PEO/LiTFSI", "method": "GPC", "parameters": {"T": 25}}
    payload.update(overrides)
    return env["owner_client"].post(experiments_url(env), payload, format="json")


def submitted_record(env):
    created = create_record(env)
    assert created.status_code == 201, created.json()
    record_id = created.json()["id"]
    assert env["owner_client"].post(record_url(env, record_id, "status/"), {"status": "RUNNING"}).status_code == 200
    assert env["owner_client"].post(record_url(env, record_id, "submit/"), {}, format="json").status_code == 200
    return record_id


@pytest.mark.django_db
class TestExperimentRegistration:
    def test_sequence_numbers_are_unique_per_project(self, env):
        first = create_record(env, "Run 1")
        second = create_record(env, "Run 2")
        assert first.json()["sequence_no"] == 1
        assert second.json()["sequence_no"] == 2
        listed = env["owner_client"].get(experiments_url(env)).json()
        assert listed["count"] == 2
        assert listed["counters"]["total"] == 2

    def test_fields_round_trip(self, env):
        created = create_record(
            env,
            "Run with details",
            hypothesis="higher T raises conversion",
            smiles="CC(=O)O",
            system_composition="10 wt%",
            environment={"temperature_c": 60},
            metrics={"conversion": 0.9},
        )
        body = created.json()
        assert body["hypothesis"] == "higher T raises conversion"
        assert body["environment"] == {"temperature_c": 60}
        detail = env["owner_client"].get(record_url(env, body["id"])).json()
        assert detail["metrics"] == {"conversion": 0.9}
        assert "molecular_system" in detail["locked_fields"]
        assert "result" in detail["amendable_fields"]
        assert detail["can_edit"] is True

    def test_running_records_lock_key_fields(self, env):
        created = create_record(env)
        record_id = created.json()["id"]
        assert env["owner_client"].post(record_url(env, record_id, "status/"), {"status": "RUNNING"}).status_code == 200
        blocked = env["owner_client"].patch(record_url(env, record_id), {"method": "NMR"}, format="json")
        assert blocked.status_code == 409
        assert blocked.json()["error_code"] == "experiment_locked_field"
        allowed = env["owner_client"].patch(record_url(env, record_id), {"result": "partial"}, format="json")
        assert allowed.status_code == 200

    def test_status_transitions_are_enforced(self, env):
        created = create_record(env)
        record_id = created.json()["id"]
        invalid = env["owner_client"].post(
            record_url(env, record_id, "status/"), {"status": "COMPLETED"}, format="json"
        )
        assert invalid.status_code == 409
        assert invalid.json()["error_code"] == "experiment_state_conflict"
        env["owner_client"].post(record_url(env, record_id, "status/"), {"status": "RUNNING"})
        failed = env["owner_client"].post(
            record_url(env, record_id, "status/"), {"status": "FAILED"}, format="json"
        )
        assert failed.status_code == 422
        assert failed.json()["error_code"] == "experiment_state_conflict"
        ok = env["owner_client"].post(
            record_url(env, record_id, "status/"),
            {"status": "FAILED", "failure_reason": "column blocked"},
            format="json",
        )
        assert ok.status_code == 200
        assert ok.json()["status"] == "FAILED"

    def test_unrelated_member_cannot_read_a_record(self, env):
        record_id = create_record(env).json()["id"]
        assert env["stranger_client"].get(record_url(env, record_id)).status_code == 404
        assert env["stranger_client"].get(experiments_url(env)).json()["count"] == 0


@pytest.mark.django_db
class TestExperimentLocking:
    def test_submission_locks_the_record_and_creates_a_version(self, env):
        record_id = submitted_record(env)
        detail = env["owner_client"].get(record_url(env, record_id)).json()
        assert detail["is_locked"] is True
        assert detail["can_edit"] is False
        versions = env["owner_client"].get(record_url(env, record_id, "versions/")).json()
        assert versions["count"] == 1
        assert versions["results"][0]["change_source"] == "SUBMIT"

    def test_patching_a_submitted_record_returns_409(self, env):
        record_id = submitted_record(env)
        blocked = env["owner_client"].patch(record_url(env, record_id), {"result": "changed"}, format="json")
        assert blocked.status_code == 409
        assert blocked.json()["error_code"] == "experiment_read_only"

    def test_deleting_is_refused_and_archiving_is_allowed(self, env):
        created = create_record(env)
        record_id = created.json()["id"]
        env["owner_client"].post(record_url(env, record_id, "status/"), {"status": "RUNNING"})
        env["owner_client"].post(
            record_url(env, record_id, "status/"),
            {"status": "FAILED", "failure_reason": "column blocked"},
            format="json",
        )
        env["owner_client"].post(record_url(env, record_id, "submit/"), {}, format="json")
        refused = env["owner_client"].delete(record_url(env, record_id, "archive/"))
        assert refused.status_code == 409
        assert refused.json()["error_code"] == "experiment_archived"
        archived = env["owner_client"].post(record_url(env, record_id, "archive/"), {}, format="json")
        assert archived.status_code == 200
        assert archived.json()["status"] == "ARCHIVED"
        assert ExperimentRecord.objects.filter(pk=record_id).exists()


@pytest.mark.django_db
class TestExperimentAmendment:
    def test_amendment_flow(self, env):
        record_id = submitted_record(env)

        missing_reason = env["owner_client"].post(
            record_url(env, record_id, "amendments/"),
            {"change_set": [{"field": "result", "new": "x"}]},
            format="json",
        )
        assert missing_reason.status_code == 422
        assert missing_reason.json()["error_code"] == "experiment_amendment_reason_required"

        created = env["owner_client"].post(
            record_url(env, record_id, "amendments/"),
            {
                "reason": "the label was wrong",
                "change_set": [{"field": "result", "old": "", "new": "conversion 92%"}],
            },
            format="json",
        )
        assert created.status_code == 201, created.json()
        amendment_id = created.json()["id"]

        # the requester cannot approve their own amendment when they are the author
        forbidden = env["owner_client"].post(
            amendment_url(env, amendment_id, "approve/"), {"comment": "ok"}, format="json"
        )
        assert forbidden.status_code == 403

        approved = env["mentor_client"].post(
            amendment_url(env, amendment_id, "approve/"), {"comment": "checked"}, format="json"
        )
        assert approved.status_code == 200, approved.json()
        assert approved.json()["status"] == "APPROVED"
        assert approved.json()["result_version"] is not None

        detail = env["owner_client"].get(record_url(env, record_id)).json()
        assert detail["result"] == "conversion 92%"
        assert detail["current_version_no"] == 2
        versions = env["owner_client"].get(record_url(env, record_id, "versions/")).json()
        assert [item["version_no"] for item in versions["results"]] == [2, 1]
        assert versions["results"][1]["snapshot"]["result"] == ""

    def test_rejection_keeps_the_record_and_requires_a_comment(self, env):
        record_id = submitted_record(env)
        created = env["owner_client"].post(
            record_url(env, record_id, "amendments/"),
            {"reason": "please", "change_set": [{"field": "result", "new": "changed"}]},
            format="json",
        )
        amendment_id = created.json()["id"]
        no_comment = env["mentor_client"].post(
            amendment_url(env, amendment_id, "reject/"), {}, format="json"
        )
        assert no_comment.status_code == 422
        assert no_comment.json()["error_code"] == "experiment_amendment_comment_required"

        rejected = env["mentor_client"].post(
            amendment_url(env, amendment_id, "reject/"), {"comment": "evidence missing"}, format="json"
        )
        assert rejected.status_code == 200
        detail = env["owner_client"].get(record_url(env, record_id)).json()
        assert detail["result"] == ""
        assert detail["current_version_no"] == 1
        assert ExperimentAmendment.objects.get(pk=amendment_id).status == "REJECTED"

    def test_requester_can_withdraw_and_only_one_is_pending(self, env):
        record_id = submitted_record(env)
        created = env["owner_client"].post(
            record_url(env, record_id, "amendments/"),
            {"reason": "please", "change_set": [{"field": "result", "new": "changed"}]},
            format="json",
        )
        amendment_id = created.json()["id"]
        duplicate = env["owner_client"].post(
            record_url(env, record_id, "amendments/"),
            {"reason": "again", "change_set": [{"field": "result", "new": "other"}]},
            format="json",
        )
        assert duplicate.status_code == 409
        assert duplicate.json()["error_code"] == "experiment_amendment_pending_exists"

        withdrawn = env["owner_client"].post(amendment_url(env, amendment_id, "cancel/"), {}, format="json")
        assert withdrawn.status_code == 200
        assert withdrawn.json()["status"] == "CANCELLED"

    def test_field_whitelist_is_enforced(self, env):
        record_id = submitted_record(env)
        blocked = env["owner_client"].post(
            record_url(env, record_id, "amendments/"),
            {"reason": "why not", "change_set": [{"field": "molecular_system", "new": "other"}]},
            format="json",
        )
        assert blocked.status_code == 422
        assert blocked.json()["error_code"] == "experiment_amendment_field_not_allowed"

    def test_versions_cannot_be_deleted_through_the_api(self, env):
        record_id = submitted_record(env)
        version = ExperimentRecordVersion.objects.get(record_id=record_id)
        response = env["owner_client"].delete(record_url(env, record_id, f"versions/{version.id}/"))
        assert response.status_code in (404, 405)
        assert ExperimentRecordVersion.objects.filter(pk=version.id).exists()


@pytest.mark.django_db
class TestExperimentAssets:
    def test_external_asset_references_are_registered_without_files(self, env):
        record_id = create_record(env).json()["id"]
        created = env["owner_client"].post(
            record_url(env, record_id, "assets/"),
            {
                "relation": "OUTPUT",
                "source_system": "SPECLABOS",
                "external_asset_id": "asset-1",
                "external_run_id": "run-7",
                "display_name": "GPC trace",
                "external_url": "https://speclabos.example.com/assets/asset-1",
            },
            format="json",
        )
        assert created.status_code == 201, created.json()
        assert created.json()["external_asset_id"] == "asset-1"

        duplicate = env["owner_client"].post(
            record_url(env, record_id, "assets/"),
            {
                "relation": "OUTPUT",
                "source_system": "SPECLABOS",
                "external_asset_id": "asset-1",
                "display_name": "again",
            },
            format="json",
        )
        assert duplicate.status_code == 409

        listed = env["owner_client"].get(record_url(env, record_id, "assets/")).json()
        assert listed["count"] == 1
        assert ExperimentAssetLink.objects.filter(record_id=record_id).count() == 1
