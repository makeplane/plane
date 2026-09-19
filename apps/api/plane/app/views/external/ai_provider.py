# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

"""Instance AI provider configuration and the OpenAI-compatible adapter.

This module deliberately uses Plane's pinned outbound transport instead of the
OpenAI SDK for requests.  Provider URLs are administrator-controlled egress
points, so every request must go through the same SSRF and redirect checks.
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

    allow_private = getattr(settings, "AI_ALLOW_PRIVATE_ENDPOINTS", False)
    is_local = hostname.lower() in {"localhost", "localhost.localdomain"}
    if parts.scheme != "https" and not (parts.scheme == "http" and is_local and allow_private):
        raise ValidationError("INVALID_BASE_URL")

    try:
        address = ipaddress.ip_address(hostname)
    except ValueError:
        address = None
    if (
        not allow_private
        and address
        and (address.is_private or address.is_loopback or address.is_link_local or address.is_reserved)
    ):
        raise ValidationError("PRIVATE_ADDRESS_BLOCKED")

    try:
        validate_url(value, allowed_hosts=[hostname] if allow_private else None)
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


class OpenAICompatibleAdapter:
    protocol = "openai_compatible"

    def _request(self, method: str, provider: ProviderConfig, path: str, **kwargs: Any) -> requests.Response:
        url = f"{provider.base_url.rstrip('/')}/{path.lstrip('/')}"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if provider.api_key:
            headers["Authorization"] = f"Bearer {provider.api_key}"
        if provider.organization_id:
            headers["OpenAI-Organization"] = provider.organization_id
        if provider.project_id:
            headers["OpenAI-Project"] = provider.project_id

        retries = max(0, min(provider.max_retries, 3))
        allow_private = getattr(settings, "AI_ALLOW_PRIVATE_ENDPOINTS", False)
        hostname = urlsplit(url).hostname
        for attempt in range(retries + 1):
            try:
                response = pinned_fetch(
                    method,
                    url,
                    headers=headers,
                    timeout=max(5, min(provider.timeout_seconds, 120)),
                    allowed_hosts=[hostname] if allow_private and hostname else None,
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

    def chat(self, provider: AIProviderProfile | ProviderConfig, model: str, prompt: str) -> str:
        config = (
            provider if isinstance(provider, ProviderConfig) else provider_config_from_profile(provider, model=model)
        )
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
        config = provider_config_from_profile(provider)
        response = self._request("GET", config, "/models")
        try:
            models = response.json().get("data", [])
            return [item["id"] for item in models if isinstance(item, dict) and item.get("id")]
        except (AttributeError, TypeError, ValueError) as exc:
            raise AIProviderError("INVALID_RESPONSE") from exc
        finally:
            response.close()


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
