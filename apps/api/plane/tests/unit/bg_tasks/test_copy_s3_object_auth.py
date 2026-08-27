# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Authentication of the API -> Live `/convert-document/` call (GHSA-55gq-rf47-9pqx).

The Live service previously served `/convert-document/` to anyone who could reach
it (`requireSecretKey` was defined but never applied to a controller). Now that the
endpoint is gated on the `live-server-secret-key` header, this background task is
the one caller that has to present it — so the header must actually be sent, and a
missing key must fail loudly rather than firing a request that 401s.

These are pure unit tests: no database, no network.
"""

from unittest.mock import MagicMock, patch

from django.test import override_settings

from plane.bgtasks.copy_s3_object import sync_with_external_service

LIVE_URL = "http://live:3000/live/"
SECRET = "unit-test-live-secret"


@override_settings(LIVE_URL=LIVE_URL, LIVE_SERVER_SECRET_KEY=SECRET)
def test_sends_secret_key_header():
    """The shared secret must travel on the request, or Live returns 401."""
    response = MagicMock(status_code=200)
    response.json.return_value = {"description_json": {}, "description_binary": "AA=="}

    with patch("plane.bgtasks.copy_s3_object.requests.post", return_value=response) as mock_post:
        result = sync_with_external_service("PAGE", "<p>hello</p>")

    assert result == {"description_json": {}, "description_binary": "AA=="}
    mock_post.assert_called_once()

    headers = mock_post.call_args.kwargs["headers"]
    assert headers == {"live-server-secret-key": SECRET}


@override_settings(LIVE_URL=LIVE_URL, LIVE_SERVER_SECRET_KEY=None)
def test_missing_secret_key_skips_request():
    """
    With no key configured the call could only ever 401, so it is not attempted.
    Returning {} leaves `description_binary` untouched upstream (the caller guards
    on `if external_data:`), which degrades duplication rather than corrupting it.
    """
    with (
        patch("plane.bgtasks.copy_s3_object.requests.post") as mock_post,
        patch("plane.bgtasks.copy_s3_object.log_exception") as mock_log,
    ):
        result = sync_with_external_service("PAGE", "<p>hello</p>")

    assert result == {}
    mock_post.assert_not_called()
    # The misconfiguration must be surfaced, not swallowed silently.
    mock_log.assert_called_once()


@override_settings(LIVE_URL=LIVE_URL, LIVE_SERVER_SECRET_KEY="")
def test_empty_secret_key_treated_as_missing():
    """An empty string is a misconfiguration, not a valid credential."""
    with (
        patch("plane.bgtasks.copy_s3_object.requests.post") as mock_post,
        patch("plane.bgtasks.copy_s3_object.log_exception"),
    ):
        result = sync_with_external_service("PAGE", "<p>hello</p>")

    assert result == {}
    mock_post.assert_not_called()


@override_settings(LIVE_URL=None, LIVE_SERVER_SECRET_KEY=SECRET)
def test_no_live_url_short_circuits():
    """Deployments without a Live service must not attempt the call at all."""
    with patch("plane.bgtasks.copy_s3_object.requests.post") as mock_post:
        result = sync_with_external_service("PAGE", "<p>hello</p>")

    assert result == {}
    mock_post.assert_not_called()


@override_settings(LIVE_URL=LIVE_URL, LIVE_SERVER_SECRET_KEY=SECRET)
def test_non_200_returns_empty_dict():
    """A rejected call (e.g. a stale key on one side) must not raise."""
    with patch("plane.bgtasks.copy_s3_object.requests.post", return_value=MagicMock(status_code=401)):
        result = sync_with_external_service("PAGE", "<p>hello</p>")

    assert result == {}


@override_settings(LIVE_URL=LIVE_URL, LIVE_SERVER_SECRET_KEY=SECRET)
def test_variant_depends_on_entity_name():
    """Guard the existing contract while changing the auth around it."""
    response = MagicMock(status_code=200)
    response.json.return_value = {}

    with patch("plane.bgtasks.copy_s3_object.requests.post", return_value=response) as mock_post:
        sync_with_external_service("PAGE", "<p>x</p>")
        assert mock_post.call_args.kwargs["json"]["variant"] == "rich"

        sync_with_external_service("ISSUE", "<p>x</p>")
        assert mock_post.call_args.kwargs["json"]["variant"] == "document"
