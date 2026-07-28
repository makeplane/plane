# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.test import RequestFactory

from plane.authentication.rate_limit import (
    AuthenticationAccountThrottle,
    _valid_rate_or_default,
)


@pytest.mark.unit
class TestValidRateOrDefault:
    """A malformed AUTHENTICATION_ACCOUNT_RATE_LIMIT must not crash auth: the throttle is
    built on every sign-in POST, and DRF parse_rate() raises on a bad rate. Guard falls
    back to the default so authentication stays up."""

    @pytest.mark.parametrize("bad", ["", "bad//x", "10/xyz", "abc/m", "5", "5/", None])
    def test_malformed_falls_back_to_default(self, bad):
        assert _valid_rate_or_default(bad, "5/minute") == "5/minute"

    @pytest.mark.parametrize("good", ["3/m", "5/minute", "10/h", "1/s", "100/d"])
    def test_valid_rate_passes_through(self, good):
        assert _valid_rate_or_default(good, "5/minute") == good


@pytest.mark.unit
class TestAccountThrottleCacheKey:
    """The per-account throttle keys on email AND client IP. Keying on email alone would
    let anyone lock a victim out of their own account by spamming their address from other
    IPs; combining with the client IP prevents that self-inflicted lockout DoS."""

    def _request(self, remote_addr, **post):
        request = RequestFactory().post("/auth/sign-in/", data=post)
        request.META["REMOTE_ADDR"] = remote_addr
        return request

    def test_key_combines_normalized_email_and_ip(self):
        key = AuthenticationAccountThrottle().get_cache_key(self._request("10.0.0.1", email="Victim@Example.COM "))
        assert "email:victim@example.com" in key  # normalized (strip + lower)
        assert "ip:10.0.0.1" in key

    def test_same_email_different_ip_yields_different_buckets(self):
        throttle = AuthenticationAccountThrottle()
        k1 = throttle.get_cache_key(self._request("1.1.1.1", email="v@example.com"))
        k2 = throttle.get_cache_key(self._request("2.2.2.2", email="v@example.com"))
        assert k1 != k2  # an attacker on another IP cannot consume the victim's bucket

    def test_no_email_falls_back_to_ip_only(self):
        key = AuthenticationAccountThrottle().get_cache_key(self._request("9.9.9.9"))
        assert "ip:9.9.9.9" in key
        assert "email:" not in key
