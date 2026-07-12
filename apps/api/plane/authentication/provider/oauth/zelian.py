# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Clean-room OIDC provider for the Zelian Supabase OAuth 2.1 server.
# Modelled on the CE `gitea` provider (host-configurable OAuth), with the two
# additions the Supabase OAuth 2.1 server requires: PKCE (S256) and
# `client_secret_basic` authentication at the token endpoint.

import base64
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


class ZelianOAuthProvider(OauthAdapter):
    provider = "zelian"
    scope = "openid email profile"

    def __init__(self, request, code=None, state=None, callback=None, code_challenge=None, code_verifier=None):
        (ZELIAN_AUTH_BASE_URL, ZELIAN_CLIENT_ID, ZELIAN_CLIENT_SECRET) = get_configuration_value(
            [
                {
                    "key": "ZELIAN_AUTH_BASE_URL",
                    "default": os.environ.get("ZELIAN_AUTH_BASE_URL"),
                },
                {
                    "key": "ZELIAN_CLIENT_ID",
                    "default": os.environ.get("ZELIAN_CLIENT_ID"),
                },
                {
                    "key": "ZELIAN_CLIENT_SECRET",
                    "default": os.environ.get("ZELIAN_CLIENT_SECRET"),
                },
            ]
        )

        if not (ZELIAN_AUTH_BASE_URL and ZELIAN_CLIENT_ID and ZELIAN_CLIENT_SECRET):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ZELIAN_NOT_CONFIGURED"],
                error_message="ZELIAN_NOT_CONFIGURED",
            )

        # Enforce scheme and normalize trailing slash(es)
        parsed = urlparse(ZELIAN_AUTH_BASE_URL)
        if not parsed.scheme or parsed.scheme not in ("https", "http"):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ZELIAN_NOT_CONFIGURED"],
                error_message="ZELIAN_NOT_CONFIGURED",  # avoid leaking details to query params
            )
        # ex. https://<ref>.supabase.co/auth/v1
        base = ZELIAN_AUTH_BASE_URL.rstrip("/")

        self.token_url = f"{base}/oauth/token"
        self.userinfo_url = f"{base}/oauth/userinfo"
        self.code_verifier = code_verifier

        client_id = ZELIAN_CLIENT_ID
        client_secret = ZELIAN_CLIENT_SECRET

        redirect_uri = f"{'https' if request.is_secure() else 'http'}://{request.get_host()}/auth/zelian/callback/"
        url_params = {
            "client_id": client_id,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        # PKCE — mandatory on the OAuth 2.1 server
        if code_challenge:
            url_params["code_challenge"] = code_challenge
            url_params["code_challenge_method"] = "S256"
        auth_url = f"{base}/oauth/authorize?{urlencode(url_params)}"

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
            "grant_type": "authorization_code",
            "code": self.code,
            "redirect_uri": self.redirect_uri,
            "code_verifier": self.code_verifier,
        }
        # client_secret_basic — the client id/secret go in the Authorization header
        basic = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        headers = {
            "Accept": "application/json",
            "Authorization": f"Basic {basic}",
        }
        token_response = self.get_user_token(data=data, headers=headers)
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.now(tz=pytz.utc) + timedelta(seconds=int(token_response.get("expires_in")))
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": None,
                "id_token": token_response.get("id_token", ""),
            }
        )

    def set_user_data(self):
        # Supabase userinfo by scope: sub (openid) · email, email_verified (email)
        # · name, picture (profile)
        user_info_response = self.get_user_response()
        email = user_info_response.get("email")
        name = (user_info_response.get("name") or "").strip()
        first_name, _, last_name = name.partition(" ")
        super().set_user_data(
            {
                "email": email,
                "user": {
                    "provider_id": user_info_response.get("sub"),
                    "email": email,
                    "avatar": user_info_response.get("picture", ""),
                    "first_name": first_name or (email.split("@")[0] if email else ""),
                    "last_name": last_name,
                    "is_password_autoset": True,
                },
            }
        )
