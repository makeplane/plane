# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for agent env encryption and validation."""

import pytest

from plane.license.models import (
    AGENT_PERMISSION_LEVEL_ORDER,
    AgentDefinition,
    agent_permission_rank,
    validate_agent_env,
)
from plane.license.utils.encryption import (
    EncryptionError,
    decrypt_data,
    decrypt_data_strict,
    encrypt_data,
    encrypt_data_strict,
)


@pytest.mark.unit
class TestStrictEncryption:
    def test_round_trip(self):
        ciphertext = encrypt_data_strict("sk-ant-secret")
        assert ciphertext and ciphertext != "sk-ant-secret"
        assert decrypt_data_strict(ciphertext) == "sk-ant-secret"

    def test_empty_stays_empty(self):
        assert encrypt_data_strict("") == ""
        assert decrypt_data_strict("") == ""

    def test_decrypt_with_wrong_key_raises(self, settings):
        ciphertext = encrypt_data_strict("sk-ant-secret")
        settings.SECRET_KEY = "a-different-secret-key-than-the-one-used-to-encrypt"

        # The lenient helper silently returns "", which is what we guard against.
        assert decrypt_data(ciphertext) == ""
        with pytest.raises(EncryptionError):
            decrypt_data_strict(ciphertext)

    def test_decrypt_garbage_raises(self):
        with pytest.raises(EncryptionError):
            decrypt_data_strict("not-a-fernet-token")

    def test_encrypt_failure_raises(self, monkeypatch):
        monkeypatch.setattr("plane.license.utils.encryption.encrypt_data", lambda data: "")
        with pytest.raises(EncryptionError):
            encrypt_data_strict("sk-ant-secret")

    def test_lenient_helpers_are_unchanged(self):
        assert decrypt_data(encrypt_data("value")) == "value"


@pytest.mark.unit
class TestAgentDefinitionEnv:
    def test_env_round_trip_is_encrypted(self):
        agent = AgentDefinition(name="Claude", slug="claude", adapter="claude")
        agent.set_env({"ANTHROPIC_API_KEY": "sk-ant-secret", "MODEL": "claude-opus-5-5"})

        assert "sk-ant-secret" not in agent.env
        assert agent.get_env() == {"ANTHROPIC_API_KEY": "sk-ant-secret", "MODEL": "claude-opus-5-5"}

    def test_empty_env_stores_empty_string(self):
        agent = AgentDefinition(name="Claude", slug="claude", adapter="claude")
        agent.set_env({})
        assert agent.env == ""
        assert agent.get_env() == {}

    def test_undecryptable_env_raises_instead_of_returning_empty(self, settings):
        agent = AgentDefinition(name="Claude", slug="claude", adapter="claude")
        agent.set_env({"ANTHROPIC_API_KEY": "sk-ant-secret"})
        settings.SECRET_KEY = "a-different-secret-key-than-the-one-used-to-encrypt"

        with pytest.raises(EncryptionError):
            agent.get_env()

    def test_set_env_rejects_invalid_env(self):
        agent = AgentDefinition(name="Claude", slug="claude", adapter="claude")
        with pytest.raises(ValueError):
            agent.set_env({"lower": "x"})
        assert agent.env == ""


@pytest.mark.unit
class TestAgentEnvValidation:
    @pytest.mark.parametrize("key", ["A", "ANTHROPIC_API_KEY", "OPENAI_BASE_URL", "X1_2", "A" + "B" * 63])
    def test_valid_keys(self, key):
        assert validate_agent_env({key: "value"}) == []

    @pytest.mark.parametrize("key", ["", "a", "_A", "1A", "A-B", "A B", "A.B", "Ä", "A" * 65, "A\n"])
    def test_invalid_keys(self, key):
        assert validate_agent_env({key: "value"})

    @pytest.mark.parametrize("value", [1, 1.5, True, None, [], {}])
    def test_non_string_values(self, value):
        assert validate_agent_env({"KEY": value})

    def test_empty_string_value_is_allowed(self):
        assert validate_agent_env({"KEY": ""}) == []

    @pytest.mark.parametrize("env", [[], "KEY=value", None, 1])
    def test_non_object_env(self, env):
        assert validate_agent_env(env)

    def test_too_many_keys(self):
        assert validate_agent_env({f"K{i}": "v" for i in range(65)})

    def test_oversized_value(self):
        assert validate_agent_env({"KEY": "x" * 16385})


@pytest.mark.unit
class TestPermissionLevelOrder:
    def test_order(self):
        assert AGENT_PERMISSION_LEVEL_ORDER == ("ask_all", "ask_writes", "yolo")
        assert agent_permission_rank("ask_all") < agent_permission_rank("ask_writes") < agent_permission_rank("yolo")
