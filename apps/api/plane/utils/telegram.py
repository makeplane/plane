# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Small, bounded Telegram Bot API client. Bot tokens never appear in API responses."""

import requests
from cryptography.fernet import Fernet
from django.conf import settings

from plane.license.utils.encryption import derive_key


class TelegramAPIError(Exception):
    pass


class TelegramRetryableError(TelegramAPIError):
    pass


def encrypt_bot_token(token: str) -> str:
    return Fernet(derive_key(settings.SECRET_KEY)).encrypt(token.encode()).decode()


def decrypt_bot_token(encrypted_token: str) -> str:
    return Fernet(derive_key(settings.SECRET_KEY)).decrypt(encrypted_token.encode()).decode()


def telegram_api(token: str, method: str, payload: dict | None = None):
    # Only callers supply method names; never accept a user-provided URL or method.
    try:
        response = requests.post(
            f"https://api.telegram.org/bot{token}/{method}",
            json=payload or {},
            timeout=10,
        )
        if response.status_code == 429 or response.status_code >= 500:
            raise TelegramRetryableError("Telegram is temporarily unavailable")
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict):
            raise TelegramAPIError("Invalid Telegram response")
        if not data.get("ok"):
            if data.get("error_code") == 429:
                raise TelegramRetryableError("Telegram rate limited the request")
            raise TelegramAPIError("Telegram rejected the request")
        return data["result"]
    except (requests.Timeout, requests.ConnectionError):
        raise TelegramRetryableError("Telegram is temporarily unavailable") from None
    except (requests.RequestException, ValueError, KeyError):
        raise TelegramAPIError("Telegram is unavailable or rejected the request") from None
