# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse

import pytz

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class KeycloakOAuthProvider(OauthAdapter):
    provider = "keycloak"
    scope = "openid email profile"

    def __init__(self, request, code=None, state=None, callback=None):
        (
            IS_KEYCLOAK_ENABLED,
            KEYCLOAK_HOST,
            KEYCLOAK_REALM,
            KEYCLOAK_CLIENT_ID,
            KEYCLOAK_CLIENT_SECRET,
        ) = get_configuration_value(
            [
                {
                    "key": "IS_KEYCLOAK_ENABLED",
                    "default": os.environ.get("IS_KEYCLOAK_ENABLED"),
                },
                {
                    "key": "KEYCLOAK_HOST",
                    "default": os.environ.get("KEYCLOAK_HOST"),
                },
                {
                    "key": "KEYCLOAK_REALM",
                    "default": os.environ.get("KEYCLOAK_REALM"),
                },
                {
                    "key": "KEYCLOAK_CLIENT_ID",
                    "default": os.environ.get("KEYCLOAK_CLIENT_ID"),
                },
                {
                    "key": "KEYCLOAK_CLIENT_SECRET",
                    "default": os.environ.get("KEYCLOAK_CLIENT_SECRET"),
                },
            ]
        )

        if not (IS_KEYCLOAK_ENABLED == "1" and KEYCLOAK_HOST and KEYCLOAK_REALM and KEYCLOAK_CLIENT_ID and KEYCLOAK_CLIENT_SECRET):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["KEYCLOAK_NOT_CONFIGURED"],
                error_message="KEYCLOAK_NOT_CONFIGURED",
            )

        # Enforce scheme and normalize trailing slash(es)
        parsed = urlparse(KEYCLOAK_HOST)
        if not parsed.scheme or parsed.scheme not in ("https", "http"):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["KEYCLOAK_NOT_CONFIGURED"],
                error_message="KEYCLOAK_NOT_CONFIGURED",
            )
        KEYCLOAK_HOST = KEYCLOAK_HOST.rstrip("/")
        # Set URLs based on the host and realm
        self.token_url = f"{KEYCLOAK_HOST}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
        self.userinfo_url = f"{KEYCLOAK_HOST}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/userinfo"

        client_id = KEYCLOAK_CLIENT_ID
        client_secret = KEYCLOAK_CLIENT_SECRET

        redirect_uri = f"{'https' if request.is_secure() else 'http'}://{request.get_host()}/auth/keycloak/callback/"
        url_params = {
            "client_id": client_id,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        auth_url = f"{KEYCLOAK_HOST}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/auth?{urlencode(url_params)}"

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
                    datetime.now(tz=pytz.utc) + timedelta(seconds=token_response.get("refresh_expires_in"))
                    if token_response.get("refresh_expires_in")
                    else None
                ),
                "id_token": token_response.get("id_token", ""),
            }
        )

    def set_user_data(self):
        user_info_response = self.get_user_response()

        email = user_info_response.get("email")
        first_name = user_info_response.get("given_name") or user_info_response.get("name", "")
        last_name = user_info_response.get("family_name", "")
        avatar = user_info_response.get("picture", None)

        super().set_user_data(
            {
                "email": email,
                "user": {
                    "provider_id": str(user_info_response.get("sub")),
                    "email": email,
                    "avatar": avatar,
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_password_autoset": True,
                },
            }
        )
