# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
from unittest.mock import patch, MagicMock
from plane.bgtasks.link_crawler_task import safe_get
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
class TestValidateUrl:
    """Test validate_url blocks private/internal IPs."""

    def test_rejects_private_ip(self):
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("192.168.1.1", 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url("http://example.com")

    def test_rejects_loopback(self):
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("127.0.0.1", 0))]
            with pytest.raises(ValueError, match="private/internal"):
                validate_url("http://example.com")

    def test_rejects_non_http_scheme(self):
        with pytest.raises(ValueError, match="Only HTTP and HTTPS"):
            validate_url("file:///etc/passwd")

    def test_allows_public_ip(self):
        with patch("plane.utils.ip_address.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(None, None, None, None, ("93.184.216.34", 0))]
            validate_url("https://example.com")  # Should not raise


@pytest.mark.unit
class TestSafeGet:
    """Test safe_get follows redirects safely and blocks SSRF."""

    @patch("plane.bgtasks.link_crawler_task.requests.get")
    @patch("plane.bgtasks.link_crawler_task.validate_url")
    def test_returns_response_for_non_redirect(self, mock_validate, mock_get):
        final_resp = _make_response(status_code=200, content=b"OK")
        mock_get.return_value = final_resp

        response, final_url = safe_get("https://example.com")

        assert response is final_resp
        assert final_url == "https://example.com"
        mock_validate.assert_called_once_with("https://example.com")

    @patch("plane.bgtasks.link_crawler_task.requests.get")
    @patch("plane.bgtasks.link_crawler_task.validate_url")
    def test_follows_redirect_and_validates_each_hop(self, mock_validate, mock_get):
        redirect_resp = _make_response(
            status_code=301,
            is_redirect=True,
            headers={"Location": "https://other.com/page"},
        )
        final_resp = _make_response(status_code=200, content=b"OK")
        mock_get.side_effect = [redirect_resp, final_resp]

        response, final_url = safe_get("https://example.com")

        assert response is final_resp
        assert final_url == "https://other.com/page"
        # Should validate both the initial URL and the redirect target
        assert mock_validate.call_count == 2
        mock_validate.assert_any_call("https://example.com")
        mock_validate.assert_any_call("https://other.com/page")

    @patch("plane.bgtasks.link_crawler_task.requests.get")
    @patch("plane.bgtasks.link_crawler_task.validate_url")
    def test_blocks_redirect_to_private_ip(self, mock_validate, mock_get):
        redirect_resp = _make_response(
            status_code=302,
            is_redirect=True,
            headers={"Location": "http://192.168.1.1:8080"},
        )
        mock_get.return_value = redirect_resp
        # First call (initial URL) succeeds, second call (redirect target) fails
        mock_validate.side_effect = [None, ValueError("Access to private/internal networks is not allowed")]

        with pytest.raises(ValueError, match="private/internal"):
            safe_get("https://evil.com/redirect")

        # Ensure the blocked redirect target is validated before any second fetch occurs.
        assert mock_get.call_count == 1
        assert mock_validate.call_count == 2
        mock_validate.assert_any_call("https://evil.com/redirect")
        mock_validate.assert_any_call("http://192.168.1.1:8080")

    @patch("plane.bgtasks.link_crawler_task.requests.get")
    @patch("plane.bgtasks.link_crawler_task.validate_url")
    def test_raises_on_too_many_redirects(self, mock_validate, mock_get):
        redirect_resp = _make_response(
            status_code=302,
            is_redirect=True,
            headers={"Location": "https://example.com/loop"},
        )
        mock_get.return_value = redirect_resp

        with pytest.raises(RuntimeError, match="Too many redirects"):
            safe_get("https://example.com/start")

    @patch("plane.bgtasks.link_crawler_task.requests.get")
    @patch("plane.bgtasks.link_crawler_task.validate_url")
    def test_succeeds_at_exact_max_redirects(self, mock_validate, mock_get):
        """After exactly MAX_REDIRECTS hops, if the final response is 200, it should succeed."""
        redirect_resp = _make_response(
            status_code=302,
            is_redirect=True,
            headers={"Location": "https://example.com/next"},
        )
        final_resp = _make_response(status_code=200, content=b"OK")
        # 5 redirects then a 200
        mock_get.side_effect = [redirect_resp] * 5 + [final_resp]

        response, final_url = safe_get("https://example.com/start")

        assert response is final_resp
        assert not response.is_redirect
