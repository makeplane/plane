"""Plane OAuth provider for FastMCP.

This module provides a complete Plane OAuth integration that's ready to use
with just a client ID and client secret. It handles all the complexity of
Plane's OAuth flow, token validation, and user management.

Example:
    ```python
    from fastmcp import FastMCP
    from plane_mcp.plane_oauth_provider import PlaneOAuthProvider

    # Simple Plane OAuth protection
    auth = PlaneOAuthProvider(
        client_id="your-plane-client-id",
        client_secret="your-plane-client-secret",
        base_url="https://api.plane.so"
    )

    mcp = FastMCP("My Protected Server", auth=auth)
    ```
"""

from __future__ import annotations

import os
import time

import httpx
from fastmcp.server.auth import TokenVerifier
from fastmcp.server.auth.auth import AccessToken
from fastmcp.server.auth.oauth_proxy import OAuthProxy
from fastmcp.settings import ENV_FILE
from fastmcp.utilities.auth import parse_scopes
from fastmcp.utilities.logging import get_logger
from fastmcp.utilities.types import NotSet, NotSetT
from key_value.aio.protocols import AsyncKeyValue
from plane.models.users import UserLite
from pydantic import AnyHttpUrl, BaseModel, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from starlette.requests import Request

logger = get_logger(__name__)

# When true, user info (PII such as the display name) is included in logs.
# Defaults to false so PII is never logged unless explicitly opted in.
LOG_USER_INFO: bool = os.getenv("LOG_USER_INFO", "").lower() == "true"


DEFAULT_PLANE_BASE_URL = "https://api.plane.so"

# Name FastMCP's consent flow gives the cookie that remembers a Deny (it lives for a year).
_DENIED_CLIENTS_COOKIE = "MCP_DENIED_CLIENTS"


class WorkspaceDetail(BaseModel):
    """Workspace detail information."""

    name: str
    slug: str
    id: str
    logo_url: str | None = None


class PlaneOAuthAppInstallation(BaseModel):
    """Plane OAuth app installation information."""

    id: str
    workspace_detail: WorkspaceDetail
    created_at: str
    updated_at: str
    deleted_at: str | None = None
    status: str
    created_by: str | None = None
    updated_by: str | None = None
    workspace: str
    application: str
    installed_by: str
    app_bot: str
    webhook: str | None = None


class PlaneOAuthProviderSettings(BaseSettings):
    """Settings for Plane OAuth provider."""

    model_config = SettingsConfigDict(
        env_prefix="PLANE_OAUTH_PROVIDER_",
        env_file=ENV_FILE,
        extra="ignore",
    )

    client_id: str | None = None
    client_secret: SecretStr | None = None
    base_url: AnyHttpUrl | str | None = None
    issuer_url: AnyHttpUrl | str | None = None
    redirect_path: str | None = None
    required_scopes: list[str] | None = None
    timeout_seconds: int | None = None
    allowed_client_redirect_uris: list[str] | None = None
    jwt_signing_key: str | None = None
    plane_base_url: str | None = None
    plane_internal_base_url: str | None = None  # Internal URL for server-to-server calls
    enable_cimd: bool = False

    @field_validator("required_scopes", mode="before")
    @classmethod
    def _parse_scopes(cls, v):
        return parse_scopes(v)


class PlaneOAuthTokenVerifier(TokenVerifier):
    """Token verifier for Plane OAuth tokens.

    Plane OAuth tokens are verified by calling Plane's API to check if they're
    valid and get user info.
    """

    def __init__(
        self,
        *,
        required_scopes: list[str] | None = None,
        timeout_seconds: int = 10,
        plane_base_url: str | None = None,
    ):
        """Initialize the Plane token verifier.

        Args:
            required_scopes: Required OAuth scopes (currently not enforced by Plane API)
            timeout_seconds: HTTP request timeout
            plane_base_url: Base URL for Plane API (defaults to https://api.plane.so)
        """
        super().__init__(required_scopes=required_scopes)
        self.timeout_seconds = timeout_seconds
        self.plane_base_url = plane_base_url or os.getenv("PLANE_BASE_URL", DEFAULT_PLANE_BASE_URL)

    async def verify_token(self, token: str) -> AccessToken | None:
        """Verify Plane OAuth token by calling Plane API."""
        logger.info(f"verify_token called, token_present={bool(token)}, token_length={len(token) if token else 0}")
        try:
            # Build the user endpoint URL
            base_url = self.plane_base_url.rstrip("/")
            user_url = f"{base_url}/api/v1/users/me/"
            logger.info(f"Verifying token against: {user_url}")

            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                # Get current user info to verify token
                response = await client.get(
                    user_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                )

                logger.info(f"Plane API response status: {response.status_code}")
                if response.status_code != 200:
                    logger.info(
                        "Plane token verification failed: %s - %s",
                        response.status_code,
                        response.text[:200],
                    )
                    return None

                # Parse user data
                user_data = response.json()
                user = UserLite.model_validate(user_data)

                expires_at = int(time.time() + 3600)

                # display_name is PII — only log it when explicitly opted in.
                if LOG_USER_INFO:
                    logger.info(f"User verified: ({user.id}) - {user.display_name}")
                else:
                    logger.info(f"User verified: ({user.id})")

                installations_response = await client.get(
                    f"{base_url}/auth/o/app-installation/",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                )

                installations: list[PlaneOAuthAppInstallation] = installations_response.json()

                if not installations:
                    raise ValueError("No app installations found")

                installation = installations[0]

                # Create AccessToken with Plane user info
                return AccessToken(
                    token=token,
                    client_id=user.id or "unknown",
                    scopes=["read", "write"],  # Plane doesn't expose scopes in user endpoint
                    expires_at=expires_at,
                    claims={
                        "auth_method": "oauth",
                        "sub": user.id or "unknown",
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "display_name": user.display_name,
                        "avatar": user.avatar,
                        "avatar_url": user.avatar_url,
                        "plane_user_data": user_data,
                        "workspace_slug": installation.get("workspace_detail", {}).get("slug"),
                        "workspace": installation.get("workspace_detail", {}),
                    },
                )

        except httpx.RequestError as e:
            logger.info(f"Failed to verify Plane token (request error): {e}")
            return None
        except Exception as e:
            logger.info(f"Failed to verify Plane token: {e}", exc_info=True)
            return None


class PlaneOAuthProvider(OAuthProxy):
    """Complete Plane OAuth provider for FastMCP.

    This provider makes it trivial to add Plane OAuth protection to any
    FastMCP server. Just provide your Plane OAuth app credentials and
    a base URL, and you're ready to go.

    Features:
    - Transparent OAuth proxy to Plane
    - Automatic token validation via Plane API
    - User information extraction
    - Minimal configuration required

    Example:
        ```python
        from fastmcp import FastMCP
        from plane_mcp.plane_oauth_provider import PlaneOAuthProvider

        auth = PlaneOAuthProvider(
            client_id="your-client-id",
            client_secret="your-client-secret",
            base_url="https://my-server.com",
            plane_base_url="https://api.plane.so"
        )

        mcp = FastMCP("My App", auth=auth)
        ```
    """

    def __init__(
        self,
        *,
        client_id: str | NotSetT = NotSet,
        client_secret: str | NotSetT = NotSet,
        base_url: AnyHttpUrl | str | NotSetT = NotSet,
        issuer_url: AnyHttpUrl | str | NotSetT = NotSet,
        redirect_path: str | NotSetT = NotSet,
        required_scopes: list[str] | NotSetT = NotSet,
        timeout_seconds: int | NotSetT = NotSet,
        allowed_client_redirect_uris: list[str] | NotSetT = NotSet,
        client_storage: AsyncKeyValue | None = None,
        jwt_signing_key: str | bytes | NotSetT = NotSet,
        require_authorization_consent: bool = True,
        plane_base_url: str | NotSetT = NotSet,
        plane_internal_base_url: str | NotSetT = NotSet,
        enable_cimd: bool | NotSetT = NotSet,
    ):
        """Initialize Plane OAuth provider.

        Args:
            client_id: Plane OAuth app client ID
            client_secret: Plane OAuth app client secret
            base_url: Public URL where OAuth endpoints will be accessible
                (includes any mount path)
            issuer_url: Issuer URL for OAuth metadata (defaults to base_url).
                Use root-level URL to avoid 404s during discovery when mounting
                under a path.
            redirect_path: Redirect path configured in Plane OAuth app
                (defaults to "/auth/callback")
            required_scopes: Required Plane scopes
                (currently not enforced by Plane API)
            timeout_seconds: HTTP request timeout for Plane API calls
            allowed_client_redirect_uris: List of allowed redirect URI patterns
                for MCP clients. If None (default), all URIs are allowed.
                If empty list, no URIs are allowed.
            client_storage: Storage backend for OAuth state
                (client registrations, encrypted tokens). If None, a DiskStore
                will be created in the data directory (derived from
                `platformdirs`). The disk store will be encrypted using a key
                derived from the JWT Signing Key.
            jwt_signing_key: Secret for signing FastMCP JWT tokens
                (any string or bytes). If bytes are provided, they will be used
                as is. If a string is provided, it will be derived into a
                32-byte key. If not provided, the upstream client secret will be
                used to derive a 32-byte key using PBKDF2.
            require_authorization_consent: Whether to require user consent
                before authorizing clients (default True). When True, users see
                a consent screen before being redirected to Plane. When False,
                authorization proceeds directly without user confirmation.
                SECURITY WARNING: Only disable for local development or
                testing environments.
            plane_base_url: Base URL for Plane API
                (defaults to https://api.plane.so or PLANE_BASE_URL env var)
            enable_cimd: Whether to enable CIMD (Client ID Metadata Document) support.
                Defaults to False. Can be set via the PLANE_OAUTH_PROVIDER_ENABLE_CIMD environment variable.
        """

        settings = PlaneOAuthProviderSettings.model_validate(
            {
                k: v
                for k, v in {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "base_url": base_url,
                    "issuer_url": issuer_url,
                    "redirect_path": redirect_path,
                    "required_scopes": required_scopes,
                    "timeout_seconds": timeout_seconds,
                    "allowed_client_redirect_uris": allowed_client_redirect_uris,
                    "jwt_signing_key": jwt_signing_key,
                    "plane_base_url": plane_base_url,
                    "plane_internal_base_url": plane_internal_base_url,
                    "enable_cimd": enable_cimd,
                }.items()
                if v is not NotSet
            }
        )

        # Validate required settings
        if not settings.client_id:
            raise ValueError("client_id is required - set via parameter or PLANE_OAUTH_PROVIDER_CLIENT_ID")
        if not settings.client_secret:
            raise ValueError("client_secret is required - set via parameter or PLANE_OAUTH_PROVIDER_CLIENT_SECRET")

        # Apply defaults
        timeout_seconds_final = settings.timeout_seconds or 10
        required_scopes_final = settings.required_scopes or []
        allowed_client_redirect_uris_final = settings.allowed_client_redirect_uris
        plane_base_url_final = settings.plane_base_url or os.getenv("PLANE_BASE_URL", DEFAULT_PLANE_BASE_URL)
        # Internal URL for server-to-server calls (token exchange, API verification)
        # Falls back to external URL if not set
        plane_internal_url = (
            settings.plane_internal_base_url or os.getenv("PLANE_INTERNAL_BASE_URL") or plane_base_url_final
        )

        # Create Plane token verifier (uses internal URL for server-to-server calls)
        token_verifier = PlaneOAuthTokenVerifier(
            required_scopes=required_scopes_final,
            timeout_seconds=timeout_seconds_final,
            plane_base_url=plane_internal_url,
        )

        # Extract secret string from SecretStr
        client_secret_str = settings.client_secret.get_secret_value() if settings.client_secret else ""

        # Initialize OAuth proxy with Plane endpoints
        # Authorization: external URL (user's browser)
        # Token exchange: internal URL (server-to-server)
        super().__init__(
            upstream_authorization_endpoint=f"{plane_base_url_final}/auth/o/authorize-app/",
            upstream_token_endpoint=f"{plane_internal_url}/auth/o/token/",
            upstream_client_id=settings.client_id,
            upstream_client_secret=client_secret_str,
            token_verifier=token_verifier,
            base_url=settings.base_url,
            redirect_path=settings.redirect_path,
            issuer_url=settings.issuer_url or settings.base_url,  # Default to base_url if not specified
            allowed_client_redirect_uris=allowed_client_redirect_uris_final,
            client_storage=client_storage,
            jwt_signing_key=settings.jwt_signing_key,
            require_authorization_consent=require_authorization_consent,
            valid_scopes=["read", "write"],
            enable_cimd=settings.enable_cimd,
        )

        logger.info(
            "Initialized Plane OAuth provider for client %s with scopes: %s",
            settings.client_id,
            required_scopes_final,
        )

    def _decode_list_cookie(self, request: Request, base_name: str) -> list[str]:
        """Ignore FastMCP's year-long denied-clients cookie so a Deny only applies to that attempt."""
        if base_name == _DENIED_CLIENTS_COOKIE:
            return []
        return super()._decode_list_cookie(request, base_name)
