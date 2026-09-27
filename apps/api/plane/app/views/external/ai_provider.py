# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

"""Instance AI provider configuration and the outbound protocol adapters.

Each provider speaks one wire protocol (OpenAI-compatible chat completions, or
the Anthropic Messages API) served by a matching adapter selected through
``get_adapter``.  Every adapter deliberately uses Plane's pinned outbound
transport instead of a vendor SDK: provider URLs are administrator-controlled
egress points, so every request must go through the same SSRF and redirect
checks.
"""

from __future__ import annotations

import ipaddress
import os
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlsplit

import requests
from django.conf import settings
from django.core.exceptions import ValidationError

from plane.license.models import AIProviderProfile, Instance
from plane.license.utils.encryption import decrypt_data
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.ip_address import validate_url
from plane.utils.url_security import pinned_fetch


class AIProviderError(Exception):
    """Stable, non-sensitive provider error."""

    def __init__(self, code: str, message: str | None = None):
        self.code = code
        super().__init__(message or code)


@dataclass(frozen=True)
class ProviderConfig:
    protocol: str
    base_url: str
    api_key: str
    model: str
    organization_id: str = ""
    project_id: str = ""
    timeout_seconds: int = 30
    max_retries: int = 2
    temperature: float | None = None
    top_p: float | None = None
    max_output_tokens: int | None = None
    profile: AIProviderProfile | None = None


def validate_provider_base_url(value: str) -> str:
    """Validate and normalize a provider root URL before it is persisted."""

    try:
        parts = urlsplit((value or "").strip())
        hostname = parts.hostname
    except ValueError as exc:
        raise ValidationError("INVALID_BASE_URL") from exc

    if not hostname or parts.username or parts.password or parts.fragment or parts.query:
        raise ValidationError("INVALID_BASE_URL")

    trust_configured = getattr(settings, "AI_ALLOW_PRIVATE_ENDPOINTS", False)

    # Provider URLs are configured by an instance administrator. On a trusted
    # deployment (typically internal), take the address as given: any http(s)
    # host is accepted with no private-IP blocking and nothing to allowlist per
    # address. The request is still pinned to the resolved IP at call time.
    if trust_configured:
        if parts.scheme not in ("http", "https"):
            raise ValidationError("INVALID_BASE_URL")
        return value.strip().rstrip("/")

    # Default posture for public deployments: https only, and the host must not
    # resolve to an internal/private address (SSRF protection).
    if parts.scheme != "https":
        raise ValidationError("INVALID_BASE_URL")
    try:
        validate_url(value)
    except ValueError as exc:
        raise ValidationError("PRIVATE_ADDRESS_BLOCKED") from exc

    return value.strip().rstrip("/")


def _decrypt_provider_key(provider: AIProviderProfile) -> str:
    value = provider.api_key_encrypted or ""
    if not value:
        return ""
    # Profiles created before encryption was introduced are treated as legacy
    # plaintext once; all writes from the API are encrypted.
    if not value.startswith("gAAAA"):
        return value
    return decrypt_data(value)


def _response_error(response: requests.Response) -> AIProviderError:
    if response.status_code in (401, 403):
        return AIProviderError("AUTH_FAILED")
    if response.status_code == 404:
        return AIProviderError("MODEL_NOT_FOUND")
    if response.status_code == 429:
        return AIProviderError("RATE_LIMITED")
    if 400 <= response.status_code < 500:
        return AIProviderError("INVALID_REQUEST")
    return AIProviderError("UPSTREAM_ERROR")


def _extract_model_ids(payload: Any) -> list[str]:
    """Read model ids out of a ``{"data": [{"id": ...}]}`` list response.

    Both the OpenAI ``/models`` and the Anthropic ``/models`` endpoints shape
    their catalog this way, so the two adapters share this parser.
    """
    try:
        models = payload.get("data", [])
    except AttributeError as exc:
        raise AIProviderError("INVALID_RESPONSE") from exc
    return [item["id"] for item in models if isinstance(item, dict) and item.get("id")]


class _BaseAdapter:
    """Shared pinned-transport request loop; subclasses supply auth headers."""

    protocol = ""

    def _auth_headers(self, provider: ProviderConfig) -> dict[str, str]:
        return {}

    def _request(self, method: str, provider: ProviderConfig, path: str, **kwargs: Any) -> requests.Response:
        url = f"{provider.base_url.rstrip('/')}/{path.lstrip('/')}"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        headers.update(self._auth_headers(provider))

        retries = max(0, min(provider.max_retries, 3))
        # On a trusted deployment the configured host bypasses the private-IP block;
        # the connection is still pinned to the resolved IP (no DNS rebinding).
        trust_configured = getattr(settings, "AI_ALLOW_PRIVATE_ENDPOINTS", False)
        hostname = urlsplit(url).hostname
        for attempt in range(retries + 1):
            try:
                response = pinned_fetch(
                    method,
                    url,
                    headers=headers,
                    timeout=max(5, min(provider.timeout_seconds, 120)),
                    allowed_hosts=[hostname] if trust_configured and hostname else None,
                    **kwargs,
                )
            except ValueError as exc:
                raise AIProviderError("PRIVATE_ADDRESS_BLOCKED") from exc
            except requests.RequestException as exc:
                if attempt >= retries:
                    code = "TIMEOUT" if isinstance(exc, requests.Timeout) else "UPSTREAM_UNAVAILABLE"
                    raise AIProviderError(code) from exc
                continue

            if response.status_code == 429 or response.status_code >= 500:
                if attempt < retries:
                    response.close()
                    time.sleep(0.25 * (2**attempt))
                    continue
            if response.status_code >= 400:
                raise _response_error(response)
            return response
        raise AIProviderError("UPSTREAM_UNAVAILABLE")

    def _config_for(self, provider: AIProviderProfile | ProviderConfig, model: str | None = None) -> ProviderConfig:
        if isinstance(provider, ProviderConfig):
            return provider
        return provider_config_from_profile(provider, model=model)


class OpenAICompatibleAdapter(_BaseAdapter):
    protocol = "openai_compatible"

    def _auth_headers(self, provider: ProviderConfig) -> dict[str, str]:
        headers: dict[str, str] = {}
        if provider.api_key:
            headers["Authorization"] = f"Bearer {provider.api_key}"
        if provider.organization_id:
            headers["OpenAI-Organization"] = provider.organization_id
        if provider.project_id:
            headers["OpenAI-Project"] = provider.project_id
        return headers

    def chat(self, provider: AIProviderProfile | ProviderConfig, model: str, prompt: str) -> str:
        config = self._config_for(provider, model)
        payload: dict[str, Any] = {"model": model, "messages": [{"role": "user", "content": prompt}]}
        if config.temperature is not None:
            payload["temperature"] = config.temperature
        if config.top_p is not None:
            payload["top_p"] = config.top_p
        if config.max_output_tokens is not None:
            payload["max_completion_tokens"] = config.max_output_tokens
        response = self._request(
            "POST",
            config,
            "/chat/completions",
            json=payload,
        )
        try:
            content = response.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise AIProviderError("INVALID_RESPONSE") from exc
        finally:
            response.close()
        if not isinstance(content, str):
            raise AIProviderError("INVALID_RESPONSE")
        return content

    def list_models(self, provider: AIProviderProfile) -> list[str]:
        response = self._request("GET", self._config_for(provider), "/models")
        try:
            return _extract_model_ids(response.json())
        except ValueError as exc:
            raise AIProviderError("INVALID_RESPONSE") from exc
        finally:
            response.close()


class AnthropicMessagesAdapter(_BaseAdapter):
    """Adapter for the native Anthropic Messages API (``POST /messages``).

    The base URL should include the API version segment (e.g.
    ``https://api.anthropic.com/v1``), just like the OpenAI-compatible adapter.
    Authentication is ``x-api-key`` rather than a bearer token, and every request
    carries the required ``anthropic-version`` header.
    """

    protocol = "anthropic_messages"
    ANTHROPIC_VERSION = "2023-06-01"
    # Anthropic requires max_tokens; use the provider's cap or a safe default.
    DEFAULT_MAX_TOKENS = 1024

    def _auth_headers(self, provider: ProviderConfig) -> dict[str, str]:
        headers = {"anthropic-version": self.ANTHROPIC_VERSION}
        if provider.api_key:
            headers["x-api-key"] = provider.api_key
        return headers

    def chat(self, provider: AIProviderProfile | ProviderConfig, model: str, prompt: str) -> str:
        config = self._config_for(provider, model)
        payload: dict[str, Any] = {
            "model": model,
            "max_tokens": config.max_output_tokens or self.DEFAULT_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}],
        }
        if config.temperature is not None:
            payload["temperature"] = config.temperature
        if config.top_p is not None:
            payload["top_p"] = config.top_p
        response = self._request(
            "POST",
            config,
            "/messages",
            json=payload,
        )
        try:
            blocks = response.json()["content"]
            content = next(
                block["text"] for block in blocks if isinstance(block, dict) and block.get("type") == "text"
            )
        except (KeyError, IndexError, TypeError, ValueError, StopIteration) as exc:
            raise AIProviderError("INVALID_RESPONSE") from exc
        finally:
            response.close()
        if not isinstance(content, str):
            raise AIProviderError("INVALID_RESPONSE")
        return content

    def list_models(self, provider: AIProviderProfile) -> list[str]:
        response = self._request("GET", self._config_for(provider), "/models")
        try:
            return _extract_model_ids(response.json())
        except ValueError as exc:
            raise AIProviderError("INVALID_RESPONSE") from exc
        finally:
            response.close()


_ADAPTERS: dict[str, _BaseAdapter] = {
    OpenAICompatibleAdapter.protocol: OpenAICompatibleAdapter(),
    AnthropicMessagesAdapter.protocol: AnthropicMessagesAdapter(),
}


def get_adapter(protocol: str) -> _BaseAdapter:
    """Return the adapter for a provider protocol, or raise UNSUPPORTED_PROTOCOL."""
    adapter = _ADAPTERS.get(protocol)
    if adapter is None:
        raise AIProviderError("UNSUPPORTED_PROTOCOL")
    return adapter


def provider_config_from_profile(provider: AIProviderProfile, *, model: str | None = None) -> ProviderConfig:
    return ProviderConfig(
        protocol=provider.protocol,
        base_url=provider.base_url,
        api_key=_decrypt_provider_key(provider),
        model=model or provider.default_model,
        organization_id=provider.organization_id,
        project_id=provider.project_id,
        timeout_seconds=provider.timeout_seconds,
        max_retries=provider.max_retries,
        temperature=provider.temperature,
        top_p=provider.top_p,
        max_output_tokens=provider.max_output_tokens,
        profile=provider,
    )


def get_active_provider_config() -> ProviderConfig | None:
    """Return the enabled database provider, then the legacy environment config."""

    instance = Instance.objects.first()
    if instance is not None:
        profiles = AIProviderProfile.objects.filter(instance=instance)
        if profiles.exists():
            provider = (
                profiles.filter(enabled=True)
                .exclude(api_key_encrypted="")
                .order_by("-is_default", "created_at")
                .first()
            )
            if provider:
                model_profiles = provider.model_profiles.all()
                if (
                    model_profiles.exists()
                    and not model_profiles.filter(model_id=provider.default_model, enabled=True).exists()
                ):
                    return None
                return provider_config_from_profile(provider)
            return None

    api_key, provider_name, model = get_configuration_value(
        [
            {"key": "LLM_API_KEY", "default": os.environ.get("LLM_API_KEY")},
            {"key": "LLM_PROVIDER", "default": os.environ.get("LLM_PROVIDER", "openai")},
            {"key": "LLM_MODEL", "default": os.environ.get("LLM_MODEL", "gpt-4o-mini")},
        ]
    )
    if not api_key:
        return None
    if str(provider_name or "openai").lower() != "openai":
        return None
    base_url = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")
    return ProviderConfig(
        protocol="openai_compatible",
        base_url=base_url,
        api_key=api_key,
        model=model or "gpt-4o-mini",
    )
