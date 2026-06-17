# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os
from datetime import datetime
from urllib.parse import urlencode

# Third party imports
import jwt
import pytz
import requests

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.license.utils.instance_value import get_configuration_value


class OIDCOAuthProvider(OauthAdapter):
    """
    Generic OpenID Connect provider. Works against any standards-compliant
    IdP (Keycloak, Kanidm, Authentik, Okta, Authelia, etc.).

    Configuration can be supplied either as a single OIDC_ISSUER (the
    authorization/token/userinfo/jwks endpoints are then auto-discovered
    from "<issuer>/.well-known/openid-configuration"), or as explicit
    endpoint URLs if the IdP doesn't support discovery or you want to pin
    them. Explicit values always take precedence over discovered ones.
    """

    provider = "oidc"
    default_scope = "openid email profile"

    def __init__(self, request, code=None, state=None, callback=None):
        (
            OIDC_ISSUER,
            OIDC_CLIENT_ID,
            OIDC_CLIENT_SECRET,
            OIDC_AUTHORIZATION_ENDPOINT,
            OIDC_TOKEN_ENDPOINT,
            OIDC_USERINFO_ENDPOINT,
            OIDC_JWKS_URI,
            OIDC_SCOPE,
        ) = get_configuration_value(
            [
                {"key": "OIDC_ISSUER", "default": os.environ.get("OIDC_ISSUER")},
                {"key": "OIDC_CLIENT_ID", "default": os.environ.get("OIDC_CLIENT_ID")},
                {
                    "key": "OIDC_CLIENT_SECRET",
                    "default": os.environ.get("OIDC_CLIENT_SECRET"),
                },
                {
                    "key": "OIDC_AUTHORIZATION_ENDPOINT",
                    "default": os.environ.get("OIDC_AUTHORIZATION_ENDPOINT"),
                },
                {
                    "key": "OIDC_TOKEN_ENDPOINT",
                    "default": os.environ.get("OIDC_TOKEN_ENDPOINT"),
                },
                {
                    "key": "OIDC_USERINFO_ENDPOINT",
                    "default": os.environ.get("OIDC_USERINFO_ENDPOINT"),
                },
                {"key": "OIDC_JWKS_URI", "default": os.environ.get("OIDC_JWKS_URI")},
                {
                    "key": "OIDC_SCOPE",
                    "default": os.environ.get("OIDC_SCOPE", self.default_scope),
                },
            ]
        )

        if not (
            OIDC_CLIENT_ID
            and OIDC_CLIENT_SECRET
            and (
                OIDC_ISSUER
                or (OIDC_AUTHORIZATION_ENDPOINT and OIDC_TOKEN_ENDPOINT and OIDC_USERINFO_ENDPOINT)
            )
        ):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        self.issuer = OIDC_ISSUER.rstrip("/") if OIDC_ISSUER else None
        self.jwks_uri = OIDC_JWKS_URI or None

        authorization_endpoint = OIDC_AUTHORIZATION_ENDPOINT
        token_endpoint = OIDC_TOKEN_ENDPOINT
        userinfo_endpoint = OIDC_USERINFO_ENDPOINT

        # Fill in anything that wasn't explicitly configured via discovery.
        # Explicit values always win over discovered ones.
        if self.issuer and not (authorization_endpoint and token_endpoint and userinfo_endpoint and self.jwks_uri):
            discovery = self._discover(self.issuer)
            authorization_endpoint = authorization_endpoint or discovery.get("authorization_endpoint")
            token_endpoint = token_endpoint or discovery.get("token_endpoint")
            userinfo_endpoint = userinfo_endpoint or discovery.get("userinfo_endpoint")
            self.jwks_uri = self.jwks_uri or discovery.get("jwks_uri")

        if not (authorization_endpoint and token_endpoint and userinfo_endpoint):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        client_id = OIDC_CLIENT_ID
        client_secret = OIDC_CLIENT_SECRET
        self.scope = OIDC_SCOPE or self.default_scope

        redirect_uri = (
            f"""{"https" if request.is_secure() else "http"}://{request.get_host()}/auth/oidc/callback/"""
        )
        url_params = {
            "client_id": client_id,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        auth_url = f"{authorization_endpoint}?{urlencode(url_params)}"

        super().__init__(
            request,
            self.provider,
            client_id,
            self.scope,
            redirect_uri,
            auth_url,
            token_endpoint,
            userinfo_endpoint,
            client_secret,
            code,
            callback=callback,
        )

    def _discover(self, issuer):
        try:
            response = requests.get(f"{issuer}/.well-known/openid-configuration", timeout=5)
            response.raise_for_status()
            return response.json()
        except (requests.RequestException, ValueError):
            self.logger.warning("Error fetching OIDC discovery document")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"],
                error_message="OIDC_OAUTH_PROVIDER_ERROR",
            )

    def set_token_data(self):
        data = {
            "code": self.code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        token_response = self.get_user_token(data=data)

        id_token = token_response.get("id_token", "")
        # Verify the ID token's signature against the IdP's published JWKS
        # whenever we have one (either configured explicitly or discovered).
        # This is the one piece real OIDC requires that Plane's other OAuth
        # providers skip entirely.
        if id_token and self.jwks_uri:
            self._verify_id_token(id_token)

        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.fromtimestamp(token_response.get("expires_in"), tz=pytz.utc)
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": (
                    datetime.fromtimestamp(token_response.get("refresh_token_expired_at"), tz=pytz.utc)
                    if token_response.get("refresh_token_expired_at")
                    else None
                ),
                "id_token": id_token,
            }
        )

    def _verify_id_token(self, id_token):
        try:
            jwk_client = jwt.PyJWKClient(self.jwks_uri)
            signing_key = jwk_client.get_signing_key_from_jwt(id_token)
            jwt.decode(
                id_token,
                signing_key.key,
                algorithms=[signing_key.algorithm_name],
                audience=self.client_id,
                issuer=self.issuer,
                options={"verify_iss": bool(self.issuer)},
            )
        except jwt.PyJWTError:
            self.logger.warning("OIDC id_token failed signature verification")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"],
                error_message="OIDC_OAUTH_PROVIDER_ERROR",
            )

    def set_user_data(self):
        user_info_response = self.get_user_response()
        user_data = {
            "email": user_info_response.get("email"),
            "user": {
                "avatar": user_info_response.get("picture", ""),
                "first_name": user_info_response.get("given_name")
                or user_info_response.get("name", ""),
                "last_name": user_info_response.get("family_name", ""),
                "provider_id": user_info_response.get("sub") or user_info_response.get("id"),
                "is_password_autoset": True,
            },
        }
        super().set_user_data(user_data)
