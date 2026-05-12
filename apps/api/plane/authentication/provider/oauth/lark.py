# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os
from datetime import datetime
from urllib.parse import urlencode

import pytz
import requests

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class LarkOAuthProvider(OauthAdapter):
    """
    OAuth provider for Lark (feishu.cn) and Lark Suite (larksuite.com).

    Brand is selected via LARK_BASE_DOMAIN config:
      - "feishu.cn"     -> 飞书 (default, China)
      - "larksuite.com" -> Lark (international)

    Lark deviates from typical OAuth2 in two ways:
      1. Token endpoint expects JSON body (not form-encoded).
      2. Userinfo endpoint wraps payload in {code, msg, data: {...}}.
    Both are handled by overriding set_token_data and set_user_data.
    """

    scope = "contact:user.email:readonly contact:user.basic_profile:readonly"
    provider = "lark"

    def __init__(self, request, code=None, state=None, callback=None):
        (LARK_CLIENT_ID, LARK_CLIENT_SECRET, LARK_BASE_DOMAIN) = get_configuration_value(
            [
                {
                    "key": "LARK_CLIENT_ID",
                    "default": os.environ.get("LARK_CLIENT_ID"),
                },
                {
                    "key": "LARK_CLIENT_SECRET",
                    "default": os.environ.get("LARK_CLIENT_SECRET"),
                },
                {
                    "key": "LARK_BASE_DOMAIN",
                    "default": os.environ.get("LARK_BASE_DOMAIN", "feishu.cn"),
                },
            ]
        )

        if not (LARK_CLIENT_ID and LARK_CLIENT_SECRET):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LARK_NOT_CONFIGURED"],
                error_message="LARK_NOT_CONFIGURED",
            )

        base_domain = LARK_BASE_DOMAIN or "feishu.cn"
        accounts_host = f"https://accounts.{base_domain}"
        open_host = f"https://open.{base_domain}"

        self.token_url = f"{open_host}/open-apis/authen/v2/oauth/token"
        self.userinfo_url = f"{open_host}/open-apis/authen/v1/user_info"

        client_id = LARK_CLIENT_ID
        client_secret = LARK_CLIENT_SECRET

        redirect_uri = (
            f"""{"https" if request.is_secure() else "http"}://{request.get_host()}/auth/lark/callback/"""
        )
        url_params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": self.scope,
            "state": state,
        }
        auth_url = f"{accounts_host}/open-apis/authen/v1/authorize?{urlencode(url_params)}"

        super().__init__(
            request,
            self.provider,
            client_id,
            self.scope,
            redirect_uri,
            auth_url,
            self.token_url,
            self.userinfo_url,
            client_secret,
            code,
            callback=callback,
        )

    def set_token_data(self):
        # Lark v2 token endpoint expects a JSON body (not form-encoded), so we
        # override the base behaviour instead of going through get_user_token.
        data = {
            "grant_type": "authorization_code",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": self.code,
            "redirect_uri": self.redirect_uri,
        }
        try:
            response = requests.post(self.token_url, json=data, timeout=15)
            response.raise_for_status()
            token_response = response.json()
        except requests.RequestException:
            self.logger.warning("Error getting Lark user token")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LARK_OAUTH_PROVIDER_ERROR"],
                error_message="LARK_OAUTH_PROVIDER_ERROR",
            )

        # Lark v2 token endpoint returns RFC 6749-style success (flat, no `code` field) or
        # error (`{error, error_description, code}`). Treat presence of `access_token`
        # as the success signal and surface the `error` field on failure.
        if not token_response.get("access_token"):
            self.logger.warning(
                "Lark token endpoint returned an error",
                extra={
                    "lark_error": token_response.get("error"),
                    "lark_error_description": token_response.get("error_description"),
                    "lark_code": token_response.get("code"),
                },
            )
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LARK_OAUTH_PROVIDER_ERROR"],
                error_message="LARK_OAUTH_PROVIDER_ERROR",
            )

        expires_in = token_response.get("expires_in")
        refresh_expires_in = token_response.get("refresh_token_expires_in")
        now_ts = datetime.now(tz=pytz.utc).timestamp()

        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token"),
                "access_token_expired_at": (
                    datetime.fromtimestamp(now_ts + expires_in, tz=pytz.utc) if expires_in else None
                ),
                "refresh_token_expired_at": (
                    datetime.fromtimestamp(now_ts + refresh_expires_in, tz=pytz.utc) if refresh_expires_in else None
                ),
                "id_token": "",
            }
        )

    def set_user_data(self):
        user_info_response = self.get_user_response()
        # Lark wraps the payload in {code, msg, data: {...}}.
        payload = user_info_response.get("data") or user_info_response or {}
        if user_info_response.get("code", 0) != 0 or not payload.get("email"):
            self.logger.warning(
                "Lark user_info returned an unexpected payload",
                extra={
                    "lark_code": user_info_response.get("code"),
                    "lark_msg": user_info_response.get("msg"),
                    "lark_keys": list(user_info_response.keys()) if isinstance(user_info_response, dict) else None,
                    "lark_payload_keys": list(payload.keys()) if isinstance(payload, dict) else None,
                    "has_email": bool(payload.get("email")),
                },
            )
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LARK_OAUTH_PROVIDER_ERROR"],
                error_message="LARK_OAUTH_PROVIDER_ERROR",
            )

        # Prefer union_id (stable across all apps in a tenant) for provider_id,
        # fall back to open_id (per-app stable).
        provider_id = payload.get("union_id") or payload.get("open_id")

        # Lark exposes a single display name. For Plane's first/last split, put
        # the full name into first_name and leave last_name empty — this avoids
        # mangling CJK names which don't follow a fixed first/last convention.
        full_name = payload.get("en_name") or payload.get("name") or ""

        user_data = {
            "email": payload.get("email"),
            "user": {
                "avatar": payload.get("avatar_url"),
                "first_name": full_name,
                "last_name": "",
                "provider_id": provider_id,
                "is_password_autoset": True,
            },
        }
        super().set_user_data(user_data)
