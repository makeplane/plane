# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import ipaddress
import socket
from urllib.parse import urlparse


# Networks that must never be reachable as an outbound request target but which
# the stdlib ``ipaddress`` flags (is_private/is_loopback/...) do NOT reliably
# classify on every Python version. Listed explicitly so the verdict is
# identical and fail-closed across Python 3.9 – 3.14 (Plane ships on 3.12,
# where e.g. 100.64.0.0/10 is neither is_private nor is_global).
_BLOCKED_NETWORKS = [
    ipaddress.ip_network(cidr)
    for cidr in (
        "0.0.0.0/8",  # "this host on this network" (RFC 1122) / unspecified block
        "100.64.0.0/10",  # carrier-grade NAT / shared address space (RFC 6598)
        "169.254.0.0/16",  # link-local (incl. cloud metadata 169.254.169.254)
        "255.255.255.255/32",  # limited broadcast
        "::ffff:0:0/96",  # IPv4-mapped IPv6
        "64:ff9b::/96",  # NAT64 well-known prefix (RFC 6052)
        "64:ff9b:1::/48",  # NAT64 local-use prefix (RFC 8215)
        "2002::/16",  # 6to4
        "2001::/32",  # Teredo
        "fec0::/10",  # deprecated IPv6 site-local
    )
]


def _embedded_ipv4(ip):
    """
    Yield any IPv4 address embedded inside an IPv6 transition address.

    An attacker who controls a hostname's AAAA record can point it at an IPv6
    address that the network transparently translates to an internal IPv4
    target (e.g. ``::ffff:169.254.169.254``, ``64:ff9b::7f00:1`` → 127.0.0.1,
    6to4, Teredo). The embedded IPv4 is what the packet ultimately reaches, so
    it must be validated too — we cannot trust the interpreter to classify the
    outer IPv6 address consistently across versions.
    """
    if ip.version != 6:
        return

    if ip.ipv4_mapped is not None:
        yield ip.ipv4_mapped

    if ip.sixtofour is not None:
        yield ip.sixtofour

    teredo = ip.teredo
    if teredo is not None:
        # (server_ipv4, client_ipv4)
        yield teredo[0]
        yield teredo[1]

    # NAT64 well-known prefix (64:ff9b::/96): the low 32 bits embed the IPv4.
    # The local-use prefix 64:ff9b:1::/48 uses a different (length-dependent)
    # embedding per RFC 6052, so it is not decoded here — it is blocked wholesale
    # via _BLOCKED_NETWORKS instead.
    if ip in ipaddress.ip_network("64:ff9b::/96"):
        yield ipaddress.ip_address(int(ip) & 0xFFFFFFFF)


def is_blocked_ip(ip):
    """
    Return ``True`` if ``ip`` (an ``ipaddress`` address object) should never be
    used as an outbound request target (SSRF protection).

    Blocks private, loopback, reserved, link-local, multicast and unspecified
    ranges; an explicit deny-list of networks the stdlib misclassifies on some
    Python versions; and recurses into IPv4 addresses embedded in IPv6
    transition formats. Fails closed: anything it cannot positively clear is
    treated as blocked.
    """
    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_reserved
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_unspecified
    ):
        return True

    if any(ip.version == net.version and ip in net for net in _BLOCKED_NETWORKS):
        return True

    for embedded in _embedded_ipv4(ip):
        if is_blocked_ip(embedded):
            return True

    return False


def _is_allowed_ip(ip, allowed_ips):
    """Return True if ``ip`` falls inside an operator-trusted allowlist network."""
    return bool(allowed_ips) and any(
        net.version == ip.version and ip in net for net in allowed_ips
    )


def resolve_and_validate(hostname, allowed_ips=None, require_safe=True):
    """
    Resolve ``hostname`` and (when ``require_safe``) ensure every resolved
    address is a safe outbound target, returning the list of resolved IP
    strings (in resolver order, de-duplicated).

    The returned list is intended to be *pinned* for the actual connection
    (connect to the IP literal so no second DNS lookup occurs), which is what
    closes the DNS-rebinding TOCTOU.

    Args:
        hostname: The hostname (or IP literal) to resolve.
        allowed_ips: Optional list of ``ipaddress.ip_network`` objects. IPs
                     inside these networks are permitted even if otherwise
                     blocked (operator-trusted internal targets).
        require_safe: When ``True`` (default) every resolved IP is checked and a
                     blocked/internal address raises. When ``False`` the host is
                     already operator-trusted (e.g. a WEBHOOK_ALLOWED_HOSTS
                     entry) so the block check is skipped — but resolution still
                     happens so the connection can be pinned (pinning prevents
                     rebinding even for trusted hosts).

    Returns:
        list[str]: The resolved IP addresses to which a connection may be
        pinned.

    Raises:
        ValueError: If the hostname cannot be resolved or (when
        ``require_safe``) any resolved address is a blocked/internal target not
        covered by ``allowed_ips``.
    """
    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except (socket.gaierror, UnicodeError):
        # UnicodeError covers IDNA encoding/normalisation failures, which
        # getaddrinfo raises before the address lookup for malformed hostnames.
        raise ValueError("Hostname could not be resolved")

    if not addr_info:
        raise ValueError("No IP addresses found for the hostname")

    validated = []
    for addr in addr_info:
        # Strip any IPv6 zone id (e.g. ``fe80::1%eth0``) before parsing.
        ip_str = addr[4][0].split("%")[0]
        ip = ipaddress.ip_address(ip_str)
        if require_safe and not _is_allowed_ip(ip, allowed_ips) and is_blocked_ip(ip):
            raise ValueError("Access to private/internal networks is not allowed")
        if ip_str not in validated:
            validated.append(ip_str)

    return validated


def validate_url(url, allowed_ips=None, allowed_hosts=None):
    """
    Validate that a URL doesn't resolve to a private/internal IP address (SSRF protection).

    Note: this validates at a point in time. To defeat DNS-rebinding (TOCTOU),
    the actual request must be pinned to the validated IP — see
    ``plane.utils.url_security.pinned_fetch``.

    Args:
        url: The URL to validate.
        allowed_ips: Optional list of ipaddress.ip_network objects. IPs falling within
                     these networks are permitted even if they are private/loopback/reserved.
                     Typically sourced from the WEBHOOK_ALLOWED_IPS setting.
        allowed_hosts: Optional iterable of hostnames that bypass IP-based blocking
                       (exact, case-insensitive match against the URL hostname).
                       Typically sourced from the WEBHOOK_ALLOWED_HOSTS setting and
                       used for trusted internal services (e.g. Silo) whose IPs are
                       dynamic in containerised deployments.

    Raises:
        ValueError: If the URL is invalid or resolves to a blocked IP.
    """
    parsed = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        raise ValueError("Invalid URL: No hostname found")

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Only HTTP and HTTPS are allowed")

    normalized_host = hostname.rstrip(".").lower()
    if allowed_hosts and normalized_host in {
        (h or "").rstrip(".").lower() for h in allowed_hosts if h
    }:
        return

    resolve_and_validate(hostname, allowed_ips=allowed_ips)


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip
