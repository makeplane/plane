# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from urllib.parse import parse_qs, urlparse

import pytest
from django.test import Client
from rest_framework.test import APIClient

from plane.db.models import IdentityMapping, ResearchAuditEvent
from plane.license.models import Instance
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
)

pytestmark = pytest.mark.contract

DISCOVERY = {
    "issuer": "https://identity.example.com",
    "authorization_endpoint": "https://identity.example.com/oauth/authorize",
    "token_endpoint": "https://identity.example.com/oauth/token",
    "userinfo_endpoint": "https://identity.example.com/oauth/userinfo",
    "jwks_uri": "https://identity.example.com/.well-known/jwks.json",
}


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True
    settings.OIDC_ISSUER_URL = None
    settings.OIDC_CLIENT_ID = None
    settings.OIDC_CLIENT_SECRET = None
    settings.OIDC_REDIRECT_URI = None
    settings.OIDC_AUTO_PROVISION_USERS = False


def configure_oidc(settings, **overrides):
    settings.OIDC_ISSUER_URL = "https://identity.example.com"
    settings.OIDC_CLIENT_ID = "plane-client"
    settings.OIDC_CLIENT_SECRET = "secret"
    settings.OIDC_REDIRECT_URI = "http://testserver/auth/oidc/callback/"
    for key, value in overrides.items():
        setattr(settings, key, value)


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestResearchIdentityMe:
    def test_returns_roles_and_sections(self, settings):
        admin = make_user()
        workspace = make_workspace(admin)
        enable_research(workspace)
        member = make_user()
        add_workspace_member(workspace, member)

        client = client_for(member)
        response = client.get(f"/api/research/workspaces/{workspace.slug}/identity/me/")
        assert response.status_code == 200
        payload = response.json()
        assert payload["sections"] == {"org": True, "reports": True, "approvals": True}
        assert payload["user"]["is_workspace_admin"] is False
        assert payload["user"]["is_research_owner"] is False
        assert payload["identity"]["configured"] is False

    def test_reports_org_roles_and_identity_mapping(self, settings):
        configure_oidc(settings)
        admin = make_user()
        workspace = make_workspace(admin)
        enable_research(workspace)
        member = make_user(email="researcher@example.com")
        add_workspace_member(workspace, member)
        IdentityMapping.objects.create(
            provider="ai4ms-oidc",
            subject="sub-1",
            user=member,
            employee_id="20230001",
        )
        client_for(admin).post(
            f"/api/research/workspaces/{workspace.slug}/org-units/", {}, format="json"
        )
        root = client_for(admin).get(f"/api/research/workspaces/{workspace.slug}/org-units/").json()
        group = client_for(admin).post(
            f"/api/research/workspaces/{workspace.slug}/org-units/",
            {"name": "Group", "unit_type": "GROUP", "parent": root["results"][0]["id"]},
            format="json",
        ).json()
        client_for(admin).post(
            f"/api/research/workspaces/{workspace.slug}/org-units/{group['id']}/members/",
            {"user": str(member.id), "org_role": "PI"},
            format="json",
        )

        response = client_for(member).get(f"/api/research/workspaces/{workspace.slug}/identity/me/")
        payload = response.json()
        assert payload["user"]["is_research_owner"] is True
        assert payload["user"]["org_units"][0]["org_role"] == "PI"
        assert payload["identity"]["subject"] == "sub-1"
        assert payload["identity"]["employee_id"] == "20230001"
        assert payload["identity"]["configured"] is True

    def test_module_switch_off_returns_not_available(self, settings):
        settings.RESEARCH_MODULE_ENABLED = False
        admin = make_user()
        workspace = make_workspace(admin)
        enable_research(workspace)
        response = client_for(admin).get(f"/api/research/workspaces/{workspace.slug}/identity/me/")
        assert response.status_code == 404
        assert response.json()["error_code"] == "research_module_disabled"

    def test_guest_is_denied(self):
        admin = make_user()
        workspace = make_workspace(admin)
        enable_research(workspace)
        guest = make_user()
        add_workspace_member(workspace, guest, role=5)
        response = client_for(guest).get(f"/api/research/workspaces/{workspace.slug}/identity/me/")
        assert response.status_code == 403


@pytest.mark.django_db
class TestIdentityMappingApi:
    def _env(self):
        admin = make_user()
        workspace = make_workspace(admin)
        enable_research(workspace)
        member = make_user()
        add_workspace_member(workspace, member)
        target = make_user(email="target@example.com")
        add_workspace_member(workspace, target)
        return admin, workspace, member, target

    def test_admin_can_bind_and_unbind(self):
        admin, workspace, _, target = self._env()
        url = f"/api/research/workspaces/{workspace.slug}/identity/mappings/"
        created = client_for(admin).post(
            url,
            {"user": str(target.id), "subject": "sub-42", "employee_id": "20230042"},
            format="json",
        )
        assert created.status_code == 201
        mapping_id = created.json()["id"]
        assert created.json()["employee_id"] == "20230042"

        listing = client_for(admin).get(url).json()
        assert listing["count"] == 1

        removed = client_for(admin).delete(f"{url}{mapping_id}/")
        assert removed.status_code == 204
        assert IdentityMapping.objects.filter(pk=mapping_id).count() == 0
        assert IdentityMapping.all_objects.get(pk=mapping_id).status == "REVOKED"
        actions = set(ResearchAuditEvent.objects.values_list("action", flat=True))
        assert {"identity.bind", "identity.unbind"} <= actions

    def test_duplicate_subject_is_rejected(self):
        admin, workspace, _, target = self._env()
        url = f"/api/research/workspaces/{workspace.slug}/identity/mappings/"
        assert (
            client_for(admin)
            .post(url, {"user": str(target.id), "subject": "sub-42"}, format="json")
            .status_code
            == 201
        )
        duplicate = client_for(admin).post(
            url, {"user": str(target.id), "subject": "sub-42"}, format="json"
        )
        assert duplicate.status_code == 400
        assert duplicate.json()["error_code"] == "identity_mapping_exists"

    def test_non_admin_cannot_manage_mappings(self):
        _, workspace, member, target = self._env()
        url = f"/api/research/workspaces/{workspace.slug}/identity/mappings/"
        assert client_for(member).get(url).status_code == 403
        assert (
            client_for(member)
            .post(url, {"user": str(target.id), "subject": "sub-1"}, format="json")
            .status_code
            == 403
        )


@pytest.mark.django_db
class TestOIDCEndpoints:
    def test_initiate_without_configuration_redirects_with_error(self, settings):
        settings.RESEARCH_MODULE_ENABLED = True
        Instance.objects.create(
            instance_name="Test",
            instance_id="instance-1",
            current_version="2.0.1",
            is_setup_done=True,
        )
        response = Client().get("/auth/oidc/")
        assert response.status_code == 302
        assert "error_code=" in response["Location"]

    def test_initiate_builds_authorization_url_with_pkce_and_nonce(self, settings, monkeypatch):
        configure_oidc(settings)
        Instance.objects.create(
            instance_name="Test",
            instance_id="instance-1",
            current_version="2.0.1",
            is_setup_done=True,
        )
        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.get_oidc_discovery",
            lambda issuer: DISCOVERY,
        )

        response = Client().get("/auth/oidc/?next_path=/acme/research/reports")
        assert response.status_code == 302
        location = response["Location"]
        assert location.startswith(DISCOVERY["authorization_endpoint"])
        query = parse_qs(urlparse(location).query)
        assert query["client_id"] == ["plane-client"]
        assert query["response_type"] == ["code"]
        assert query["code_challenge_method"] == ["S256"]
        assert query["nonce"]
        assert query["state"]
        assert query["redirect_uri"] == ["http://testserver/auth/oidc/callback/"]

    def test_callback_rejects_state_mismatch(self, settings, monkeypatch):
        configure_oidc(settings)
        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.get_oidc_discovery",
            lambda issuer: DISCOVERY,
        )
        client = Client()
        client.get("/auth/oidc/")
        response = client.get("/auth/oidc/callback/?code=abc&state=forged")
        assert response.status_code == 302
        assert "error_code=" in response["Location"]

    def test_callback_logs_in_a_mapped_user(self, settings, monkeypatch):
        configure_oidc(settings)
        Instance.objects.create(
            instance_name="Test",
            instance_id="instance-1",
            current_version="2.0.1",
            is_setup_done=True,
        )
        user = make_user(email="researcher@example.com")
        workspace = make_workspace(user)
        IdentityMapping.objects.create(provider="ai4ms-oidc", subject="sub-1", user=user)

        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.get_oidc_discovery",
            lambda issuer: DISCOVERY,
        )
        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.verify_id_token",
            lambda *args, **kwargs: {"sub": "sub-1", "email": "researcher@example.com", "name": "Researcher"},
        )
        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.OIDCOauthProvider.get_user_token",
            lambda self, data, headers=None: {"id_token": "fake", "access_token": "token", "expires_in": 3600},
        )
        monkeypatch.setattr(
            "plane.authentication.views.app.oidc.post_user_auth_workflow",
            lambda user, is_signup, request: None,
        )
        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.OIDCOauthProvider.download_and_upload_avatar",
            lambda self, avatar_url, user: None,
        )

        client = Client()
        initiate = client.get("/auth/oidc/?next_path=/acme/research/reports")
        state = parse_qs(urlparse(initiate["Location"]).query)["state"][0]
        response = client.get(f"/auth/oidc/callback/?code=abc&state={state}")
        assert response.status_code == 302
        assert "/acme/research/reports" in response["Location"]
        assert client.session.get("_auth_user_id") == str(user.id)
        assert ResearchAuditEvent.objects.filter(action="identity.login").exists()
        assert workspace.pk is not None

    def test_callback_rejects_unprovisioned_identity(self, settings, monkeypatch):
        configure_oidc(settings)
        Instance.objects.create(
            instance_name="Test",
            instance_id="instance-1",
            current_version="2.0.1",
            is_setup_done=True,
        )
        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.get_oidc_discovery",
            lambda issuer: DISCOVERY,
        )
        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.verify_id_token",
            lambda *args, **kwargs: {"sub": "unknown", "email": "nobody@example.com"},
        )
        monkeypatch.setattr(
            "plane.authentication.provider.oauth.oidc.OIDCOauthProvider.get_user_token",
            lambda self, data, headers=None: {"id_token": "fake", "access_token": "token"},
        )

        client = Client()
        initiate = client.get("/auth/oidc/")
        state = parse_qs(urlparse(initiate["Location"]).query)["state"][0]
        response = client.get(f"/auth/oidc/callback/?code=abc&state={state}")
        assert response.status_code == 302
        assert "error_code=" in response["Location"]
