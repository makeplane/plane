# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Offline unit tests for the Zelian (Supabase) OAuth 2.1 provider.

These cover the logic that does NOT require a live Supabase server: PKCE
generation, authorization-URL construction, config validation, the token-
exchange request shape (Basic auth + code_verifier) and the userinfo mapping.
End-to-end flow testing needs a configured Supabase OAuth server (see the plan).
"""

import base64
import hashlib
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import pytest
from django.test import RequestFactory

from plane.authentication.adapter.error import AuthenticationException
from plane.authentication.views.app.zelian import generate_pkce_pair

# get_configuration_value reads the instance_configurations table (falls back to
# env), so any test that instantiates the provider needs DB access.
pytestmark = pytest.mark.django_db


ENV = {
    "ZELIAN_AUTH_BASE_URL": "https://abcdefgh.supabase.co/auth/v1",
    "ZELIAN_CLIENT_ID": "client-123",
    "ZELIAN_CLIENT_SECRET": "secret-456",
}


def secure_request():
    request = RequestFactory().get("/auth/zelian/", secure=True)
    return request


class TestGeneratePkcePair:
    def test_verifier_length_and_challenge_is_s256_of_verifier(self):
        verifier, challenge = generate_pkce_pair()

        # RFC 7636: verifier is 43–128 chars
        assert 43 <= len(verifier) <= 128
        # challenge = base64url(sha256(verifier)) without padding
        expected = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
        assert challenge == expected
        assert "=" not in challenge

    def test_pairs_are_unique(self):
        assert generate_pkce_pair()[0] != generate_pkce_pair()[0]


class TestProviderConfig:
    def test_raises_when_not_configured(self):
        from plane.authentication.provider.oauth.zelian import ZelianOAuthProvider

        with patch.dict("os.environ", {}, clear=False):
            with patch("os.environ.get", return_value=None):
                with pytest.raises(AuthenticationException) as exc:
                    ZelianOAuthProvider(request=secure_request(), state="s")
        assert exc.value.error_code == 5113  # ZELIAN_NOT_CONFIGURED

    def test_rejects_non_http_scheme(self):
        from plane.authentication.provider.oauth.zelian import ZelianOAuthProvider

        bad = dict(ENV, ZELIAN_AUTH_BASE_URL="ftp://x/auth/v1")
        with patch.dict("os.environ", bad, clear=False):
            with pytest.raises(AuthenticationException) as exc:
                ZelianOAuthProvider(request=secure_request(), state="s")
        assert exc.value.error_code == 5113


class TestAuthorizationUrl:
    def test_builds_pkce_authorize_url(self):
        from plane.authentication.provider.oauth.zelian import ZelianOAuthProvider

        _verifier, challenge = generate_pkce_pair()
        with patch.dict("os.environ", ENV, clear=False):
            provider = ZelianOAuthProvider(request=secure_request(), state="state-xyz", code_challenge=challenge)

        parsed = urlparse(provider.get_auth_url())
        assert parsed.scheme == "https"
        assert parsed.netloc == "abcdefgh.supabase.co"
        assert parsed.path == "/auth/v1/oauth/authorize"
        qs = parse_qs(parsed.query)
        assert qs["response_type"] == ["code"]
        assert qs["client_id"] == ["client-123"]
        assert qs["scope"] == ["openid email profile"]
        assert qs["state"] == ["state-xyz"]
        assert qs["code_challenge"] == [challenge]
        assert qs["code_challenge_method"] == ["S256"]
        assert qs["redirect_uri"] == ["https://testserver/auth/zelian/callback/"]

    def test_token_and_userinfo_urls(self):
        from plane.authentication.provider.oauth.zelian import ZelianOAuthProvider

        with patch.dict("os.environ", ENV, clear=False):
            provider = ZelianOAuthProvider(request=secure_request(), state="s")
        assert provider.token_url == "https://abcdefgh.supabase.co/auth/v1/oauth/token"
        assert provider.userinfo_url == "https://abcdefgh.supabase.co/auth/v1/oauth/userinfo"


class TestTokenExchange:
    def test_set_token_data_uses_basic_auth_and_code_verifier(self):
        from plane.authentication.provider.oauth.zelian import ZelianOAuthProvider

        with patch.dict("os.environ", ENV, clear=False):
            provider = ZelianOAuthProvider(
                request=secure_request(), code="auth-code", code_verifier="verifier-abc"
            )

        with patch.object(
            provider,
            "get_user_token",
            return_value={"access_token": "at", "refresh_token": "rt", "expires_in": 3600, "id_token": "idt"},
        ) as mocked:
            provider.set_token_data()

        _args, kwargs = mocked.call_args
        sent_data = kwargs["data"]
        sent_headers = kwargs["headers"]
        assert sent_data["grant_type"] == "authorization_code"
        assert sent_data["code"] == "auth-code"
        assert sent_data["code_verifier"] == "verifier-abc"
        # client_secret_basic: base64(client_id:client_secret) in the Authorization header
        expected_basic = base64.b64encode(b"client-123:secret-456").decode()
        assert sent_headers["Authorization"] == f"Basic {expected_basic}"
        assert provider.token_data["access_token"] == "at"
        assert provider.token_data["id_token"] == "idt"


class TestUserinfoMapping:
    def test_maps_supabase_userinfo_to_plane_user(self):
        from plane.authentication.provider.oauth.zelian import ZelianOAuthProvider

        with patch.dict("os.environ", ENV, clear=False):
            provider = ZelianOAuthProvider(request=secure_request(), code="c")

        userinfo = {
            "sub": "supabase-uid-1",
            "email": "jane.doe@zelian.fr",
            "name": "Jane Doe",
            "picture": "https://cdn/avatar.png",
        }
        with patch.object(provider, "get_user_response", return_value=userinfo):
            provider.set_user_data()

        u = provider.user_data
        assert u["email"] == "jane.doe@zelian.fr"
        assert u["user"]["provider_id"] == "supabase-uid-1"
        assert u["user"]["first_name"] == "Jane"
        assert u["user"]["last_name"] == "Doe"
        assert u["user"]["avatar"] == "https://cdn/avatar.png"
        assert u["user"]["is_password_autoset"] is True

    def test_falls_back_to_email_local_part_when_no_name(self):
        from plane.authentication.provider.oauth.zelian import ZelianOAuthProvider

        with patch.dict("os.environ", ENV, clear=False):
            provider = ZelianOAuthProvider(request=secure_request(), code="c")

        with patch.object(provider, "get_user_response", return_value={"sub": "s", "email": "bob@zelian.fr"}):
            provider.set_user_data()

        assert provider.user_data["user"]["first_name"] == "bob"
        assert provider.user_data["user"]["last_name"] == ""
