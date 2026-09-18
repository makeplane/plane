# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Integration base layer: auth, degradation, ACL mapping and caching (P1-D1)."""

from unittest.mock import patch

import pytest

from plane.db.models import ExternalSystemConnection, IntegrationCallLog, ResearchAuditEvent
from plane.research.services.integrations import client_for
from plane.research.services.integrations.base import IntegrationErrorCode, resolve_secret
from plane.research.utils.integrations import (
    actor_acl_dimension,
    cache_key,
    filter_source_items,
    reference_allowed,
)
from plane.tests.research_fixtures import add_workspace_member, enable_research, make_user, make_workspace

pytestmark = pytest.mark.unit


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload if payload is not None else {"items": []}
        self.content = b"{}"

    def json(self):
        return self._payload


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    member = make_user(first_name="Member")
    add_workspace_member(workspace, member)
    connection = ExternalSystemConnection.objects.create(
        workspace=workspace,
        system="RAGPORTAL",
        display_name="RAGPortal",
        base_url="https://ragportal.example.com",
        auth_mode="HMAC",
        credential_ref="ragportal_shared_secret",
        timeout_seconds=1,
        cache_ttl_seconds=60,
        is_enabled=True,
    )
    return {"workspace": workspace, "admin": admin, "member": member, "connection": connection}


def test_secret_resolution_prefers_the_secret_store(env, settings):
    settings.RAGPORTAL_SHARED_SECRET = "top-secret"
    assert resolve_secret(env["connection"]) == "top-secret"


def test_hmac_headers_never_expose_the_secret(env, settings):
    settings.RAGPORTAL_SHARED_SECRET = "top-secret"
    client = client_for("RAGPORTAL", env["connection"])
    headers = client.headers(path="/api/knowledge/entries/", query="q=x")
    assert headers["X-AI4MS-Signature"]
    assert headers["X-AI4MS-Timestamp"]
    assert "top-secret" not in str(headers)


@pytest.mark.django_db
def test_missing_connection_degrades(env):
    client = client_for("SPECLABOS", None)
    result = client.search(query="sample")
    assert result.degraded is True
    assert result.degraded_reason == IntegrationErrorCode.NOT_CONFIGURED
    assert result.items == []
    assert result.as_payload()["degraded"] is True


@pytest.mark.django_db
def test_disabled_connection_degrades_without_calling_out(env):
    env["connection"].is_enabled = False
    env["connection"].save(update_fields=["is_enabled"])
    client = client_for("RAGPORTAL", env["connection"])
    with patch("httpx.get") as fake_get:
        result = client.search(query="x")
    fake_get.assert_not_called()
    assert result.degraded is True
    assert result.degraded_reason == IntegrationErrorCode.DISABLED
    log = IntegrationCallLog.objects.filter(workspace=env["workspace"]).first()
    assert log.outcome == "DEGRADED"
    assert log.error_code == IntegrationErrorCode.DISABLED


@pytest.mark.django_db
def test_successful_call_normalises_and_logs(env):
    client = client_for("RAGPORTAL", env["connection"])
    payload = {
        "items": [
            {
                "id": "kb-1",
                "title": "Polymer handbook",
                "summary": "reference data",
                "url": "https://ragportal.example.com/entries/kb-1",
                "acl": {"public": True},
                "updated_at": "2026-01-02T00:00:00Z",
            }
        ]
    }
    with patch("httpx.get", return_value=FakeResponse(200, payload)) as fake_get:
        result = client.search(query="polymer")
    assert result.degraded is False
    assert result.items[0]["external_id"] == "kb-1"
    assert result.items[0]["external_type"] == "KNOWLEDGE_ENTRY"
    assert result.items[0]["metadata"]["updated_at"] == "2026-01-02T00:00:00Z"
    assert fake_get.call_args.kwargs["timeout"] == 1.0
    log = IntegrationCallLog.objects.filter(workspace=env["workspace"]).latest("created_at")
    assert log.outcome == "SUCCESS"
    assert log.latency_ms is not None
    assert ResearchAuditEvent.objects.filter(action="integration.call").exists()


@pytest.mark.django_db
def test_http_error_degrades_and_marks_health(env):
    client = client_for("RAGPORTAL", env["connection"])
    with patch("httpx.get", return_value=FakeResponse(503, {})):
        result = client.search(query="x")
    assert result.degraded is True
    assert result.degraded_reason == IntegrationErrorCode.HTTP_ERROR
    assert result.status_code == 503
    env["connection"].refresh_from_db()
    assert env["connection"].health_status == "DEGRADED"
    assert env["connection"].last_error == IntegrationErrorCode.HTTP_ERROR


@pytest.mark.django_db
def test_timeout_is_reported_as_degradation(env):
    client = client_for("RAGPORTAL", env["connection"])

    class ReadTimeout(Exception):
        pass

    with patch("httpx.get", side_effect=ReadTimeout("timed out")):
        result = client.search(query="x")
    assert result.degraded is True
    assert result.degraded_reason == IntegrationErrorCode.TIMEOUT


@pytest.mark.django_db
def test_adapter_field_mapping(env):
    connection = ExternalSystemConnection.objects.create(
        workspace=env["workspace"],
        system="SPEC_AGENT",
        display_name="Spec_Agent",
        base_url="https://spec-agent.example.com",
        auth_mode="NONE",
        is_enabled=True,
    )
    client = client_for("SPEC_AGENT", connection)
    payload = {
        "items": [
            {
                "id": "analysis-9",
                "name": "GPC analysis",
                "method": "GPC",
                "generated_at": "2026-02-01T10:00:00Z",
                "acl": {"public": True},
            }
        ]
    }
    with patch("httpx.get", return_value=FakeResponse(200, payload)):
        result = client.search(query="GPC")
    assert result.items[0]["external_type"] == "ANALYSIS_RESULT"
    assert result.items[0]["metadata"]["method"] == "GPC"
    assert result.items[0]["metadata"]["generated_at"] == "2026-02-01T10:00:00Z"


@pytest.mark.django_db
def test_source_acl_intersection_defaults_to_deny(env):
    items = [
        {"external_id": "public", "acl_hint": {"public": True}},
        {"external_id": "mine", "acl_hint": {"users": [str(env["member"].id)]}},
        {"external_id": "other", "acl_hint": {"users": ["someone-else"]}},
        {"external_id": "unknown", "acl_hint": {}},
    ]
    allowed = filter_source_items(items, env["member"], env["workspace"].id)
    assert {item["external_id"] for item in allowed} == {"public", "mine"}


@pytest.mark.django_db
def test_reference_visibility_defaults_to_deny_without_hint(env):
    class StubReference:
        def __init__(self, hint):
            self.acl_hint = hint

    assert reference_allowed(StubReference({}), env["member"], env["workspace"].id) is False
    assert reference_allowed(StubReference({"public": True}), env["member"], env["workspace"].id) is True


@pytest.mark.django_db
def test_cache_key_includes_the_acl_dimension(env):
    other = make_user(first_name="Other")
    add_workspace_member(env["workspace"], other)
    first = cache_key(env["workspace"].id, "RAGPORTAL", "search", "q", env["member"])
    second = cache_key(env["workspace"].id, "RAGPORTAL", "search", "q", other)
    assert first != second
    assert actor_acl_dimension(env["member"], env["workspace"].id) in first
    assert cache_key(env["workspace"].id, "RAGPORTAL", "search", "q", env["member"], page=2) != first
