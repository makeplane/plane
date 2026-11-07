# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the instance-admin agent registry.

GET/POST /api/instances/agents/
GET/PATCH/DELETE /api/instances/agents/<uuid:pk>/

``env`` holds API keys: it is encrypted at rest, write-only, and returned masked.
On PATCH, ``env`` is the complete desired key set; a masked value keeps the
stored secret and a key left out is removed.
"""

import uuid

import pytest
from django.utils import timezone
from rest_framework import status

from plane.license.api.serializers import AGENT_ENV_MASK
from plane.license.models import AgentDefinition, Instance, InstanceAdmin

AGENTS_URL = "/api/instances/agents/"


def _agent_url(pk):
    return f"{AGENTS_URL}{pk}/"


@pytest.fixture
def instance(db):
    instance = Instance.objects.first()
    if instance is None:
        instance = Instance.objects.create(
            instance_name="Test Instance",
            instance_id=str(uuid.uuid4()),
            current_version="1.0.0",
            domain="http://localhost:8000",
            last_checked_at=timezone.now(),
            is_setup_done=True,
        )
    return instance


@pytest.fixture
def admin_client(session_client, create_user, instance):
    InstanceAdmin.objects.create(instance=instance, user=create_user, role=20)
    return session_client


def _make_agent(**overrides):
    env = overrides.pop("env", {"ANTHROPIC_API_KEY": "sk-ant-secret", "MODEL": "claude-opus-5-5"})
    fields = {"name": "Claude", "slug": "claude", "adapter": "claude"}
    fields.update(overrides)
    agent = AgentDefinition(**fields)
    agent.set_env(env)
    agent.save()
    return agent


def _payload(**overrides):
    payload = {
        "name": "Claude",
        "slug": "claude",
        "description": "Claude Agent SDK",
        "adapter": "claude",
        "env": {"ANTHROPIC_API_KEY": "sk-ant-secret"},
        "default_permission_level": "ask_writes",
        "max_permission_level": "yolo",
    }
    payload.update(overrides)
    return payload


@pytest.mark.contract
class TestAgentAdminPermissions:
    @pytest.mark.django_db
    def test_non_admin_cannot_list(self, session_client, instance):
        _make_agent()
        assert session_client.get(AGENTS_URL).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_non_admin_cannot_create(self, session_client, instance):
        response = session_client.post(AGENTS_URL, _payload(), format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not AgentDefinition.objects.exists()

    @pytest.mark.django_db
    def test_non_admin_cannot_read_update_or_delete(self, session_client, instance):
        agent = _make_agent()
        assert session_client.get(_agent_url(agent.id)).status_code == status.HTTP_403_FORBIDDEN
        assert (
            session_client.patch(_agent_url(agent.id), {"name": "x"}, format="json").status_code
            == status.HTTP_403_FORBIDDEN
        )
        assert session_client.delete(_agent_url(agent.id)).status_code == status.HTTP_403_FORBIDDEN
        agent.refresh_from_db()
        assert agent.name == "Claude"

    @pytest.mark.django_db
    def test_anonymous_is_rejected(self, api_client, instance):
        assert api_client.get(AGENTS_URL).status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )


@pytest.mark.contract
class TestAgentAdminCrud:
    @pytest.mark.django_db
    def test_create_encrypts_env_and_masks_response(self, admin_client):
        response = admin_client.post(AGENTS_URL, _payload(), format="json")

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["env"] == {"ANTHROPIC_API_KEY": AGENT_ENV_MASK}
        assert "sk-ant-secret" not in str(response.data)

        agent = AgentDefinition.objects.get(pk=response.data["id"])
        assert "sk-ant-secret" not in agent.env  # stored encrypted
        assert agent.get_env() == {"ANTHROPIC_API_KEY": "sk-ant-secret"}
        assert agent.attach_plane_mcp is True
        assert agent.is_enabled is True

    @pytest.mark.django_db
    def test_list_and_retrieve_mask_secrets(self, admin_client):
        agent = _make_agent()

        listed = admin_client.get(AGENTS_URL)
        retrieved = admin_client.get(_agent_url(agent.id))

        assert listed.status_code == status.HTTP_200_OK
        assert retrieved.status_code == status.HTTP_200_OK
        expected = {"ANTHROPIC_API_KEY": AGENT_ENV_MASK, "MODEL": AGENT_ENV_MASK}
        assert listed.data[0]["env"] == expected
        assert retrieved.data["env"] == expected
        for body in (listed.content, retrieved.content):
            assert b"sk-ant-secret" not in body
            assert b"claude-opus-5-5" not in body
            assert agent.env.encode() not in body  # ciphertext is not exposed either

    @pytest.mark.django_db
    def test_patch_without_env_keeps_env(self, admin_client):
        agent = _make_agent()

        response = admin_client.patch(_agent_url(agent.id), {"name": "Renamed"}, format="json")

        assert response.status_code == status.HTTP_200_OK, response.data
        agent.refresh_from_db()
        assert agent.name == "Renamed"
        assert agent.get_env() == {"ANTHROPIC_API_KEY": "sk-ant-secret", "MODEL": "claude-opus-5-5"}

    @pytest.mark.django_db
    def test_patch_masked_value_keeps_secret_and_omitted_key_is_removed(self, admin_client):
        agent = _make_agent()

        response = admin_client.patch(
            _agent_url(agent.id),
            {"env": {"ANTHROPIC_API_KEY": AGENT_ENV_MASK, "EXTRA": "new"}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["env"] == {"ANTHROPIC_API_KEY": AGENT_ENV_MASK, "EXTRA": AGENT_ENV_MASK}
        agent.refresh_from_db()
        # Masked key kept, new key added, MODEL (left out) removed.
        assert agent.get_env() == {"ANTHROPIC_API_KEY": "sk-ant-secret", "EXTRA": "new"}

    @pytest.mark.django_db
    def test_patch_round_trip_of_read_env_is_a_no_op(self, admin_client):
        agent = _make_agent()
        read_env = admin_client.get(_agent_url(agent.id)).data["env"]

        response = admin_client.patch(_agent_url(agent.id), {"env": read_env}, format="json")

        assert response.status_code == status.HTTP_200_OK
        agent.refresh_from_db()
        assert agent.get_env() == {"ANTHROPIC_API_KEY": "sk-ant-secret", "MODEL": "claude-opus-5-5"}

    @pytest.mark.django_db
    def test_patch_new_value_replaces_secret(self, admin_client):
        agent = _make_agent()

        response = admin_client.patch(
            _agent_url(agent.id),
            {"env": {"ANTHROPIC_API_KEY": "sk-ant-rotated", "MODEL": AGENT_ENV_MASK}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        agent.refresh_from_db()
        assert agent.get_env() == {"ANTHROPIC_API_KEY": "sk-ant-rotated", "MODEL": "claude-opus-5-5"}

    @pytest.mark.django_db
    def test_mask_for_unknown_key_is_rejected(self, admin_client):
        agent = _make_agent()

        response = admin_client.patch(_agent_url(agent.id), {"env": {"NEW_KEY": AGENT_ENV_MASK}}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        agent.refresh_from_db()
        assert agent.get_env()["ANTHROPIC_API_KEY"] == "sk-ant-secret"

    @pytest.mark.django_db
    def test_mask_on_create_is_rejected(self, admin_client):
        response = admin_client.post(AGENTS_URL, _payload(env={"ANTHROPIC_API_KEY": AGENT_ENV_MASK}), format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not AgentDefinition.objects.exists()

    @pytest.mark.django_db
    def test_delete_removes_row(self, admin_client):
        agent = _make_agent()

        response = admin_client.delete(_agent_url(agent.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not AgentDefinition.all_objects.filter(pk=agent.id).exists()

    @pytest.mark.django_db
    def test_unknown_agent_returns_404(self, admin_client):
        assert admin_client.get(_agent_url(uuid.uuid4())).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_duplicate_slug_is_rejected(self, admin_client):
        _make_agent()
        response = admin_client.post(AGENTS_URL, _payload(), format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestAgentAdminValidation:
    @pytest.mark.django_db
    def test_default_above_max_is_rejected_on_create(self, admin_client):
        response = admin_client.post(
            AGENTS_URL,
            _payload(default_permission_level="yolo", max_permission_level="ask_writes"),
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "default_permission_level" in response.data
        assert not AgentDefinition.objects.exists()

    @pytest.mark.django_db
    def test_default_above_max_is_rejected_on_patch(self, admin_client):
        agent = _make_agent(default_permission_level="ask_writes", max_permission_level="ask_writes")

        # Only one side changes; the other comes from the stored row.
        response = admin_client.patch(_agent_url(agent.id), {"default_permission_level": "yolo"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        response = admin_client.patch(_agent_url(agent.id), {"max_permission_level": "ask_all"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        agent.refresh_from_db()
        assert (agent.default_permission_level, agent.max_permission_level) == ("ask_writes", "ask_writes")

    @pytest.mark.django_db
    def test_default_equal_to_max_is_accepted(self, admin_client):
        response = admin_client.post(
            AGENTS_URL,
            _payload(default_permission_level="ask_all", max_permission_level="ask_all"),
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    @pytest.mark.django_db
    def test_unknown_permission_level_and_adapter_are_rejected(self, admin_client):
        assert (
            admin_client.post(AGENTS_URL, _payload(max_permission_level="root"), format="json").status_code
            == status.HTTP_400_BAD_REQUEST
        )
        assert (
            admin_client.post(AGENTS_URL, _payload(adapter="/bin/sh"), format="json").status_code
            == status.HTTP_400_BAD_REQUEST
        )

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "env",
        [
            {"lowercase": "x"},
            {"1LEADING_DIGIT": "x"},
            {"HAS-DASH": "x"},
            {"": "x"},
            {"A" * 65: "x"},
            {"NOT_A_STRING": 123},
            {"NULL_VALUE": None},
            ["ANTHROPIC_API_KEY"],
            "ANTHROPIC_API_KEY=x",
        ],
    )
    def test_invalid_env_is_rejected(self, admin_client, env):
        response = admin_client.post(AGENTS_URL, _payload(env=env), format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "env" in response.data
        assert not AgentDefinition.objects.exists()

    @pytest.mark.django_db
    def test_invalid_env_on_patch_keeps_stored_env(self, admin_client):
        agent = _make_agent()
        response = admin_client.patch(_agent_url(agent.id), {"env": {"bad key": "x"}}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        agent.refresh_from_db()
        assert agent.get_env()["ANTHROPIC_API_KEY"] == "sk-ant-secret"

    @pytest.mark.django_db
    def test_undecryptable_env_is_flagged_not_500(self, admin_client, settings):
        agent = _make_agent()
        settings.SECRET_KEY = "a-different-secret-key-than-the-one-used-to-encrypt"

        response = admin_client.get(_agent_url(agent.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["env"] == {}
        assert response.data["env_decryption_failed"] is True

        # The mask cannot keep a value we cannot read; the admin must re-enter it.
        masked = admin_client.patch(_agent_url(agent.id), {"env": {"ANTHROPIC_API_KEY": AGENT_ENV_MASK}}, format="json")
        assert masked.status_code == status.HTTP_400_BAD_REQUEST

        fresh = admin_client.patch(_agent_url(agent.id), {"env": {"ANTHROPIC_API_KEY": "sk-new"}}, format="json")
        assert fresh.status_code == status.HTTP_200_OK
        agent.refresh_from_db()
        assert agent.get_env() == {"ANTHROPIC_API_KEY": "sk-new"}
