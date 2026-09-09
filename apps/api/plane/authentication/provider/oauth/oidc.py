# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Generic OpenID Connect (OIDC) provider.

Works with any spec-compliant identity provider that publishes a discovery
document at ``{issuer}/.well-known/openid-configuration`` (Keycloak, Authentik,
Okta, Auth0, Azure AD, Dex, ...). The flow is the standard authorization-code
flow with PKCE and a nonce-bound, signature-verified ID token.
"""

import base64
import hashlib
import logging
import os
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse

import jwt
import pytz
import requests
from django.core.cache import cache

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value

# Discovery documents change rarely; cache them so every login does not pay
# for an extra round-trip to the identity provider.
DISCOVERY_CACHE_TTL = 60 * 60
HTTP_TIMEOUT = 10

# Asymmetric algorithms are verified against the provider's JWKS; the HMAC
# family is verified against the client secret. Anything else (including
# ``none``) is rejected outright.
ASYMMETRIC_ALGORITHMS = ["RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"]
SYMMETRIC_ALGORITHMS = ["HS256", "HS384", "HS512"]


def _cache_key(prefix, value):
    return f"oidc:{prefix}:{hashlib.sha256(value.encode()).hexdigest()}"


class OIDCOAuthProvider(OauthAdapter):
    provider = "oidc"
    scope = "openid email profile"

    def __init__(self, request, code=None, state=None, callback=None, nonce=None, code_verifier=None):
        # The base adapter only sets this up in super().__init__(), which runs
        # after discovery below; the discovery path needs a logger too.
        self.logger = logging.getLogger("plane.authentication")
        (
            OIDC_ISSUER_URL,
            OIDC_CLIENT_ID,
            OIDC_CLIENT_SECRET,
            OIDC_REQUIRE_EMAIL_VERIFIED,
        ) = get_configuration_value(
            [
                {"key": "OIDC_ISSUER_URL", "default": os.environ.get("OIDC_ISSUER_URL")},
                {"key": "OIDC_CLIENT_ID", "default": os.environ.get("OIDC_CLIENT_ID")},
                {"key": "OIDC_CLIENT_SECRET", "default": os.environ.get("OIDC_CLIENT_SECRET")},
                {
                    "key": "OIDC_REQUIRE_EMAIL_VERIFIED",
                    "default": os.environ.get("OIDC_REQUIRE_EMAIL_VERIFIED", "0"),
                },
            ]
        )

        if not (OIDC_ISSUER_URL and OIDC_CLIENT_ID and OIDC_CLIENT_SECRET):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        parsed = urlparse(OIDC_ISSUER_URL)
        if parsed.scheme not in ("https", "http") or not parsed.netloc:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        self.issuer = OIDC_ISSUER_URL.rstrip("/")
        self.require_email_verified = OIDC_REQUIRE_EMAIL_VERIFIED == "1"
        self.nonce = nonce
        self.code_verifier = code_verifier
        self.id_token_claims = {}

        discovery = self._get_discovery_document()
        # The ``iss`` claim must match the issuer exactly as the provider
        # publishes it (some providers, e.g. Auth0, include a trailing slash).
        self.token_issuer = discovery.get("issuer")
        self.jwks_uri = discovery.get("jwks_uri")
        self.token_url = discovery.get("token_endpoint")
        self.userinfo_url = discovery.get("userinfo_endpoint")
        authorization_endpoint = discovery.get("authorization_endpoint")

        if not (authorization_endpoint and self.token_url and self.jwks_uri):
            self.logger.warning("OIDC discovery document is missing required endpoints")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        redirect_uri = f"{'https' if request.is_secure() else 'http'}://{request.get_host()}/auth/oidc/callback/"
        url_params = {
            "client_id": OIDC_CLIENT_ID,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        if nonce:
            url_params["nonce"] = nonce
        if code_verifier:
            url_params["code_challenge"] = self.compute_code_challenge(code_verifier)
            url_params["code_challenge_method"] = "S256"
        auth_url = f"{authorization_endpoint}?{urlencode(url_params)}"

        super().__init__(
            request,
            self.provider,
            OIDC_CLIENT_ID,
            self.scope,
            redirect_uri,
            auth_url,
            self.token_url,
            self.userinfo_url,
            OIDC_CLIENT_SECRET,
            code,
            callback=callback,
        )

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def compute_code_challenge(code_verifier):
        digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
        return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")

    def _provider_error(self, message):
        self.logger.warning("OIDC provider error: %s", message)
        return AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"],
            error_message="OIDC_OAUTH_PROVIDER_ERROR",
        )

    def _get_discovery_document(self):
        cache_key = _cache_key("discovery", self.issuer)
        discovery = cache.get(cache_key)
        if discovery:
            return discovery

        try:
            response = requests.get(
                f"{self.issuer}/.well-known/openid-configuration",
                headers={"Accept": "application/json"},
                timeout=HTTP_TIMEOUT,
            )
            response.raise_for_status()
            discovery = response.json()
        except (requests.RequestException, ValueError):
            self.logger.warning("Unable to fetch OIDC discovery document")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        # The discovery document's issuer MUST match the configured one
        # (OpenID Connect Discovery §4.3); anything else indicates
        # misconfiguration or a spoofed provider.
        if str(discovery.get("issuer", "")).rstrip("/") != self.issuer:
            self.logger.warning("OIDC discovery issuer does not match configured issuer")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        cache.set(cache_key, discovery, DISCOVERY_CACHE_TTL)
        return discovery

    def _fetch_jwks(self, force=False):
        cache_key = _cache_key("jwks", self.jwks_uri)
        jwks = None if force else cache.get(cache_key)
        if jwks:
            return jwks
        try:
            response = requests.get(self.jwks_uri, headers={"Accept": "application/json"}, timeout=HTTP_TIMEOUT)
            response.raise_for_status()
            jwks = response.json()
        except (requests.RequestException, ValueError):
            raise self._provider_error("unable to fetch JWKS")
        cache.set(cache_key, jwks, DISCOVERY_CACHE_TTL)
        return jwks

    def _get_signing_key(self, id_token):
        """Resolve the JWK that signed ``id_token``; refetch once on an unknown kid (key rotation)."""
        try:
            header = jwt.get_unverified_header(id_token)
        except jwt.PyJWTError:
            raise self._provider_error("malformed id_token header")
        kid = header.get("kid")

        for force in (False, True):
            keys = [k for k in self._fetch_jwks(force=force).get("keys", []) if k.get("use", "sig") == "sig"]
            if kid is not None:
                keys = [k for k in keys if k.get("kid") == kid]
            if keys:
                try:
                    return jwt.PyJWK.from_dict(keys[0]).key
                except jwt.PyJWTError:
                    raise self._provider_error("unusable signing key in JWKS")
        raise self._provider_error("no matching signing key in JWKS")

    def _verify_id_token(self, id_token):
        if not id_token:
            raise self._provider_error("missing id_token")

        try:
            header = jwt.get_unverified_header(id_token)
        except jwt.PyJWTError:
            raise self._provider_error("malformed id_token header")

        alg = header.get("alg")
        try:
            if alg in ASYMMETRIC_ALGORITHMS:
                signing_key = self._get_signing_key(id_token)
                algorithms = [alg]
            elif alg in SYMMETRIC_ALGORITHMS:
                signing_key = self.client_secret
                algorithms = [alg]
            else:
                raise self._provider_error(f"unsupported id_token alg {alg!r}")

            claims = jwt.decode(
                id_token,
                key=signing_key,
                algorithms=algorithms,
                audience=self.client_id,
                issuer=self.token_issuer,
                options={"require": ["exp", "iat", "iss", "sub", "aud"]},
                leeway=60,
            )
        except jwt.PyJWTError as e:
            raise self._provider_error(f"id_token verification failed: {e.__class__.__name__}")

        # Bind the token to this login attempt (OIDC Core §3.1.3.7 step 11).
        if self.nonce and claims.get("nonce") != self.nonce:
            raise self._provider_error("id_token nonce mismatch")

        # When the token carries multiple audiences the authorized party must be us.
        aud = claims.get("aud")
        if isinstance(aud, list) and len(aud) > 1 and claims.get("azp") != self.client_id:
            raise self._provider_error("id_token azp mismatch")

        return claims

    # ------------------------------------------------------------------ #
    # Adapter hooks
    # ------------------------------------------------------------------ #
    def set_token_data(self):
        data = {
            "code": self.code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        if self.code_verifier:
            data["code_verifier"] = self.code_verifier

        try:
            response = requests.post(
                self.token_url,
                data=data,
                headers={"Accept": "application/json"},
                timeout=HTTP_TIMEOUT,
            )
            response.raise_for_status()
            token_response = response.json()
        except (requests.RequestException, ValueError):
            raise self._provider_error("token exchange failed")

        self.id_token_claims = self._verify_id_token(token_response.get("id_token"))

        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.now(tz=pytz.utc) + timedelta(seconds=int(token_response.get("expires_in")))
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": (
                    datetime.now(tz=pytz.utc) + timedelta(seconds=int(token_response.get("refresh_expires_in")))
                    if token_response.get("refresh_expires_in")
                    else None
                ),
                "id_token": token_response.get("id_token", ""),
            }
        )

    def _get_userinfo_claims(self):
        """Fetch the UserInfo document; fall back to ID-token claims if unavailable."""
        if not self.userinfo_url or not self.token_data.get("access_token"):
            return {}
        try:
            response = requests.get(
                self.userinfo_url,
                headers={
                    "Authorization": f"Bearer {self.token_data.get('access_token')}",
                    "Accept": "application/json",
                },
                timeout=HTTP_TIMEOUT,
            )
            response.raise_for_status()
            claims = response.json()
        except (requests.RequestException, ValueError):
            # Do not log headers here: they carry the access token
            self.logger.warning("Unable to fetch OIDC userinfo; falling back to id_token claims")
            return {}

        # UserInfo sub MUST match the ID token sub (OIDC Core §5.3.2).
        if claims.get("sub") != self.id_token_claims.get("sub"):
            raise self._provider_error("userinfo sub mismatch")
        return claims

    def set_user_data(self):
        claims = {**self.id_token_claims, **self._get_userinfo_claims()}

        email = claims.get("email")
        if not email:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"],
                error_message="INVALID_EMAIL",
            )

        # Only enforce verification when the admin opted in: many self-hosted
        # IdPs (Keycloak included) never set email_verified for admin-created
        # users, which would otherwise lock everyone out.
        if self.require_email_verified and claims.get("email_verified") is not True:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OAUTH_PROVIDER_UNVERIFIED_EMAIL"],
                error_message="OAUTH_PROVIDER_UNVERIFIED_EMAIL",
            )

        first_name = claims.get("given_name") or ""
        last_name = claims.get("family_name") or ""
        if not first_name:
            full_name = (claims.get("name") or "").strip()
            if full_name:
                first_name, _, last_name = full_name.partition(" ")
            else:
                first_name = claims.get("preferred_username") or email.split("@")[0]

        super().set_user_data(
            {
                "email": email,
                "user": {
                    "provider_id": str(claims.get("sub")),
                    "email": email,
                    "avatar": claims.get("picture") or "",
                    "first_name": first_name,
                    "last_name": last_name,
                    "display_name": claims.get("preferred_username") or None,
                    "is_password_autoset": True,
                },
            }
        )
