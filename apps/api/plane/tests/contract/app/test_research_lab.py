# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Device and wet-lab ingestion (P1-D3, P1-LAB-01 ~ P1-LAB-08)."""

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    ExperimentAssetLink,
    ExperimentRecord,
    ExternalSystemConnection,
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


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload if payload is not None else {"items": []}
        self.content = b"{}"

    def json(self):
        return self._payload


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
    member = make_user(first_name="Member")
    add_workspace_member(workspace, member)

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
    return {
        "admin": admin,
        "owner": owner,
        "member": member,
        "workspace": workspace,
        "project_id": created.json()["id"],
        "admin_client": admin_client,
        "owner_client": client_for(owner),
        "member_client": client_for(member),
    }


def ingest_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/experiments/ingest/"


def enable_speclabos(env, enabled=True):
    ExternalSystemConnection.objects.create(
        workspace=env["workspace"],
        system="SPECLABOS",
        display_name="SpecLabOS",
        base_url="https://speclabos.example.com",
        auth_mode="NONE",
        is_enabled=enabled,
    )


RUN_PAYLOAD = {
    "items": [
        {
            "id": "run-42",
            "title": "GPC run of sample A",
            "status": "COMPLETED",
            "instrument": "GPC-1",
            "operator": "Owner",
            "method": "GPC",
            "acl": {"public": True},
        }
    ]
}


@pytest.mark.django_db
class TestRunIngestion:
    def test_run_creates_an_automated_record_with_its_assets(self, env):
        enable_speclabos(env)
        payload = {
            "external_run_id": "run-42",
            "title": "GPC run of sample A",
            "status": "COMPLETED",
            "assets": [
                {
                    "relation": "OUTPUT",
                    "external_asset_id": "asset-7",
                    "display_name": "GPC trace",
                    "external_url": "https://speclabos.example.com/assets/asset-7",
                }
            ],
        }
        with patch("httpx.get", return_value=FakeResponse(200, RUN_PAYLOAD)):
            response = env["owner_client"].post(ingest_url(env), payload, format="json")
        assert response.status_code == 201, response.json()
        body = response.json()
        assert body["source"] == "AUTOMATED"
        assert body["status"] == "COMPLETED"
        assert body["degraded"] is False
        assert body["asset_count"] == 1

        links = ExperimentAssetLink.objects.filter(record_id=body["id"])
        assert links.count() == 1
        assert links.first().external_run_id == "run-42"
        assert links.first().source_system == "SPECLABOS"

    def test_same_run_is_never_registered_twice(self, env):
        enable_speclabos(env)
        payload = {"external_run_id": "run-42", "title": "GPC run of sample A"}
        with patch("httpx.get", return_value=FakeResponse(200, RUN_PAYLOAD)):
            first = env["owner_client"].post(ingest_url(env), payload, format="json")
            second = env["owner_client"].post(ingest_url(env), payload, format="json")
        assert first.status_code == 201
        assert second.status_code == 200
        assert second.json()["created"] is False
        assert second.json()["duplicate_of"] == first.json()["id"]
        assert ExperimentRecord.objects.filter(project_id=env["project_id"]).count() == 1

    def test_same_run_id_in_another_project_is_a_new_record(self, env):
        enable_speclabos(env)
        from plane.db.models import WorkspaceResearchSetting

        setting = WorkspaceResearchSetting.objects.get(workspace=env["workspace"])
        setting.allow_multiple_projects = True
        setting.save(update_fields=["allow_multiple_projects"])
        second_project = env["admin_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/",
            {"owner": str(env["owner"].id), "research_type": "MASTER", "create_project": True},
            format="json",
        ).json()["id"]
        with patch("httpx.get", return_value=FakeResponse(200, RUN_PAYLOAD)):
            env["owner_client"].post(
                ingest_url(env), {"external_run_id": "run-42", "title": "A"}, format="json"
            )
            response = env["admin_client"].post(
                f"/api/research/workspaces/{env['workspace'].slug}/projects/{second_project}/experiments/ingest/",
                {"external_run_id": "run-42", "title": "B"},
                format="json",
            )
        assert response.status_code == 201
        assert ExperimentRecord.objects.filter(project_id=second_project).count() == 1

    def test_missing_run_id_is_rejected(self, env):
        enable_speclabos(env)
        response = env["owner_client"].post(ingest_url(env), {"title": "no id"}, format="json")
        assert response.status_code == 422
        assert response.json()["error_code"] == "experiment_state_conflict"


@pytest.mark.django_db
class TestIngestionDegradation:
    def test_unreachable_source_marks_the_record_pending(self, env):
        enable_speclabos(env)
        with patch("httpx.get", side_effect=RuntimeError("connection refused")):
            response = env["owner_client"].post(
                ingest_url(env),
                {
                    "external_run_id": "run-99",
                    "title": "Offline run",
                    "assets": [{"external_asset_id": "asset-1", "display_name": "trace"}],
                },
                format="json",
            )
        assert response.status_code == 201
        body = response.json()
        assert body["degraded"] is True
        assert body["status_note"] == "pending_source_sync"
        link = ExperimentAssetLink.objects.get(record_id=body["id"])
        assert link.last_verified_at is None

    def test_disabled_connection_marks_pending_without_calling_out(self, env):
        enable_speclabos(env, enabled=False)
        with patch("httpx.get") as fake_get:
            response = env["owner_client"].post(
                ingest_url(env), {"external_run_id": "run-100", "title": "Offline"}, format="json"
            )
        fake_get.assert_not_called()
        assert response.json()["degraded"] is True
        assert response.json()["degraded_reason"] == "connection_disabled"
        assert response.json()["status_note"] == "pending_source_sync"

    def test_manual_registration_still_works_when_the_source_is_down(self, env):
        # no SpecLabOS connection at all: manual entry remains available
        created = env["owner_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/experiments/",
            {"title": "Manual run"},
            format="json",
        )
        assert created.status_code == 201
        assert created.json()["source"] == "MANUAL"
        assert created.json()["status_note"] == ""

    def test_ingest_requires_the_project_owner(self, env):
        enable_speclabos(env)
        response = env["member_client"].post(
            ingest_url(env), {"external_run_id": "run-1", "title": "x"}, format="json"
        )
        assert response.status_code == 403
