# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse
import pytz
import requests

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class OidcFreeOAuthProvider(OauthAdapter):
    provider = "oidc-free"

    def __read_option_from_env(self, option: str, default: str | None = None):
        env_default = os.environ.get(option)
        return {
            "key": option,
            "default": env_default if not default else env_default or default,
        }

    def __init__(self, request, code=None, state=None, callback=None):
        (
            OIDC_FREE_CLIENT_ID,
            OIDC_FREE_CLIENT_SECRET,
            OIDC_FREE_HOST,
            OIDC_FREE_SCOPE,
            OIDC_FREE_USERINFO_URL,
            OIDC_FREE_TOKEN_URL,
            OIDC_FREE_CALLBACK_URI,
            OIDC_FREE_AUTH_URI,
        ) = get_configuration_value(
            [
                self.__read_option_from_env("OIDC_FREE_CLIENT_ID"),
                self.__read_option_from_env("OIDC_FREE_CLIENT_SECRET"),
                self.__read_option_from_env("OIDC_FREE_HOST"),
                self.__read_option_from_env("OIDC_FREE_SCOPE", "openid email profile"),
                self.__read_option_from_env("OIDC_FREE_USERINFO_URL"),
                self.__read_option_from_env("OIDC_FREE_TOKEN_URL"),
                self.__read_option_from_env("OIDC_FREE_CALLBACK_URI"),
                self.__read_option_from_env("OIDC_FREE_AUTH_URI"),
            ]
        )

        if any(v is None for v in [
                OIDC_FREE_CLIENT_ID,
                OIDC_FREE_CLIENT_SECRET,
                OIDC_FREE_HOST,
                OIDC_FREE_SCOPE,
                OIDC_FREE_USERINFO_URL,
                OIDC_FREE_TOKEN_URL,
                OIDC_FREE_CALLBACK_URI,
                OIDC_FREE_AUTH_URI
        ]):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_FREE_NOT_CONFIGURED"],
                error_message="OIDC_FREE_NOT_CONFIGURED",
            )

        # Enforce scheme and normalize trailing slash(es)
        parsed = urlparse(OIDC_FREE_HOST)
        if not parsed.scheme or parsed.scheme not in ("https", "http"):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_FREE_NOT_CONFIGURED"],
                error_message="OIDC_FREE_NOT_CONFIGURED",  # avoid leaking details to query params
            )
        OIDC_FREE_HOST = OIDC_FREE_HOST.rstrip("/")

        # Set URLs based on the host
        self.token_url = f"{OIDC_FREE_HOST}/{OIDC_FREE_TOKEN_URL}"
        self.userinfo_url = f"{OIDC_FREE_HOST}/{OIDC_FREE_USERINFO_URL}"

        scope = OIDC_FREE_SCOPE
        client_id = OIDC_FREE_CLIENT_ID
        client_secret = OIDC_FREE_CLIENT_SECRET

        server_host = request.get_host() + (":" + request.get_port() if request.get_port() != 80 else "")
        redirect_uri = f"{'https' if request.is_secure() else 'http'}://{server_host}/{OIDC_FREE_CALLBACK_URI.lstrip('/')}"
        url_params = {
            "client_id": client_id,
            "scope": scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        auth_url = f"{OIDC_FREE_HOST}/{OIDC_FREE_AUTH_URI.lstrip('/')}?{urlencode(url_params)}"

        super().__init__(
            request,
            self.provider,
            client_id,
            scope,
            redirect_uri,
            auth_url,
            self.token_url,
            self.userinfo_url,
            client_secret,
            code,
            callback=callback,
        )

    def set_token_data(self):
        data = {
            "code": self.code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        headers = {"Accept": "application/json"}
        token_response = self.get_user_token(data=data, headers=headers)
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.now(tz=pytz.utc) + timedelta(seconds=token_response.get("expires_in"))
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": (
                    datetime.fromtimestamp(token_response.get("refresh_token_expired_at"), tz=pytz.utc)
                    if token_response.get("refresh_token_expired_at")
                    else None
                ),
                "id_token": token_response.get("id_token", ""),
            }
        )

    def __get_email(self, headers):
        try:
            # Gitea may not provide email in user response, so fetch it separately
            emails_url = f"{self.userinfo_url}/emails"
            response = requests.get(emails_url, headers=headers)
            if not response.ok:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["OIDC_FREE_OAUTH_PROVIDER_ERROR"],
                    error_message="OIDC_FREE_OAUTH_PROVIDER_ERROR: Failed to fetch emails",
                )
            emails_response = response.json()

            if not emails_response:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["OIDC_FREE_OAUTH_PROVIDER_ERROR"],
                    error_message="OIDC_FREE_OAUTH_PROVIDER_ERROR: No emails found",
                )
            # Prefer primary+verified, then any verified, then primary, else first
            email = next((e.get("email") for e in emails_response if e.get("primary") and e.get("verified")), None)
            if not email:
                email = next((e.get("email") for e in emails_response if e.get("verified")), None)
            if not email:
                email = next((e.get("email") for e in emails_response if e.get("primary")), None)
            if not email and emails_response:
                # If no primary email, use the first one
                email = emails_response[0].get("email")
            return email
        except requests.RequestException:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_FREE_OAUTH_PROVIDER_ERROR"],
                error_message="OIDC_FREE_OAUTH_PROVIDER_ERROR: Exception occurred while fetching emails",
            )

    def set_user_data(self):
        user_info_response = self.get_user_response()
        headers = {
            "Authorization": f"Bearer {self.token_data.get('access_token')}",
            "Accept": "application/json",
        }

        # Get email if not provided in user info
        email = user_info_response.get("email")
        # if not email:
        #     email = self.__get_email(headers=headers)

        super().set_user_data(
            {
                "email": email,
                "user": {
                    "provider_id": str(user_info_response.get("sub")),
                    "email": email,
                    # have to set empty string, to prevent violating non-null constraint
                    "avatar": user_info_response.get("avatar_url") or "",
                    "first_name": user_info_response.get("given_name") or user_info_response.get("login"),
                    "last_name": user_info_response.get("family_name"),
                    "is_password_autoset": True,
                },
            }
        )
