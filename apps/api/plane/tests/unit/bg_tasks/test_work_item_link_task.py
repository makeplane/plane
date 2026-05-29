# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import ipaddress

import pytest
import requests
from unittest.mock import patch, MagicMock
from plane.bgtasks.work_item_link_task import safe_get, validate_url_ip
from plane.utils.ip_address import validate_url


def _make_response(status_code=200, headers=None, is_redirect=False, content=b""):
    """Create a mock requests.Response."""
    resp = MagicMock()
    resp.status_code = status_code
    resp.is_redirect = is_redirect
    resp.headers = headers or {}
    resp.content = content
    return resp


@pytest.mark.unit
class TestValidateUrlIp:
    """Test validate_url_ip blocks private/internal IPs."""

    def test_rejects_private_ip(self):
        with patch("plane.bgtasks.work_item_link_task.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("192.168.1.1", 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url_ip("http://example.com")

    def test_rejects_loopback(self):
        with patch("plane.bgtasks.work_item_link_task.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("127.0.0.1", 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url_ip("http://example.com")

    def test_rejects_non_http_scheme(self):
        with pytest.raises(ValueError, match="Only HTTP and HTTPS"):
            validate_url_ip("file:///etc/passwd")

    def test_allows_public_ip(self):
        with patch("plane.bgtasks.work_item_link_task.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("93.184.216.34", 0))]
            validate_url_ip("https://example.com")  # Should not raise

    @pytest.mark.parametrize(
        "ip",
        [
            "100.64.0.1",  # CGNAT / shared address space (not is_private on 3.12)
            "224.0.0.1",  # multicast
            "0.0.0.0",  # unspecified
            "::ffff:169.254.169.254",  # IPv4-mapped cloud metadata
            "64:ff9b::a9fe:a9fe",  # NAT64 embedding 169.254.169.254
        ],
    )
    def test_rejects_hardened_bypass_ranges(self, ip):
        with patch("plane.bgtasks.work_item_link_task.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, (ip, 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url_ip("http://attacker.example.com")


@pytest.mark.unit
class TestValidateUrlAllowlist:
    """Test validate_url allowlist permits specific private IPs."""

    def test_allowlist_permits_private_ip(self):
        allowed = [ipaddress.ip_network("192.168.1.0/24")]
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("192.168.1.50", 0))]
            validate_url("http://example.com", allowed_ips=allowed)  # Should not raise

    def test_allowlist_does_not_permit_other_private_ip(self):
        allowed = [ipaddress.ip_network("192.168.1.0/24")]
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("10.0.0.1", 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url("http://example.com", allowed_ips=allowed)

    def test_allowlist_permits_loopback_when_explicitly_allowed(self):
        allowed = [ipaddress.ip_network("127.0.0.0/8")]
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("127.0.0.1", 0))]
            validate_url("http://example.com", allowed_ips=allowed)  # Should not raise

    def test_allowlist_permits_matching_ipv4_with_mixed_version_networks(self):
        allowed = [
            ipaddress.ip_network("2001:db8::/32"),
            ipaddress.ip_network("192.168.1.0/24"),
        ]
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("192.168.1.50", 0))]
            validate_url("http://example.com", allowed_ips=allowed)  # Should not raise

    def test_allowlist_blocks_non_matching_ipv4_with_mixed_version_networks(self):
        allowed = [
            ipaddress.ip_network("2001:db8::/32"),
            ipaddress.ip_network("192.168.1.0/24"),
        ]
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("10.0.0.1", 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url("http://example.com", allowed_ips=allowed)

    def test_allowed_hosts_bypasses_private_ip_check(self):
        """Hostnames in WEBHOOK_ALLOWED_HOSTS skip IP-based blocking — used for
        trusted internal services (e.g. Silo) whose IPs are dynamic in
        containerised deployments."""
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("172.18.0.5", 0))]
            validate_url("http://silo:3000/hook", allowed_hosts=["silo"])  # Should not raise

    def test_allowed_hosts_matches_case_insensitively(self):
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("10.0.0.1", 0))]
            validate_url(
                "http://Silo.Namespace.Svc.Cluster.Local/x",
                allowed_hosts=["silo.namespace.svc.cluster.local"],
            )  # Should not raise

    def test_allowed_hosts_skips_dns_lookup(self):
        """When the hostname is explicitly trusted we shouldn't even resolve it —
        protects against operators who allowlist a name that isn't resolvable
        from the API container."""
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            validate_url("http://silo/hook", allowed_hosts=["silo"])
            mock_dns.assert_not_called()

    def test_allowed_hosts_requires_exact_match(self):
        """Subdomains of an allowed host must NOT bypass — a hostile
        ``attacker.silo.internal`` should still be blocked when only
        ``silo.internal`` is allowed."""
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("192.168.1.1", 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url(
                    "http://attacker.silo.internal/x",
                    allowed_hosts=["silo.internal"],
                )

    def test_allowed_hosts_empty_does_not_bypass(self):
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("10.0.0.1", 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url("http://silo/hook", allowed_hosts=[])


@pytest.mark.unit
class TestSafeGet:
    """safe_get now delegates to the pinned SSRF-safe client; assert it resolves,
    validates, pins to the validated IP and follows redirects safely. Network is
    mocked at the requests.Session boundary inside plane.utils.url_security."""

    @patch("plane.utils.url_security.requests.Session")
    @patch("plane.utils.url_security.resolve_and_validate")
    def test_returns_response_for_non_redirect(self, mock_resolve, mock_session_cls):
        mock_resolve.return_value = ["93.184.216.34"]
        session = mock_session_cls.return_value
        session.request.return_value = _make_response(status_code=200, content=b"OK")

        response, final_url = safe_get("https://example.com")

        assert response.status_code == 200
        assert final_url == "https://example.com"
        # Pinned to the validated IP literal, not the hostname.
        _, url = session.request.call_args.args
        assert url == "https://93.184.216.34:443/"
        assert session.request.call_args.kwargs["headers"]["Host"] == "example.com"

    @patch("plane.utils.url_security.requests.Session")
    @patch("plane.utils.url_security.resolve_and_validate")
    def test_follows_redirect_and_validates_each_hop(self, mock_resolve, mock_session_cls):
        mock_resolve.return_value = ["93.184.216.34"]
        session = mock_session_cls.return_value
        session.request.side_effect = [
            _make_response(status_code=301, headers={"Location": "https://other.com/page"}),
            _make_response(status_code=200, content=b"OK"),
        ]

        response, final_url = safe_get("https://example.com")

        assert response.status_code == 200
        assert final_url == "https://other.com/page"
        assert mock_resolve.call_count == 2
        assert mock_resolve.call_args_list[0].args[0] == "example.com"
        assert mock_resolve.call_args_list[1].args[0] == "other.com"

    @patch("plane.utils.url_security.requests.Session")
    @patch("plane.utils.url_security.resolve_and_validate")
    def test_blocks_redirect_to_private_ip(self, mock_resolve, mock_session_cls):
        mock_resolve.side_effect = [
            ["93.184.216.34"],
            ValueError("Access to private/internal networks is not allowed"),
        ]
        session = mock_session_cls.return_value
        session.request.return_value = _make_response(
            status_code=302, headers={"Location": "http://192.168.1.1:8080"}
        )

        with pytest.raises(ValueError, match="private/internal"):
            safe_get("https://evil.com/redirect")

    @patch("plane.utils.url_security.requests.Session")
    @patch("plane.utils.url_security.resolve_and_validate")
    def test_raises_on_too_many_redirects(self, mock_resolve, mock_session_cls):
        mock_resolve.return_value = ["93.184.216.34"]
        session = mock_session_cls.return_value
        session.request.return_value = _make_response(
            status_code=302, headers={"Location": "https://example.com/loop"}
        )

        with pytest.raises(requests.TooManyRedirects):
            safe_get("https://example.com/start")

    @patch("plane.utils.url_security.requests.Session")
    @patch("plane.utils.url_security.resolve_and_validate")
    def test_succeeds_at_exact_max_redirects(self, mock_resolve, mock_session_cls):
        """5 redirects then a 200 must succeed (MAX_REDIRECTS == 5)."""
        mock_resolve.return_value = ["93.184.216.34"]
        session = mock_session_cls.return_value
        session.request.side_effect = [
            _make_response(status_code=302, headers={"Location": "https://example.com/next"})
        ] * 5 + [_make_response(status_code=200, content=b"OK")]

        response, final_url = safe_get("https://example.com/start")

        assert response.status_code == 200
