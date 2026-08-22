# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from urllib.parse import parse_qs, urlparse

import pytest
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.test import Client
from django.utils.encoding import smart_bytes
from django.utils.http import urlsafe_base64_encode

from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES
from plane.db.models import User

EXPECTED_ORIGIN = ("http", "testserver")

STRONG_PASSWORD = "correct-horse-battery-staple-9x"
WEAK_PASSWORD = "password"

# Where each endpoint sends a rejected reset, and where it sends a successful one
SPACE_ERROR_PATH = "/spaces/accounts/reset-password"
SPACE_SUCCESS_PATH = "/spaces"
APP_ERROR_PATH = "/accounts/reset-password"
APP_SUCCESS_PATH = "/sign-in"


@pytest.fixture(autouse=True)
def _pin_web_url(settings):
    """Pin the redirect host so base_host() does not depend on the ambient environment"""
    settings.WEB_URL = "http://testserver"
    settings.SPACE_BASE_URL = None
    settings.APP_BASE_URL = None
    settings.SPACE_BASE_PATH = "/spaces/"


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
    """Encode a user id the way generate_password_token() does"""
    return urlsafe_base64_encode(smart_bytes(value))


def _space_url(uidb64, token):
    """Build the space reset-password path.

    Three patterns share name="forgot-password" and two share
    name="space-forgot-password", so reverse() picks between them by argument
    count alone. Hardcoding the paths pins the URL contract these tests assert.
    """
    return f"/auth/spaces/reset-password/{uidb64}/{token}/"


def _app_url(uidb64, token):
    """Build the app reset-password path - see _space_url for why reverse() is not used"""
    return f"/auth/reset-password/{uidb64}/{token}/"


def _error_query(error_code_key):
    """Return the query string both endpoints attach to a rejected reset"""
    return {"error_code": [str(AUTHENTICATION_ERROR_CODES[error_code_key])], "error_message": [error_code_key]}


def _assert_redirect(response, expected_path, expected_query):
    """Assert the response redirects to expected_path on the pinned origin, carrying exactly expected_query.

    Only the doubled slash after the space base path is normalized: base_host()
    already ends in a slash, so the space endpoint emits
    "/spaces//accounts/reset-password/". That quirk predates these tests and is
    not what they pin - but every other path is compared as emitted, so the same
    defect appearing anywhere else does fail.
    """
    assert response.status_code == 302
    location = urlparse(response["Location"])
    assert (location.scheme, location.netloc) == EXPECTED_ORIGIN
    assert location.path.replace("/spaces//", "/spaces/", 1).rstrip("/") == expected_path
    assert parse_qs(location.query, keep_blank_values=True) == expected_query


def _assert_credentials_untouched(user, password_hash):
    """Assert a rejected reset left the stored hash and the autoset flag alone"""
    user.refresh_from_db()
    assert user.password == password_hash
    assert user.is_password_autoset is True


@pytest.mark.contract
class TestResetPasswordSpaceEndpoint:
    """The space reset-password endpoint must redirect - never 500 - on a bad uidb64"""

    @pytest.mark.django_db
    def test_unknown_user_id_redirects(self, django_client, reset_user):
        """A well formed uidb64 for a user that does not exist redirects with INVALID_PASSWORD_TOKEN"""
        password_hash = reset_user.password
        uidb64 = _encode(uuid.uuid4())
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, SPACE_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_non_uuid_id_redirects(self, django_client, reset_user):
        """A uidb64 that decodes to something that is not a UUID redirects instead of raising ValidationError"""
        password_hash = reset_user.password
        uidb64 = _encode("not-a-uuid")
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, SPACE_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_malformed_base64_redirects(self, django_client, reset_user):
        """A uidb64 that is not decodable base64 redirects instead of raising ValueError"""
        password_hash = reset_user.password
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url("a", token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, SPACE_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_undecodable_uidb64_redirects(self, django_client, reset_user):
        """A uidb64 that decodes to invalid utf-8 keeps the EXPIRED_PASSWORD_TOKEN response"""
        password_hash = reset_user.password
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url("not", token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, SPACE_ERROR_PATH, _error_query("EXPIRED_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_missing_password_redirects(self, django_client, reset_user):
        """A valid link without a password is still rejected with INVALID_PASSWORD"""
        password_hash = reset_user.password
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {})

        _assert_redirect(response, SPACE_ERROR_PATH, _error_query("INVALID_PASSWORD"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_invalid_token_redirects(self, django_client, reset_user):
        """An existing user with a token that does not belong to them is still rejected"""
        password_hash = reset_user.password
        uidb64 = _encode(reset_user.id)

        response = django_client.post(_space_url(uidb64, "invalid-token"), {"password": STRONG_PASSWORD})

        _assert_redirect(response, SPACE_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_weak_password_redirects(self, django_client, reset_user):
        """A valid link with a weak password does not change the password"""
        password_hash = reset_user.password
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {"password": WEAK_PASSWORD})

        _assert_redirect(response, SPACE_ERROR_PATH, _error_query("PASSWORD_TOO_WEAK"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_valid_link_resets_password(self, django_client, reset_user):
        """A valid link with a strong password still resets the password"""
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_space_url(uidb64, token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, SPACE_SUCCESS_PATH, {})
        reset_user.refresh_from_db()
        assert reset_user.check_password(STRONG_PASSWORD)
        assert reset_user.is_password_autoset is False

    @pytest.mark.django_db
    def test_token_cannot_be_replayed(self, django_client, reset_user):
        """A token stops working once it has been spent - it is hashed over the stored password"""
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)
        django_client.post(_space_url(uidb64, token), {"password": STRONG_PASSWORD})
        reset_user.refresh_from_db()
        password_hash = reset_user.password

        response = django_client.post(_space_url(uidb64, token), {"password": "another-correct-horse-99x"})

        _assert_redirect(response, SPACE_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        reset_user.refresh_from_db()
        assert reset_user.password == password_hash


@pytest.mark.contract
class TestResetPasswordAppEndpoint:
    """The app reset-password endpoint must redirect - never 500 - on a bad uidb64"""

    @pytest.mark.django_db
    def test_non_uuid_id_redirects(self, django_client, reset_user):
        """A uidb64 that decodes to something that is not a UUID redirects instead of raising ValidationError"""
        password_hash = reset_user.password
        uidb64 = _encode("not-a-uuid")
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url(uidb64, token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, APP_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_unknown_user_id_redirects(self, django_client, reset_user):
        """A well formed uidb64 for a user that does not exist redirects with INVALID_PASSWORD_TOKEN"""
        password_hash = reset_user.password
        uidb64 = _encode(uuid.uuid4())
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url(uidb64, token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, APP_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_malformed_base64_redirects(self, django_client, reset_user):
        """A uidb64 that is not decodable base64 redirects instead of raising ValueError"""
        password_hash = reset_user.password
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url("a", token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, APP_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_undecodable_uidb64_redirects(self, django_client, reset_user):
        """A uidb64 that decodes to invalid utf-8 keeps the EXPIRED_PASSWORD_TOKEN response"""
        password_hash = reset_user.password
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url("not", token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, APP_ERROR_PATH, _error_query("EXPIRED_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_invalid_token_redirects(self, django_client, reset_user):
        """An existing user with a token that does not belong to them is still rejected"""
        password_hash = reset_user.password
        uidb64 = _encode(reset_user.id)

        response = django_client.post(_app_url(uidb64, "invalid-token"), {"password": STRONG_PASSWORD})

        _assert_redirect(response, APP_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_missing_password_redirects(self, django_client, reset_user):
        """A valid link without a password is still rejected with INVALID_PASSWORD"""
        password_hash = reset_user.password
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url(uidb64, token), {})

        _assert_redirect(response, APP_ERROR_PATH, _error_query("INVALID_PASSWORD"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_weak_password_redirects(self, django_client, reset_user):
        """A valid link with a weak password does not change the password"""
        password_hash = reset_user.password
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url(uidb64, token), {"password": WEAK_PASSWORD})

        _assert_redirect(response, APP_ERROR_PATH, _error_query("PASSWORD_TOO_WEAK"))
        _assert_credentials_untouched(reset_user, password_hash)

    @pytest.mark.django_db
    def test_valid_link_resets_password(self, django_client, reset_user):
        """A valid link with a strong password still resets the password"""
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)

        response = django_client.post(_app_url(uidb64, token), {"password": STRONG_PASSWORD})

        _assert_redirect(response, APP_SUCCESS_PATH, {"success": ["True"]})
        reset_user.refresh_from_db()
        assert reset_user.check_password(STRONG_PASSWORD)
        assert reset_user.is_password_autoset is False

    @pytest.mark.django_db
    def test_token_cannot_be_replayed(self, django_client, reset_user):
        """A token stops working once it has been spent - it is hashed over the stored password"""
        uidb64 = _encode(reset_user.id)
        token = PasswordResetTokenGenerator().make_token(reset_user)
        django_client.post(_app_url(uidb64, token), {"password": STRONG_PASSWORD})
        reset_user.refresh_from_db()
        password_hash = reset_user.password

        response = django_client.post(_app_url(uidb64, token), {"password": "another-correct-horse-99x"})

        _assert_redirect(response, APP_ERROR_PATH, _error_query("INVALID_PASSWORD_TOKEN"))
        reset_user.refresh_from_db()
        assert reset_user.password == password_hash
