# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for the LLM helpers behind the ai-assistant endpoints.

Each provider's key must go to that provider's OpenAI-compatible endpoint, not to
api.openai.com. The HTTP layer is stubbed, so nothing leaves the machine.
"""

import importlib
import json
from unittest.mock import patch

import httpx
import pytest
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from plane.app.views.external.base import (
    GPTIntegrationEndpoint,
    WorkspaceGPTIntegrationEndpoint,
    get_llm_config,
    get_llm_response,
)
from plane.utils.instance_config_variables import core as instance_config

COMPLETION = {
    "id": "chatcmpl-test",
    "object": "chat.completion",
    "created": 0,
    "model": "test-model",
    "choices": [
        {
            "index": 0,
            "finish_reason": "stop",
            "message": {"role": "assistant", "content": "Generated text"},
        }
    ],
}


@pytest.fixture
def sent_requests(monkeypatch):
    """Record the requests the OpenAI client sends and answer them locally."""
    monkeypatch.delenv("OPENAI_BASE_URL", raising=False)
    requests = []

    def fake_send(self, request, *args, **kwargs):
        requests.append(request)
        return httpx.Response(200, json=COMPLETION, request=request)

    monkeypatch.setattr(httpx.Client, "send", fake_send)
    return requests


@pytest.fixture
def first_boot_llm_config(monkeypatch):
    """Return the LLM settings configure_instance stores on a new instance for the given env."""

    def seed(**env):
        for key in ("LLM_API_KEY", "LLM_PROVIDER", "LLM_MODEL"):
            monkeypatch.delenv(key, raising=False)
        for key, value in env.items():
            monkeypatch.setenv(key, value)
        # The seed values are read from the environment when the module is imported
        seeded = {item["key"]: item["value"] for item in importlib.reload(instance_config).llm_config_variables}
        return seeded["LLM_API_KEY"], seeded["LLM_PROVIDER"], seeded["LLM_MODEL"]

    yield seed
    monkeypatch.undo()
    importlib.reload(instance_config)


@pytest.mark.unit
@pytest.mark.parametrize(
    "provider, model, expected_url",
    [
        ("openai", "gpt-4o-mini", "https://api.openai.com/v1/chat/completions"),
        ("anthropic", "claude-sonnet-5-5", "https://api.anthropic.com/v1/chat/completions"),
        ("gemini", "gemini-3.8-flash", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"),
    ],
    ids=["openai", "anthropic", "gemini"],
)
def test_request_is_sent_to_the_configured_provider(sent_requests, provider, model, expected_url):
    assert get_llm_response("Summarize", "hello", "provider-key", model, provider) == ("Generated text", None)

    assert len(sent_requests) == 1
    request = sent_requests[0]
    assert str(request.url) == expected_url
    assert request.headers["authorization"] == "Bearer provider-key"
    assert json.loads(request.content)["model"] == model


@pytest.mark.unit
@pytest.mark.parametrize(
    "provider, expected_model",
    [
        ("openai", "gpt-4o-mini"),
        ("anthropic", "claude-sonnet-5-5"),
        ("gemini", "gemini-3.8-flash"),
    ],
    ids=["openai", "anthropic", "gemini"],
)
@patch("plane.app.views.external.base.log_exception")
@patch("plane.app.views.external.base.get_configuration_value")
def test_new_instance_without_llm_model_uses_the_provider_default(
    mock_config, mock_log, first_boot_llm_config, provider, expected_model
):
    # The admin sets LLM_PROVIDER and LLM_API_KEY and leaves LLM_MODEL unset
    mock_config.return_value = first_boot_llm_config(LLM_PROVIDER=provider, LLM_API_KEY="provider-key")
    api_key, model, provider_key, *_ = get_llm_config()

    assert (api_key, model, provider_key) == ("provider-key", expected_model, provider)


@pytest.mark.unit
@pytest.mark.parametrize(
    "endpoint, view_kwargs",
    [
        (WorkspaceGPTIntegrationEndpoint, {"slug": "acme"}),
        (GPTIntegrationEndpoint, {"slug": "acme", "project_id": "00000000-0000-0000-0000-000000000000"}),
    ],
    ids=["workspace", "project"],
)
@patch("plane.app.views.external.base.log_exception")
@patch("plane.app.views.external.base.get_configuration_value")
def test_unsupported_model_is_reported_as_unsupported(mock_config, mock_log, endpoint, view_kwargs):
    # The key and model are both set; the model is just not in the provider's list
    mock_config.return_value = ("provider-key", "openai", "not-a-listed-model")
    request = Request(
        APIRequestFactory().post("/api/ai-assistant/", {"task": "Describe"}, format="json"),
        parsers=[JSONParser()],
    )

    # Call the view body directly: the role check in allow_permission needs a database
    response = endpoint.post.__wrapped__(endpoint(), request, **view_kwargs)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not supported" in response.data["error"]


@pytest.mark.unit
@pytest.mark.parametrize(
    "provider, model",
    [("anthropic", "claude-sonnet-5-5"), ("gemini", "gemini-3.8-flash")],
    ids=["anthropic", "gemini"],
)
def test_openai_base_url_still_sends_every_provider_to_the_gateway(sent_requests, monkeypatch, provider, model):
    # Before this fix, a gateway set in OPENAI_BASE_URL was the only way these providers worked
    monkeypatch.setenv("OPENAI_BASE_URL", "http://llm-gateway:4000/v1")

    assert get_llm_response("Summarize", "hello", "gateway-key", model, provider) == ("Generated text", None)

    assert str(sent_requests[0].url) == "http://llm-gateway:4000/v1/chat/completions"
    assert json.loads(sent_requests[0].content)["model"] == model
