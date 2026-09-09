# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for the generic OpenID Connect provider.

All HTTP traffic (discovery, JWKS, token, userinfo) is mocked at the
``requests`` boundary so these tests exercise the real OIDC validation logic:
PKCE challenge derivation, ID-token signature / issuer / audience / nonce
checks, UserInfo ``sub`` binding and the optional verified-email gate.
"""

import json
import time
from unittest.mock import MagicMock, patch

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES, AuthenticationException
from plane.authentication.provider.oauth import oidc as oidc_module
from plane.authentication.provider.oauth.oidc import OIDCOAuthProvider

ISSUER = "https://kc.example.com/realms/plane"
CLIENT_ID = "plane"
CLIENT_SECRET = "s3cret"
KID = "test-key"

DISCOVERY = {
    "issuer": ISSUER,
    "authorization_endpoint": f"{ISSUER}/protocol/openid-connect/auth",
    "token_endpoint": f"{ISSUER}/protocol/openid-connect/token",
    "userinfo_endpoint": f"{ISSUER}/protocol/openid-connect/userinfo",
    "jwks_uri": f"{ISSUER}/protocol/openid-connect/certs",
}


def _rsa_pem():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(key.public_key()))
    jwk.update({"kid": KID, "use": "sig", "alg": "RS256"})
    return pem, jwk


SIGNING_PEM, SIGNING_JWK = _rsa_pem()
OTHER_PEM, _ = _rsa_pem()


class FakeCache:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, timeout=None):
        self.store[key] = value


class FakeResponse:
    def __init__(self, payload, status=200):
        self._payload = payload
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            import requests

            raise requests.HTTPError(f"{self.status_code}")

    def json(self):
        return self._payload


def _request():
    request = MagicMock()
    request.is_secure.return_value = True
    request.get_host.return_value = "plane.example.com"
    return request


def _id_token(nonce="nonce-1", pem=SIGNING_PEM, alg="RS256", headers=None, **overrides):
    now = int(time.time())
    claims = {
        "iss": ISSUER,
        "aud": CLIENT_ID,
        "sub": "user-123",
        "exp": now + 300,
        "iat": now,
        "nonce": nonce,
        "email": "alice@example.com",
        "email_verified": True,
        "given_name": "Alice",
        "family_name": "Smith",
        "preferred_username": "alice",
        "picture": "https://cdn.example.com/alice.png",
    }
    claims.update(overrides)
    return jwt.encode(claims, pem, algorithm=alg, headers=headers or {"kid": KID})


@pytest.fixture
def idp():
    """Fake identity provider: patches config, cache and the requests module."""
    state = {
        "config": {
            "OIDC_ISSUER_URL": ISSUER + "/",  # trailing slash must be tolerated
            "OIDC_CLIENT_ID": CLIENT_ID,
            "OIDC_CLIENT_SECRET": CLIENT_SECRET,
            "OIDC_REQUIRE_EMAIL_VERIFIED": "0",
        },
        "discovery": dict(DISCOVERY),
        "jwks": {"keys": [SIGNING_JWK]},
        "token": {},
        "userinfo": {"sub": "user-123", "email": "alice@example.com"},
        "token_requests": [],
    }

    def fake_get_configuration_value(keys):
        return tuple(state["config"].get(k["key"], k.get("default")) for k in keys)

    def fake_get(url, headers=None, timeout=None):
        if url.endswith("/.well-known/openid-configuration"):
            return FakeResponse(state["discovery"])
        if url == DISCOVERY["jwks_uri"]:
            return FakeResponse(state["jwks"])
        if url == DISCOVERY["userinfo_endpoint"]:
            assert headers["Authorization"] == f"Bearer {state['token'].get('access_token')}"
            return FakeResponse(state["userinfo"])
        raise AssertionError(f"unexpected GET {url}")

    def fake_post(url, data=None, headers=None, timeout=None):
        assert url == DISCOVERY["token_endpoint"]
        state["token_requests"].append(data)
        return FakeResponse(state["token"])

    fake_requests = MagicMock()
    fake_requests.get.side_effect = fake_get
    fake_requests.post.side_effect = fake_post
    import requests as real_requests

    fake_requests.RequestException = real_requests.RequestException

    with (
        patch.object(oidc_module, "get_configuration_value", side_effect=fake_get_configuration_value),
        patch.object(oidc_module, "cache", FakeCache()),
        patch.object(oidc_module, "requests", fake_requests),
    ):
        yield state


def _login(state, nonce="nonce-1", code_verifier="verifier-xyz", id_token=None):
    state["token"] = {
        "access_token": "access-token",
        "refresh_token": "refresh-token",
        "expires_in": 300,
        "refresh_expires_in": 1800,
        "id_token": id_token if id_token is not None else _id_token(nonce="nonce-1"),
    }
    provider = OIDCOAuthProvider(request=_request(), code="auth-code", nonce=nonce, code_verifier=code_verifier)
    provider.set_token_data()
    provider.set_user_data()
    return provider


@pytest.mark.unit
class TestOIDCInitiate:
    def test_auth_url_carries_state_nonce_and_pkce(self, idp):
        provider = OIDCOAuthProvider(request=_request(), state="st", nonce="n1", code_verifier="verifier-xyz")
        url = provider.get_auth_url()

        assert url.startswith(DISCOVERY["authorization_endpoint"] + "?")
        assert "state=st" in url
        assert "nonce=n1" in url
        assert "code_challenge_method=S256" in url
        assert f"code_challenge={OIDCOAuthProvider.compute_code_challenge('verifier-xyz')}" in url
        assert "redirect_uri=https%3A%2F%2Fplane.example.com%2Fauth%2Foidc%2Fcallback%2F" in url
        assert "scope=openid+email+profile" in url

    def test_missing_config_raises_not_configured(self, idp):
        idp["config"]["OIDC_CLIENT_SECRET"] = ""
        with pytest.raises(AuthenticationException) as exc:
            OIDCOAuthProvider(request=_request(), state="st")
        assert exc.value.error_code == AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"]

    def test_discovery_issuer_mismatch_raises_not_configured(self, idp):
        idp["discovery"]["issuer"] = "https://evil.example.com"
        with pytest.raises(AuthenticationException) as exc:
            OIDCOAuthProvider(request=_request(), state="st")
        assert exc.value.error_code == AUTHENTICATION_ERROR_CODES["OIDC_NOT_CONFIGURED"]

    def test_discovery_is_cached(self, idp):
        OIDCOAuthProvider(request=_request(), state="a")
        OIDCOAuthProvider(request=_request(), state="b")
        discovery_calls = [
            c for c in oidc_module.requests.get.call_args_list if c.args[0].endswith("openid-configuration")
        ]
        assert len(discovery_calls) == 1


@pytest.mark.unit
class TestOIDCCallback:
    def test_happy_path_populates_user_and_token_data(self, idp):
        provider = _login(idp)

        token_request = idp["token_requests"][-1]
        assert token_request["grant_type"] == "authorization_code"
        assert token_request["code"] == "auth-code"
        assert token_request["code_verifier"] == "verifier-xyz"
        assert token_request["client_secret"] == CLIENT_SECRET

        assert provider.token_data["access_token"] == "access-token"
        assert provider.token_data["refresh_token"] == "refresh-token"
        assert provider.token_data["access_token_expired_at"] is not None
        assert provider.token_data["refresh_token_expired_at"] is not None

        user = provider.user_data["user"]
        assert provider.user_data["email"] == "alice@example.com"
        assert user["provider_id"] == "user-123"
        assert user["first_name"] == "Alice"
        assert user["last_name"] == "Smith"
        assert user["avatar"] == "https://cdn.example.com/alice.png"
        assert user["is_password_autoset"] is True

    def test_userinfo_claims_override_id_token_claims(self, idp):
        idp["userinfo"] = {"sub": "user-123", "email": "alice@corp.example.com", "given_name": "Alicia"}
        provider = _login(idp)
        assert provider.user_data["email"] == "alice@corp.example.com"
        assert provider.user_data["user"]["first_name"] == "Alicia"

    def test_name_falls_back_to_full_name_then_username(self, idp):
        provider = _login(idp, id_token=_id_token(given_name=None, family_name=None, name="Bob Jones"))
        assert provider.user_data["user"]["first_name"] == "Bob"
        assert provider.user_data["user"]["last_name"] == "Jones"

        provider = _login(idp, id_token=_id_token(given_name=None, family_name=None, name=None))
        assert provider.user_data["user"]["first_name"] == "alice"

    def test_nonce_mismatch_is_rejected(self, idp):
        with pytest.raises(AuthenticationException) as exc:
            _login(idp, nonce="different-nonce")
        assert exc.value.error_code == AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"]

    def test_forged_signature_is_rejected(self, idp):
        with pytest.raises(AuthenticationException) as exc:
            _login(idp, id_token=_id_token(pem=OTHER_PEM))
        assert exc.value.error_code == AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"]

    def test_alg_none_is_rejected(self, idp):
        now = int(time.time())
        unsigned = jwt.encode(
            {"iss": ISSUER, "aud": CLIENT_ID, "sub": "user-123", "exp": now + 300, "iat": now, "nonce": "nonce-1"},
            key=None,
            algorithm="none",
        )
        with pytest.raises(AuthenticationException):
            _login(idp, id_token=unsigned)

    def test_wrong_audience_is_rejected(self, idp):
        with pytest.raises(AuthenticationException):
            _login(idp, id_token=_id_token(aud="someone-else"))

    def test_wrong_issuer_is_rejected(self, idp):
        with pytest.raises(AuthenticationException):
            _login(idp, id_token=_id_token(iss="https://other.example.com"))

    def test_expired_token_is_rejected(self, idp):
        with pytest.raises(AuthenticationException):
            _login(idp, id_token=_id_token(exp=int(time.time()) - 3600))

    def test_missing_id_token_is_rejected(self, idp):
        with pytest.raises(AuthenticationException) as exc:
            _login(idp, id_token="")
        assert exc.value.error_code == AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"]

    def test_userinfo_sub_mismatch_is_rejected(self, idp):
        idp["userinfo"] = {"sub": "attacker", "email": "victim@example.com"}
        with pytest.raises(AuthenticationException) as exc:
            _login(idp)
        assert exc.value.error_code == AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"]

    def test_userinfo_failure_falls_back_to_id_token(self, idp):
        idp["userinfo"] = None  # FakeResponse.json() returns None -> treated as failure path
        oidc_module.requests.get.side_effect = _failing_userinfo(idp)
        provider = _login(idp)
        assert provider.user_data["email"] == "alice@example.com"

    def test_unknown_kid_triggers_jwks_refetch(self, idp):
        idp["jwks"] = {"keys": []}  # first fetch: no keys (cached)
        OIDCOAuthProvider(request=_request(), state="warm")  # populate discovery cache
        idp["jwks"] = {"keys": [SIGNING_JWK]}
        provider = _login(idp)
        assert provider.user_data["user"]["provider_id"] == "user-123"

    def test_symmetric_alg_uses_client_secret(self, idp):
        token = _id_token(pem=CLIENT_SECRET, alg="HS256", headers={})
        provider = _login(idp, id_token=token)
        assert provider.user_data["user"]["provider_id"] == "user-123"

    def test_missing_email_is_rejected(self, idp):
        idp["userinfo"] = {"sub": "user-123"}
        with pytest.raises(AuthenticationException) as exc:
            _login(idp, id_token=_id_token(email=None))
        assert exc.value.error_code == AUTHENTICATION_ERROR_CODES["INVALID_EMAIL"]


@pytest.mark.unit
class TestOIDCVerifiedEmailGate:
    def test_unverified_email_allowed_by_default(self, idp):
        idp["userinfo"] = {"sub": "user-123", "email": "alice@example.com", "email_verified": False}
        provider = _login(idp, id_token=_id_token(email_verified=False))
        assert provider.user_data["email"] == "alice@example.com"

    def test_unverified_email_rejected_when_required(self, idp):
        idp["config"]["OIDC_REQUIRE_EMAIL_VERIFIED"] = "1"
        idp["userinfo"] = {"sub": "user-123", "email": "alice@example.com", "email_verified": False}
        with pytest.raises(AuthenticationException) as exc:
            _login(idp, id_token=_id_token(email_verified=False))
        assert exc.value.error_code == AUTHENTICATION_ERROR_CODES["OAUTH_PROVIDER_UNVERIFIED_EMAIL"]

    def test_verified_email_accepted_when_required(self, idp):
        idp["config"]["OIDC_REQUIRE_EMAIL_VERIFIED"] = "1"
        idp["userinfo"] = {"sub": "user-123", "email": "alice@example.com", "email_verified": True}
        provider = _login(idp)
        assert provider.user_data["email"] == "alice@example.com"


def _failing_userinfo(state):
    """GET side-effect where the userinfo endpoint errors out."""
    import requests as real_requests

    def fake_get(url, headers=None, timeout=None):
        if url.endswith("/.well-known/openid-configuration"):
            return FakeResponse(state["discovery"])
        if url == DISCOVERY["jwks_uri"]:
            return FakeResponse(state["jwks"])
        if url == DISCOVERY["userinfo_endpoint"]:
            raise real_requests.ConnectionError("userinfo down")
        raise AssertionError(f"unexpected GET {url}")

    return fake_get
