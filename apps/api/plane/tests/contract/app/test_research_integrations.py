# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Integration contract tests (P1-INT-01 ~ P1-INT-12)."""

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    ExternalSystemConnection,
    OrgUnit,
    OrgUnitMember,
    ResearchExternalReference,
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
        workspace=workspace, org_unit=group, user=member, org_role=OrgUnitMember.OrgRole.PI
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
        "group": group,
        "admin_client": admin_client,
        "owner_client": client_for(owner),
        "member_client": client_for(member),
    }


def integrations_url(env, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/integrations/{suffix}"


def references_url(env, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/external-references/{suffix}"


@pytest.mark.django_db
class TestConnectionConfiguration:
    def test_lists_every_system_even_when_unconfigured(self, env):
        payload = env["admin_client"].get(integrations_url(env)).json()
        systems = {item["system"] for item in payload["results"]}
        assert systems == {"RAGPORTAL", "WEKNORA", "SPECLABOS", "SMARTACCESS", "POLY_AGENT", "SPEC_AGENT"}
        ragportal = next(item for item in payload["results"] if item["system"] == "RAGPORTAL")
        assert ragportal["configured"] is False
        assert ragportal["is_enabled"] is False

    def test_admin_configures_a_connection_without_echoing_credentials(self, env):
        response = env["admin_client"].patch(
            integrations_url(env),
            {
                "items": [
                    {
                        "system": "RAGPORTAL",
                        "display_name": "Knowledge portal",
                        "base_url": "https://ragportal.example.com",
                        "auth_mode": "HMAC",
                        "credential_ref": "ragportal_shared_secret",
                        "timeout_seconds": 2,
                        "cache_ttl_seconds": 120,
                        "is_enabled": True,
                    }
                ]
            },
            format="json",
        )
        assert response.status_code == 200, response.json()
        body = response.json()["results"][0]
        assert body["has_credential"] is True
        assert body["credential_ref"] == "ragportal_shared_secret"
        assert {"secret", "token", "credential_value"} & set(body) == set()
        assert body["timeout_seconds"] == 2
        assert ExternalSystemConnection.objects.filter(system="RAGPORTAL", is_enabled=True).exists()

    def test_only_admins_may_configure(self, env):
        response = env["owner_client"].patch(
            integrations_url(env),
            {"items": [{"system": "RAGPORTAL", "base_url": "https://x.example.com", "is_enabled": True}]},
            format="json",
        )
        assert response.status_code == 403

    def test_health_reports_unconfigured_systems(self, env):
        payload = env["admin_client"].get(integrations_url(env, "health/")).json()
        ragportal = next(item for item in payload["results"] if item["system"] == "RAGPORTAL")
        assert ragportal["configured"] is False
        assert ragportal["degraded_reason"] == "not_configured"


@pytest.mark.django_db
class TestIntegrationSearch:
    def test_unconfigured_system_degrades_without_blocking(self, env):
        payload = env["owner_client"].get(f"{integrations_url(env, 'search/')}?system=RAGPORTAL&q=test").json()
        assert payload["degraded"] is True
        assert payload["degraded_reason"] == "not_configured"
        assert payload["items"] == []

        # the main flow keeps working while an external system is unavailable
        stages = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/stages/"
        )
        assert stages.status_code == 200

    def test_search_filters_by_the_source_acl(self, env):
        ExternalSystemConnection.objects.create(
            workspace=env["workspace"],
            system="RAGPORTAL",
            display_name="RAGPortal",
            base_url="https://ragportal.example.com",
            auth_mode="NONE",
            is_enabled=True,
        )
        payload = {
            "items": [
                {"id": "public-1", "title": "Public entry", "acl": {"public": True}},
                {"id": "unit-1", "title": "Group entry", "acl": {"org_units": [str(env["group"].id)]}},
                {"id": "hidden-1", "title": "Hidden entry", "acl": {"users": ["someone-else"]}},
                {"id": "unknown-1", "title": "No hint", "acl": {}},
            ]
        }
        with patch("httpx.get", return_value=FakeResponse(200, payload)):
            data = env["member_client"].get(f"{integrations_url(env, 'search/')}?system=RAGPORTAL&q=x").json()
        titles = {item["title"] for item in data["items"]}
        assert titles == {"Public entry", "Group entry"}
        assert data["filtered_out"] == 2

    def test_results_are_cached_per_acl_dimension(self, env):
        ExternalSystemConnection.objects.create(
            workspace=env["workspace"],
            system="RAGPORTAL",
            display_name="RAGPortal",
            base_url="https://ragportal.example.com",
            auth_mode="NONE",
            is_enabled=True,
        )
        payload = {"items": [{"id": "public-1", "title": "Public entry", "acl": {"public": True}}]}
        with patch("httpx.get", return_value=FakeResponse(200, payload)) as fake_get:
            env["member_client"].get(f"{integrations_url(env, 'search/')}?system=RAGPORTAL&q=cache")
            env["member_client"].get(f"{integrations_url(env, 'search/')}?system=RAGPORTAL&q=cache")
            assert fake_get.call_count == 1
            env["owner_client"].get(f"{integrations_url(env, 'search/')}?system=RAGPORTAL&q=cache")
            # a different caller has a different ACL dimension, so the cache misses
            assert fake_get.call_count == 2

    def test_knowledge_entries_endpoint_uses_the_reference_shape(self, env):
        ExternalSystemConnection.objects.create(
            workspace=env["workspace"],
            system="RAGPORTAL",
            display_name="RAGPortal",
            base_url="https://ragportal.example.com",
            auth_mode="NONE",
            is_enabled=True,
        )
        payload = {
            "items": [
                {
                    "id": "kb-7",
                    "title": "Polymer handbook",
                    "summary": "handbook",
                    "url": "https://ragportal.example.com/entries/kb-7",
                    "acl": {"public": True},
                }
            ]
        }
        with patch("httpx.get", return_value=FakeResponse(200, payload)):
            data = env["owner_client"].get(
                f"/api/research/workspaces/{env['workspace'].slug}/knowledge/entries/?q=polymer"
            ).json()
        assert data["source_system"] == "RAGPORTAL"
        assert data["items"][0]["external_type"] == "KNOWLEDGE_ENTRY"
        assert data["synced_at"]

    def test_call_logs_are_admin_only_and_redacted(self, env):
        assert env["owner_client"].get(integrations_url(env, "call-logs/")).status_code == 403
        payload = env["admin_client"].get(integrations_url(env, "call-logs/")).json()
        assert payload["count"] >= 0
        if payload["results"]:
            entry = payload["results"][0]
            assert set(entry) == {
                "id",
                "system",
                "operation",
                "request_id",
                "outcome",
                "status_code",
                "latency_ms",
                "error_code",
                "created_at",
            }


@pytest.mark.django_db
class TestExternalReferences:
    def _create_reference(self, env, **overrides):
        payload = {
            "system": "RAGPORTAL",
            "external_type": "KNOWLEDGE_ENTRY",
            "external_id": "kb-1",
            "title": "Polymer handbook",
            "summary": "handbook",
            "source_url": "https://ragportal.example.com/entries/kb-1",
            "acl_hint": {"public": True},
        }
        payload.update(overrides)
        return env["owner_client"].post(references_url(env), payload, format="json")

    def test_reference_requires_an_acl_hint(self, env):
        response = self._create_reference(env, acl_hint={})
        assert response.status_code == 422
        assert response.json()["error_code"] == "external_reference_invalid"

    def test_reference_lifecycle_and_links(self, env):
        created = self._create_reference(env)
        assert created.status_code == 201, created.json()
        reference_id = created.json()["id"]
        assert created.json()["links"] == []

        linked = env["owner_client"].post(
            references_url(env, f"{reference_id}/links/"),
            {"target_type": "PROJECT", "target_id": env["project_id"]},
            format="json",
        )
        assert linked.status_code == 201, linked.json()
        assert len(linked.json()["links"]) == 1

        listed = env["owner_client"].get(references_url(env)).json()
        assert listed["count"] == 1

        removed = env["owner_client"].delete(
            references_url(env, f"{reference_id}/links/{linked.json()['links'][0]['id']}/")
        )
        assert removed.status_code == 204

    def test_private_reference_is_invisible_to_others(self, env):
        created = self._create_reference(env, acl_hint={"users": [str(env["owner"].id)]})
        reference_id = created.json()["id"]
        assert env["member_client"].get(references_url(env)).json()["count"] == 0
        assert env["member_client"].get(references_url(env, f"{reference_id}/")).status_code == 404
        assert env["owner_client"].get(references_url(env, f"{reference_id}/")).status_code == 200

    def test_duplicate_reference_returns_409(self, env):
        assert self._create_reference(env).status_code == 201
        duplicate = self._create_reference(env)
        assert duplicate.status_code == 409
        assert duplicate.json()["error_code"] == "external_reference_exists"

    def test_reference_stores_no_body_copy(self, env):
        created = self._create_reference(env)
        reference = ResearchExternalReference.objects.get(pk=created.json()["id"])
        assert reference.summary == "handbook"
        field_names = {field.name for field in ResearchExternalReference._meta.get_fields()}
        assert "content" not in field_names
        assert "body" not in field_names
