"""Tests for stateless HTTP mode.

Verifies that the OAuth and header HTTP apps work correctly with
stateless_http=True, which prevents unbounded session accumulation
in StreamableHTTPSessionManager._server_instances.
"""

import pytest
from fastmcp import FastMCP
from key_value.aio.stores.memory import MemoryStore
from starlette.testclient import TestClient

from plane_mcp.auth import PlaneHeaderAuthProvider, PlaneOAuthProvider
from plane_mcp.server import get_allowed_client_redirect_uris

ALLOWED_REDIRECT_URI_PATTERNS = get_allowed_client_redirect_uris()


@pytest.fixture()
def oauth_mcp():
    """Build an OAuth MCP server with dummy credentials."""
    return FastMCP(
        "Plane MCP Server",
        auth=PlaneOAuthProvider(
            client_id="test-client-id",
            client_secret="test-client-secret",
            base_url="http://localhost:8211",
            plane_base_url="http://localhost:9999",
            plane_internal_base_url="http://localhost:9999",
            client_storage=MemoryStore(),
            required_scopes=["read", "write"],
            allowed_client_redirect_uris=ALLOWED_REDIRECT_URI_PATTERNS,
            require_authorization_consent=False,
        ),
    )


@pytest.fixture()
def header_mcp():
    """Build a header-auth MCP server."""
    return FastMCP(
        "Plane MCP Server (header-http)",
        auth=PlaneHeaderAuthProvider(
            required_scopes=["read", "write"],
        ),
    )


class TestStatelessHttpOAuth:
    """Verify OAuth HTTP app works in stateless mode."""

    def test_oauth_app_creates_with_stateless_flag(self, oauth_mcp):
        """http_app(stateless_http=True) should return a valid ASGI app."""
        app = oauth_mcp.http_app(stateless_http=True)
        assert app is not None

    def test_oauth_mcp_endpoint_responds(self, oauth_mcp):
        """The /mcp endpoint should accept POST requests in stateless mode."""
        app = oauth_mcp.http_app(stateless_http=True)
        client = TestClient(app, raise_server_exceptions=False)
        # POST to /mcp without auth should return 401, not a server error
        response = client.post("/mcp", json={"jsonrpc": "2.0", "method": "initialize", "id": 1})
        assert response.status_code in (401, 403)

    def test_oauth_register_endpoint_responds(self, oauth_mcp):
        """/register should still work in stateless mode."""
        app = oauth_mcp.http_app(stateless_http=True)
        client = TestClient(app, raise_server_exceptions=False)
        response = client.post(
            "/register",
            json={
                "redirect_uris": ["http://localhost:3000/callback"],
                "grant_types": ["authorization_code", "refresh_token"],
                "response_types": ["code"],
                "token_endpoint_auth_method": "client_secret_post",
            },
        )
        assert response.status_code == 201


class TestStatelessHttpHeader:
    """Verify header-auth HTTP app works in stateless mode."""

    def test_header_app_creates_with_stateless_flag(self, header_mcp):
        """http_app(stateless_http=True) should return a valid ASGI app."""
        app = header_mcp.http_app(stateless_http=True)
        assert app is not None

    def test_header_mcp_endpoint_responds(self, header_mcp):
        """The /mcp endpoint should accept POST requests in stateless mode."""
        app = header_mcp.http_app(stateless_http=True)
        client = TestClient(app, raise_server_exceptions=False)
        response = client.post("/mcp", json={"jsonrpc": "2.0", "method": "initialize", "id": 1})
        # Without auth headers, expect 401/403, not 500
        assert response.status_code in (401, 403)
