# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Knowledge base references on Plane objects (P1-D2, P1-KB-01 ~ P1-KB-08)."""

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    ExperimentRecord,
    ExternalSystemConnection,
    LiteratureEntry,
    OrgUnit,
    OrgUnitMember,
    StageMaterial,
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
    ExternalSystemConnection.objects.create(
        workspace=workspace,
        system="RAGPORTAL",
        display_name="RAGPortal",
        base_url="https://ragportal.example.com",
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
        "member": member,
        "workspace": workspace,
        "group": group,
        "project_id": created.json()["id"],
        "admin_client": admin_client,
        "owner_client": client_for(owner),
        "member_client": client_for(member),
    }


def references_url(env, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/external-references/{suffix}"


def make_reference(env, external_id="kb-1"):
    return env["owner_client"].post(
        references_url(env),
        {
            "system": "RAGPORTAL",
            "external_type": "KNOWLEDGE_ENTRY",
            "external_id": external_id,
            "title": "Polymer handbook",
            "summary": "handbook",
            "source_url": f"https://ragportal.example.com/entries/{external_id}",
            "acl_hint": {"public": True},
        },
        format="json",
    )


@pytest.mark.django_db
class TestKnowledgeReferences:
    def test_reference_can_hang_off_a_stage_material(self, env):
        stages = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/stages/"
        ).json()["results"]
        pre = next(item for item in stages if item["stage"] == "PRE_OPENING")
        env["owner_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/stages/{pre['id']}/enter/", {}, format="json"
        )
        material = env["owner_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/stages/{pre['id']}/materials/",
            {"material_type": MATERIAL_TYPES_BY_STAGE["PRE_OPENING"][0]},
            format="json",
        ).json()

        reference = make_reference(env).json()
        linked = env["owner_client"].post(
            references_url(env, f"{reference['id']}/links/"),
            {"target_type": "STAGE_MATERIAL", "target_id": material["id"]},
            format="json",
        )
        assert linked.status_code == 201, linked.json()
        assert linked.json()["links"][0]["target_type"] == "STAGE_MATERIAL"

    def test_reference_can_hang_off_a_literature_entry_and_an_experiment(self, env):
        entry = LiteratureEntry.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            owner=env["owner"],
            title="Paper",
            status="COLLECTED",
        )
        record = ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Run",
            owner=env["owner"],
        )
        reference = make_reference(env).json()
        for target_type, target_id in (
            ("LITERATURE_ENTRY", str(entry.id)),
            ("EXPERIMENT_RECORD", str(record.id)),
        ):
            response = env["owner_client"].post(
                references_url(env, f"{reference['id']}/links/"),
                {"target_type": target_type, "target_id": target_id},
                format="json",
            )
            assert response.status_code == 201, response.json()
        detail = env["owner_client"].get(references_url(env, f"{reference['id']}/")).json()
        assert {link["target_type"] for link in detail["links"]} == {
            "LITERATURE_ENTRY",
            "EXPERIMENT_RECORD",
        }

    def test_link_to_invisible_target_is_refused(self, env):
        entry = LiteratureEntry.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            owner=env["owner"],
            title="Private paper",
            visibility="PRIVATE",
            status="COLLECTED",
        )
        reference = make_reference(env).json()
        response = env["member_client"].post(
            references_url(env, f"{reference['id']}/links/"),
            {"target_type": "LITERATURE_ENTRY", "target_id": str(entry.id)},
            format="json",
        )
        # private external references are invisible to the member in the first place
        assert response.status_code in (403, 404)

    def test_unknown_target_type_is_rejected(self, env):
        reference = make_reference(env).json()
        response = env["owner_client"].post(
            references_url(env, f"{reference['id']}/links/"),
            {"target_type": "UNKNOWN_KIND", "target_id": str(env["project_id"])},
            format="json",
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "external_reference_invalid"


@pytest.mark.django_db
class TestKnowledgeDegradation:
    def test_unavailable_source_returns_links_only(self, env):
        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/integrations/",
            {"items": [{"system": "RAGPORTAL", "base_url": "https://ragportal.example.com", "is_enabled": False}]},
            format="json",
        )
        payload = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/knowledge/entries/?q=x"
        ).json()
        assert payload["degraded"] is True
        assert payload["degraded_reason"] == "connection_disabled"
        assert payload["items"] == []

        # existing references stay readable as links
        reference = make_reference(env, external_id="kb-2").json()
        assert env["owner_client"].get(references_url(env, f"{reference['id']}/")).status_code == 200

    def test_reference_metadata_reflects_the_source_acl_change(self, env):
        reference = make_reference(env).json()
        # the source system narrows the ACL: the reference becomes invisible
        env["owner_client"].patch(
            references_url(env, f"{reference['id']}/"),
            {"acl_hint": {"users": [str(env["owner"].id)]}},
            format="json",
        )
        assert env["member_client"].get(references_url(env)).json()["count"] == 0

    def test_knowledge_search_does_not_store_bodies(self, env):
        payload = {
            "items": [
                {
                    "id": "kb-9",
                    "title": "Handbook",
                    "summary": "short summary",
                    "url": "https://ragportal.example.com/entries/kb-9",
                    "acl": {"public": True},
                    "content": "the full document body that must never be stored",
                }
            ]
        }
        with patch("httpx.get", return_value=FakeResponse(200, payload)):
            data = env["owner_client"].get(
                f"/api/research/workspaces/{env['workspace'].slug}/knowledge/entries/?q=handbook"
            ).json()
        assert "content" not in data["items"][0]
        assert "the full document body" not in str(data)
