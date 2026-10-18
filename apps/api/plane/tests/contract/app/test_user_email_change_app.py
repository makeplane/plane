# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from plane.authentication.provider.credentials.magic_code import MagicCodeProvider
from plane.authentication.rate_limit import AuthenticationThrottle
from plane.db.models import User

NEW_EMAIL = "changed@plane.so"
CODES_PER_TARGET = 5


def _clear_request_throttles():
    cache.delete_pattern("throttle_authentication_*")
    cache.delete_pattern("throttle_email_verification_*")


@pytest.fixture(autouse=True)
def _clear_throttle_state():
    _clear_request_throttles()
    cache.delete_pattern("email_update_issued:*")
    yield
    _clear_request_throttles()
    cache.delete_pattern("email_update_issued:*")


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
    def test_correct_code_rejected_once_attempts_exhausted(self, session_client, create_user, mock_email_tasks):
        """Attempts are counted before the code is compared, so a used-up budget rejects even the correct code."""
        code = _generate_code(session_client, mock_email_tasks)
        cache.set(
            f"magic_email_update_{create_user.id}_{NEW_EMAIL}:verify_attempts",
            MagicCodeProvider.MAX_VERIFY_ATTEMPTS,
            timeout=600,
        )

        response = session_client.patch(reverse("user-email-update"), {"email": NEW_EMAIL, "code": code}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        create_user.refresh_from_db()
        assert create_user.email != NEW_EMAIL

    @pytest.mark.django_db
    def test_code_invalidated_after_attempt_is_counted_is_not_compared(
        self, session_client, create_user, mock_email_tasks
    ):
        """The code is read after the attempt is counted, so a concurrent invalidation is honoured."""
        code = _generate_code(session_client, mock_email_tasks)
        code_key = f"magic_email_update_{create_user.id}_{NEW_EMAIL}"
        real_incr = cache.incr

        def incr_then_invalidate(key, *args, **kwargs):
            value = real_incr(key, *args, **kwargs)
            if key == f"{code_key}:verify_attempts":
                # A concurrent request reaches the cap and deletes the code and its counter.
                cache.delete_many([code_key, key])
            return value

        with patch.object(cache, "incr", side_effect=incr_then_invalidate):
            response = session_client.patch(
                reverse("user-email-update"), {"email": NEW_EMAIL, "code": code}, format="json"
            )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        create_user.refresh_from_db()
        assert create_user.email != NEW_EMAIL

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

    @pytest.mark.django_db
    def test_generate_code_capped_per_target_email(self, mock_email_tasks):
        """Codes issued for one address are capped across accounts, independent of request throttles."""
        url = reverse("user-email-verify-code")

        def request_from_new_account(index):
            _clear_request_throttles()
            client = APIClient()
            user = User.objects.create(username=f"requester{index}", email=f"requester{index}@plane.so")
            client.force_authenticate(user=user)
            return client.post(url, {"email": NEW_EMAIL}, format="json")

        for index in range(CODES_PER_TARGET):
            assert request_from_new_account(index).status_code == status.HTTP_200_OK

        response = request_from_new_account(CODES_PER_TARGET)
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert mock_email_tasks.call_count == CODES_PER_TARGET
