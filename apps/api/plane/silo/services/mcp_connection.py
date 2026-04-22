# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import base64
import hashlib
import logging
import re
import secrets
import time
from datetime import timedelta
from urllib.parse import quote, urljoin, urlparse

# Third party imports
import httpx
import requests
from asgiref.sync import async_to_sync
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client

# Module imports
from plane.utils.encryption import encrypt, decrypt

logger = logging.getLogger("plane.silo.services.mcp_connection")

# Timeout for outgoing HTTP requests to MCP servers (seconds)
MCP_REQUEST_TIMEOUT = 15


def _mcp_error_from_exc(exc):
    cause = exc
    while hasattr(cause, "exceptions") and getattr(cause, "exceptions", None):
        cause = cause.exceptions[0]
    if isinstance(cause, httpx.TimeoutException):
        return "Connection timed out."
    if isinstance(cause, httpx.ConnectError):
        return "Could not reach the MCP server."
    if isinstance(cause, httpx.HTTPStatusError):
        return f"HTTP {cause.response.status_code} error."
    return None


async def _probe_mcp_async(url, headers):
    """
    Probe an MCP server using the MCP SDK with full protocol handshake.

    1. Open a streamable HTTP transport session (MCP 2025 spec)
    2. session.initialize()  — negotiate protocol version + capabilities
    3. session.list_tools()  — fetch available tools
    """
    auth_headers = headers or {}
    timeout_td = timedelta(seconds=MCP_REQUEST_TIMEOUT)

    try:
        async with (
            streamablehttp_client(url, headers=auth_headers, timeout=timeout_td) as (read, write, _),
            ClientSession(read, write) as session,
        ):
            await session.initialize()
            result = await session.list_tools()
            tools = [t.name for t in result.tools]
            return True, {
                "tools_count": len(tools),
            }
    except Exception as exc:
        err_msg = _mcp_error_from_exc(exc)
        if err_msg:
            return False, {"error": err_msg}
        logger.warning("Streamable HTTP probe failed for %s", url, exc_info=True)
        return False, {"error": "Connection failed."}


def test_mcp_connection(url, headers=None):
    """
    Test connectivity to an MCP server URL with optional auth headers using the MCP SDK.
    """
    try:
        return async_to_sync(_probe_mcp_async)(url, headers)
    except Exception:
        logger.warning("Unexpected error testing MCP connection to %s", url, exc_info=True)
        return False, {"error": "Unexpected error during connection test."}


# ---------------------------------------------------------------------------
# OAuth helpers
# ---------------------------------------------------------------------------


def generate_pkce():
    """
    Generate PKCE code_verifier and code_challenge (S256).

    Returns:
        tuple: (code_verifier, code_challenge)
    """
    code_verifier = secrets.token_urlsafe(96)  # produces exactly 128 URL-safe chars (RFC 7636)
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge


def _parse_www_authenticate(header_value):
    """
    Parse the WWW-Authenticate header to extract the resource_metadata URL.

    Handles the Bearer scheme with optional parameters like:
        Bearer resource_metadata="https://..."
    """
    match = re.search(r'resource_metadata="([^"]+)"', header_value)
    if match:
        return match.group(1)
    return None


def _build_prm_discovery_urls(www_auth_url, mcp_url):
    """
    Build ordered list of URLs to try for Protected Resource Metadata
    discovery per SEP-985.

    Priority:
        1. resource_metadata URL from WWW-Authenticate header (if present)
        2. Path-based well-known URI: /.well-known/oauth-protected-resource/{path}
        3. Root-based well-known URI: /.well-known/oauth-protected-resource

    Args:
        www_auth_url: Optional resource_metadata URL from WWW-Authenticate.
        mcp_url: The MCP server URL.

    Returns:
        list[str]: Ordered list of URLs to try.
    """
    urls = []
    parsed = urlparse(mcp_url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    if www_auth_url:
        urls.append(www_auth_url)

    path = parsed.path.rstrip("/")
    if path:
        urls.append(f"{base_url}/.well-known/oauth-protected-resource{path}")

    urls.append(f"{base_url}/.well-known/oauth-protected-resource")
    return urls


def _build_as_metadata_discovery_urls(auth_server_url, mcp_url):
    """
    Build ordered list of URLs to try for Authorization Server Metadata
    discovery per RFC 8414 with OIDC fallback.

    Priority (when auth_server_url has a path):
        1. /.well-known/oauth-authorization-server{path}
        2. /.well-known/openid-configuration{path}
        3. {path}/.well-known/openid-configuration

    Priority (when auth_server_url has no path):
        1. /.well-known/oauth-authorization-server
        2. /.well-known/openid-configuration

    Args:
        auth_server_url: Authorization server URL from PRM.
        mcp_url: The MCP server URL (fallback if auth_server_url is None).

    Returns:
        list[str]: Ordered list of URLs to try.
    """
    target = auth_server_url or mcp_url
    parsed = urlparse(target)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    path = parsed.path.rstrip("/")
    urls = []

    if path and path != "/":
        urls.append(urljoin(base_url, f"/.well-known/oauth-authorization-server{path}"))
        urls.append(urljoin(base_url, f"/.well-known/openid-configuration{path}"))
        urls.append(urljoin(base_url, f"{path}/.well-known/openid-configuration"))
    else:
        urls.append(urljoin(base_url, "/.well-known/oauth-authorization-server"))
        urls.append(urljoin(base_url, "/.well-known/openid-configuration"))

    return urls


def discover_oauth_metadata(mcp_url):
    """
    Phase 1 — OAuth Discovery.

    1. GET mcp_url → expect 401 with WWW-Authenticate header
    2. GET Protected Resource Metadata (PRM, RFC 9728) — with SEP-985 fallbacks
    3. GET Authorization Server Metadata (RFC 8414) — with OIDC fallback

    Args:
        mcp_url: The MCP server URL.

    Returns:
        dict with keys:
            authorization_endpoint, token_endpoint,
            registration_endpoint (optional), scopes_supported,
            resource (MCP server URL)
    """
    # Step 1: Hit MCP server to get 401 + WWW-Authenticate
    www_auth_resource_url = None
    try:
        resp = requests.get(mcp_url, timeout=MCP_REQUEST_TIMEOUT)
        if resp.status_code == 401:
            www_auth = resp.headers.get("WWW-Authenticate", "")
            www_auth_resource_url = _parse_www_authenticate(www_auth)
    except Exception as e:
        raise ValueError(f"Could not reach MCP server: {e}")

    # Step 2: Fetch Protected Resource Metadata (PRM) — try fallback URLs
    prm_urls = _build_prm_discovery_urls(www_auth_resource_url, mcp_url)
    prm_data = None

    for prm_url in prm_urls:
        try:
            prm_resp = requests.get(prm_url, timeout=MCP_REQUEST_TIMEOUT)
            if prm_resp.status_code == 200:
                prm_data = prm_resp.json()
                break
        except Exception:
            logger.debug("PRM fetch failed for %s", prm_url, exc_info=True)
            continue

    if not prm_data:
        raise ValueError(
            f"Could not fetch OAuth protected resource metadata. "
            f"Tried: {prm_urls}"
        )

    auth_servers = prm_data.get("authorization_servers", [])
    if not auth_servers:
        raise ValueError("No authorization servers found in protected resource metadata")

    auth_server_url = auth_servers[0]

    # Step 3: Fetch Authorization Server Metadata — try fallback URLs
    as_urls = _build_as_metadata_discovery_urls(auth_server_url, mcp_url)
    as_data = None

    for as_url in as_urls:
        try:
            as_resp = requests.get(as_url, timeout=MCP_REQUEST_TIMEOUT)
            if as_resp.status_code == 200:
                as_data = as_resp.json()
                break
        except Exception:
            logger.debug("AS metadata fetch failed for %s", as_url, exc_info=True)
            continue

    if not as_data:
        raise ValueError(
            f"Could not fetch authorization server metadata. "
            f"Tried: {as_urls}"
        )

    return {
        "authorization_endpoint": as_data.get("authorization_endpoint"),
        "token_endpoint": as_data.get("token_endpoint"),
        "registration_endpoint": as_data.get("registration_endpoint"),
        "scopes_supported": as_data.get("scopes_supported", []),
        "resource": prm_data.get("resource", mcp_url),
    }


def register_oauth_client(registration_endpoint, redirect_uri, client_name="Plane"):
    """
    Phase 2 — Dynamic Client Registration (RFC 7591).

    Args:
        registration_endpoint: The DCR endpoint URL.
        redirect_uri: The OAuth callback URL.
        client_name: Human-readable name for the client.

    Returns:
        dict: {client_id, client_secret, token_endpoint_auth_method}
    """
    payload = {
        "client_name": client_name,
        "redirect_uris": [redirect_uri],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "client_secret_post",
    }

    try:
        resp = requests.post(
            registration_endpoint,
            json=payload,
            timeout=MCP_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        raise ValueError(f"Dynamic client registration failed: {e}")

    client_id = data.get("client_id")
    if not client_id:
        raise ValueError("DCR response missing client_id")

    return {
        "client_id": client_id,
        "client_secret": data.get("client_secret", ""),
        "token_endpoint_auth_method": data.get(
            "token_endpoint_auth_method", "client_secret_post"
        ),
    }


def _prepare_token_auth(payload, client_id, client_secret, auth_method="client_secret_post"):
    """
    Prepare token request authentication based on the server's preferred method.

    Supports:
        - client_secret_post: include client_secret in body (default)
        - client_secret_basic: HTTP Basic auth in Authorization header (RFC 6749 §2.3.1)
        - none: no client authentication

    Args:
        payload: The form data dict (mutated in-place for client_secret_post).
        client_id: OAuth client ID.
        client_secret: OAuth client secret.
        auth_method: One of "client_secret_post", "client_secret_basic", "none".

    Returns:
        dict: Extra headers to include in the token request.
    """
    extra_headers = {}

    if auth_method == "client_secret_basic" and client_id and client_secret:
        # RFC 6749 Section 2.3.1: URL-encode then Base64
        encoded_id = quote(client_id, safe="")
        encoded_secret = quote(client_secret, safe="")
        credentials = f"{encoded_id}:{encoded_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        extra_headers["Authorization"] = f"Basic {encoded}"
        # Remove client_secret from body for basic auth
        payload.pop("client_secret", None)
    elif auth_method == "client_secret_post" and client_secret:
        payload["client_secret"] = client_secret
    # For auth_method == "none", don't add anything

    return extra_headers


def _post_token_request(token_endpoint, payload, client_id, client_secret, auth_method, error_prefix):
    """
    Send a form-encoded POST to a token endpoint and return the parsed response.

    Applies ``_prepare_token_auth`` to add the appropriate client credentials,
    then raises ``ValueError`` on any HTTP or missing-token error.
    """
    extra_headers = _prepare_token_auth(payload, client_id, client_secret, auth_method)
    try:
        resp = requests.post(
            token_endpoint,
            data=payload,
            headers=extra_headers or None,
            timeout=MCP_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        raise ValueError(f"{error_prefix} failed: {e}")


def exchange_oauth_code(
    token_endpoint,
    code,
    client_id,
    client_secret,
    redirect_uri,
    code_verifier,
    resource=None,
    token_endpoint_auth_method="client_secret_post",
):
    """
    Phase 4 — Exchange authorization code for tokens (with PKCE verification).

    Args:
        token_endpoint: The token endpoint URL.
        code: The authorization code from callback.
        client_id: OAuth client ID.
        client_secret: OAuth client secret.
        redirect_uri: The redirect URI used in the authorization request.
        code_verifier: The PKCE code verifier.
        resource: Optional resource indicator (MCP server URL, RFC 8707).
        token_endpoint_auth_method: Auth method ("client_secret_post" or "client_secret_basic").

    Returns:
        dict: {access_token, refresh_token, expires_in, token_issued_at}
    """
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "code_verifier": code_verifier,
    }
    if resource:
        payload["resource"] = resource

    data = _post_token_request(
        token_endpoint, payload, client_id, client_secret, token_endpoint_auth_method, "Token exchange"
    )

    access_token = data.get("access_token")
    if not access_token:
        raise ValueError("Token response missing access_token")

    return {
        "access_token": access_token,
        "refresh_token": data.get("refresh_token", ""),
        "expires_in": data.get("expires_in"),
        "token_issued_at": int(time.time()),
    }


def refresh_oauth_token(
    token_endpoint,
    refresh_token,
    client_id,
    client_secret=None,
    resource=None,
    token_endpoint_auth_method="client_secret_post",
):
    """
    Refresh an OAuth access token using the refresh_token grant.

    Args:
        token_endpoint: The token endpoint URL.
        refresh_token: The refresh token.
        client_id: OAuth client ID.
        client_secret: OAuth client secret (optional).
        resource: Optional resource indicator (MCP server URL, RFC 8707).
        token_endpoint_auth_method: Auth method ("client_secret_post" or "client_secret_basic").

    Returns:
        dict: {access_token, refresh_token, expires_in, token_issued_at}
    """
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
    }
    if resource:
        payload["resource"] = resource

    data = _post_token_request(
        token_endpoint, payload, client_id, client_secret, token_endpoint_auth_method, "Token refresh"
    )

    access_token = data.get("access_token")
    if not access_token:
        raise ValueError("Token refresh response missing access_token")

    return {
        "access_token": access_token,
        "refresh_token": data.get("refresh_token", refresh_token),
        "expires_in": data.get("expires_in"),
        "token_issued_at": int(time.time()),
    }


def is_token_expired(auth_config, buffer_seconds=300):
    """
    Check whether the stored OAuth access token has expired or is about to.

    Uses ``token_issued_at`` + ``expires_in`` from auth_config.
    Returns True if the token will expire within ``buffer_seconds`` (default 5 min).
    Returns False if expiry information is missing (treat as valid).
    """
    issued_at = auth_config.get("token_issued_at")
    expires_in = auth_config.get("expires_in")

    if not issued_at or not expires_in:
        return False

    return time.time() > (issued_at + expires_in - buffer_seconds)


# ---------------------------------------------------------------------------
# Auth config encryption / decryption
# ---------------------------------------------------------------------------

# Keys within auth_config whose values should be encrypted at rest.
# "value" applies to the HEADER path only (handled separately via early-return above).
# The remaining keys apply to the flat OAuth config path.
_SENSITIVE_KEYS = {"value", "access_token", "refresh_token", "client_secret"}


def _encrypt_value(plain_text):
    """Encrypt a string and return the iv:ciphertext:tag representation."""
    encrypted = encrypt(plain_text)
    return f"{encrypted['iv']}:{encrypted['ciphertext']}:{encrypted['tag']}"


def _decrypt_value(encrypted_str):
    """Decrypt an iv:ciphertext:tag string and return the plain text."""
    parts = encrypted_str.split(":")
    if len(parts) != 3:
        return encrypted_str  # not encrypted or wrong format
    return decrypt({"iv": parts[0], "ciphertext": parts[1], "tag": parts[2]})


def encrypt_auth_config(auth_config):
    """
    Encrypt sensitive values in an auth_config dict.

    For HEADER-type configs with a ``headers`` list, encrypts each header's
    ``value``. For OAuth-type configs, encrypts ``access_token``,
    ``refresh_token``, and ``client_secret``.

    Returns a new dict (the original is not mutated).
    """
    if not auth_config:
        return auth_config

    config = dict(auth_config)

    # Handle HEADER / API-key headers list
    if "headers" in config and isinstance(config["headers"], list):
        config["headers"] = [
            {**h, "value": _encrypt_value(h["value"])} if h.get("value") else h
            for h in config["headers"]
        ]
        return config

    # Handle flat OAuth config
    for key in _SENSITIVE_KEYS:
        if key in config and config[key]:
            config[key] = _encrypt_value(config[key])

    return config


def decrypt_auth_config(auth_config):
    """
    Decrypt sensitive values in an auth_config dict.

    Inverse of ``encrypt_auth_config``.

    Returns a new dict (the original is not mutated).
    """
    if not auth_config:
        return auth_config

    config = dict(auth_config)

    # Handle HEADER / API-key headers list
    if "headers" in config and isinstance(config["headers"], list):
        config["headers"] = [
            {**h, "value": _decrypt_value(h["value"])} if h.get("value") else h
            for h in config["headers"]
        ]
        return config

    # Handle flat OAuth config
    for key in _SENSITIVE_KEYS:
        if key in config and config[key]:
            try:
                config[key] = _decrypt_value(config[key])
            except Exception:
                logger.warning("Failed to decrypt auth_config key '%s'; value may be unencrypted", key, exc_info=True)

    return config


def build_auth_headers(auth_config):
    """
    Build HTTP headers dict from a decrypted auth_config.

    For HEADER-type configs, returns headers from the list.
    For OAuth-type configs, returns an Authorization Bearer header.
    For none-type (empty config), returns empty dict.
    """
    if not auth_config:
        return {}

    # HEADER / API-key style
    if "headers" in auth_config and isinstance(auth_config["headers"], list):
        return {h["name"]: h["value"] for h in auth_config["headers"] if h.get("name") and h.get("value")}

    # OAuth style
    if "access_token" in auth_config and auth_config["access_token"]:
        return {"Authorization": f"Bearer {auth_config['access_token']}"}

    return {}
