# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone


@pytest.mark.unit
def test_provider_url_rejects_private_ip():
    from plane.app.views.external.ai_provider import validate_provider_base_url

    with pytest.raises(ValidationError, match="PRIVATE_ADDRESS_BLOCKED"):
        validate_provider_base_url("https://127.0.0.1/v1")


@pytest.mark.unit
def test_provider_url_requires_https_for_non_localhost():
    from plane.app.views.external.ai_provider import validate_provider_base_url

    with pytest.raises(ValidationError, match="INVALID_BASE_URL"):
        validate_provider_base_url("http://provider.example/v1")


@pytest.mark.unit
def test_provider_serializer_never_returns_secret(db, create_user):
    from plane.license.api.serializers.ai import AIProviderProfileSerializer
    from plane.license.models import AIProviderProfile, Instance

    instance = Instance.objects.create(
        instance_name="Test",
        instance_id="test-instance",
        current_version="0.0.0",
        last_checked_at="2025-01-01T00:00:00Z",
    )
    provider = AIProviderProfile.objects.create(
        instance=instance,
        name="Gateway",
        slug="gateway",
        base_url="https://api.example.com/v1",
        api_key_encrypted="encrypted-value",
    )

    data = AIProviderProfileSerializer(provider).data

    assert "api_key" not in data
    assert data["has_api_key"] is True
    assert data["api_key_hint"] == ""


@pytest.mark.unit
def test_openai_compatible_adapter_uses_safe_transport():
    from plane.app.views.external.ai_provider import OpenAICompatibleAdapter, ProviderConfig

    provider = ProviderConfig(
        protocol="openai_compatible",
        base_url="https://api.example.com/v1",
        api_key="secret",
        model="gpt-test",
        organization_id="org-test",
        project_id="project-test",
        timeout_seconds=12,
        max_retries=0,
    )
    response = SimpleNamespace(
        status_code=200,
        json=lambda: {"choices": [{"message": {"content": "hello"}}]},
        headers={},
        text=json.dumps({"choices": [{"message": {"content": "hello"}}]}),
        close=lambda: None,
    )

    with patch("plane.app.views.external.ai_provider.pinned_fetch", return_value=response) as fetch:
        result = OpenAICompatibleAdapter().chat(provider, "gpt-test", "hello")

    assert result == "hello"
    fetch.assert_called_once()
    assert fetch.call_args.args[:2] == ("POST", "https://api.example.com/v1/chat/completions")
    assert fetch.call_args.kwargs["headers"]["Authorization"] == "Bearer secret"


@pytest.mark.unit
@pytest.mark.django_db
def test_disabled_database_provider_does_not_fall_back_to_legacy(create_user):
    from plane.app.views.external.ai_provider import get_active_provider_config
    from plane.license.models import AIProviderProfile, Instance

    instance = Instance.objects.create(
        instance_name="Test",
        instance_id="disabled-provider-instance",
        current_version="0.0.0",
        last_checked_at=timezone.now(),
    )
    AIProviderProfile.objects.create(
        instance=instance,
        name="Disabled",
        slug="disabled",
        base_url="https://api.example.com/v1",
        api_key_encrypted="encrypted-value",
        default_model="gpt-test",
        enabled=False,
    )

    with patch(
        "plane.app.views.external.ai_provider.get_configuration_value",
        return_value=("legacy-secret", "openai", "gpt-4o-mini"),
    ) as legacy:
        assert get_active_provider_config() is None

    legacy.assert_not_called()


@pytest.mark.unit
@pytest.mark.django_db
def test_unsupported_legacy_provider_is_not_routed_through_openai(create_user):
    from plane.app.views.external.ai_provider import get_active_provider_config

    with patch(
        "plane.app.views.external.ai_provider.get_configuration_value",
        return_value=("legacy-secret", "anthropic", "claude-test"),
    ):
        assert get_active_provider_config() is None


@pytest.mark.unit
def test_provider_url_rejects_hostname_resolving_to_private_address():
    from plane.app.views.external.ai_provider import validate_provider_base_url

    with patch("plane.app.views.external.ai_provider.validate_url", side_effect=ValueError("blocked")):
        with pytest.raises(ValidationError, match="PRIVATE_ADDRESS_BLOCKED"):
            validate_provider_base_url("https://private.example/v1")
