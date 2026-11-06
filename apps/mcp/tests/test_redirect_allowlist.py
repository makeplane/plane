"""The OAuth redirect allowlist, checked against the real callback URIs.

Every entry in DEFAULT_ALLOWED_REDIRECT_URIS exists because one MCP client
could not connect without it, and the pattern only works if it matches the URI
that client actually sends. These tests pin both halves: the real URI is
accepted, and the lookalikes an attacker would try are not.

Validation runs through fastmcp's `validate_redirect_uri` — the same function
the OAuth proxy calls, so a change in its matching semantics fails here rather
than in production.
"""

import pytest
from fastmcp.server.auth.redirect_validation import validate_redirect_uri

from plane_mcp.server import DEFAULT_ALLOWED_REDIRECT_URIS, get_allowed_client_redirect_uris


def allowed(uri: str, patterns: list[str] | None = None) -> bool:
    return validate_redirect_uri(uri, patterns or DEFAULT_ALLOWED_REDIRECT_URIS)


# A real callback URI per supported client. The Gemini and ChatGPT paths carry a
# per-user connector id, so the URI below is a sample of that shape.
CLIENT_REDIRECT_URIS = {
    "localhost-dynamic-port": "http://localhost:54321/callback",
    "loopback-ip": "http://127.0.0.1:8080/oauth/callback",
    "cursor-scheme": "cursor://anysphere.cursor-mcp/oauth/callback",
    "cursor-web": "https://www.cursor.com/api/auth/mcp/callback",
    "vscode": "https://vscode.dev/redirect",
    "vscode-insiders": "https://insiders.vscode.dev/redirect",
    "antigravity": "https://antigravity.google/oauth-callback",
    "claude-ai": "https://claude.ai/api/mcp/auth_callback",
    "chatgpt-connector": "https://chatgpt.com/connector/oauth/callback",
    "chatgpt-legacy": "https://chatgpt.com/connector_platform_oauth_redirect",
    "gemini-spark": (
        "https://oauth-redirect.googleusercontent.com/r/user_bound_custom-mcp-116109532806053202916-mcp_plane_so"
    ),
    "grok-web": "https://grok.com/connectors-oauth-exchange-code/",
}


@pytest.mark.parametrize("uri", CLIENT_REDIRECT_URIS.values(), ids=CLIENT_REDIRECT_URIS.keys())
def test_supported_client_callback_is_allowed(uri: str) -> None:
    assert allowed(uri), f"{uri} is rejected — that client cannot complete OAuth"


# Each one is a near-miss on a pattern above: the same string a phishing client
# would register hoping the allowlist matches on a substring.
LOOKALIKE_URIS = {
    "unrelated-domain": "https://attacker.com/steal",
    "gemini-host-suffix": "https://oauth-redirect.googleusercontent.com.evil.com/r/user_bound_custom-mcp-1",
    "gemini-host-prefix": "https://evil-oauth-redirect.googleusercontent.com/r/user_bound_custom-mcp-1",
    "gemini-userinfo": "https://oauth-redirect.googleusercontent.com@evil.com/r/user_bound_custom-mcp-1",
    "gemini-parent-domain": "https://googleusercontent.com/r/user_bound_custom-mcp-1",
    "gemini-scheme-downgrade": "http://oauth-redirect.googleusercontent.com/r/user_bound_custom-mcp-1",
    "gemini-other-path": "https://oauth-redirect.googleusercontent.com/oauth2/callback",
    "grok-host-suffix": "https://grok.com.evil.com/connectors-oauth-exchange-code/",
    "grok-other-path": "https://grok.com/anything-else",
    "claude-host-suffix": "https://claude.ai.evil.com/api/mcp/auth_callback",
    "chatgpt-path-suffix": "https://chatgpt.com/connector_platform_oauth_redirect_evil",
    "cursor-unregistered-scheme": "myapp://callback",
    "javascript-scheme": "javascript:alert(document.cookie)",
}


@pytest.mark.parametrize("uri", LOOKALIKE_URIS.values(), ids=LOOKALIKE_URIS.keys())
def test_lookalike_callback_is_refused(uri: str) -> None:
    assert not allowed(uri), f"VULNERABILITY: {uri} matches an allowed pattern"


class TestRuntimeExtras:
    """PLANE_OAUTH_ALLOWED_REDIRECT_URIS onboards a client without a release."""

    def test_extras_are_appended_after_the_defaults(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(
            "PLANE_OAUTH_ALLOWED_REDIRECT_URIS", " https://new-client.example.com/cb , https://claude.ai/* "
        )

        patterns = get_allowed_client_redirect_uris()

        assert patterns[: len(DEFAULT_ALLOWED_REDIRECT_URIS)] == DEFAULT_ALLOWED_REDIRECT_URIS
        assert patterns[len(DEFAULT_ALLOWED_REDIRECT_URIS) :] == ["https://new-client.example.com/cb"]
        assert allowed("https://new-client.example.com/cb", patterns)

    def test_the_defaults_stand_alone_without_the_env_var(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("PLANE_OAUTH_ALLOWED_REDIRECT_URIS", raising=False)

        assert get_allowed_client_redirect_uris() == DEFAULT_ALLOWED_REDIRECT_URIS

    def test_the_returned_list_is_a_copy(self) -> None:
        """A caller mutating the result must not edit the shipped allowlist."""
        get_allowed_client_redirect_uris().append("https://attacker.com/*")

        assert not allowed("https://attacker.com/steal")
