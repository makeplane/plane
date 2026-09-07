# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for the Microsoft Graph email helper.

Covers:
- OAuth2 client-credentials token acquisition
- building a Graph sendMail payload from a Django EmailMessage, including
  attachments (e.g. the analytics CSV export)
- the end-to-end send call wiring the token into the request
"""

import base64
from unittest.mock import Mock, patch

import pytest
from django.core.mail import EmailMultiAlternatives

from plane.license.utils.graph_mail import (
    build_graph_message,
    get_graph_access_token,
    send_graph_email,
)


@pytest.mark.unit
class TestGetGraphAccessToken:
    def test_requests_token_with_client_credentials(self):
        response = Mock(status_code=200)
        response.json.return_value = {"access_token": "fake-token"}
        response.raise_for_status = Mock()

        with patch("plane.license.utils.graph_mail.requests.post", return_value=response) as mock_post:
            token = get_graph_access_token("tenant-id", "client-id", "client-secret")

        assert token == "fake-token"
        args, kwargs = mock_post.call_args
        assert args[0] == "https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token"
        assert kwargs["data"]["client_id"] == "client-id"
        assert kwargs["data"]["client_secret"] == "client-secret"
        assert kwargs["data"]["grant_type"] == "client_credentials"
        assert kwargs["data"]["scope"] == "https://graph.microsoft.com/.default"

    def test_raises_for_non_2xx_response(self):
        response = Mock(status_code=401)
        response.raise_for_status = Mock(side_effect=Exception("unauthorized"))

        with patch("plane.license.utils.graph_mail.requests.post", return_value=response):
            with pytest.raises(Exception):
                get_graph_access_token("tenant-id", "client-id", "bad-secret")


@pytest.mark.unit
class TestBuildGraphMessage:
    def test_plain_text_message(self):
        message = EmailMultiAlternatives(
            subject="Hello",
            body="Plain text body",
            from_email="Sender <sender@example.com>",
            to=["Receiver <receiver@example.com>"],
            cc=["cc@example.com"],
            bcc=["bcc@example.com"],
        )

        payload = build_graph_message(message)

        assert payload["message"]["subject"] == "Hello"
        assert payload["message"]["body"] == {
            "contentType": "Text",
            "content": "Plain text body",
        }
        assert payload["message"]["toRecipients"] == [{"emailAddress": {"address": "receiver@example.com"}}]
        assert payload["message"]["ccRecipients"] == [{"emailAddress": {"address": "cc@example.com"}}]
        assert payload["message"]["bccRecipients"] == [{"emailAddress": {"address": "bcc@example.com"}}]
        assert payload["message"]["attachments"] == []
        assert payload["saveToSentItems"] is False

    def test_prefers_html_alternative_when_present(self):
        message = EmailMultiAlternatives(
            subject="Hello",
            body="Plain fallback",
            from_email="sender@example.com",
            to=["receiver@example.com"],
        )
        message.attach_alternative("<p>Rich body</p>", "text/html")

        payload = build_graph_message(message)

        assert payload["message"]["body"] == {
            "contentType": "HTML",
            "content": "<p>Rich body</p>",
        }

    def test_serializes_attachment_as_base64_file_attachment(self):
        message = EmailMultiAlternatives(
            subject="Analytics export",
            body="See attached CSV",
            from_email="sender@example.com",
            to=["receiver@example.com"],
        )
        message.attach("plane-analytics.csv", "col1,col2\n1,2\n", "text/csv")

        payload = build_graph_message(message)

        [attachment] = payload["message"]["attachments"]
        assert attachment["@odata.type"] == "#microsoft.graph.fileAttachment"
        assert attachment["name"] == "plane-analytics.csv"
        assert attachment["contentType"] == "text/csv"
        assert base64.b64decode(attachment["contentBytes"]) == b"col1,col2\n1,2\n"

    def test_guesses_mimetype_when_not_provided(self):
        message = EmailMultiAlternatives(
            subject="Hi",
            body="body",
            from_email="sender@example.com",
            to=["receiver@example.com"],
        )
        message.attach("notes.txt", "hello")

        payload = build_graph_message(message)

        [attachment] = payload["message"]["attachments"]
        assert attachment["contentType"] == "text/plain"

    def test_rejects_unsupported_attachment_content(self):
        message = EmailMultiAlternatives(
            subject="Hi",
            body="body",
            from_email="sender@example.com",
            to=["receiver@example.com"],
        )
        message.attachments.append(("bad.bin", object(), "application/octet-stream"))

        with pytest.raises(ValueError):
            build_graph_message(message)


@pytest.mark.unit
class TestSendGraphEmail:
    def test_sends_to_correct_mailbox_with_bearer_token(self):
        message = EmailMultiAlternatives(
            subject="Hi",
            body="body",
            from_email="sender@example.com",
            to=["receiver@example.com"],
        )
        send_response = Mock(status_code=202)
        send_response.raise_for_status = Mock()

        with patch(
            "plane.license.utils.graph_mail.get_graph_access_token", return_value="fake-token"
        ) as mock_token, patch("plane.license.utils.graph_mail.requests.post", return_value=send_response) as mock_post:
            send_graph_email("tenant-id", "client-id", "client-secret", "noreply@example.com", message)

        mock_token.assert_called_once_with("tenant-id", "client-id", "client-secret")
        args, kwargs = mock_post.call_args
        assert args[0] == "https://graph.microsoft.com/v1.0/users/noreply@example.com/sendMail"
        assert kwargs["headers"]["Authorization"] == "Bearer fake-token"
        send_response.raise_for_status.assert_called_once()

    def test_raises_when_graph_rejects_the_send(self):
        message = EmailMultiAlternatives(
            subject="Hi",
            body="body",
            from_email="sender@example.com",
            to=["receiver@example.com"],
        )
        send_response = Mock(status_code=403)
        send_response.raise_for_status = Mock(side_effect=Exception("forbidden"))

        with patch("plane.license.utils.graph_mail.get_graph_access_token", return_value="fake-token"), patch(
            "plane.license.utils.graph_mail.requests.post", return_value=send_response
        ):
            with pytest.raises(Exception):
                send_graph_email("tenant-id", "client-id", "client-secret", "noreply@example.com", message)
