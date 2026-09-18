# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""R&D platform references (P1-D4, P1-RD-01 ~ P1-RD-07)."""

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
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
    for system, base in (
        ("POLY_AGENT", "https://poly-agent.example.com"),
        ("SPEC_AGENT", "https://spec-agent.example.com"),
    ):
        ExternalSystemConnection.objects.create(
            workspace=workspace,
            system=system,
            display_name=system,
            base_url=base,
            auth_mode="NONE",
            is_enabled=True,
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
        "workspace": workspace,
        "project_id": created.json()["id"],
        "admin_client": admin_client,
        "owner_client": client_for(owner),
    }


def references_url(env, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/external-references/{suffix}"


def create_reference(env, **overrides):
    payload = {
        "system": "POLY_AGENT",
        "external_type": "RD_PROJECT",
        "external_id": "proj-1",
        "title": "Polymer screening",
        "summary": "screening project",
        "source_url": "https://poly-agent.example.com/projects/proj-1",
        "acl_hint": {"public": True},
    }
    payload.update(overrides)
    return env["owner_client"].post(references_url(env), payload, format="json")


@pytest.mark.django_db
class TestRdReferences:
    def test_poly_agent_project_reference_on_an_experiment(self, env):
        record = ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Screening run",
            owner=env["owner"],
        )
        reference = create_reference(env).json()
        linked = env["owner_client"].post(
            references_url(env, f"{reference['id']}/links/"),
            {"target_type": "EXPERIMENT_RECORD", "target_id": str(record.id)},
            format="json",
        )
        assert linked.status_code == 201, linked.json()
        assert linked.json()["system"] == "POLY_AGENT"
        assert linked.json()["external_type"] == "RD_PROJECT"

    def test_spec_agent_task_reference_on_a_stage_material(self, env):
        reference = create_reference(
            env,
            system="SPEC_AGENT",
            external_type="ANALYSIS_RESULT",
            external_id="analysis-3",
            title="GPC analysis",
            source_url="https://spec-agent.example.com/analyses/analysis-3",
        ).json()
        linked = env["owner_client"].post(
            references_url(env, f"{reference['id']}/links/"),
            {"target_type": "PROJECT", "target_id": env["project_id"]},
            format="json",
        )
        assert linked.status_code == 201

    def test_rd_search_returns_reference_shaped_items(self, env):
        payload = {
            "items": [
                {
                    "id": "task-9",
                    "name": "DoE task",
                    "status": "RUNNING",
                    "updated_at": "2026-03-01T08:00:00Z",
                    "acl": {"public": True},
                }
            ]
        }
        with patch("httpx.get", return_value=FakeResponse(200, payload)):
            data = env["owner_client"].get(
                f"/api/research/workspaces/{env['workspace'].slug}/rd/projects/?q=task"
            ).json()
        assert data["source_system"] == "POLY_AGENT"
        assert data["items"][0]["external_type"] == "RD_PROJECT"
        assert data["items"][0]["metadata"]["status"] == "RUNNING"

    def test_analysis_result_keeps_every_generation(self, env):
        reference = create_reference(
            env,
            system="SPEC_AGENT",
            external_type="ANALYSIS_RESULT",
            external_id="analysis-3",
            title="GPC analysis v1",
            summary="first generation",
            source_url="https://spec-agent.example.com/analyses/analysis-3",
            metadata={"generated_at": "2026-03-01T08:00:00Z", "method": "GPC"},
        ).json()

        refreshed_payload = {
            "items": [
                {
                    "id": "analysis-3",
                    "name": "GPC analysis v2",
                    "summary": "second generation",
                    "method": "GPC",
                    "generated_at": "2026-03-05T09:30:00Z",
                    "acl": {"public": True},
                }
            ]
        }
        with patch("httpx.get", return_value=FakeResponse(200, refreshed_payload)):
            refreshed = env["owner_client"].post(
                references_url(env, f"{reference['id']}/sync/"), {}, format="json"
            )
        assert refreshed.status_code == 200, refreshed.json()
        body = refreshed.json()
        assert body["external_id"] == "analysis-3"
        assert body["title"] == "GPC analysis v2"
        assert body["metadata"]["generated_at"] == "2026-03-05T09:30:00Z"
        assert body["metadata"]["history"][0]["summary"] == "first generation"
        assert body["history_count"] == 1

    def test_sync_on_unreachable_source_degrades(self, env):
        reference = create_reference(env).json()
        with patch("httpx.get", side_effect=RuntimeError("connection refused")):
            response = env["owner_client"].post(
                references_url(env, f"{reference['id']}/sync/"), {}, format="json"
            )
        assert response.status_code == 200
        assert response.json()["degraded"] is True
        assert response.json()["status"] == "DEGRADED"
        # the reference itself stays readable with its last known metadata
        detail = env["owner_client"].get(references_url(env, f"{reference['id']}/")).json()
        assert detail["title"] == "Polymer screening"

    def test_missing_link_target_is_rejected(self, env):
        reference = create_reference(env).json()
        response = env["owner_client"].post(
            references_url(env, f"{reference['id']}/links/"),
            {"target_type": "EXPERIMENT_RECORD", "target_id": "11111111-1111-1111-1111-111111111111"},
            format="json",
        )
        assert response.status_code == 404
        assert response.json()["error_code"] == "external_reference_link_not_found"
