# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: the instance admin "send test email" check never waits forever.

Without a timeout, an SMTP server that never answers (for example port 25
silently blocked by a firewall) keeps the request open indefinitely, so the
admin's "Send test email" modal just spins (#10096). Connections now use
EMAIL_TIMEOUT, and a timeout comes back as a clear 400.
"""

import uuid
from unittest import mock

import pytest
from django.conf import settings as django_settings
from django.utils import timezone
from rest_framework import status

from plane.license.models import Instance, InstanceAdmin

URL = "/api/instances/email-credentials-check/"
SMTP_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_CONFIGURATION = (
    "smtp.example.invalid",  # EMAIL_HOST
    "",  # EMAIL_HOST_USER
    "",  # EMAIL_HOST_PASSWORD
    "25",  # EMAIL_PORT
    "0",  # EMAIL_USE_TLS
    "0",  # EMAIL_USE_SSL
    "Plane <noreply@example.com>",  # EMAIL_FROM
)


@pytest.fixture
def admin_client(db, session_client, create_user):
    instance = Instance.objects.create(
        instance_name="Test Instance",
        instance_id=str(uuid.uuid4()),
        current_version="1.0.0",
        domain="http://localhost:8000",
        last_checked_at=timezone.now(),
        is_setup_done=True,
    )
    InstanceAdmin.objects.create(instance=instance, user=create_user, role=20)
    return session_client


@pytest.fixture
def email_configuration(settings):
    """Use the real SMTP backend (tests default to locmem) against a configured host."""
    settings.EMAIL_BACKEND = SMTP_BACKEND
    with mock.patch(
        "plane.license.api.views.configuration.get_email_configuration",
        return_value=EMAIL_CONFIGURATION,
    ):
        yield


@pytest.mark.contract
class TestEmailCredentialCheckTimeout:
    @pytest.mark.django_db
    def test_smtp_connection_is_opened_with_a_timeout(self, admin_client, email_configuration):
        with mock.patch("django.core.mail.backends.smtp.smtplib.SMTP") as smtp:
            response = admin_client.post(URL, {"receiver_email": "admin@example.com"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert smtp.call_args.kwargs.get("timeout") == django_settings.EMAIL_TIMEOUT == 30

    @pytest.mark.django_db
    def test_unreachable_server_returns_timeout_error(self, admin_client, email_configuration):
        with mock.patch("django.core.mail.backends.smtp.smtplib.SMTP", side_effect=TimeoutError):
            response = admin_client.post(URL, {"receiver_email": "admin@example.com"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "Timeout error while trying to connect to the SMTP server."
