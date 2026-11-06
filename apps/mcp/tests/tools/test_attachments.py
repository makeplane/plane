"""The attachment actions the dispatch smoke test cannot reach.

read, download_url and upload_from_url all need attachment metadata to exist and
an outbound fetch to succeed, so they get explicit stubs here. The image channel
is the reason: `read` must return an Image for an image and a str for text, and
a regression that collapsed both to str would pass every other test in this
suite.
"""

from __future__ import annotations

import socket
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
import urllib3
from fastmcp.utilities.types import Image

from plane_mcp.tools import workitem_attachment as module

PROJECT = "project-1"
WORK_ITEM = "work-item-1"
ATTACHMENT = "attachment-1"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
PUBLIC_IP = "8.8.8.8"  # genuinely globally-routable -- these are mocked tests, no real network call happens

_PROXY_ENV_VARS = ("HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy")


@pytest.fixture(autouse=True)
def _clear_proxy_env(monkeypatch):
    """A CI runner's own HTTP_PROXY/HTTPS_PROXY/NO_PROXY cannot be allowed to
    silently flip any test in this file onto the proxy code path -- the
    proxy tests below opt back in explicitly via monkeypatch.setenv.
    """
    for var in _PROXY_ENV_VARS:
        monkeypatch.delenv(var, raising=False)


class _Response:
    """A streamed requests.Response. `served` counts the bytes handed out."""

    def __init__(self, content: bytes, headers: dict[str, str] | None = None) -> None:
        self.content = content
        self.headers = headers or {}
        self.served = 0

    def raise_for_status(self) -> None:
        return None

    def iter_content(self, chunk_size: int = 1):
        for start in range(0, len(self.content), chunk_size):
            chunk = self.content[start : start + chunk_size]
            self.served += len(chunk)
            yield chunk

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def _fake_urlopen(status: int, headers: dict[str, str], content: bytes):
    """A stand-in for urllib3's ConnectionPool.urlopen -- the connection-layer
    boundary fetch_validated_get's tests mock against, not the function under
    test itself.
    """

    def fake(self, method: str, url: str, *args, **kwargs):
        return SimpleNamespace(
            status=status,
            headers=dict(headers),
            read=lambda amt=None: content,
            release_conn=lambda: None,
        )

    return fake


def _attachment(name: str, content_type: str):
    return SimpleNamespace(id=ATTACHMENT, attributes={"name": name, "type": content_type})


@pytest.fixture
def attachment_tool(registered, spy, monkeypatch):
    """The tool, with attachment metadata present and the network stubbed out."""
    spy.returns["work_items.attachments.get_download_url"] = "https://files.example.com/a"
    monkeypatch.setattr(module, "get_plane_client_context", lambda: (spy, "acme"))

    def stub(name: str, content_type: str, payload: bytes = PNG):
        spy.returns["work_items.attachments.list"] = [_attachment(name, content_type)]
        monkeypatch.setattr(module.requests, "get", lambda *a, **k: _Response(payload, {"Content-Type": content_type}))

    return registered["workitem_attachment"].fn, spy, stub


def test_read_returns_an_image_for_an_image(attachment_tool):
    tool, _, stub = attachment_tool
    stub("diagram.png", "image/png")

    result = tool(action="read", project_id=PROJECT, workitem_id=WORK_ITEM, attachment_id=ATTACHMENT)

    assert isinstance(result, Image)
    assert result._mime_type == "image/png"


def test_read_returns_text_for_a_text_file(attachment_tool):
    tool, _, stub = attachment_tool
    stub("notes.md", "text/markdown", b"# Notes\nbody")

    result = tool(action="read", project_id=PROJECT, workitem_id=WORK_ITEM, attachment_id=ATTACHMENT)

    assert result == "# Notes\nbody"


def test_read_refuses_an_unsupported_type_and_points_at_download_url(attachment_tool):
    tool, _, stub = attachment_tool
    stub("spec.pdf", "application/pdf")

    with pytest.raises(ValueError, match="download_url"):
        tool(action="read", project_id=PROJECT, workitem_id=WORK_ITEM, attachment_id=ATTACHMENT)


def test_read_refuses_a_file_over_the_limit(attachment_tool):
    tool, _, stub = attachment_tool
    stub("huge.png", "image/png", b"\x00" * (module.IMAGE_READ_LIMIT + 1))

    with pytest.raises(ValueError, match="exceeds"):
        tool(action="read", project_id=PROJECT, workitem_id=WORK_ITEM, attachment_id=ATTACHMENT)


def test_read_refuses_a_declared_size_before_downloading(attachment_tool, monkeypatch):
    """The whole body used to be buffered before any size check."""
    tool, spy, _ = attachment_tool
    spy.returns["work_items.attachments.list"] = [
        SimpleNamespace(
            id=ATTACHMENT, attributes={"name": "huge.png", "type": "image/png", "size": module.IMAGE_READ_LIMIT + 1}
        )
    ]
    fetch = Mock()
    monkeypatch.setattr(module.requests, "get", fetch)

    with pytest.raises(ValueError, match="exceeds"):
        tool(action="read", project_id=PROJECT, workitem_id=WORK_ITEM, attachment_id=ATTACHMENT)
    fetch.assert_not_called()


def test_read_refuses_a_large_content_length_without_reading_it(attachment_tool, monkeypatch):
    tool, spy, _ = attachment_tool
    spy.returns["work_items.attachments.list"] = [_attachment("huge.png", "image/png")]
    response = _Response(b"\x00" * 10, {"Content-Length": str(module.IMAGE_READ_LIMIT + 1)})
    monkeypatch.setattr(module.requests, "get", lambda *a, **k: response)

    with pytest.raises(ValueError, match="exceeds"):
        tool(action="read", project_id=PROJECT, workitem_id=WORK_ITEM, attachment_id=ATTACHMENT)
    assert response.served == 0


def test_read_stops_reading_an_undeclared_body_at_the_limit(attachment_tool, monkeypatch):
    tool, spy, _ = attachment_tool
    spy.returns["work_items.attachments.list"] = [_attachment("notes.txt", "text/plain")]
    response = _Response(b"a" * (module.TEXT_READ_LIMIT * 4))
    monkeypatch.setattr(module.requests, "get", lambda *a, **k: response)

    with pytest.raises(ValueError, match="exceeds"):
        tool(action="read", project_id=PROJECT, workitem_id=WORK_ITEM, attachment_id=ATTACHMENT)
    assert response.served <= module.TEXT_READ_LIMIT + 64 * 1024


def test_download_url_returns_the_link_and_the_name(attachment_tool):
    tool, _, stub = attachment_tool
    stub("spec.pdf", "application/pdf")

    result = tool(action="download_url", project_id=PROJECT, workitem_id=WORK_ITEM, attachment_id=ATTACHMENT)

    assert result == {
        "download_url": "https://files.example.com/a",
        "attachment_id": ATTACHMENT,
        "name": "spec.pdf",
    }


def test_upload_from_url_rejects_a_private_address(attachment_tool):
    """The SSRF guard: the server performs this fetch, so it must not reach the LAN."""
    tool, spy, _ = attachment_tool

    with pytest.raises(ValueError):
        tool(
            action="upload_from_url",
            project_id=PROJECT,
            workitem_id=WORK_ITEM,
            url="http://169.254.169.254/latest/meta-data/",
        )
    assert not spy.recorder.calls


def test_upload_from_url_rejects_a_6to4_encoded_metadata_address(attachment_tool):
    """169.254.169.254 (cloud metadata) embedded in a 6to4 (2002::/16) IPv6
    literal must be unwrapped and rejected, not waved through just because
    the outer address isn't itself in PRIVATE_NETWORKS.
    """
    tool, spy, _ = attachment_tool

    with pytest.raises(ValueError):
        tool(
            action="upload_from_url",
            project_id=PROJECT,
            workitem_id=WORK_ITEM,
            url="http://[2002:a9fe:a9fe::1]/latest/meta-data/",
        )
    assert not spy.recorder.calls


def test_upload_from_url_rejects_a_nat64_encoded_metadata_address(attachment_tool):
    """Same bypass class as the 6to4 case, via the NAT64 (64:ff9b::/96) range."""
    tool, spy, _ = attachment_tool

    with pytest.raises(ValueError):
        tool(
            action="upload_from_url",
            project_id=PROJECT,
            workitem_id=WORK_ITEM,
            url="http://[64:ff9b::a9fe:a9fe]/latest/meta-data/",
        )
    assert not spy.recorder.calls


def test_upload_from_url_sends_the_fetched_bytes(attachment_tool, monkeypatch):
    """Happy path through the new fetch_validated_get call path: a legitimate
    public-URL upload must keep working unaffected by the SSRF fix.
    """
    tool, spy, _ = attachment_tool
    monkeypatch.setattr(module, "attachment_to_dict", lambda attachment, slug: {"id": ATTACHMENT})
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda host, port, *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (PUBLIC_IP, port or 0))],
    )
    monkeypatch.setattr(urllib3.HTTPSConnectionPool, "urlopen", _fake_urlopen(200, {"Content-Type": "image/png"}, PNG))

    result = tool(
        action="upload_from_url",
        project_id=PROJECT,
        workitem_id=WORK_ITEM,
        url="https://example.com/diagram.png",
    )

    upload = next(c for c in spy.recorder.calls if c.method.endswith("upload_from_bytes"))
    assert upload.kwargs["file_bytes"] == PNG
    assert upload.kwargs["name"] == "diagram.png"
    assert upload.kwargs["content_type"] == "image/png"
    assert result == {"id": ATTACHMENT}


def test_upload_from_url_sends_the_port_in_the_host_header(attachment_tool, monkeypatch):
    """RFC 9110: a non-default port must survive into the Host header, not just
    the connection's actual port.
    """
    tool, _, _ = attachment_tool
    monkeypatch.setattr(module, "attachment_to_dict", lambda attachment, slug: {"id": ATTACHMENT})
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda host, port, *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (PUBLIC_IP, port or 0))],
    )
    captured_headers: dict[str, str] = {}

    def fake_urlopen(self, method, url, *args, **kwargs):
        captured_headers.update(kwargs.get("headers") or {})
        return SimpleNamespace(
            status=200,
            headers={"Content-Type": "image/png"},
            read=lambda amt=None: PNG,
            release_conn=lambda: None,
        )

    monkeypatch.setattr(urllib3.HTTPSConnectionPool, "urlopen", fake_urlopen)

    tool(
        action="upload_from_url",
        project_id=PROJECT,
        workitem_id=WORK_ITEM,
        url="https://files.example.com:8443/diagram.png",
    )

    assert captured_headers["Host"] == "files.example.com:8443"


def test_upload_rejects_dns_rebinding(attachment_tool, monkeypatch):
    """The TOCTOU this fix closes: a hostname resolving publicly at
    validation time and privately moments later must not reach the private
    address -- there is no second, independent lookup left to exploit.
    """
    tool, spy, _ = attachment_tool
    hostname = "rebinding.example.com"
    calls: list[str] = []

    def fake_getaddrinfo(host, port, *args, **kwargs):
        calls.append(host)
        ip = PUBLIC_IP if calls.count(host) == 1 else "169.254.169.254"
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, port or 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    # The connection layer: fails deterministically, with no real networking
    # involved, so the only thing under test is how many times DNS was asked.
    monkeypatch.setattr(
        urllib3.util.connection,
        "create_connection",
        lambda *a, **k: (_ for _ in ()).throw(OSError("connection refused (test stub)")),
    )

    with pytest.raises(ValueError):
        tool(
            action="upload_from_url",
            project_id=PROJECT,
            workitem_id=WORK_ITEM,
            url=f"http://{hostname}/file.png",
        )

    assert calls.count(hostname) == 1
    assert not spy.recorder.calls


def test_upload_rejects_redirect_to_private_ip(attachment_tool, monkeypatch):
    """Mechanism 2: a redirect from an initially-valid public URL to a
    private/reserved address must be rejected, not followed.
    """
    tool, spy, _ = attachment_tool
    real_getaddrinfo = socket.getaddrinfo

    def fake_getaddrinfo(host, port, *args, **kwargs):
        if host == "redirect.example.com":
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (PUBLIC_IP, port or 0))]
        # Anything else (e.g. the literal redirect-target IP) resolves for real --
        # a literal IP never touches the network, so this stays hermetic.
        return real_getaddrinfo(host, port, *args, **kwargs)

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    monkeypatch.setattr(
        urllib3.HTTPConnectionPool,
        "urlopen",
        _fake_urlopen(302, {"Location": "http://169.254.169.254/latest/meta-data/"}, b""),
    )

    with pytest.raises(ValueError):
        tool(
            action="upload_from_url",
            project_id=PROJECT,
            workitem_id=WORK_ITEM,
            url="http://redirect.example.com/file.png",
        )

    assert not spy.recorder.calls


def _fake_getaddrinfo_resolves_publicly(host, port, *args, **kwargs):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (PUBLIC_IP, port or 0))]


def test_upload_rejects_a_response_whose_declared_length_exceeds_the_limit(attachment_tool, monkeypatch):
    """Content-Length over the limit must be rejected on the header alone,
    never by buffering the body first -- the direct and proxy paths share
    this check through one helper, so covering this path covers both.
    """
    tool, spy, _ = attachment_tool
    monkeypatch.setattr(socket, "getaddrinfo", _fake_getaddrinfo_resolves_publicly)
    read_mock = Mock()
    monkeypatch.setattr(
        urllib3.HTTPSConnectionPool,
        "urlopen",
        lambda self, method, url, *a, **k: SimpleNamespace(
            status=200,
            headers={"Content-Type": "image/png", "Content-Length": str(module.UPLOAD_SIZE_LIMIT + 1)},
            read=read_mock,
            release_conn=lambda: None,
        ),
    )

    with pytest.raises(ValueError, match="exceeds"):
        tool(
            action="upload_from_url",
            project_id=PROJECT,
            workitem_id=WORK_ITEM,
            url="https://example.com/huge.png",
        )

    read_mock.assert_not_called()
    assert not spy.recorder.calls


def test_upload_rejects_a_body_exceeding_the_limit_with_no_declared_length(attachment_tool, monkeypatch):
    """The lying-or-silent-server case: no (or an understated) Content-Length
    must not let an oversized body through, and the read itself must be
    bounded (amt=max_bytes + 1), never an unbounded `.read()`.
    """
    tool, spy, _ = attachment_tool
    monkeypatch.setattr(socket, "getaddrinfo", _fake_getaddrinfo_resolves_publicly)
    oversized = b"\x00" * (module.UPLOAD_SIZE_LIMIT + 1)
    read_mock = Mock(return_value=oversized)
    monkeypatch.setattr(
        urllib3.HTTPSConnectionPool,
        "urlopen",
        lambda self, method, url, *a, **k: SimpleNamespace(
            status=200,
            headers={"Content-Type": "image/png"},
            read=read_mock,
            release_conn=lambda: None,
        ),
    )

    with pytest.raises(ValueError, match="exceeds"):
        tool(
            action="upload_from_url",
            project_id=PROJECT,
            workitem_id=WORK_ITEM,
            url="https://example.com/huge.png",
        )

    read_mock.assert_called_once_with(module.UPLOAD_SIZE_LIMIT + 1)
    assert not spy.recorder.calls


def test_upload_from_url_proxy_set_routes_through_proxy(attachment_tool, monkeypatch):
    """HTTPS_PROXY set: the fetch must go through urllib3.ProxyManager, never
    the direct pinned-IP path, and must never perform a DNS lookup for the
    target host -- once a proxy is selected it is the sole SSRF control.
    """
    tool, _, _ = attachment_tool
    monkeypatch.setattr(module, "attachment_to_dict", lambda attachment, slug: {"id": ATTACHMENT})
    monkeypatch.setenv("HTTPS_PROXY", "http://proxy.example.com:8080")

    getaddrinfo_calls: list[str] = []

    def fake_getaddrinfo(host, port, *args, **kwargs):
        getaddrinfo_calls.append(host)
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (PUBLIC_IP, port or 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    direct_calls: list[bool] = []

    def fake_direct_urlopen(self, method, url, *args, **kwargs):
        direct_calls.append(True)
        return SimpleNamespace(
            status=200, headers={"Content-Type": "image/png"}, read=lambda amt=None: PNG, release_conn=lambda: None
        )

    monkeypatch.setattr(urllib3.HTTPSConnectionPool, "urlopen", fake_direct_urlopen)
    monkeypatch.setattr(urllib3.ProxyManager, "urlopen", _fake_urlopen(200, {"Content-Type": "image/png"}, PNG))

    result = tool(
        action="upload_from_url",
        project_id=PROJECT,
        workitem_id=WORK_ITEM,
        url="https://example.com/diagram.png",
    )

    assert not direct_calls
    assert not getaddrinfo_calls
    assert result == {"id": ATTACHMENT}


def test_upload_from_url_no_proxy_excludes_host_falls_back_to_direct(attachment_tool, monkeypatch):
    """HTTPS_PROXY is set, but NO_PROXY matches the target host: the
    existing pinned-IP direct path must still run, not the proxy.
    """
    tool, _, _ = attachment_tool
    monkeypatch.setattr(module, "attachment_to_dict", lambda attachment, slug: {"id": ATTACHMENT})
    monkeypatch.setenv("HTTPS_PROXY", "http://proxy.example.com:8080")
    monkeypatch.setenv("NO_PROXY", "example.com")

    getaddrinfo_calls: list[str] = []

    def fake_getaddrinfo(host, port, *args, **kwargs):
        getaddrinfo_calls.append(host)
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (PUBLIC_IP, port or 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    direct_calls: list[str] = []

    def fake_direct_urlopen(self, method, url, *args, **kwargs):
        direct_calls.append(self.host)
        return SimpleNamespace(
            status=200, headers={"Content-Type": "image/png"}, read=lambda amt=None: PNG, release_conn=lambda: None
        )

    monkeypatch.setattr(urllib3.HTTPSConnectionPool, "urlopen", fake_direct_urlopen)

    proxy_calls: list[bool] = []
    monkeypatch.setattr(urllib3.ProxyManager, "urlopen", lambda self, *a, **k: proxy_calls.append(True))

    result = tool(
        action="upload_from_url",
        project_id=PROJECT,
        workitem_id=WORK_ITEM,
        url="https://example.com/diagram.png",
    )

    assert getaddrinfo_calls == ["example.com"]
    assert direct_calls == [PUBLIC_IP]
    assert not proxy_calls
    assert result == {"id": ATTACHMENT}


def test_upload_from_url_reevaluates_proxy_selection_per_hop(attachment_tool, monkeypatch):
    """Each redirect hop re-selects its own proxy: hop 1 is NO_PROXY-excluded
    (direct), the redirect target is not (proxied) -- catches proxy
    selection getting hoisted out of the per-hop loop.
    """
    tool, _, _ = attachment_tool
    monkeypatch.setattr(module, "attachment_to_dict", lambda attachment, slug: {"id": ATTACHMENT})
    monkeypatch.setenv("HTTPS_PROXY", "http://proxy.example.com:8080")
    monkeypatch.setenv("NO_PROXY", "hop1.example.com")

    getaddrinfo_calls: list[str] = []

    def fake_getaddrinfo(host, port, *args, **kwargs):
        getaddrinfo_calls.append(host)
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (PUBLIC_IP, port or 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    monkeypatch.setattr(
        urllib3.HTTPSConnectionPool,
        "urlopen",
        _fake_urlopen(302, {"Location": "https://hop2.example.com/file2"}, b""),
    )

    proxy_urls: list[str] = []

    def fake_proxy_urlopen(self, method, url, *args, **kwargs):
        proxy_urls.append(url)
        return SimpleNamespace(
            status=200, headers={"Content-Type": "image/png"}, read=lambda amt=None: PNG, release_conn=lambda: None
        )

    monkeypatch.setattr(urllib3.ProxyManager, "urlopen", fake_proxy_urlopen)

    result = tool(
        action="upload_from_url",
        project_id=PROJECT,
        workitem_id=WORK_ITEM,
        url="https://hop1.example.com/file",
    )

    assert getaddrinfo_calls == ["hop1.example.com"]
    assert proxy_urls == ["https://hop2.example.com/file2"]
    assert result == {"id": ATTACHMENT}


def test_upload_from_url_proxy_rejects_an_ip_literal_private_address(attachment_tool, monkeypatch):
    """An IP-literal host needs no DNS lookup to classify, so it carries none
    of the split-horizon-DNS justification the proxy path relies on to skip
    validation -- it must still be rejected before any proxy delegation.
    """
    tool, spy, _ = attachment_tool
    monkeypatch.setenv("HTTPS_PROXY", "http://proxy.example.com:8080")

    proxy_calls: list[bool] = []
    monkeypatch.setattr(urllib3.ProxyManager, "urlopen", lambda self, *a, **k: proxy_calls.append(True))

    with pytest.raises(ValueError):
        tool(
            action="upload_from_url",
            project_id=PROJECT,
            workitem_id=WORK_ITEM,
            url="https://169.254.169.254/latest/meta-data/",
        )

    assert not proxy_calls
    assert not spy.recorder.calls


def test_upload_from_url_preserves_matrix_params_in_the_request_path(attachment_tool, monkeypatch):
    """urlsplit (not urlparse) must rebuild the direct-path request target --
    urlparse splits a trailing ';params' segment off the path into `.params`,
    which would otherwise be silently dropped from the outgoing request.
    """
    tool, _, _ = attachment_tool
    monkeypatch.setattr(module, "attachment_to_dict", lambda attachment, slug: {"id": ATTACHMENT})
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda host, port, *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (PUBLIC_IP, port or 0))],
    )

    captured_paths: list[str] = []

    def fake_urlopen(self, method, path, *args, **kwargs):
        captured_paths.append(path)
        return SimpleNamespace(
            status=200, headers={"Content-Type": "image/png"}, read=lambda amt=None: PNG, release_conn=lambda: None
        )

    monkeypatch.setattr(urllib3.HTTPSConnectionPool, "urlopen", fake_urlopen)

    tool(
        action="upload_from_url",
        project_id=PROJECT,
        workitem_id=WORK_ITEM,
        url="https://example.com/file.png;v=2?sig=x",
    )

    assert captured_paths == ["/file.png;v=2?sig=x"]
