# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import hashlib
import json
import logging
import os

# Third party imports
import requests

# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.db.models import User
from plane.license.utils.instance_value import get_configuration_value

logger = logging.getLogger(__name__)


class SwingSSOProvider(CredentialAdapter):
    """Authenticate users via Swing SSO REST API (password-based flow).

    Flow: load config → SHA-256 hash password → POST JSON to Swing API
    → validate response → lookup Plane user by email → set session.
    """

    provider = "swing-sso"

    def __init__(self, request, username, password, callback=None):
        super().__init__(request=request, provider=self.provider, callback=callback)
        # Validate password is not empty and has no null bytes
        if not password or "\x00" in password:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_AUTHENTICATION_FAILED"],
                error_message="SWING_SSO_AUTHENTICATION_FAILED",
            )
        self.username = username
        self.password = password
        self._load_config()

    def _load_config(self):
        """Load Swing SSO configuration from InstanceConfiguration."""
        (
            IS_SWING_SSO_ENABLED,
            SWING_SSO_URL,
            SWING_SSO_CLIENT_ID,
            SWING_SSO_CLIENT_SECRET,
            SWING_SSO_COMPANY_CODE,
        ) = get_configuration_value(
            [
                {"key": "IS_SWING_SSO_ENABLED", "default": os.environ.get("IS_SWING_SSO_ENABLED", "0")},
                {"key": "SWING_SSO_URL", "default": os.environ.get("SWING_SSO_URL", "")},
                {"key": "SWING_SSO_CLIENT_ID", "default": os.environ.get("SWING_SSO_CLIENT_ID", "")},
                {"key": "SWING_SSO_CLIENT_SECRET", "default": os.environ.get("SWING_SSO_CLIENT_SECRET", "")},
                {"key": "SWING_SSO_COMPANY_CODE", "default": os.environ.get("SWING_SSO_COMPANY_CODE", "VN")},
            ]
        )

        if IS_SWING_SSO_ENABLED != "1":
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_NOT_CONFIGURED"],
                error_message="SWING_SSO_NOT_CONFIGURED",
            )

        if not SWING_SSO_URL or not SWING_SSO_CLIENT_ID or not SWING_SSO_CLIENT_SECRET:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_NOT_CONFIGURED"],
                error_message="SWING_SSO_NOT_CONFIGURED",
            )

        self.swing_url = SWING_SSO_URL
        self.client_id = SWING_SSO_CLIENT_ID
        self.client_secret = SWING_SSO_CLIENT_SECRET
        self.company_code = SWING_SSO_COMPANY_CODE

    def _hash_password(self, password):
        """SHA-256 hex hash of plain password (no salt, matches Java MessageDigest)."""
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def _authenticate_swing(self):
        """POST JSON to Swing SSO API and return parsed response dict."""
        payload = {
            "common": {
                "companyCode": self.company_code,
                "clientId": self.client_id,
                "clientSecret": self.client_secret,
                "employeeNo": self.username,
            },
            "data": {
                "loginPassword": self._hash_password(self.password),
            },
        }

        try:
            response = requests.post(
                self.swing_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            response.raise_for_status()
            return response.json()
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )
        except requests.exceptions.RequestException:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )
        except (json.JSONDecodeError, ValueError):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )

    def _map_auth_result_to_error(self, auth_result):
        """Map Swing authResult value to specific error code and raise."""
        error_map = {
            "LOGIN_FAILED": "SWING_SSO_AUTHENTICATION_FAILED",
            "DENIED_PWD_CNT": "SWING_SSO_PASSWORD_ATTEMPTS_EXCEEDED",
            "PWD_EXPIRATION": "SWING_SSO_PASSWORD_EXPIRED",
            "DENIED_LOGIN": "SWING_SSO_LOGIN_DENIED",
        }
        error_key = error_map.get(auth_result, "SWING_SSO_AUTHENTICATION_FAILED")
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES[error_key],
            error_message=error_key,
        )

    def set_user_data(self):
        """Authenticate via Swing API and lookup Plane user."""
        # Step 1: Call Swing SSO API
        result = self._authenticate_swing()

        # Step 2: Validate response
        result_code = result.get("common", {}).get("resultCode", "")
        auth_result = result.get("data", {}).get("authResult", "")

        if result_code != "200" or auth_result != "SUCCESS":
            self._map_auth_result_to_error(auth_result)

        # Step 3: Lookup user in Plane DB by staff email pattern
        email = f"sh{self.username}@swing.shinhan.com"
        user = User.objects.filter(email=email).first()

        if not user:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_PLANE_USER_NOT_FOUND"],
                error_message="SWING_SSO_PLANE_USER_NOT_FOUND",
            )

        if not user.is_active:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ACCOUNT_DEACTIVATED"],
                error_message="USER_ACCOUNT_DEACTIVATED",
            )

        # Step 4: Set user data for session creation
        super().set_user_data(
            {
                "email": email,
                "user": {
                    "avatar": user.avatar or "",
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                    "provider_id": self.username,
                    "is_password_autoset": True,
                },
            }
        )
