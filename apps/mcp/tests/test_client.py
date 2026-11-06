"""Which workspace a connection is bound to, and that every surface agrees on it.

A caller on a hosted client has no other way to learn the binding: the slug is
resolved from credentials it never sees. `current_workspace` reports it, and the
guarantee worth testing is that it reports the slug the tools actually act on --
a report that could disagree with them would be worse than none.
"""

from __future__ import annotations

import time

import pytest
from fastmcp.server.auth.auth import AccessToken

import plane_mcp.client as client_module
from plane_mcp.client import current_workspace, get_plane_client_context

WORKSPACE = {"id": "ws-1", "name": "Acme Inc", "slug": "acme", "logo_url": None}


def _token(**claims) -> AccessToken:
    return AccessToken(
        token="t", client_id="c", scopes=["read", "write"], expires_at=int(time.time()) + 3600, claims=claims
    )


# The claims each provider really issues: plane_oauth_provider.py and
# plane_header_auth_provider.py. stdio has no provider, so no token at all.
CONNECTIONS = {
    "oauth": _token(auth_method="oauth", workspace_slug="acme", workspace=WORKSPACE),
    "header": _token(auth_method="api_key_header", workspace_slug="acme"),
    "stdio": None,
}


@pytest.fixture
def connected(monkeypatch):
    """Bind the process to one connection, as the transport would."""
    monkeypatch.setenv("PLANE_WORKSPACE_SLUG", "acme")
    monkeypatch.setenv("PLANE_API_KEY", "k")

    def bind(kind: str) -> None:
        monkeypatch.setattr(client_module, "get_access_token", lambda: CONNECTIONS[kind])

    return bind


def test_an_oauth_connection_names_its_workspace(connected):
    """The installation the token was granted for carries the id and name, so they
    cost nothing to report."""
    connected("oauth")

    assert current_workspace() == {"slug": "acme", "id": "ws-1", "name": "Acme Inc", "connected_via": "oauth"}


@pytest.mark.parametrize(("kind", "via"), [("header", "api_key_header"), ("stdio", "environment")])
def test_a_key_connection_knows_only_the_slug_its_caller_set(kind, via, connected):
    """No v1 endpoint describes a workspace, so id and name are left null rather
    than guessed or fetched from somewhere that does not exist."""
    connected(kind)

    assert current_workspace() == {"slug": "acme", "id": None, "name": None, "connected_via": via}


@pytest.mark.parametrize("kind", sorted(CONNECTIONS))
def test_the_reported_slug_is_the_one_every_tool_acts_on(kind, connected):
    connected(kind)

    assert current_workspace()["slug"] == get_plane_client_context().workspace_slug


def test_a_token_that_names_no_method_is_reported_as_the_one_it_is_built_for(connected, monkeypatch):
    """`auth_method` had two defaults: the client treated a missing claim as OAuth,
    and the report called the same connection "environment". Whatever the default,
    both have to read it the same way, or the report describes a connection the
    tools are not using. A token is never the environment: that is stdio, with none.
    """
    monkeypatch.setattr(client_module, "get_access_token", lambda: _token(workspace_slug="acme"))

    assert current_workspace()["connected_via"] == "oauth"
    assert get_plane_client_context().client.config.access_token, "built for OAuth, so it carries the token"


def test_a_token_without_a_slug_does_not_borrow_the_environments(connected, monkeypatch):
    """A token's claim is authoritative even when empty. Falling back to the
    environment would report -- and act on -- a workspace the token was never
    granted."""
    monkeypatch.setattr(client_module, "get_access_token", lambda: _token(auth_method="oauth"))

    assert current_workspace()["slug"] == ""
    assert get_plane_client_context().workspace_slug == ""
