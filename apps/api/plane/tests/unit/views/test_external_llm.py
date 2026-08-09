# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch

import pytest

from plane.app.views.external.base import get_llm_config, get_llm_response


@pytest.mark.unit
class TestLLMConfiguration:
    @patch("plane.app.views.external.base.get_configuration_value")
    def test_uses_provider_models_without_override(self, mock_get_configuration_value, monkeypatch):
        monkeypatch.delenv("LLM_MODELS", raising=False)
        monkeypatch.delenv("LLM_API_BASE", raising=False)
        mock_get_configuration_value.return_value = (
            "api-key",
            "openai",
            "gpt-4o-mini",
        )

        assert get_llm_config() == ("api-key", "gpt-4o-mini", "openai", None)

    @patch("plane.app.views.external.base.get_configuration_value")
    def test_uses_configured_model_override(self, mock_get_configuration_value, monkeypatch):
        monkeypatch.setenv("LLM_MODELS", "gpt-5-mini, qwen3-235b")
        monkeypatch.setenv("LLM_API_BASE", "https://example.com/v1")
        mock_get_configuration_value.return_value = (
            "api-key",
            "openai",
            "qwen3-235b",
        )

        assert get_llm_config() == (
            "api-key",
            "qwen3-235b",
            "openai",
            "https://example.com/v1",
        )

    @patch("plane.app.views.external.base.log_exception")
    @patch("plane.app.views.external.base.get_configuration_value")
    def test_rejects_model_outside_configured_override(
        self, mock_get_configuration_value, mock_log_exception, monkeypatch
    ):
        monkeypatch.setenv("LLM_MODELS", "gpt-5-mini,qwen3-235b")
        monkeypatch.delenv("LLM_API_BASE", raising=False)
        mock_get_configuration_value.return_value = (
            "api-key",
            "openai",
            "gpt-4o-mini",
        )

        assert get_llm_config() == (None, None, None, None)
        mock_log_exception.assert_called_once()

    @patch("plane.app.views.external.base.OpenAI")
    def test_uses_default_client_without_api_base(self, mock_openai):
        completion = MagicMock()
        completion.choices[0].message.content = "response"
        mock_openai.return_value.chat.completions.create.return_value = completion

        assert get_llm_response("task", "prompt", "api-key", "gpt-4o-mini", "openai") == ("response", None)
        mock_openai.assert_called_once_with(api_key="api-key", base_url=None)

    @patch("plane.app.views.external.base.OpenAI")
    def test_passes_configured_api_base_to_client(self, mock_openai):
        completion = MagicMock()
        completion.choices[0].message.content = "response"
        mock_openai.return_value.chat.completions.create.return_value = completion

        assert get_llm_response("task", "prompt", "api-key", "qwen3-235b", "openai", "https://example.com/v1") == (
            "response",
            None,
        )
        mock_openai.assert_called_once_with(api_key="api-key", base_url="https://example.com/v1")
