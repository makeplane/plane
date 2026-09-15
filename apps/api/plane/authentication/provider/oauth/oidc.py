# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""AI4MS Identity OIDC provider.

Implements the authorisation code flow with PKCE, ``state`` / ``nonce``
validation, JWKS signature verification and clock skew tolerance
(P0-ID-01). Identity mapping is delegated to
``plane.research.utils.identity.resolve_identity`` so the sub > email >
employee_id priority lives in one place.
"""

import base64
import hashlib
import logging
import os
import time
from datetime import datetime, timedelta
from urllib.parse import urlencode

import jwt
import pytz
import requests

# Django imports
from django.utils import timezone

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.adapter.oauth import OauthAdapter
from plane.db.models import Profile, User
from plane.research.utils.config import oidc_configured, oidc_settings
from plane.research.utils.identity import IdentityResolutionError, resolve_identity

DISCOVERY_CACHE_TTL_SECONDS = 300
_DISCOVERY_CACHE = {}


def get_oidc_discovery(issuer_url):
    """Fetch and cache the OIDC discovery document."""
    if not issuer_url:
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
            error_message="OIDC_NOT_CONFIGURED",
        )
    cached = _DISCOVERY_CACHE.get(issuer_url)
    now = time.monotonic()
    if cached and now - cached["fetched_at"] < DISCOVERY_CACHE_TTL_SECONDS:
        return cached["document"]

    discovery_url = f"{issuer_url.rstrip('/')}/.well-known/openid-configuration"
    try:
        response = requests.get(discovery_url, timeout=10)
        response.raise_for_status()
        document = response.json()
    except Exception:
        logging.getLogger("plane.authentication").warning("Unable to load OIDC discovery document")
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
            error_message="OIDC_PROVIDER_ERROR",
        )

    if not document.get("authorization_endpoint") or not document.get("token_endpoint"):
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
            error_message="OIDC_PROVIDER_ERROR",
        )
    _DISCOVERY_CACHE[issuer_url] = {"document": document, "fetched_at": now}
    return document


def generate_pkce_pair():
    verifier = base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("=")
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    return verifier, challenge


def verify_id_token(id_token, *, issuer, client_id, jwks_uri, nonce=None, leeway=120):
    """Verify an ``id_token`` and return its claims."""
    if not id_token:
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
            error_message="OIDC_PROVIDER_ERROR",
        )
    try:
        if jwks_uri:
            signing_key = jwt.PyJWKClient(jwks_uri).get_signing_key_from_jwt(id_token)
            key = signing_key.key
        else:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                error_message="OIDC_PROVIDER_ERROR",
            )
        claims = jwt.decode(
            id_token,
            key,
            algorithms=["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
            audience=client_id,
            issuer=issuer,
            leeway=leeway,
            options={"require": ["exp", "iat", "sub"]},
        )
    except AuthenticationException:
        raise
    except jwt.PyJWTError:
        # deliberately opaque: never leak token contents or verification detail
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
            error_message="OIDC_PROVIDER_ERROR",
        )

    if nonce and claims.get("nonce") != nonce:
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
            error_message="OIDC_PROVIDER_ERROR",
        )
    return claims


EMPLOYEE_ID_CLAIMS = ("employee_id", "employeeId", "employee_number", "student_id", "staff_id")


def extract_employee_id(claims):
    for key in EMPLOYEE_ID_CLAIMS:
        value = claims.get(key)
        if value:
            return str(value)
    return None


class OIDCOauthProvider(OauthAdapter):
    """OIDC provider used by the AI4MS portal sign-in button."""

    scope = "openid profile email"

    def __init__(self, request, state=None, nonce=None, code_verifier=None, code=None, callback=None):
        config = oidc_settings()
        if not oidc_configured():
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        discovery = get_oidc_discovery(config["issuer_url"])
        redirect_uri = config["redirect_uri"] or (
            f"{'https' if request.is_secure() else 'http'}://{request.get_host()}/auth/oidc/callback/"
        )

        super().__init__(
            request=request,
            provider=config["provider"],
            client_id=config["client_id"],
            scope=config["scopes"] or self.scope,
            redirect_uri=redirect_uri,
            auth_url=discovery["authorization_endpoint"],
            token_url=discovery["token_endpoint"],
            userinfo_url=discovery.get("userinfo_endpoint"),
            client_secret=config["client_secret"],
            code=code,
            callback=callback,
        )
        self.state = state
        self.nonce = nonce
        self.code_verifier = code_verifier
        self.issuer = discovery.get("issuer") or config["issuer_url"]
        self.jwks_uri = discovery.get("jwks_uri")
        self.enable_pkce = config["enable_pkce"]
        self.auto_provision_users = config["auto_provision_users"]
        self.claims = {}

    def authentication_error_code(self):
        return "OIDC_PROVIDER_ERROR"

    def get_auth_url(self):
        params = {
            "client_id": self.client_id,
            "scope": self.scope,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
        }
        if self.state:
            params["state"] = self.state
        if self.nonce:
            params["nonce"] = self.nonce
        if self.enable_pkce and self.code_verifier:
            params["code_challenge"] = (
                base64.urlsafe_b64encode(hashlib.sha256(self.code_verifier.encode()).digest()).decode().rstrip("=")
            )
            params["code_challenge_method"] = "S256"
        return f"{self.auth_url}?{urlencode(params)}"

    def set_token_data(self):
        data = {
            "grant_type": "authorization_code",
            "code": self.code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
        }
        if self.client_secret:
            data["client_secret"] = self.client_secret
        if self.code_verifier:
            data["code_verifier"] = self.code_verifier

        token_response = self.get_user_token(data=data, headers={"Accept": "application/json"})
        self.claims = verify_id_token(
            token_response.get("id_token"),
            issuer=self.issuer,
            client_id=self.client_id,
            jwks_uri=self.jwks_uri,
            nonce=self.nonce,
        )
        expires_in = token_response.get("expires_in")
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token"),
                "access_token_expired_at": (
                    datetime.now(tz=pytz.utc) + timedelta(seconds=expires_in) if expires_in else None
                ),
                "refresh_token_expired_at": None,
                "id_token": token_response.get("id_token", ""),
                "subject": self.claims.get("sub"),
            }
        )

    def set_user_data(self):
        claims = self.claims
        email = claims.get("email")
        display_name = claims.get("name") or claims.get("preferred_username")
        first_name = claims.get("given_name") or ""
        last_name = claims.get("family_name") or ""
        if not first_name and not last_name and display_name:
            parts = str(display_name).split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

        self.user_data = {
            "email": email,
            "subject": claims.get("sub"),
            "employee_id": extract_employee_id(claims),
            "email_verified": claims.get("email_verified"),
            "user": {
                "provider_id": claims.get("sub"),
                "display_name": display_name,
                "first_name": first_name,
                "last_name": last_name,
                "avatar": claims.get("picture") or "",
                "is_password_autoset": True,
            },
        }
        return self.user_data

    def complete_login_or_signup(self):
        """Resolve the SSO identity instead of the generic email-only flow."""
        claims = self.claims
        try:
            user, is_signup, mapping = resolve_identity(
                provider=self.provider,
                subject=claims.get("sub"),
                email=claims.get("email"),
                employee_id=extract_employee_id(claims),
                request=self.request,
                allow_auto_provision=self.auto_provision_users,
            )
        except IdentityResolutionError as error:
            raise self._identity_exception(error)

        if not user.is_active and user.last_logout_time is not None:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ACCOUNT_DEACTIVATED"],
                error_message="USER_ACCOUNT_DEACTIVATED",
                payload={"email": user.email},
            )
        if user.is_bot:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["BOT_USER_LOGIN_FORBIDDEN"],
                error_message="BOT_USER_LOGIN_FORBIDDEN",
                payload={"email": user.email},
            )

        if is_signup:
            if not Profile.objects.filter(user=user).exists():
                Profile.objects.create(user=user)
        else:
            user = self.sync_user_data(user=user)

        user = self.save_user_data(user=user)

        if self.callback:
            self.callback(user, is_signup, self.request)

        if mapping is not None and self.token_data:
            self.create_update_account(user=user)
        return user

    def create_update_account(self, user):
        from plane.db.models import Account

        subject = self.claims.get("sub")
        if not subject:
            return
        account, _ = Account.objects.update_or_create(
            user=user,
            provider=self.provider,
            provider_account_id=subject,
            defaults={
                "access_token": self.token_data.get("access_token"),
                "refresh_token": None,
                "access_token_expired_at": self.token_data.get("access_token_expired_at"),
                "refresh_token_expired_at": None,
                "last_connected_at": timezone.now(),
                "id_token": self.token_data.get("id_token", ""),
            },
        )
        return account

    def check_sync_enabled(self):
        # OIDC profile sync is driven by the id_token on every login
        return True

    def save_user_data(self, user):
        # ``User.last_login_uagent`` is NOT NULL; clients that omit the header
        # would otherwise break the login flow with a database error.
        if not self.request.META.get("HTTP_USER_AGENT"):
            self.request.META["HTTP_USER_AGENT"] = ""
        return super().save_user_data(user=user)

    def _identity_exception(self, error):
        if error.error_code == "identity_not_provisioned":
            code = "OIDC_IDENTITY_NOT_PROVISIONED"
        elif error.error_code in ("identity_mapping_inactive", "identity_user_inactive"):
            code = "USER_ACCOUNT_DEACTIVATED"
        else:
            code = "OIDC_IDENTITY_CONFLICT"
        return AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES[code],
            error_message=code,
            payload=error.metadata,
        )
