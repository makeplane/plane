# Python imports
import os
import secrets
import hashlib
import base64
from datetime import datetime
from urllib.parse import urlencode

import pytz

# Module imports
from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class OIDCOAuthProvider(OauthAdapter):
    """
    OpenID Connect OAuth provider for Login.gov and other OIDC identity providers.

    Supports:
    - Login.gov (federal identity)
    - Azure AD Government
    - Any standard OIDC-compliant IdP

    Features:
    - PKCE flow (required by Login.gov)
    - Configurable endpoints via environment or admin panel
    - Standard OIDC claims mapping
    """

    provider = "oidc"

    def __init__(self, request, code=None, state=None, callback=None):
        # Get OIDC configuration from instance config or environment
        (
            OIDC_CLIENT_ID,
            OIDC_CLIENT_SECRET,
            OIDC_AUTHORIZATION_URL,
            OIDC_TOKEN_URL,
            OIDC_USERINFO_URL,
            OIDC_SCOPE,
        ) = get_configuration_value(
            [
                {
                    "key": "OIDC_CLIENT_ID",
                    "default": os.environ.get("OIDC_CLIENT_ID"),
                },
                {
                    "key": "OIDC_CLIENT_SECRET",
                    "default": os.environ.get("OIDC_CLIENT_SECRET"),
                },
                {
                    "key": "OIDC_AUTHORIZATION_URL",
                    "default": os.environ.get("OIDC_AUTHORIZATION_URL"),
                },
                {
                    "key": "OIDC_TOKEN_URL",
                    "default": os.environ.get("OIDC_TOKEN_URL"),
                },
                {
                    "key": "OIDC_USERINFO_URL",
                    "default": os.environ.get("OIDC_USERINFO_URL"),
                },
                {
                    "key": "OIDC_SCOPE",
                    "default": os.environ.get("OIDC_SCOPE", "openid email profile"),
                },
            ]
        )

        if not (OIDC_CLIENT_ID and OIDC_AUTHORIZATION_URL and OIDC_TOKEN_URL):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"],
                error_message="OIDC_NOT_CONFIGURED",
            )

        self.client_id = OIDC_CLIENT_ID
        self.client_secret = OIDC_CLIENT_SECRET
        self.scope = OIDC_SCOPE
        self.token_url = OIDC_TOKEN_URL
        self.userinfo_url = OIDC_USERINFO_URL

        # Generate PKCE challenge for Login.gov compliance
        self.code_verifier = None
        self.code_challenge = None
        if not code:  # Only generate on initiate, not callback
            self.code_verifier, self.code_challenge = self._generate_pkce_pair()

        redirect_uri = f"""{"https" if request.is_secure() else "http"}://{request.get_host()}/auth/oidc/callback/"""

        url_params = {
            "client_id": self.client_id,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }

        # Add PKCE parameters if generated (Login.gov requires S256)
        if self.code_challenge:
            url_params["code_challenge"] = self.code_challenge
            url_params["code_challenge_method"] = "S256"

        auth_url = f"{OIDC_AUTHORIZATION_URL}?{urlencode(url_params)}"

        super().__init__(
            request,
            self.provider,
            self.client_id,
            self.scope,
            redirect_uri,
            auth_url,
            self.token_url,
            self.userinfo_url,
            self.client_secret,
            code,
            callback=callback,
        )

    @staticmethod
    def _generate_pkce_pair():
        """
        Generate PKCE code verifier and challenge for Login.gov compliance.

        Returns:
            tuple: (code_verifier, code_challenge)
        """
        # Generate a high-entropy code verifier
        code_verifier = secrets.token_urlsafe(64)

        # Create S256 code challenge
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip('=')

        return code_verifier, code_challenge

    def set_token_data(self):
        data = {
            "code": self.code,
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }

        # Include client_secret if configured (some IdPs require it)
        if self.client_secret:
            data["client_secret"] = self.client_secret

        # Include PKCE code_verifier if available in session
        # Note: code_verifier is passed via session in the view layer
        if hasattr(self, '_code_verifier') and self._code_verifier:
            data["code_verifier"] = self._code_verifier

        token_response = self.get_user_token(data=data)
        super().set_token_data(
            {
                "access_token": token_response.get("access_token"),
                "refresh_token": token_response.get("refresh_token", None),
                "access_token_expired_at": (
                    datetime.fromtimestamp(
                        datetime.now(tz=pytz.utc).timestamp() + token_response.get("expires_in", 3600),
                        tz=pytz.utc
                    )
                    if token_response.get("expires_in")
                    else None
                ),
                "refresh_token_expired_at": None,
                "id_token": token_response.get("id_token", ""),
            }
        )

    def set_user_data(self):
        """
        Fetch user info from OIDC userinfo endpoint and map to Plane user format.

        Standard OIDC claims mapping:
        - sub -> provider_id (unique identifier)
        - email -> email
        - given_name / name -> first_name
        - family_name -> last_name
        - picture -> avatar
        """
        user_info_response = self.get_user_response()

        # Extract name - handle both split (given_name/family_name) and combined (name) formats
        first_name = user_info_response.get("given_name", "")
        last_name = user_info_response.get("family_name", "")

        # Fallback: if given_name not present, try to split "name"
        if not first_name and user_info_response.get("name"):
            name_parts = user_info_response.get("name", "").split(" ", 1)
            first_name = name_parts[0] if name_parts else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""

        user_data = {
            "email": user_info_response.get("email"),
            "user": {
                "avatar": user_info_response.get("picture", ""),
                "first_name": first_name,
                "last_name": last_name,
                "provider_id": user_info_response.get("sub"),  # OIDC uses 'sub' as unique ID
                "is_password_autoset": True,
            },
        }
        super().set_user_data(user_data)

    def set_code_verifier(self, code_verifier):
        """Set the PKCE code verifier from session storage."""
        self._code_verifier = code_verifier
