# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status

from plane.authentication.provider.credentials.magic_code import MagicCodeProvider
from plane.authentication.rate_limit import AuthenticationThrottle

NEW_EMAIL = "changed@plane.so"


@pytest.fixture(autouse=True)
def _clear_throttle_state():
    cache.delete_pattern("throttle_authentication_*")
    cache.delete_pattern("throttle_email_verification_*")
    yield
    cache.delete_pattern("throttle_authentication_*")
    cache.delete_pattern("throttle_email_verification_*")


@pytest.fixture
def mock_email_tasks():
    with (
        patch("plane.app.views.user.base.send_email_update_magic_code.delay") as send_code,
        patch("plane.app.views.user.base.send_email_update_confirmation.delay"),
    ):
        yield send_code


def _generate_code(client, send_code):
    response = client.post(reverse("user-email-verify-code"), {"email": NEW_EMAIL}, format="json")
    assert response.status_code == status.HTTP_200_OK
    return send_code.call_args.args[1]


def _wrong_code(code):
    return "100000" if code != "100000" else "100001"


@pytest.mark.contract
class TestUserEmailChangeVerification:
    """The email-change code allows MAX_VERIFY_ATTEMPTS tries and both endpoints are throttled per IP."""

    @pytest.mark.django_db
    def test_code_invalidated_after_max_wrong_attempts(self, session_client, create_user, mock_email_tasks):
        """After MAX_VERIFY_ATTEMPTS wrong codes the issued code no longer verifies."""
        code = _generate_code(session_client, mock_email_tasks)
        url = reverse("user-email-update")

        for _ in range(MagicCodeProvider.MAX_VERIFY_ATTEMPTS):
            response = session_client.patch(url, {"email": NEW_EMAIL, "code": _wrong_code(code)}, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST

        response = session_client.patch(url, {"email": NEW_EMAIL, "code": code}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        create_user.refresh_from_db()
        assert create_user.email != NEW_EMAIL

    @pytest.mark.django_db
    def test_correct_code_accepted_on_last_attempt(self, session_client, create_user, mock_email_tasks):
        """A correct code on the MAX-th attempt still updates the email."""
        code = _generate_code(session_client, mock_email_tasks)
        url = reverse("user-email-update")

        for _ in range(MagicCodeProvider.MAX_VERIFY_ATTEMPTS - 1):
            session_client.patch(url, {"email": NEW_EMAIL, "code": _wrong_code(code)}, format="json")

        response = session_client.patch(url, {"email": NEW_EMAIL, "code": code}, format="json")
        assert response.status_code == status.HTTP_200_OK
        create_user.refresh_from_db()
        assert create_user.email == NEW_EMAIL

    @pytest.mark.django_db
    def test_update_email_throttled(self, session_client, create_user):
        """Code verification from one IP is limited by AuthenticationThrottle."""
        url = reverse("user-email-update")
        with patch.object(AuthenticationThrottle, "rate", "1/minute"):
            response = session_client.patch(url, {"email": NEW_EMAIL, "code": "100000"}, format="json")
            assert response.status_code != status.HTTP_429_TOO_MANY_REQUESTS

            response = session_client.patch(url, {"email": NEW_EMAIL, "code": "100000"}, format="json")
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    @pytest.mark.django_db
    def test_generate_code_throttled(self, session_client, create_user, mock_email_tasks):
        """Code generation from one IP is limited by AuthenticationThrottle as well."""
        url = reverse("user-email-verify-code")
        with patch.object(AuthenticationThrottle, "rate", "1/minute"):
            response = session_client.post(url, {"email": NEW_EMAIL}, format="json")
            assert response.status_code == status.HTTP_200_OK

            response = session_client.post(url, {"email": NEW_EMAIL}, format="json")
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
