# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import base64
import hashlib
import time

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from plane.authentication.adapter.error import AuthenticationException
from plane.authentication.provider.oauth.oidc import (
    extract_employee_id,
    generate_pkce_pair,
    verify_id_token,
)

pytestmark = pytest.mark.unit

ISSUER = "https://identity.example.com"
CLIENT_ID = "plane-client"


@pytest.fixture(scope="module")
def rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return private_pem, private_key


class FakeJWKClient:
    def __init__(self, jwks_uri, **_kwargs):
        self.jwks_uri = jwks_uri
        self._key = _kwargs.get("key")

    def get_signing_key_from_jwt(self, token):
        return type("SigningKey", (), {"key": self._key})()


@pytest.fixture
def patched_jwks(monkeypatch, rsa_keypair):
    _, private_key = rsa_keypair

    def factory(jwks_uri, **kwargs):
        return FakeJWKClient(jwks_uri, key=private_key.public_key())

    monkeypatch.setattr(jwt, "PyJWKClient", factory)
    return private_key


def build_token(private_key, **overrides):
    now = int(time.time())
    claims = {
        "iss": ISSUER,
        "aud": CLIENT_ID,
        "sub": "subject-1",
        "email": "researcher@example.com",
        "iat": now,
        "exp": now + 300,
        "nonce": "nonce-1",
    }
    claims.update(overrides)
    return jwt.encode(claims, private_key, algorithm="RS256")


class TestIdTokenVerification:
    def test_valid_token_returns_claims(self, patched_jwks):
        token = build_token(patched_jwks)
        claims = verify_id_token(
            token,
            issuer=ISSUER,
            client_id=CLIENT_ID,
            jwks_uri="https://identity.example.com/jwks",
            nonce="nonce-1",
        )
        assert claims["sub"] == "subject-1"
        assert claims["email"] == "researcher@example.com"

    def test_missing_nonce_is_rejected(self, patched_jwks):
        token = build_token(patched_jwks, nonce=None)
        with pytest.raises(AuthenticationException):
            verify_id_token(
                token,
                issuer=ISSUER,
                client_id=CLIENT_ID,
                jwks_uri="https://identity.example.com/jwks",
                nonce="nonce-1",
            )

    def test_expired_token_is_rejected(self, patched_jwks):
        token = build_token(patched_jwks, exp=int(time.time()) - 600, iat=int(time.time()) - 900)
        with pytest.raises(AuthenticationException):
            verify_id_token(
                token,
                issuer=ISSUER,
                client_id=CLIENT_ID,
                jwks_uri="https://identity.example.com/jwks",
            )

    def test_wrong_audience_is_rejected(self, patched_jwks):
        token = build_token(patched_jwks, aud="another-client")
        with pytest.raises(AuthenticationException):
            verify_id_token(
                token,
                issuer=ISSUER,
                client_id=CLIENT_ID,
                jwks_uri="https://identity.example.com/jwks",
            )

    def test_wrong_issuer_is_rejected(self, patched_jwks):
        token = build_token(patched_jwks, iss="https://evil.example.com")
        with pytest.raises(AuthenticationException):
            verify_id_token(
                token,
                issuer=ISSUER,
                client_id=CLIENT_ID,
                jwks_uri="https://identity.example.com/jwks",
            )

    def test_forged_signature_is_rejected(self, patched_jwks):
        other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        token = build_token(other_key)
        with pytest.raises(AuthenticationException):
            verify_id_token(
                token,
                issuer=ISSUER,
                client_id=CLIENT_ID,
                jwks_uri="https://identity.example.com/jwks",
            )

    def test_missing_token_is_rejected(self, patched_jwks):
        with pytest.raises(AuthenticationException):
            verify_id_token(
                None,
                issuer=ISSUER,
                client_id=CLIENT_ID,
                jwks_uri="https://identity.example.com/jwks",
            )


class TestPkceAndClaims:
    def test_pkce_challenge_matches_verifier(self):
        verifier, challenge = generate_pkce_pair()
        assert challenge == base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
        assert "=" not in verifier

    def test_pkce_pairs_are_unique(self):
        assert generate_pkce_pair()[0] != generate_pkce_pair()[0]

    def test_extract_employee_id_supports_common_claims(self):
        assert extract_employee_id({"employee_id": "20230001"}) == "20230001"
        assert extract_employee_id({"student_id": "S-1"}) == "S-1"
        assert extract_employee_id({"email": "a@b.com"}) is None
