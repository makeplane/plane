# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for ``AgentProviderCredential``: encryption, validation and DB constraints,
plus the credential resolution / env building used by the agent session endpoint."""

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from plane.db.models import AgentProviderCredential, User, Workspace
from plane.db.models.agent_provider import (
    AGENT_ADAPTER_PROVIDER,
    AGENT_PROVIDER_ADAPTER,
    validate_agent_api_key,
)
from plane.license.models import AgentAdapter, AgentDefinition
from plane.license.utils.encryption import EncryptionError
from plane.utils.agent_credentials import (
    build_agent_env,
    instance_configured_providers,
    resolve_agent_credential,
)

KEY = "sk-test-0123456789abcd"


@pytest.fixture
def member(db):
    return User.objects.create(email="cred-member@plane.so", username="cred-member")


@pytest.fixture
def ws(member):
    return Workspace.objects.create(name="Cred WS", slug="cred-ws", owner=member)


def _api_key_row(workspace, user, provider="anthropic", key=KEY):
    row = AgentProviderCredential(workspace=workspace, user=user, provider=provider)
    row.set_api_key(key)
    row.save()
    return row


def _create_fails(**fields):
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            AgentProviderCredential.objects.create(**fields)


@pytest.mark.unit
class TestApiKeyValidation:
    @pytest.mark.parametrize("value", ["12345678", "x" * 512, "sk-ant-api03-abc_DEF-123"])
    def test_valid(self, value):
        assert validate_agent_api_key(value) is None

    @pytest.mark.parametrize(
        "value", [None, 12345678, ["sk-12345678"], "1234567", "x" * 513, "sk-12345 678", "sk-12345678\n", "\tsk-123456"]
    )
    def test_invalid(self, value):
        assert validate_agent_api_key(value)


@pytest.mark.unit
class TestAgentProviderCredentialModel:
    @pytest.mark.django_db
    def test_set_api_key_encrypts_and_keeps_hint(self, ws, member):
        row = _api_key_row(ws, member)
        row.refresh_from_db()
        assert row.method == "api_key"
        assert row.secret and KEY not in row.secret
        assert row.secret_hint == "abcd"
        assert row.get_secret() == KEY

    def test_set_api_key_rejects_invalid(self):
        row = AgentProviderCredential(provider="anthropic")
        with pytest.raises(ValueError):
            row.set_api_key("short")
        assert row.secret == ""

    @pytest.mark.django_db
    def test_undecryptable_secret_raises(self, settings, ws, member):
        row = _api_key_row(ws, member)
        settings.SECRET_KEY = "a-different-secret-key-than-the-one-used-to-encrypt"
        with pytest.raises(EncryptionError):
            row.get_secret()

    @pytest.mark.django_db
    def test_one_personal_row_per_provider(self, ws, member):
        _api_key_row(ws, member)
        _create_fails(workspace=ws, user=member, provider="anthropic", method="api_key")
        # Other providers and other users are independent.
        _api_key_row(ws, member, provider="openai")
        other = User.objects.create(email="cred-other@plane.so", username="cred-other")
        _api_key_row(ws, other)

    @pytest.mark.django_db
    def test_one_shared_row_per_provider(self, ws, member):
        _api_key_row(ws, None)
        _create_fails(workspace=ws, user=None, provider="anthropic", method="api_key")
        # A shared row does not block a personal one.
        _api_key_row(ws, member)

    @pytest.mark.django_db
    def test_soft_deleted_rows_do_not_block(self, ws, member):
        for user in (None, member):
            row = _api_key_row(ws, user)
            AgentProviderCredential.all_objects.filter(pk=row.pk).update(deleted_at=timezone.now())
            _api_key_row(ws, user)

    @pytest.mark.django_db
    @pytest.mark.parametrize("method", ["chatgpt", "google_account"])
    def test_shared_row_must_be_api_key(self, ws, method):
        provider = "openai" if method == "chatgpt" else "google"
        _create_fails(workspace=ws, user=None, provider=provider, method=method)

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "provider,method",
        [
            ("anthropic", "chatgpt"),
            ("anthropic", "google_account"),
            ("openai", "google_account"),
            ("google", "chatgpt"),
        ],
    )
    def test_account_method_must_match_provider(self, ws, member, provider, method):
        _create_fails(workspace=ws, user=member, provider=provider, method=method)

    @pytest.mark.django_db
    @pytest.mark.parametrize("provider,method", [("openai", "chatgpt"), ("google", "google_account")])
    def test_personal_account_rows_are_allowed(self, ws, member, provider, method):
        AgentProviderCredential.objects.create(
            workspace=ws, user=member, provider=provider, method=method, account_label="me@example.com"
        )

    def test_provider_adapters_are_real_adapters(self):
        assert set(AGENT_PROVIDER_ADAPTER.values()) <= set(AgentAdapter.values)
        assert AGENT_ADAPTER_PROVIDER == {"claude": "anthropic", "codex": "openai", "gemini": "google"}
        assert "gemini" in AgentAdapter.values


@pytest.mark.unit
class TestCredentialResolution:
    @pytest.mark.django_db
    def test_precedence_personal_then_workspace_then_instance(self, ws, member):
        assert resolve_agent_credential(ws, member, "claude") == (None, "instance")

        shared = _api_key_row(ws, None)
        assert resolve_agent_credential(ws, member, "claude") == (shared, "workspace")

        personal = _api_key_row(ws, member)
        assert resolve_agent_credential(ws, member, "claude") == (personal, "personal")

        # Another member's personal key is never used.
        other = User.objects.create(email="cred-other2@plane.so", username="cred-other2")
        assert resolve_agent_credential(ws, other, "claude") == (shared, "workspace")

    @pytest.mark.django_db
    def test_other_workspace_and_provider_are_ignored(self, ws, member):
        other_ws = Workspace.objects.create(name="Cred WS 2", slug="cred-ws-2", owner=member)
        _api_key_row(other_ws, member)
        _api_key_row(ws, member, provider="openai")
        assert resolve_agent_credential(ws, member, "claude") == (None, "instance")

    @pytest.mark.django_db
    def test_deepseek_always_uses_instance(self, ws, member):
        _api_key_row(ws, member)
        assert resolve_agent_credential(ws, member, "deepseek") == (None, "instance")

    def test_no_credential_keeps_admin_env(self):
        env = {"ANTHROPIC_API_KEY": "admin", "MODEL": "m"}
        assert build_agent_env(env, None) == env

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "provider,admin_env,expected",
        [
            (
                "anthropic",
                {
                    "ANTHROPIC_API_KEY": "a",
                    "ANTHROPIC_AUTH_TOKEN": "b",
                    "CLAUDE_CODE_OAUTH_TOKEN": "c",
                    "PLANE_AGENT_AUTH": "x",
                    "MODEL": "m",
                },
                {"ANTHROPIC_API_KEY": KEY, "PLANE_AGENT_AUTH": "api_key", "MODEL": "m"},
            ),
            (
                "openai",
                {"OPENAI_API_KEY": "a", "CODEX_HOME": "/h", "MODEL": "m"},
                {"OPENAI_API_KEY": KEY, "PLANE_AGENT_AUTH": "api_key", "MODEL": "m"},
            ),
            (
                "google",
                {
                    "GEMINI_API_KEY": "a",
                    "GOOGLE_API_KEY": "b",
                    "GOOGLE_GENAI_USE_VERTEXAI": "true",
                    "GOOGLE_CLOUD_PROJECT": "p",
                    "GOOGLE_APPLICATION_CREDENTIALS": "/c.json",
                    "MODEL": "m",
                },
                {"GEMINI_API_KEY": KEY, "PLANE_AGENT_AUTH": "api_key", "MODEL": "m"},
            ),
        ],
    )
    def test_api_key_replaces_provider_vars(self, ws, member, provider, admin_env, expected):
        row = _api_key_row(ws, member, provider=provider)
        assert build_agent_env(admin_env, row) == expected

    @pytest.mark.django_db
    def test_account_method_sets_auth_without_key(self, ws, member):
        row = AgentProviderCredential.objects.create(workspace=ws, user=member, provider="openai", method="chatgpt")
        env = build_agent_env({"OPENAI_API_KEY": "admin", "CODEX_HOME": "/h", "MODEL": "m"}, row)
        assert env == {"PLANE_AGENT_AUTH": "chatgpt", "MODEL": "m"}

    @pytest.mark.django_db
    def test_instance_configured_providers(self, member):
        def agent(slug, adapter, env, **kw):
            a = AgentDefinition(name=slug, slug=slug, adapter=adapter, **kw)
            a.set_env(env)
            a.save()

        agent("claude-oauth", "claude", {"CLAUDE_CODE_OAUTH_TOKEN": "t"})
        agent("codex-off", "codex", {"OPENAI_API_KEY": "k"}, is_enabled=False)
        agent("codex-empty", "codex", {"OPENAI_API_KEY": ""})
        agent("gemini-model-only", "gemini", {"GEMINI_MODEL": "x"})
        agent("deepseek", "deepseek", {"DEEPSEEK_API_KEY": "k"})
        assert instance_configured_providers() == {"anthropic"}

        agent("codex-home", "codex", {"CODEX_HOME": "/srv/codex"})
        agent("gemini", "gemini", {"GEMINI_API_KEY": "k"})
        assert instance_configured_providers() == {"anthropic", "openai", "google"}
