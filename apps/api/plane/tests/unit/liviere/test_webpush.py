# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Liviere/plane fork: web push encryption, VAPID and endpoint checks (plane/liviere/push).

import json
import os
from types import SimpleNamespace
from unittest import mock

import http_ece
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from plane.liviere.push import config as push_config
from plane.liviere.push import webpush
from plane.liviere.push.config import b64url_encode, public_key_bytes


def _key_pair():
    private_key = ec.generate_private_key(ec.SECP256R1())
    raw_private = private_key.private_numbers().private_value.to_bytes(32, "big")
    return private_key, b64url_encode(raw_private), b64url_encode(public_key_bytes(private_key))


def _env(private, public, subject="mailto:push@example.com"):
    return {
        "LIVIERE_VAPID_PRIVATE_KEY": private,
        "LIVIERE_VAPID_PUBLIC_KEY": public,
        "LIVIERE_VAPID_SUBJECT": subject,
    }


@pytest.mark.unit
class TestVapidConfig:
    def test_complete_matching_keys(self):
        _, private, public = _key_pair()
        with mock.patch.dict(os.environ, _env(private, public)):
            config = push_config.vapid_config()
        assert config is not None
        assert config.public_key == public
        assert push_config.public_key_bytes(config.private_key) == push_config.b64url_decode(public)

    @pytest.mark.parametrize(
        "change",
        [
            {"LIVIERE_VAPID_PRIVATE_KEY": ""},
            {"LIVIERE_VAPID_PUBLIC_KEY": ""},
            {"LIVIERE_VAPID_SUBJECT": ""},
            {"LIVIERE_VAPID_SUBJECT": "push@example.com"},
            {"LIVIERE_VAPID_PRIVATE_KEY": "not base64 !"},
            {"LIVIERE_VAPID_PRIVATE_KEY": b64url_encode(b"short")},
        ],
    )
    def test_missing_or_invalid_values_disable_push(self, change):
        _, private, public = _key_pair()
        with mock.patch.dict(os.environ, {**_env(private, public), **change}):
            assert push_config.vapid_config() is None
            assert push_config.push_available() is False

    def test_a_public_key_of_another_pair_disables_push(self):
        _, private, _ = _key_pair()
        _, _, other_public = _key_pair()
        with mock.patch.dict(os.environ, _env(private, other_public)):
            assert push_config.vapid_config() is None

    def test_nothing_set(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            assert push_config.vapid_config() is None


@pytest.mark.unit
class TestEndpoints:
    @pytest.mark.parametrize(
        "endpoint",
        [
            "https://updates.push.services.mozilla.com/wpush/v2/abc",
            "https://fcm.googleapis.com/fcm/send/abc",
            "https://wns2-db5p.notify.windows.com/w/?token=abc",
            "https://web.push.apple.com/abc",
        ],
    )
    def test_known_push_services(self, endpoint):
        assert webpush.validate_endpoint(endpoint) == endpoint

    @pytest.mark.parametrize(
        "endpoint",
        [
            "http://updates.push.services.mozilla.com/wpush/v2/abc",
            "https://localhost/push",
            "https://127.0.0.1/push",
            "https://plane-db:5432/",
            "https://fcm.googleapis.com.evil.example/push",
            "https://evilnotify.windows.com/push",
            "https://user:pass@fcm.googleapis.com/fcm/send/abc",
            "https://fcm.googleapis.com:8443/fcm/send/abc",
            "",
            "not a url",
        ],
    )
    def test_other_endpoints_are_refused(self, endpoint):
        with pytest.raises(webpush.InvalidSubscription):
            webpush.validate_endpoint(endpoint)

    def test_keys(self):
        receiver = ec.generate_private_key(ec.SECP256R1())
        webpush.validate_keys(b64url_encode(public_key_bytes(receiver)), b64url_encode(os.urandom(16)))
        for p256dh, auth in (
            ("abc", b64url_encode(os.urandom(16))),
            (b64url_encode(public_key_bytes(receiver)), "abc"),
        ):
            with pytest.raises(webpush.InvalidSubscription):
                webpush.validate_keys(p256dh, auth)


@pytest.mark.unit
class TestSend:
    def test_payload_decrypts_with_the_browser_keys(self):
        receiver = ec.generate_private_key(ec.SECP256R1())
        auth = os.urandom(16)
        body = webpush.encrypt_payload(
            b'{"title": "LS-7"}', b64url_encode(public_key_bytes(receiver)), b64url_encode(auth)
        )
        assert (
            http_ece.decrypt(body, private_key=receiver, auth_secret=auth, version="aes128gcm") == b'{"title": "LS-7"}'
        )

    def test_vapid_header_is_a_valid_es256_token_for_the_push_service(self):
        server_key, private, public = _key_pair()
        with mock.patch.dict(os.environ, _env(private, public)):
            config = push_config.vapid_config()
        header = webpush.vapid_headers("https://fcm.googleapis.com/fcm/send/abc", config, now=1_000_000)[
            "Authorization"
        ]
        token, key = header.removeprefix("vapid t=").split(", k=")
        assert key == public
        claims = jwt.decode(
            token,
            server_key.public_key(),
            algorithms=["ES256"],
            audience="https://fcm.googleapis.com",
            options={"verify_exp": False},
        )
        assert claims == {
            "aud": "https://fcm.googleapis.com",
            "exp": 1_000_000 + 12 * 3600,
            "sub": "mailto:push@example.com",
        }

    def test_send_posts_through_pinned_fetch(self):
        _, private, public = _key_pair()
        receiver = ec.generate_private_key(ec.SECP256R1())
        subscription = SimpleNamespace(
            endpoint="https://updates.push.services.mozilla.com/wpush/v2/abc",
            p256dh=b64url_encode(public_key_bytes(receiver)),
            auth=b64url_encode(os.urandom(16)),
        )
        with mock.patch.dict(os.environ, _env(private, public)):
            config = push_config.vapid_config()
        with mock.patch.object(webpush, "pinned_fetch", return_value=mock.Mock(status_code=201)) as fetch:
            assert webpush.send(subscription, {"title": "LS-7"}, config) == 201
        method, url = fetch.call_args.args
        headers = fetch.call_args.kwargs["headers"]
        assert (method, url) == ("POST", subscription.endpoint)
        assert headers["Content-Encoding"] == "aes128gcm"
        assert headers["TTL"] == "86400"
        assert headers["Authorization"].startswith("vapid t=")
        assert "allowed_hosts" not in fetch.call_args.kwargs
        assert json.loads(
            http_ece.decrypt(
                fetch.call_args.kwargs["data"],
                private_key=receiver,
                auth_secret=webpush.b64url_decode(subscription.auth),
                version="aes128gcm",
            )
        ) == {"title": "LS-7"}

    def test_send_refuses_an_unknown_endpoint_without_a_request(self):
        _, private, public = _key_pair()
        with mock.patch.dict(os.environ, _env(private, public)):
            config = push_config.vapid_config()
        subscription = SimpleNamespace(endpoint="https://10.0.0.1/push", p256dh="", auth="")
        with mock.patch.object(webpush, "pinned_fetch") as fetch, pytest.raises(webpush.InvalidSubscription):
            webpush.send(subscription, {}, config)
        fetch.assert_not_called()
