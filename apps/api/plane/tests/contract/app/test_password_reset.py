# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import pytest
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.test import Client
from django.utils.encoding import smart_bytes
from django.utils.http import urlsafe_base64_encode

from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES
from plane.db.models import User

STRONG_PASSWORD = "correct-horse-battery-staple-9x"


@pytest.fixture(autouse=True)
def _pin_web_url(settings):
    """Pin the redirect host so base_host() does not depend on the ambient environment"""
    settings.WEB_URL = "http://testserver"
    settings.SPACE_BASE_URL = None
    settings.APP_BASE_URL = None


@pytest.fixture
def django_client():
    """Return a Django test client with a User-Agent header for handling redirects"""
    return Client(HTTP_USER_AGENT="Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1")


@pytest.fixture
def reset_user(db):
    """Create a user that owns a valid password reset link"""
    user = User.objects.create(email="reset-user@plane.so", is_password_autoset=True)
    user.set_password("user@123")
    user.save()
    return user


def _encode(value):
    return urlsafe_base64_encode(smart_bytes(value))


# The reset-password patterns share their url names with the forgot-password
# ones, so reverse() resolves to the wrong view - build the paths by hand.
def _space_url(uidb64, token):
    return f"/auth/spaces/reset-password/{uidb64}/{token}/"


def _app_url(uidb64, token):
    return f"/auth/reset-password/{uidb64}/{token}/"


@pytest.mark.contract
class TestResetPasswordSpaceEndpoint:
    """The space reset-password endpoint must redirect - never 500 - on a bad uidb64"""

    @pytest.mark.django_db
    def test_unknown_user_id_redirects(self, django_client, reset_user):
        """A well formed uidb64 for a user that does not exist redirects with INVALID_PASSWORD_TOKEN"""
        uidb64 = _encode(uuid.uuid4())
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['INVALID_PASSWORD_TOKEN']}" in response["Location"]

    @pytest.mark.django_db
    def test_non_uuid_id_redirects(self, django_client, reset_user):
        """A uidb64 that decodes to something that is not a UUID redirects instead of raising ValidationError"""
        uidb64 = _encode("not-a-uuid")
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['INVALID_PASSWORD_TOKEN']}" in response["Location"]

    @pytest.mark.django_db
    def test_malformed_base64_redirects(self, django_client, reset_user):
        """A uidb64 that is not decodable base64 redirects instead of raising ValueError"""
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url("a", token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['INVALID_PASSWORD_TOKEN']}" in response["Location"]

    @pytest.mark.django_db
    def test_undecodable_uidb64_redirects(self, django_client, reset_user):
        """A uidb64 that decodes to invalid utf-8 keeps the EXPIRED_PASSWORD_TOKEN response"""
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url("not", token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['EXPIRED_PASSWORD_TOKEN']}" in response["Location"]

    @pytest.mark.django_db
    def test_missing_password_redirects(self, django_client, reset_user):
        """A valid link without a password is still rejected with INVALID_PASSWORD"""
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['INVALID_PASSWORD']}" in response["Location"]

    @pytest.mark.django_db
    def test_invalid_token_redirects(self, django_client, reset_user):
        """An existing user with a token that does not belong to them is still rejected"""
        uidb64 = _encode(reset_user.id)

        response = django_client.post(_space_url(uidb64, "invalid-token"), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['INVALID_PASSWORD_TOKEN']}" in response["Location"]
        reset_user.refresh_from_db()
        assert not reset_user.check_password(STRONG_PASSWORD)

    @pytest.mark.django_db
    def test_weak_password_redirects(self, django_client, reset_user):
        """A valid link with a weak password does not change the password"""
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {"password": "password"})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['PASSWORD_TOO_WEAK']}" in response["Location"]
        reset_user.refresh_from_db()
        assert not reset_user.check_password("password")

    @pytest.mark.django_db
    def test_valid_link_resets_password(self, django_client, reset_user):
        """A valid link with a strong password still resets the password"""
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert "error_code" not in response["Location"]
        reset_user.refresh_from_db()
        assert reset_user.check_password(STRONG_PASSWORD)
        assert reset_user.is_password_autoset is False


@pytest.mark.contract
class TestResetPasswordAppEndpoint:
    """The app reset-password endpoint must redirect - never 500 - on a bad uidb64"""

    @pytest.mark.django_db
    def test_non_uuid_id_redirects(self, django_client, reset_user):
        """A uidb64 that decodes to something that is not a UUID redirects instead of raising ValidationError"""
        uidb64 = _encode("not-a-uuid")
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url(uidb64, token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['INVALID_PASSWORD_TOKEN']}" in response["Location"]

    @pytest.mark.django_db
    def test_unknown_user_id_redirects(self, django_client, reset_user):
        """A well formed uidb64 for a user that does not exist redirects with INVALID_PASSWORD_TOKEN"""
        uidb64 = _encode(uuid.uuid4())
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url(uidb64, token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['INVALID_PASSWORD_TOKEN']}" in response["Location"]

    @pytest.mark.django_db
    def test_malformed_base64_redirects(self, django_client, reset_user):
        """A uidb64 that is not decodable base64 redirects instead of raising ValueError"""
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url("a", token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['INVALID_PASSWORD_TOKEN']}" in response["Location"]

    @pytest.mark.django_db
    def test_undecodable_uidb64_redirects(self, django_client, reset_user):
        """A uidb64 that decodes to invalid utf-8 keeps the EXPIRED_PASSWORD_TOKEN response"""
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url("not", token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert f"error_code={AUTHENTICATION_ERROR_CODES['EXPIRED_PASSWORD_TOKEN']}" in response["Location"]

    @pytest.mark.django_db
    def test_valid_link_resets_password(self, django_client, reset_user):
        """A valid link with a strong password still resets the password"""
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url(uidb64, token), {"password": STRONG_PASSWORD})

        assert response.status_code == 302
        assert "sign-in?success=True" in response["Location"]
        reset_user.refresh_from_db()
        assert reset_user.check_password(STRONG_PASSWORD)
        assert reset_user.is_password_autoset is False
