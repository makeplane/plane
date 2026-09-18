# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
SSRF-safe outbound HTTP client.

The validators in :mod:`plane.utils.ip_address` resolve a hostname and confirm
that none of its addresses point at internal infrastructure. On their own they
are vulnerable to DNS rebinding (TOCTOU): the validator resolves the name, but
``requests`` resolves it a *second* time when it actually connects, and an
attacker who controls DNS can return a public IP to the validator and an
internal IP to the connection.

``pinned_fetch`` closes that window by resolving + validating once and then
connecting to the *validated IP literal* — urllib3 performs no second DNS
lookup, so the address that was checked is exactly the address that is reached.
The original hostname is still used for the ``Host`` header, TLS SNI and
certificate verification, so virtual-hosting and HTTPS continue to work.

Redirects are never auto-followed (``requests`` would re-resolve each hop and
reopen the rebinding window, and a ``Location`` can point at a new internal
host). ``pinned_fetch_following_redirects`` follows them manually, re-resolving,
re-validating and re-pinning every hop.
"""

# Python imports
import ipaddress
from urllib.parse import unquote, urljoin, urlsplit

# Third party imports
import requests
from requests.adapters import HTTPAdapter

# Module imports
from plane.utils.ip_address import resolve_and_validate

# 3xx status codes that carry a Location we may follow.
_REDIRECT_STATUSES = {301, 302, 303, 307, 308}

# Never route through an ambient proxy — a CONNECT to a proxy would tunnel to
# the original hostname and bypass the IP pinning entirely.
_NO_PROXIES = {"http": None, "https": None}


class PinnedIPAdapter(HTTPAdapter):
    """
    A ``requests`` transport adapter that connects to whatever IP literal is in
    the request URL while presenting ``server_hostname`` for TLS SNI and
    certificate verification.

    The IP literal in the URL means urllib3 opens the socket to that exact IP
    with no DNS resolution. Injecting ``server_hostname`` (and leaving
    ``assert_hostname`` at its ``None`` default so ``SSLContext.check_hostname``
    stays ``True``) makes the standard library verify the presented certificate
    against the real hostname rather than the IP.

    Instances hold no global state — one is mounted on a throwaway
    :class:`requests.Session` per request, so this is safe under any Celery pool
    (prefork / threads / gevent).
    """

    def __init__(self, server_hostname, *args, **kwargs):
        self._server_hostname = server_hostname
        super().__init__(*args, **kwargs)

    def get_connection_with_tls_context(self, request, verify, proxies=None, cert=None):
        # requests >= 2.32 calls this (it replaced get_connection() as part of
        # the CVE-2024-35195 fix). requests is pinned to 2.33 in base.txt.
        host_params, pool_kwargs = self.build_connection_pool_key_attributes(
            request, verify, cert
        )
        # server_hostname is a recognised urllib3 SSL pool-key field, so pools
        # for different hostnames don't collide.
        pool_kwargs["server_hostname"] = self._server_hostname
        return self.poolmanager.connection_from_host(**host_params, pool_kwargs=pool_kwargs)


def _split_target(url):
    """Parse a URL into the pieces needed to build a pinned request.

    Returns ``(scheme, hostname, port, path, auth)`` where ``auth`` carries any
    URL-embedded credentials (``user:pass@host``) as a ``(user, pass)`` tuple so
    HTTP Basic Auth still works once the URL is rewritten to an IP literal.
    """
    parts = urlsplit(url)
    scheme = parts.scheme
    if scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Only HTTP and HTTPS are allowed")
    hostname = parts.hostname
    if not hostname:
        raise ValueError("Invalid URL: No hostname found")
    port = parts.port or (443 if scheme == "https" else 80)
    path = parts.path or "/"
    if parts.query:
        path = f"{path}?{parts.query}"
    auth = None
    if parts.username is not None or parts.password is not None:
        auth = (unquote(parts.username or ""), unquote(parts.password or ""))
    return scheme, hostname, port, path, auth


def _request_to_ip(method, scheme, hostname, ip, port, path, *, headers, timeout, auth=None, **kwargs):
    """Issue a single request whose socket is pinned to ``ip``.

    With ``stream=True`` the session is kept open until the caller closes the
    response (closing the response also closes the session), so a streamed body
    can be read with a real size cap; otherwise the session is closed eagerly.
    """
    ip_obj = ipaddress.ip_address(ip)
    host_for_url = f"[{ip}]" if ip_obj.version == 6 else ip
    url = f"{scheme}://{host_for_url}:{port}{path}"

    request_headers = dict(headers or {})
    default_port = 443 if scheme == "https" else 80
    # Host header (and TLS) carry the ORIGINAL hostname, not the IP literal.
    # An IPv6-literal hostname must be bracketed in the Host header.
    host_label = f"[{hostname}]" if ":" in hostname else hostname
    request_headers["Host"] = host_label if port == default_port else f"{host_label}:{port}"

    session = requests.Session()
    session.trust_env = False  # ignore ambient proxy / netrc / env (see _NO_PROXIES)
    if scheme == "https":
        session.mount("https://", PinnedIPAdapter(server_hostname=hostname))

    try:
        response = session.request(
            method,
            url,
            headers=request_headers,
            timeout=timeout,
            allow_redirects=False,
            verify=True,
            proxies=_NO_PROXIES,
            auth=auth,
            **kwargs,
        )
    except BaseException:
        session.close()
        raise

    if kwargs.get("stream"):
        # Defer closing the session until the response is closed, so the
        # streamed body remains readable. response.close() now also closes
        # the session.
        _orig_close = response.close

        def _close_all(_orig=_orig_close, _sess=session):
            try:
                _orig()
            finally:
                _sess.close()

        response.close = _close_all
    else:
        session.close()
    return response


def _fetch_validated_hop(method, url, *, allowed_ips, allowed_hosts, headers, timeout, **kwargs):
    """
    Resolve ``url``'s host, validate it, then issue a single (non-redirecting)
    request pinned to a resolved IP. Returns ``(response, normalized_host)``.

    Hosts in ``allowed_hosts`` are operator-trusted (e.g. internal service DNS
    whose IPs are dynamic): they skip the private-IP *block* check, but the
    connection is STILL pinned to the resolved IP so a trusted hostname cannot
    be rebound to a different internal target between validation and connect.
    """
    scheme, hostname, port, path, auth = _split_target(url)

    normalized_host = hostname.rstrip(".").lower()
    trusted = bool(allowed_hosts) and normalized_host in {
        (h or "").rstrip(".").lower() for h in allowed_hosts if h
    }

    # Resolve once (and validate unless the host is operator-trusted), then pin
    # the connection to a resolved IP literal — urllib3 performs no second DNS
    # lookup, so the address validated here is exactly the one reached.
    ips = resolve_and_validate(hostname, allowed_ips=allowed_ips, require_safe=not trusted)

    last_exc = None
    for ip in ips:
        try:
            response = _request_to_ip(
                method, scheme, hostname, ip, port, path,
                headers=headers, timeout=timeout, auth=auth, **kwargs,
            )
            return response, normalized_host
        except requests.RequestException as exc:
            # Try the next resolved address (dual-stack / round-robin hosts).
            last_exc = exc
    if last_exc is not None:
        raise last_exc
    raise requests.ConnectionError(f"No reachable address for host: {hostname}")


def pinned_fetch(
    method,
    url,
    *,
    allowed_ips=None,
    allowed_hosts=None,
    headers=None,
    timeout=30,
    **kwargs,
):
    """
    SSRF-safe single request. Resolves + validates the target host and pins the
    connection to a validated IP (defeating DNS rebinding). Does NOT follow
    redirects.

    Raises:
        ValueError: if the URL is invalid or resolves to a blocked address.
        requests.RequestException: on network/transport errors.
    """
    response, _ = _fetch_validated_hop(
        method, url,
        allowed_ips=allowed_ips, allowed_hosts=allowed_hosts,
        headers=headers, timeout=timeout, **kwargs,
    )
    return response


def pinned_fetch_following_redirects(
    method,
    url,
    *,
    allowed_ips=None,
    allowed_hosts=None,
    headers=None,
    timeout=30,
    max_redirects=5,
    **kwargs,
):
    """
    SSRF-safe request that follows redirects manually, re-resolving,
    re-validating and re-pinning every hop. Returns ``(response, final_url)``.

    Raises:
        ValueError: if any URL in the chain is invalid or resolves to a blocked
            address.
        requests.TooManyRedirects: if the hop limit is exceeded.
        requests.RequestException: on network/transport errors.
    """
    current_url = url
    redirects = 0
    while True:
        response, _ = _fetch_validated_hop(
            method, current_url,
            allowed_ips=allowed_ips, allowed_hosts=allowed_hosts,
            headers=headers, timeout=timeout, **kwargs,
        )

        if response.status_code not in _REDIRECT_STATUSES:
            return response, current_url

        location = response.headers.get("Location")
        if not location:
            return response, current_url

        if redirects >= max_redirects:
            response.close()
            raise requests.TooManyRedirects(
                f"Exceeded {max_redirects} redirects for URL: {url}"
            )
        redirects += 1
        # Release the intermediate hop's connection/session before following.
        response.close()
        # Resolve the redirect target against the current URL; the next loop
        # iteration re-validates and re-pins it.
        current_url = urljoin(current_url, location)
