"""Attachment helpers shared by both tool surfaces.

Network limits, MIME allow-lists, the SSRF guard and the attachment
normaliser. Kept out of either surface package so neither depends on the other.
"""

from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin, urlsplit

import requests
import urllib3
from requests.structures import CaseInsensitiveDict

# ── Limits ────────────────────────────────────────────────────────────────────
IMAGE_READ_LIMIT = 5 * 1024 * 1024  # 5 MB
TEXT_READ_LIMIT = 1 * 1024 * 1024  # 1 MB
UPLOAD_SIZE_LIMIT = 5 * 1024 * 1024  # 5 MB

# Connect timeout / read timeout tuple used for all outbound HTTP calls.
HTTP_TIMEOUT = (10, 60)

# ── Supported MIME types ──────────────────────────────────────────────────────
READABLE_IMAGE_TYPES: frozenset[str] = frozenset({"image/png", "image/jpeg", "image/gif", "image/webp"})
READABLE_TEXT_TYPES: frozenset[str] = frozenset(
    {
        "text/plain",
        "text/markdown",
        "text/csv",
        "text/html",
        "text/xml",
        "text/yaml",
        "application/json",
        "application/xml",
        "application/yaml",
        "application/x-yaml",
    }
)

# ── Private / reserved network ranges (SSRF guard) ───────────────────────────
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),  # loopback
    ipaddress.ip_network("10.0.0.0/8"),  # RFC 1918
    ipaddress.ip_network("172.16.0.0/12"),  # RFC 1918
    ipaddress.ip_network("192.168.0.0/16"),  # RFC 1918
    ipaddress.ip_network("169.254.0.0/16"),  # link-local / AWS metadata
    ipaddress.ip_network("::1/128"),  # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),  # IPv6 unique-local
    ipaddress.ip_network("fe80::/10"),  # IPv6 link-local
]


NAT64_NETWORK = ipaddress.ip_network("64:ff9b::/96")


def _is_private_address(addr: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """True if addr -- after normalizing an IPv4-mapped IPv6 address (e.g.
    ::ffff:169.254.169.254) down to its IPv4 form -- falls in PRIVATE_NETWORKS,
    or if `ipaddress` itself considers it non-global/multicast, or if it is a
    6to4 (2002::/16) or NAT64 (64:ff9b::/96) address embedding such an IPv4
    target.

    `is_global`/`is_multicast` are the primary check -- they catch ranges the
    hand-rolled PRIVATE_NETWORKS list below doesn't (0.0.0.0/8, the IPv6
    unspecified address, CGNAT 100.64.0.0/10, 198.18.0.0/15, 240.0.0.0/4,
    255.255.255.255, multicast) and are more robust against future missed
    ranges than a hand-maintained list. PRIVATE_NETWORKS stays as defense in
    depth since some of its entries are stricter than is_global alone.
    """
    if isinstance(addr, ipaddress.IPv6Address):
        mapped = addr.ipv4_mapped
        if mapped is not None:
            addr = mapped

    if not addr.is_global or addr.is_multicast:
        return True

    if isinstance(addr, ipaddress.IPv6Address):
        embedded = addr.sixtofour
        if embedded is None and addr in NAT64_NETWORK:
            embedded = ipaddress.IPv4Address(int(addr) & 0xFFFFFFFF)
        if embedded is not None and (not embedded.is_global or embedded.is_multicast):
            return True

    return any(addr in net for net in PRIVATE_NETWORKS)


def _resolve_and_validate(hostname: str, port: int) -> str:
    """One getaddrinfo call; every address it returns is checked, and the
    first (now-validated) one is returned to pin the connection to --
    closing the DNS-rebinding TOCTOU gap by never looking up hostname again.
    """
    try:
        results = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ValueError(f"Could not resolve hostname {hostname!r}: {exc}") from exc

    pinned_ip: str | None = None
    for _family, _type, _proto, _canonname, sockaddr in results:
        ip_str = sockaddr[0]
        addr = ipaddress.ip_address(ip_str)
        if _is_private_address(addr):
            raise ValueError(
                f"Hostname {hostname!r} resolves to a private/reserved address ({ip_str}) "
                "and cannot be fetched for security reasons."
            )
        if pinned_ip is None:
            pinned_ip = ip_str

    if pinned_ip is None:
        raise ValueError(f"Could not resolve hostname {hostname!r}: no addresses returned")

    return pinned_ip


@dataclass(frozen=True)
class FetchedResponse:
    """A fetch_validated_get result exposing the same attributes callers
    already read off a `requests.Response`, so the downstream logic that
    reads `.headers`/`.content`/`.raise_for_status()` needs no changes.
    """

    status_code: int
    headers: CaseInsensitiveDict
    content: bytes

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise ValueError(f"Request failed with HTTP {self.status_code}")


def _read_bounded(response: Any, url: str, max_bytes: int) -> bytes:
    """Rejects via ValueError on a declared Content-Length over `max_bytes`
    without reading the body, else reads at most `max_bytes + 1` bytes and
    rejects if that still exceeds the limit -- never buffers more.
    """
    declared = response.headers.get("Content-Length")
    if declared and declared.isdigit() and int(declared) > max_bytes:
        response.release_conn()
        raise ValueError(f"Response from {url!r} exceeds the {max_bytes} byte limit")

    content = response.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise ValueError(f"Response from {url!r} exceeds the {max_bytes} byte limit")
    return content


def _select_proxy_url(url: str) -> str | None:
    """The proxy (if any) HTTP_PROXY/HTTPS_PROXY/NO_PROXY route this URL
    through -- reuses `requests`' own NO_PROXY matching rather than
    reimplementing it.
    """
    return requests.utils.select_proxy(url, requests.utils.get_environ_proxies(url))


def _fetch_one_hop_via_proxy(url: str, proxy_url: str, max_bytes: int) -> tuple[str | None, FetchedResponse | None]:
    """Same contract as the direct path below, but through `proxy_url`, by
    the original hostname -- never a pinned IP. See the SECURITY comment at
    the call site: no DNS/private-IP preflight runs for this path.
    """
    timeout = urllib3.util.Timeout(connect=HTTP_TIMEOUT[0], read=HTTP_TIMEOUT[1])

    proxy_user, proxy_pass = requests.utils.get_auth_from_url(proxy_url)
    proxy_headers = urllib3.make_headers(proxy_basic_auth=f"{proxy_user}:{proxy_pass}") if proxy_user else None

    proxy_manager = urllib3.ProxyManager(
        proxy_url,
        proxy_headers=proxy_headers,
        use_forwarding_for_https=False,
        timeout=timeout,
        cert_reqs="CERT_REQUIRED",
        ca_certs=requests.utils.DEFAULT_CA_BUNDLE_PATH,
    )
    try:
        try:
            response = proxy_manager.urlopen(
                "GET",
                url,
                preload_content=False,
                redirect=False,
                retries=False,
            )
        except urllib3.exceptions.HTTPError as exc:
            raise ValueError(f"Failed to fetch {url!r} via proxy: {exc}") from exc

        if 300 <= response.status < 400:
            location = response.headers.get("Location")
            response.release_conn()
            if not location:
                raise ValueError(f"Redirect ({response.status}) from {url!r} has no Location header")
            return urljoin(url, location), None

        try:
            content = _read_bounded(response, url, max_bytes)
        except urllib3.exceptions.HTTPError as exc:
            raise ValueError(f"Failed to read response from {url!r} via proxy: {exc}") from exc

        return None, FetchedResponse(
            status_code=response.status,
            headers=CaseInsensitiveDict(response.headers.items()),
            content=content,
        )
    finally:
        proxy_manager.clear()


def _fetch_one_hop(url: str, max_bytes: int) -> tuple[str | None, FetchedResponse | None]:
    """One HTTP GET for a single hop (DNS-pinned directly; see the SECURITY
    comment below for the proxied case). Returns (redirect_url, None) for a
    3xx with a Location header (its body is never read), else (None, FetchedResponse).
    """
    # urlsplit, not urlparse: urlparse splits a trailing ";params" segment off
    # the path into `.params`, silently dropping it from the request below.
    parsed = urlsplit(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"Unsupported URL scheme {parsed.scheme!r} for {url!r}; only http and https are allowed")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError(f"Invalid URL (no hostname): {url!r}")

    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    proxy_url = _select_proxy_url(url)
    if proxy_url is not None:
        # SECURITY: proxied requests get ZERO DNS-rebinding/private-IP
        # protection here -- the proxy resolves the target independently,
        # so the proxy (and its network policy) is the SOLE SSRF control.

        # That reasoning only covers hostnames needing DNS lookup though --
        # an IP literal needs none, so check it directly before delegating.
        try:
            literal = ipaddress.ip_address(hostname)
        except ValueError:
            literal = None
        if literal is not None and _is_private_address(literal):
            raise ValueError(
                f"URL {url!r} targets a private/reserved address and cannot be fetched for security reasons."
            )
        return _fetch_one_hop_via_proxy(url, proxy_url, max_bytes)

    pinned_ip = _resolve_and_validate(hostname, port)

    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"

    timeout = urllib3.util.Timeout(connect=HTTP_TIMEOUT[0], read=HTTP_TIMEOUT[1])
    default_port = 443 if parsed.scheme == "https" else 80
    host_header = f"[{hostname}]" if ":" in hostname else hostname
    if port != default_port:
        host_header = f"{host_header}:{port}"
    headers = {"Host": host_header}

    pool_kwargs: dict[str, Any] = {"port": port, "timeout": timeout}
    if parsed.scheme == "https":
        pool_cls = urllib3.HTTPSConnectionPool
        pool_kwargs.update(
            server_hostname=hostname,
            assert_hostname=hostname,
            cert_reqs="CERT_REQUIRED",
            ca_certs=requests.utils.DEFAULT_CA_BUNDLE_PATH,
        )
    else:
        pool_cls = urllib3.HTTPConnectionPool

    # host is the validated IP literal, never the hostname -- this is what
    # keeps the connect path free of a second DNS lookup.
    pool = pool_cls(pinned_ip, **pool_kwargs)
    try:
        try:
            response = pool.urlopen(
                "GET",
                path,
                headers=headers,
                preload_content=False,
                redirect=False,
                retries=False,
            )
        except urllib3.exceptions.HTTPError as exc:
            raise ValueError(f"Failed to fetch {url!r}: {exc}") from exc

        if 300 <= response.status < 400:
            location = response.headers.get("Location")
            response.release_conn()
            if not location:
                raise ValueError(f"Redirect ({response.status}) from {url!r} has no Location header")
            return urljoin(url, location), None

        try:
            content = _read_bounded(response, url, max_bytes)
        except urllib3.exceptions.HTTPError as exc:
            raise ValueError(f"Failed to read response from {url!r}: {exc}") from exc

        return None, FetchedResponse(
            status_code=response.status,
            headers=CaseInsensitiveDict(response.headers.items()),
            content=content,
        )
    finally:
        pool.close()


def fetch_validated_get(url: str, *, max_redirects: int = 5, max_bytes: int = UPLOAD_SIZE_LIMIT) -> FetchedResponse:
    """Atomic, DNS-pinned GET. Follows up to `max_redirects` 3xx hops, each
    re-validated from scratch; raises ValueError for any unsafe target,
    scheme, redirect cap, timeout/TLS failure, or body over `max_bytes`.
    """
    current_url = url
    for _hop in range(max_redirects + 1):
        redirect_url, response = _fetch_one_hop(current_url, max_bytes)
        if response is not None:
            return response
        current_url = redirect_url

    raise ValueError(f"Exceeded the maximum of {max_redirects} redirects fetching {url!r}")


def attachment_to_dict(attachment: Any, workspace_slug: str) -> dict[str, Any]:
    data = attachment.model_dump()
    attrs = data.get("attributes") or {}
    data["name"] = attrs.get("name")
    data["size"] = attrs.get("size") or data.get("size")
    data["content_type"] = attrs.get("type")
    return data
