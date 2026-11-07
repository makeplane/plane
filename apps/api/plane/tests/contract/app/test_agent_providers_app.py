# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the workspace AI-provider credential endpoints.

GET          /api/workspaces/<slug>/agent-providers/
PUT|DELETE   /api/workspaces/<slug>/agent-providers/<provider>/personal/
PUT|DELETE   /api/workspaces/<slug>/agent-providers/<provider>/workspace/
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import AgentProviderCredential, User, Workspace, WorkspaceMember
from plane.license.models import AgentDefinition

KEY = "sk-personal-0123456789wxyz"
SHARED_KEY = "sk-shared-0123456789abcd"
ENTRY_FIELDS = {"provider", "personal", "workspace", "instance_configured", "can_manage_workspace"}


def _list_url(slug):
    return f"/api/workspaces/{slug}/agent-providers/"


def _url(slug, provider, scope):
    return f"/api/workspaces/{slug}/agent-providers/{provider}/{scope}/"


def _client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def member(workspace):
    user = User.objects.create(email="provider-member@plane.so", username="provider-member")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    return user


@pytest.fixture
def member_client(member):
    return _client_for(member)


def _entry(response, provider):
    return next(item for item in response.json() if item["provider"] == provider)


@pytest.mark.contract
class TestListAgentProviders:
    @pytest.mark.django_db
    def test_empty_state_lists_all_providers_in_order(self, session_client, workspace):
        response = session_client.get(_list_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert [item["provider"] for item in body] == ["anthropic", "openai", "google"]
        for item in body:
            assert set(item) == ENTRY_FIELDS
            assert item["personal"] is None
            assert item["workspace"] is None
            assert item["instance_configured"] is False
            assert item["can_manage_workspace"] is True  # the fixture user is the workspace admin

    @pytest.mark.django_db
    def test_shows_metadata_but_never_secrets(self, session_client, member_client, create_user, member, workspace):
        assert (
            session_client.put(
                _url(workspace.slug, "anthropic", "workspace"), {"api_key": SHARED_KEY}, format="json"
            ).status_code
            == 200
        )
        assert (
            member_client.put(
                _url(workspace.slug, "anthropic", "personal"), {"api_key": KEY}, format="json"
            ).status_code
            == 200
        )
        AgentProviderCredential.objects.create(
            workspace=workspace, user=member, provider="google", method="google_account", account_label="m@gmail.com"
        )

        response = member_client.get(_list_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert KEY.encode() not in response.content
        assert SHARED_KEY.encode() not in response.content
        assert b'secret"' not in response.content
        anthropic = _entry(response, "anthropic")
        assert set(anthropic["personal"]) == {"method", "secret_hint", "account_label", "updated_at"}
        assert anthropic["personal"]["method"] == "api_key"
        assert anthropic["personal"]["secret_hint"] == "wxyz"
        assert anthropic["personal"]["account_label"] == ""
        assert anthropic["personal"]["updated_at"]
        assert set(anthropic["workspace"]) == {"method", "secret_hint", "updated_at"}
        assert anthropic["workspace"]["method"] == "api_key"
        assert anthropic["workspace"]["secret_hint"] == "abcd"
        assert anthropic["can_manage_workspace"] is False
        google = _entry(response, "google")
        assert google["personal"]["method"] == "google_account"
        assert google["personal"]["account_label"] == "m@gmail.com"
        assert google["personal"]["secret_hint"] == ""
        assert google["workspace"] is None

    @pytest.mark.django_db
    def test_other_members_personal_credentials_are_not_shown(self, session_client, member_client, workspace):
        assert (
            member_client.put(_url(workspace.slug, "openai", "personal"), {"api_key": KEY}, format="json").status_code
            == 200
        )

        response = session_client.get(_list_url(workspace.slug))

        assert _entry(response, "openai")["personal"] is None

    @pytest.mark.django_db
    def test_other_workspace_credentials_are_not_shown(self, session_client, create_user, workspace):
        other = Workspace.objects.create(name="Other", slug="other-providers-ws", owner=create_user)
        WorkspaceMember.objects.create(workspace=other, member=create_user, role=20)
        assert (
            session_client.put(_url(other.slug, "openai", "personal"), {"api_key": KEY}, format="json").status_code
            == 200
        )
        assert (
            session_client.put(_url(other.slug, "openai", "workspace"), {"api_key": KEY}, format="json").status_code
            == 200
        )

        entry = _entry(session_client.get(_list_url(workspace.slug)), "openai")

        assert entry["personal"] is None
        assert entry["workspace"] is None

    @pytest.mark.django_db
    def test_instance_configured_from_enabled_agents(self, session_client, workspace):
        agent = AgentDefinition(name="Codex", slug="codex", adapter="codex")
        agent.set_env({"OPENAI_API_KEY": "sk-admin-secret"})
        agent.save()

        response = session_client.get(_list_url(workspace.slug))

        assert {item["provider"]: item["instance_configured"] for item in response.json()} == {
            "anthropic": False,
            "openai": True,
            "google": False,
        }
        assert b"sk-admin-secret" not in response.content

    @pytest.mark.django_db
    def test_guest_can_list(self, api_client, workspace):
        guest = User.objects.create(email="provider-guest@plane.so", username="provider-guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
        api_client.force_authenticate(user=guest)
        assert api_client.get(_list_url(workspace.slug)).status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_non_member_and_inactive_member_are_rejected(self, api_client, workspace, member):
        outsider = User.objects.create(email="provider-outsider@plane.so", username="provider-outsider")
        assert _client_for(outsider).get(_list_url(workspace.slug)).status_code == status.HTTP_403_FORBIDDEN

        WorkspaceMember.objects.filter(workspace=workspace, member=member).update(is_active=False)
        assert _client_for(member).get(_list_url(workspace.slug)).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_anonymous_is_rejected(self, workspace):
        response = APIClient().get(_list_url(workspace.slug))
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
class TestPersonalCredential:
    @pytest.mark.django_db
    def test_put_stores_encrypted_key_and_returns_entry(self, member_client, member, workspace):
        response = member_client.put(_url(workspace.slug, "anthropic", "personal"), {"api_key": KEY}, format="json")

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert set(body) == ENTRY_FIELDS
        assert body["provider"] == "anthropic"
        assert body["personal"]["method"] == "api_key"
        assert body["personal"]["secret_hint"] == "wxyz"
        assert KEY.encode() not in response.content
        row = AgentProviderCredential.objects.get(workspace=workspace, user=member, provider="anthropic")
        assert KEY not in row.secret
        assert row.get_secret() == KEY

    @pytest.mark.django_db
    def test_put_replaces_existing_key(self, member_client, member, workspace):
        url = _url(workspace.slug, "openai", "personal")
        member_client.put(url, {"api_key": KEY}, format="json")
        member_client.put(url, {"api_key": "sk-replaced-key-9876"}, format="json")

        rows = AgentProviderCredential.objects.filter(workspace=workspace, user=member, provider="openai")
        assert rows.count() == 1
        assert rows.get().get_secret() == "sk-replaced-key-9876"

    @pytest.mark.django_db
    def test_put_replaces_account_sign_in(self, member_client, member, workspace):
        AgentProviderCredential.objects.create(
            workspace=workspace, user=member, provider="openai", method="chatgpt", account_label="me@example.com"
        )

        response = member_client.put(_url(workspace.slug, "openai", "personal"), {"api_key": KEY}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["personal"] == {
            "method": "api_key",
            "secret_hint": "wxyz",
            "account_label": "",
            "updated_at": response.json()["personal"]["updated_at"],
        }
        row = AgentProviderCredential.objects.get(workspace=workspace, user=member, provider="openai")
        assert row.method == "api_key"

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "body",
        [
            {},
            {"api_key": None},
            {"api_key": 12345678},
            {"api_key": "short"},
            {"api_key": "x" * 513},
            {"api_key": "sk-with space"},
        ],
    )
    def test_put_rejects_invalid_key(self, member_client, workspace, body):
        response = member_client.put(_url(workspace.slug, "anthropic", "personal"), body, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not AgentProviderCredential.objects.exists()

    @pytest.mark.django_db
    def test_unknown_provider_is_404(self, member_client, workspace):
        assert (
            member_client.put(_url(workspace.slug, "deepseek", "personal"), {"api_key": KEY}, format="json").status_code
            == 404
        )
        assert member_client.delete(_url(workspace.slug, "deepseek", "personal")).status_code == 404

    @pytest.mark.django_db
    def test_guest_can_set_personal_key(self, workspace):
        guest = User.objects.create(email="provider-guest2@plane.so", username="provider-guest2")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
        response = _client_for(guest).put(_url(workspace.slug, "google", "personal"), {"api_key": KEY}, format="json")
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_non_member_cannot_set(self, workspace):
        outsider = User.objects.create(email="provider-outsider2@plane.so", username="provider-outsider2")
        response = _client_for(outsider).put(
            _url(workspace.slug, "google", "personal"), {"api_key": KEY}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not AgentProviderCredential.objects.exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize("method,provider", [("api_key", "anthropic"), ("chatgpt", "openai")])
    def test_delete_removes_own_row_of_any_method(self, member_client, member, workspace, method, provider):
        AgentProviderCredential.objects.create(workspace=workspace, user=member, provider=provider, method=method)

        response = member_client.delete(_url(workspace.slug, provider, "personal"))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not AgentProviderCredential.all_objects.filter(user=member).exists()  # hard-deleted

    @pytest.mark.django_db
    def test_delete_leaves_others_alone(self, member_client, session_client, create_user, member, workspace):
        session_client.put(_url(workspace.slug, "anthropic", "personal"), {"api_key": KEY}, format="json")
        session_client.put(_url(workspace.slug, "anthropic", "workspace"), {"api_key": SHARED_KEY}, format="json")
        member_client.put(_url(workspace.slug, "openai", "personal"), {"api_key": KEY}, format="json")

        assert member_client.delete(_url(workspace.slug, "anthropic", "personal")).status_code == 204

        assert AgentProviderCredential.objects.filter(user=create_user, provider="anthropic").exists()
        assert AgentProviderCredential.objects.filter(user__isnull=True, provider="anthropic").exists()
        assert AgentProviderCredential.objects.filter(user=member, provider="openai").exists()

    @pytest.mark.django_db
    def test_delete_without_row_is_204(self, member_client, workspace):
        assert member_client.delete(_url(workspace.slug, "google", "personal")).status_code == 204


@pytest.mark.contract
class TestWorkspaceCredential:
    @pytest.mark.django_db
    def test_admin_can_set_replace_and_remove(self, session_client, workspace):
        url = _url(workspace.slug, "google", "workspace")

        response = session_client.put(url, {"api_key": SHARED_KEY}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["workspace"]["secret_hint"] == "abcd"
        assert response.json()["workspace"]["method"] == "api_key"
        assert response.json()["personal"] is None
        assert SHARED_KEY.encode() not in response.content

        session_client.put(url, {"api_key": "sk-shared-replaced-5678"}, format="json")
        row = AgentProviderCredential.objects.get(workspace=workspace, user__isnull=True, provider="google")
        assert row.get_secret() == "sk-shared-replaced-5678"

        assert session_client.delete(url).status_code == status.HTTP_204_NO_CONTENT
        assert not AgentProviderCredential.all_objects.filter(workspace=workspace).exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize("role", [15, 5])
    def test_non_admin_cannot_manage(self, workspace, role):
        user = User.objects.create(email=f"provider-r{role}@plane.so", username=f"provider-r{role}")
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
        shared = AgentProviderCredential(workspace=workspace, user=None, provider="anthropic")
        shared.set_api_key(SHARED_KEY)
        shared.save()
        client = _client_for(user)
        url = _url(workspace.slug, "anthropic", "workspace")

        assert client.put(url, {"api_key": KEY}, format="json").status_code == status.HTTP_403_FORBIDDEN
        assert client.delete(url).status_code == status.HTTP_403_FORBIDDEN
        shared.refresh_from_db()
        assert shared.get_secret() == SHARED_KEY

    @pytest.mark.django_db
    def test_admin_of_another_workspace_cannot_manage(self, workspace):
        user = User.objects.create(email="provider-otheradmin@plane.so", username="provider-otheradmin")
        other = Workspace.objects.create(name="Mine", slug="provider-mine", owner=user)
        WorkspaceMember.objects.create(workspace=other, member=user, role=20)
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)

        response = _client_for(user).put(
            _url(workspace.slug, "anthropic", "workspace"), {"api_key": KEY}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_invalid_key_is_rejected(self, session_client, workspace):
        response = session_client.put(
            _url(workspace.slug, "openai", "workspace"), {"api_key": "a b c d e f g h"}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
