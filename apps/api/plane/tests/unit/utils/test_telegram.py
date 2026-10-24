# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import Mock, patch

import pytest
import requests

from plane.utils.telegram import TelegramAPIError, TelegramRetryableError, telegram_api


@pytest.mark.unit
@pytest.mark.parametrize(
    ("status_code", "error_type"),
    [(400, TelegramAPIError), (429, TelegramRetryableError), (503, TelegramRetryableError)],
)
def test_telegram_api_classifies_http_errors(status_code, error_type):
    response = Mock(status_code=status_code)
    response.raise_for_status.side_effect = requests.HTTPError("Telegram request failed")
    with patch("plane.utils.telegram.requests.post", return_value=response):
        with pytest.raises(error_type):
            telegram_api("123:token", "sendMessage", {"chat_id": 42, "text": "Hello"})


@pytest.mark.unit
def test_telegram_api_retries_timeouts_without_exposing_token():
    with patch("plane.utils.telegram.requests.post", side_effect=requests.Timeout("secret-token")):
        with pytest.raises(TelegramRetryableError, match="temporarily unavailable") as error:
            telegram_api("123:secret-token", "sendMessage")
    assert "secret-token" not in str(error.value)


@pytest.mark.unit
def test_telegram_api_retries_json_rate_limit():
    response = Mock(status_code=200)
    response.json.return_value = {"ok": False, "error_code": 429}
    with patch("plane.utils.telegram.requests.post", return_value=response):
        with pytest.raises(TelegramRetryableError):
            telegram_api("123:token", "sendMessage")
