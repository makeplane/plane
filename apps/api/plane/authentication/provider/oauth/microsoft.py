# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os
from datetime import datetime
import pytz
import requests

from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class MicrosoftOAuthProvider(OauthAdapter):
    userinfo_url = "https://graph.microsoft.com/v1.0/me"
    scope = "openid email profile https://graph.microsoft.com/User.Read"
    provider = "microsoft"

    def __init__(self, request, code=None, state=None, callback=None):
        (MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID) = get_configuration_value(
            [
                {"key": "MICROSOFT_CLIENT_ID", "default": os.environ.get("MICROSOFT_CLIENT_ID")},
                {"key": "MICROSOFT_CLIENT_SECRET", "default": os.environ.get("MICROSOFT_CLIENT_SECRET")},
                {"key": "MICROSOFT_TENANT_ID", "default": os.environ.get("MICROSOFT_TENANT_ID")},
            ]
        )
        if not (MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["MICROSOFT_NOT_CONFIGURED"],
                error_message="MICROSOFT_NOT_CONFIGURED",
            )
        tenant = MICROSOFT_TENANT_ID or "common"
        self.token_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
        self.auth_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize"
        redirect_uri = f"""{"https" if request.is_secure() else "http"}://{request.get_host()}/auth/microsoft/callback/"""
        from urllib.parse import urlencode
        url_params = {
            "client_id": MICROSOFT_CLIENT_ID,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        auth_url = f"{self.auth_url}?{urlencode(url_params)}"
        super().__init__(
            request, self.provider, MICROSOFT_CLIENT_ID, self.scope, redirect_uri,
            auth_url, self.token_url, self.userinfo_url,
            client_secret=MICROSOFT_CLIENT_SECRET, code=code, callback=callback,
        )

    def set_token_data(self):
        data = {
            "code": self.code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
            "scope": self.scope,
        }
        token_response = self.get_user_token(data=data)
        super().set_token_data({
            "access_token": token_response.get("access_token", ""),
            "refresh_token": token_response.get("refresh_token", None),
            "access_token_expired_at": (
                datetime.fromtimestamp(token_response.get("expires_in"), tz=pytz.utc)
                if token_response.get("expires_in") else None
            ),
            "refresh_token_expired_at": None,
            "id_token": token_response.get("id_token", ""),
        })

    def set_user_data(self):
        headers = {"Authorization": f"Bearer {self.token_data.get('access_token')}"}
        user_info_response = requests.get(self.userinfo_url, headers=headers).json()
        email = user_info_response.get("mail") or user_info_response.get("userPrincipalName")
        user_data = {
            "email": email,
            "user": {
                "avatar": "",
                "first_name": user_info_response.get("givenName", ""),
                "last_name": user_info_response.get("surname", ""),
                "provider_id": user_info_response.get("id"),
                "is_password_autoset": True,
            },
        }
        super().set_user_data(user_data)
