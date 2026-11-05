# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the bridge-only agent session endpoints and the
workspace scoping of the tokens they mint.

POST   /api/internal/agent-sessions/
DELETE /api/internal/agent-sessions/<uuid:token_id>/
"""

import uuid
from datetime import timedelta

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, User, Workspace, WorkspaceMember
from plane.db.models.api import AGENT_SESSION_TOKEN_LABEL
from plane.license.models import AgentDefinition

SESSIONS_URL = "/api/internal/agent-sessions/"
BRIDGE_SECRET = "test-bridge-secret-0123456789abcdef"
MCP_URL = "http://mcp:8000/mcp"


def _session_url(token_id):
    return f"{SESSIONS_URL}{token_id}/"


@pytest.fixture(autouse=True)
def _bridge_settings(settings):
    settings.AGENT_BRIDGE_SECRET = BRIDGE_SECRET
    settings.PLANE_MCP_URL = MCP_URL
    settings.AGENT_SESSION_TOKEN_TTL_MINUTES = 120


@pytest.fixture(autouse=True)
def _reset_api_key_throttle_cache():
    cache.delete_pattern("api_key:*")
    yield
    cache.delete_pattern("api_key:*")


@pytest.fixture
def bridge_client():
    client = APIClient()
    client.credentials(HTTP_X_AGENT_BRIDGE_SECRET=BRIDGE_SECRET)
    return client


@pytest.fixture
def agent(db):
    agent = AgentDefinition(
        name="Claude",
        slug="claude",
        adapter="claude",
        default_permission_level="ask_writes",
        max_permission_level="yolo",
    )
    agent.set_env({"ANTHROPIC_API_KEY": "sk-ant-secret", "MODEL": "claude-opus-5-5"})
    agent.save()
    return agent


@pytest.fixture
def other_workspace(create_user):
    """A second workspace the same user is also an active member of."""
    owner = User.objects.create(email="other-ws-owner@plane.so", username="other-ws-owner")
    other = Workspace.objects.create(name="Other Workspace", slug="other-workspace", owner=owner)
    WorkspaceMember.objects.create(workspace=other, member=owner, role=20)
    WorkspaceMember.objects.create(workspace=other, member=create_user, role=15)
    return other


def _body(user, workspace, agent):
    return {"user_id": str(user.id), "workspace_slug": workspace.slug, "agent_id": str(agent.id)}


def _mint(bridge_client, user, workspace, agent):
    response = bridge_client.post(SESSIONS_URL, _body(user, workspace, agent), format="json")
    assert response.status_code == status.HTTP_201_CREATED, response.data
    return response.json()


def _assert_token_invalid(response):
    # DRF reports APIKeyAuthentication's AuthenticationFailed as 403 (no
    # WWW-Authenticate header); the detail tells it apart from a scope denial.
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
    assert response.json()["detail"] == "Given API token is not valid"


def _token_client(token):
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token)
    return client


@pytest.mark.contract
class TestAgentBridgeSecret:
    @pytest.mark.django_db
    def test_missing_secret_is_rejected(self, create_user, workspace, agent):
        response = APIClient().post(SESSIONS_URL, _body(create_user, workspace, agent), format="json")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert not APIToken.objects.filter(label=AGENT_SESSION_TOKEN_LABEL).exists()

    @pytest.mark.django_db
    def test_wrong_secret_is_rejected(self, create_user, workspace, agent):
        client = APIClient()
        client.credentials(HTTP_X_AGENT_BRIDGE_SECRET=BRIDGE_SECRET + "x")
        response = client.post(SESSIONS_URL, _body(create_user, workspace, agent), format="json")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert not APIToken.objects.filter(label=AGENT_SESSION_TOKEN_LABEL).exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize("sent", ["", BRIDGE_SECRET])
    def test_unset_secret_rejects_everything(self, settings, create_user, workspace, agent, sent):
        settings.AGENT_BRIDGE_SECRET = ""
        client = APIClient()
        client.credentials(HTTP_X_AGENT_BRIDGE_SECRET=sent)
        response = client.post(SESSIONS_URL, _body(create_user, workspace, agent), format="json")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    @pytest.mark.django_db
    def test_user_session_is_not_enough(self, session_client, create_user, workspace, agent):
        response = session_client.post(SESSIONS_URL, _body(create_user, workspace, agent), format="json")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    @pytest.mark.django_db
    def test_delete_requires_secret(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        response = APIClient().delete(_session_url(minted["token_id"]))
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert APIToken.objects.get(pk=minted["token_id"]).is_active is True


@pytest.mark.contract
class TestAgentSessionMint:
    @pytest.mark.django_db
    def test_mint_returns_session_contract(self, bridge_client, create_user, workspace, agent):
        before = timezone.now()
        body = _mint(bridge_client, create_user, workspace, agent)

        token = APIToken.objects.get(pk=body["token_id"])
        assert body["token"] == token.token
        assert token.user_id == create_user.id
        assert token.workspace_id == workspace.id
        assert token.label == AGENT_SESSION_TOKEN_LABEL
        assert token.user_type == 0
        assert token.is_active is True
        assert before + timedelta(minutes=119) < token.expired_at <= timezone.now() + timedelta(minutes=120)
        assert body["expires_at"] == token.expired_at.isoformat()

        assert body["workspace"] == {"id": str(workspace.id), "slug": workspace.slug}
        assert body["user"] == {"id": str(create_user.id)}
        assert body["agent"] == {
            "id": str(agent.id),
            "adapter": "claude",
            "env": {"ANTHROPIC_API_KEY": "sk-ant-secret", "MODEL": "claude-opus-5-5"},
            "default_permission_level": "ask_writes",
            "max_permission_level": "yolo",
            "attach_plane_mcp": True,
        }
        assert body["mcp"] == {"url": MCP_URL, "workspace_slug": workspace.slug}

    @pytest.mark.django_db
    def test_ttl_comes_from_settings(self, settings, bridge_client, create_user, workspace, agent):
        settings.AGENT_SESSION_TOKEN_TTL_MINUTES = 5
        body = _mint(bridge_client, create_user, workspace, agent)
        token = APIToken.objects.get(pk=body["token_id"])
        assert token.expired_at <= timezone.now() + timedelta(minutes=5)

    @pytest.mark.django_db
    def test_non_member_is_rejected(self, bridge_client, workspace, agent):
        outsider = User.objects.create(email="outsider@plane.so", username="outsider")
        response = bridge_client.post(SESSIONS_URL, _body(outsider, workspace, agent), format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not APIToken.objects.filter(label=AGENT_SESSION_TOKEN_LABEL).exists()

    @pytest.mark.django_db
    def test_inactive_membership_is_rejected(self, bridge_client, create_user, workspace, agent):
        WorkspaceMember.objects.filter(workspace=workspace, member=create_user).update(is_active=False)
        response = bridge_client.post(SESSIONS_URL, _body(create_user, workspace, agent), format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_inactive_user_is_rejected(self, bridge_client, create_user, workspace, agent):
        create_user.is_active = False
        create_user.save()
        response = bridge_client.post(SESSIONS_URL, _body(create_user, workspace, agent), format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not APIToken.objects.filter(label=AGENT_SESSION_TOKEN_LABEL).exists()

    @pytest.mark.django_db
    def test_unknown_user_or_workspace_is_rejected(self, bridge_client, create_user, workspace, agent):
        unknown_user = bridge_client.post(
            SESSIONS_URL,
            {"user_id": str(uuid.uuid4()), "workspace_slug": workspace.slug, "agent_id": str(agent.id)},
            format="json",
        )
        unknown_workspace = bridge_client.post(
            SESSIONS_URL,
            {"user_id": str(create_user.id), "workspace_slug": "no-such-workspace", "agent_id": str(agent.id)},
            format="json",
        )
        assert unknown_user.status_code == status.HTTP_403_FORBIDDEN
        assert unknown_workspace.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_disabled_agent_is_rejected(self, bridge_client, create_user, workspace, agent):
        agent.is_enabled = False
        agent.save()
        response = bridge_client.post(SESSIONS_URL, _body(create_user, workspace, agent), format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not APIToken.objects.filter(label=AGENT_SESSION_TOKEN_LABEL).exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "body",
        [
            {},
            {"user_id": "not-a-uuid", "workspace_slug": "test-workspace", "agent_id": str(uuid.uuid4())},
            {"user_id": str(uuid.uuid4()), "workspace_slug": "", "agent_id": str(uuid.uuid4())},
            {"user_id": str(uuid.uuid4()), "workspace_slug": "test-workspace"},
        ],
    )
    def test_malformed_body_is_rejected(self, bridge_client, workspace, body):
        response = bridge_client.post(SESSIONS_URL, body, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_undecryptable_env_does_not_mint(self, settings, bridge_client, create_user, workspace, agent):
        settings.SECRET_KEY = "a-different-secret-key-than-the-one-used-to-encrypt"
        response = bridge_client.post(SESSIONS_URL, _body(create_user, workspace, agent), format="json")
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "sk-ant-secret" not in str(response.content)
        assert not APIToken.objects.filter(label=AGENT_SESSION_TOKEN_LABEL).exists()


@pytest.mark.contract
class TestAgentSessionRevoke:
    @pytest.mark.django_db
    def test_delete_revokes_token(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        client = _token_client(minted["token"])
        assert client.get(f"/api/v1/workspaces/{workspace.slug}/members-lite/").status_code == status.HTTP_200_OK

        response = bridge_client.delete(_session_url(minted["token_id"]))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert APIToken.objects.get(pk=minted["token_id"]).is_active is False
        _assert_token_invalid(client.get(f"/api/v1/workspaces/{workspace.slug}/members-lite/"))

    @pytest.mark.django_db
    def test_delete_is_idempotent(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        assert bridge_client.delete(_session_url(minted["token_id"])).status_code == status.HTTP_204_NO_CONTENT
        assert bridge_client.delete(_session_url(minted["token_id"])).status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.django_db
    def test_cannot_revoke_personal_tokens(self, bridge_client, api_token):
        response = bridge_client.delete(_session_url(api_token.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND
        api_token.refresh_from_db()
        assert api_token.is_active is True

    @pytest.mark.django_db
    def test_unknown_token_returns_404(self, bridge_client):
        assert bridge_client.delete(_session_url(uuid.uuid4())).status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestAgentSessionTokenScope:
    @pytest.mark.django_db
    def test_token_works_for_its_workspace(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        client = _token_client(minted["token"])

        response = client.get(f"/api/v1/workspaces/{workspace.slug}/members-lite/")

        assert response.status_code == status.HTTP_200_OK
        token = APIToken.objects.get(pk=minted["token_id"])
        assert token.last_used is not None

    @pytest.mark.django_db
    def test_token_rejected_for_another_workspace_of_the_same_user(
        self, bridge_client, create_user, workspace, other_workspace, agent
    ):
        minted = _mint(bridge_client, create_user, workspace, agent)
        client = _token_client(minted["token"])

        for path in ("members-lite/", "projects/"):
            response = client.get(f"/api/v1/workspaces/{other_workspace.slug}/{path}")
            assert response.status_code == status.HTTP_403_FORBIDDEN, path
            assert response.json()["detail"] == "This API token is scoped to a different workspace.", path

    @pytest.mark.django_db
    def test_token_can_read_users_me(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        response = _token_client(minted["token"]).get("/api/v1/users/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == str(create_user.id)

    @pytest.mark.django_db
    def test_token_rejected_on_non_slug_endpoints_without_opt_in(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        response = _token_client(minted["token"]).post(
            "/api/v1/assets/user-assets/", {"name": "a.png", "type": "image/png", "size": 1}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "cannot access this endpoint" in response.json()["detail"]

    @pytest.mark.django_db
    def test_token_rejected_on_session_app_endpoints(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        response = _token_client(minted["token"]).get(f"/api/workspaces/{workspace.slug}/agents/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_expired_token_is_rejected(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        APIToken.objects.filter(pk=minted["token_id"]).update(expired_at=timezone.now() - timedelta(seconds=1))

        response = _token_client(minted["token"]).get(f"/api/v1/workspaces/{workspace.slug}/members-lite/")

        _assert_token_invalid(response)

    @pytest.mark.django_db
    def test_token_of_soft_deleted_workspace_is_rejected(self, bridge_client, create_user, workspace, agent):
        minted = _mint(bridge_client, create_user, workspace, agent)
        Workspace.all_objects.filter(pk=workspace.id).update(deleted_at=timezone.now())

        response = _token_client(minted["token"]).get("/api/v1/users/me/")

        _assert_token_invalid(response)

    @pytest.mark.django_db
    def test_unscoped_token_still_reaches_every_workspace(self, api_key_client, workspace, other_workspace):
        """Existing personal tokens (workspace=NULL) keep working exactly as before."""
        assert api_key_client.get(f"/api/v1/workspaces/{workspace.slug}/members-lite/").status_code == 200
        assert api_key_client.get(f"/api/v1/workspaces/{other_workspace.slug}/members-lite/").status_code == 200
        assert api_key_client.get("/api/v1/users/me/").status_code == 200
