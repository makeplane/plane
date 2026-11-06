"""A Deny on the consent page must not lock the client out on later attempts."""

from types import SimpleNamespace

from key_value.aio.stores.memory import MemoryStore
from starlette.responses import Response

from plane_mcp.auth import PlaneOAuthProvider


def _provider() -> PlaneOAuthProvider:
    return PlaneOAuthProvider(
        client_id="test-client-id",
        client_secret="test-client-secret",
        base_url="http://localhost:8211",
        plane_base_url="http://localhost:9999",
        client_storage=MemoryStore(),
    )


def _request_with_cookie(provider: PlaneOAuthProvider, base_name: str, values: list[str]):
    response = Response()
    provider._set_list_cookie(response, base_name, provider._encode_list_cookie(values), max_age=60)
    name, _, rest = response.headers["set-cookie"].partition("=")
    return SimpleNamespace(cookies={name: rest.split(";", 1)[0].strip('"')})


def test_denied_cookie_is_ignored():
    provider = _provider()
    request = _request_with_cookie(provider, "MCP_DENIED_CLIENTS", ["chatgpt:https://chatgpt.com/cb"])
    assert provider._decode_list_cookie(request, "MCP_DENIED_CLIENTS") == []


def test_approved_cookie_still_honoured():
    provider = _provider()
    request = _request_with_cookie(provider, "MCP_APPROVED_CLIENTS", ["chatgpt:https://chatgpt.com/cb"])
    assert provider._decode_list_cookie(request, "MCP_APPROVED_CLIENTS") == ["chatgpt:https://chatgpt.com/cb"]
