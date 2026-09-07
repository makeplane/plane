# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for PlaneEmailBackend.

Covers:
- falling back to Django's SMTP backend when EMAIL_PROVIDER is not MICROSOFT_GRAPH
- routing through Microsoft Graph when EMAIL_PROVIDER is MICROSOFT_GRAPH
- fail_silently swallowing Graph send errors instead of raising
"""

from unittest.mock import Mock, patch

import pytest
from django.core.mail import EmailMultiAlternatives

from plane.license.utils.email_backend import PlaneEmailBackend


GRAPH_CONFIG = (
    "MICROSOFT_GRAPH",
    "tenant-id",
    "client-id",
    "client-secret",
    "noreply@example.com",
)

SMTP_CONFIG = ("SMTP", "", "", "", "noreply@example.com")


def _make_message():
    return EmailMultiAlternatives(
        subject="Hi",
        body="body",
        from_email="sender@example.com",
        to=["receiver@example.com"],
    )


@pytest.mark.unit
class TestPlaneEmailBackend:
    def test_empty_message_list_sends_nothing(self):
        backend = PlaneEmailBackend()
        assert backend.send_messages([]) == 0

    def test_falls_back_to_smtp_backend_by_default(self):
        backend = PlaneEmailBackend(host="smtp.example.com", port=587, username="u", password="p")
        message = _make_message()

        with patch(
            "plane.license.utils.email_backend.get_graph_email_configuration",
            return_value=SMTP_CONFIG,
        ), patch("plane.license.utils.email_backend.SMTPEmailBackend") as mock_smtp_cls:
            mock_smtp_instance = Mock()
            mock_smtp_instance.send_messages.return_value = 1
            mock_smtp_cls.return_value = mock_smtp_instance

            sent = backend.send_messages([message])

        mock_smtp_cls.assert_called_once_with(
            fail_silently=False, host="smtp.example.com", port=587, username="u", password="p"
        )
        mock_smtp_instance.send_messages.assert_called_once_with([message])
        assert sent == 1

    def test_routes_through_graph_when_provider_is_microsoft_graph(self):
        backend = PlaneEmailBackend()
        message = _make_message()

        with patch(
            "plane.license.utils.email_backend.get_graph_email_configuration",
            return_value=GRAPH_CONFIG,
        ), patch("plane.license.utils.email_backend.send_graph_email") as mock_send:
            sent = backend.send_messages([message])

        mock_send.assert_called_once_with("tenant-id", "client-id", "client-secret", "noreply@example.com", message)
        assert sent == 1

    def test_fail_silently_swallows_graph_errors(self):
        backend = PlaneEmailBackend(fail_silently=True)
        message = _make_message()

        with patch(
            "plane.license.utils.email_backend.get_graph_email_configuration",
            return_value=GRAPH_CONFIG,
        ), patch("plane.license.utils.email_backend.send_graph_email", side_effect=Exception("boom")):
            sent = backend.send_messages([message])

        assert sent == 0

    def test_raises_graph_errors_when_not_fail_silently(self):
        backend = PlaneEmailBackend(fail_silently=False)
        message = _make_message()

        with patch(
            "plane.license.utils.email_backend.get_graph_email_configuration",
            return_value=GRAPH_CONFIG,
        ), patch("plane.license.utils.email_backend.send_graph_email", side_effect=Exception("boom")):
            with pytest.raises(Exception):
                backend.send_messages([message])
