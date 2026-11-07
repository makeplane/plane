# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the bridge-only account sign-in endpoints.

POST    /api/internal/agent-connections/authorize/
PUT     /api/internal/agent-connections/
DELETE  /api/internal/agent-connections/
"""

import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import AgentProviderCredential, User, WorkspaceMember

AUTHORIZE_URL = "/api/internal/agent-connections/authorize/"
CONNECTIONS_URL = "/api/internal/agent-connections/"
BRIDGE_SECRET = "test-bridge-secret-0123456789abcdef"


@pytest.fixture(autouse=True)
def _bridge_settings(settings):
    settings.AGENT_BRIDGE_SECRET = BRIDGE_SECRET


@pytest.fixture
def bridge_client():
    client = APIClient()
    client.credentials(HTTP_X_AGENT_BRIDGE_SECRET=BRIDGE_SECRET)
    return client


def _who(user, workspace, **extra):
    return {"user_id": str(user.id), "workspace_slug": workspace.slug, **extra}


def _connect(user, workspace, provider="openai", method="chatgpt", account_label="me@example.com"):
    return _who(user, workspace, provider=provider, method=method, account_label=account_label)


@pytest.mark.contract
class TestAgentConnectionsSecret:
    @pytest.mark.django_db
    @pytest.mark.parametrize("secret", [None, BRIDGE_SECRET + "x"])
    def test_requires_bridge_secret(self, create_user, workspace, secret):
        client = APIClient()
        if secret:
            client.credentials(HTTP_X_AGENT_BRIDGE_SECRET=secret)
        responses = [
            client.post(AUTHORIZE_URL, _who(create_user, workspace), format="json"),
            client.put(CONNECTIONS_URL, _connect(create_user, workspace), format="json"),
            client.delete(CONNECTIONS_URL, _who(create_user, workspace, provider="openai"), format="json"),
        ]
        for response in responses:
            assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert not AgentProviderCredential.objects.exists()

    @pytest.mark.django_db
    def test_user_session_is_not_enough(self, session_client, create_user, workspace):
        response = session_client.put(CONNECTIONS_URL, _connect(create_user, workspace), format="json")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert not AgentProviderCredential.objects.exists()


@pytest.mark.contract
class TestAgentConnectionAuthorize:
    @pytest.mark.django_db
    def test_active_member_is_authorized(self, bridge_client, create_user, workspace):
        response = bridge_client.post(AUTHORIZE_URL, _who(create_user, workspace), format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {
            "user": {"id": str(create_user.id)},
            "workspace": {"id": str(workspace.id), "slug": workspace.slug},
        }

    @pytest.mark.django_db
    def test_guest_is_authorized(self, bridge_client, workspace):
        guest = User.objects.create(email="conn-guest@plane.so", username="conn-guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
        assert bridge_client.post(AUTHORIZE_URL, _who(guest, workspace), format="json").status_code == 200

    @pytest.mark.django_db
    def test_inactive_bot_or_non_member_is_rejected(self, bridge_client, create_user, workspace, create_bot_user):
        outsider = User.objects.create(email="conn-outsider@plane.so", username="conn-outsider")
        WorkspaceMember.objects.create(workspace=workspace, member=create_bot_user, role=15)
        cases = [outsider, create_bot_user]
        for user in cases:
            response = bridge_client.post(AUTHORIZE_URL, _who(user, workspace), format="json")
            assert response.status_code == status.HTTP_403_FORBIDDEN, user.email

        WorkspaceMember.objects.filter(workspace=workspace, member=create_user).update(is_active=False)
        assert bridge_client.post(AUTHORIZE_URL, _who(create_user, workspace), format="json").status_code == 403

        WorkspaceMember.objects.filter(workspace=workspace, member=create_user).update(is_active=True)
        create_user.is_active = False
        create_user.save()
        assert bridge_client.post(AUTHORIZE_URL, _who(create_user, workspace), format="json").status_code == 403

    @pytest.mark.django_db
    def test_unknown_user_or_workspace_is_rejected(self, bridge_client, create_user, workspace):
        unknown_user = {"user_id": str(uuid.uuid4()), "workspace_slug": workspace.slug}
        unknown_ws = {"user_id": str(create_user.id), "workspace_slug": "no-such-workspace"}
        assert bridge_client.post(AUTHORIZE_URL, unknown_user, format="json").status_code == 403
        assert bridge_client.post(AUTHORIZE_URL, unknown_ws, format="json").status_code == 403

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "body",
        [{}, {"user_id": "not-a-uuid", "workspace_slug": "test-workspace"}, {"user_id": str(uuid.uuid4())}],
    )
    def test_malformed_body_is_rejected(self, bridge_client, workspace, body):
        assert bridge_client.post(AUTHORIZE_URL, body, format="json").status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestAgentConnectionUpsert:
    @pytest.mark.django_db
    @pytest.mark.parametrize("provider,method", [("openai", "chatgpt"), ("google", "google_account")])
    def test_put_records_account_sign_in(self, bridge_client, create_user, workspace, provider, method):
        response = bridge_client.put(
            CONNECTIONS_URL, _connect(create_user, workspace, provider, method, "me@example.com"), format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["provider"] == provider
        assert body["method"] == method
        assert body["account_label"] == "me@example.com"
        assert body["updated_at"]
        row = AgentProviderCredential.objects.get(workspace=workspace, user=create_user, provider=provider)
        assert (row.method, row.secret, row.secret_hint, row.account_label) == (method, "", "", "me@example.com")

    @pytest.mark.django_db
    def test_put_replaces_personal_api_key_and_is_idempotent(self, bridge_client, create_user, workspace):
        key_row = AgentProviderCredential(workspace=workspace, user=create_user, provider="openai")
        key_row.set_api_key("sk-personal-0123456789")
        key_row.save()

        bridge_client.put(
            CONNECTIONS_URL, _connect(create_user, workspace, account_label="a@example.com"), format="json"
        )
        bridge_client.put(
            CONNECTIONS_URL, _connect(create_user, workspace, account_label="b@example.com"), format="json"
        )

        rows = AgentProviderCredential.objects.filter(workspace=workspace, user=create_user, provider="openai")
        assert rows.count() == 1
        row = rows.get()
        assert (row.method, row.secret, row.secret_hint, row.account_label) == ("chatgpt", "", "", "b@example.com")

    @pytest.mark.django_db
    def test_put_leaves_workspace_key_alone(self, bridge_client, create_user, workspace):
        shared = AgentProviderCredential(workspace=workspace, user=None, provider="openai")
        shared.set_api_key("sk-shared-0123456789")
        shared.save()

        bridge_client.put(CONNECTIONS_URL, _connect(create_user, workspace), format="json")

        shared.refresh_from_db()
        assert shared.method == "api_key"
        assert shared.get_secret() == "sk-shared-0123456789"

    @pytest.mark.django_db
    def test_missing_account_label_is_empty(self, bridge_client, create_user, workspace):
        body = _who(create_user, workspace, provider="google", method="google_account")
        assert bridge_client.put(CONNECTIONS_URL, body, format="json").status_code == status.HTTP_200_OK
        assert AgentProviderCredential.objects.get(user=create_user).account_label == ""

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "provider,method,label",
        [
            ("anthropic", "api_key", ""),
            ("anthropic", "chatgpt", ""),
            ("openai", "api_key", ""),
            ("openai", "google_account", ""),
            ("google", "chatgpt", ""),
            ("deepseek", "chatgpt", ""),
            (["openai"], "chatgpt", ""),
            ("openai", None, ""),
            ("openai", "chatgpt", 42),
            ("openai", "chatgpt", "x" * 256),
        ],
    )
    def test_put_rejects_invalid_input(self, bridge_client, create_user, workspace, provider, method, label):
        body = _connect(create_user, workspace, provider, method, label)
        assert bridge_client.put(CONNECTIONS_URL, body, format="json").status_code == status.HTTP_400_BAD_REQUEST
        assert not AgentProviderCredential.objects.exists()

    @pytest.mark.django_db
    def test_put_rejects_non_member(self, bridge_client, workspace):
        outsider = User.objects.create(email="conn-outsider2@plane.so", username="conn-outsider2")
        assert bridge_client.put(CONNECTIONS_URL, _connect(outsider, workspace), format="json").status_code == 403
        assert not AgentProviderCredential.objects.exists()


@pytest.mark.contract
class TestAgentConnectionDelete:
    @pytest.mark.django_db
    def test_delete_removes_account_sign_in(self, bridge_client, create_user, workspace):
        bridge_client.put(CONNECTIONS_URL, _connect(create_user, workspace), format="json")

        response = bridge_client.delete(CONNECTIONS_URL, _who(create_user, workspace, provider="openai"), format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not AgentProviderCredential.all_objects.filter(user=create_user).exists()

    @pytest.mark.django_db
    def test_delete_keeps_personal_api_key(self, bridge_client, create_user, workspace):
        row = AgentProviderCredential(workspace=workspace, user=create_user, provider="google")
        row.set_api_key("sk-personal-0123456789")
        row.save()

        response = bridge_client.delete(CONNECTIONS_URL, _who(create_user, workspace, provider="google"), format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert AgentProviderCredential.objects.filter(pk=row.pk).exists()

    @pytest.mark.django_db
    def test_delete_without_row_is_204(self, bridge_client, create_user, workspace):
        response = bridge_client.delete(CONNECTIONS_URL, _who(create_user, workspace, provider="openai"), format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.django_db
    @pytest.mark.parametrize("provider", ["anthropic", "deepseek", None])
    def test_delete_rejects_provider_without_sign_in(self, bridge_client, create_user, workspace, provider):
        response = bridge_client.delete(CONNECTIONS_URL, _who(create_user, workspace, provider=provider), format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
