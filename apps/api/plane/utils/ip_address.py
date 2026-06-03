# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import ipaddress
import socket
from urllib.parse import urlparse


def validate_url(url, allowed_ips=None, allowed_hosts=None):
    """
    Validate that a URL doesn't resolve to a private/internal IP address (SSRF protection).

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

    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise ValueError("Hostname could not be resolved")

    if not addr_info:
        raise ValueError("No IP addresses found for the hostname")

    for addr in addr_info:
        ip = ipaddress.ip_address(addr[4][0])
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            if allowed_ips and any(
                network.version == ip.version and ip in network for network in allowed_ips
            ):
                continue
            raise ValueError("Access to private/internal networks is not allowed")


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip
