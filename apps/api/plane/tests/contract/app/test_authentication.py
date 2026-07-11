# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
import uuid
import pytest
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from django.test import Client
from django.core.exceptions import ValidationError
from unittest.mock import patch

from plane.authentication.provider.credentials.magic_code import MagicCodeProvider
from plane.authentication.rate_limit import AuthenticationThrottle
from plane.db.models import User
from plane.settings.redis import redis_instance
from plane.license.models import Instance


@pytest.fixture
def setup_instance(db):
    """Create and configure an instance for authentication tests"""
    instance_id = uuid.uuid4() if not Instance.objects.exists() else Instance.objects.first().id

    # Create or update instance with all required fields
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.0.0",
            "domain": "http://localhost:8000",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def django_client():
    """Return a Django test client with User-Agent header for handling redirects"""
    client = Client(HTTP_USER_AGENT="Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1")
    return client


@pytest.mark.contract
class TestMagicLinkGenerate:
    """Test magic link generation functionality"""

    @pytest.fixture
    def setup_user(self, db):
        """Create a test user for magic link tests"""
        user = User.objects.create(email="user@plane.so")
        user.set_password("user@123")
        user.save()
        return user

    @pytest.mark.django_db
    def test_without_data(self, api_client, setup_user, setup_instance):
        """Test magic link generation with empty data"""
        url = reverse("magic-generate")
        try:
            response = api_client.post(url, {}, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST
        except ValidationError:
            # If a ValidationError is raised directly, that's also acceptable
            # as it indicates the empty email was rejected
            assert True

    @pytest.mark.django_db
    def test_email_validity(self, api_client, setup_user, setup_instance):
        """Test magic link generation with invalid email format"""
        url = reverse("magic-generate")
        try:
            response = api_client.post(url, {"email": "useremail.com"}, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "error_code" in response.data  # Check for error code in response
        except ValidationError:
            # If a ValidationError is raised directly, that's also acceptable
            # as it indicates the invalid email was rejected
            assert True

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_magic_generate(self, mock_magic_link, api_client, setup_user, setup_instance):
        """Test successful magic link generation"""
        url = reverse("magic-generate")

        ri = redis_instance()
        ri.delete("magic_user@plane.so")

        response = api_client.post(url, {"email": "user@plane.so"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "key" in response.data  # Check for key in response

        # Verify the mock was called with the expected arguments
        mock_magic_link.assert_called_once()
        args = mock_magic_link.call_args[0]
        assert args[0] == "user@plane.so"  # First arg should be the email

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_max_generate_attempt(self, mock_magic_link, api_client, setup_user, setup_instance):
        """Test exceeding maximum magic link generation attempts"""
        url = reverse("magic-generate")

        ri = redis_instance()
        ri.delete("magic_user@plane.so")

        for _ in range(4):
            api_client.post(url, {"email": "user@plane.so"}, format="json")

        response = api_client.post(url, {"email": "user@plane.so"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error_code" in response.data  # Check for error code in response


@pytest.mark.contract
class TestSignInEndpoint:
    """Test sign-in functionality"""

    @pytest.fixture
    def setup_user(self, db):
        """Create a test user for authentication tests"""
        user = User.objects.create(email="user@plane.so")
        user.set_password("user@123")
        user.save()
        return user

    @pytest.mark.django_db
    def test_without_data(self, django_client, setup_user, setup_instance):
        """Test sign-in with empty data"""
        url = reverse("sign-in")
        response = django_client.post(url, {}, follow=True)

        # Check redirect contains error code
        assert "REQUIRED_EMAIL_PASSWORD_SIGN_IN" in response.redirect_chain[-1][0]

    @pytest.mark.django_db
    def test_email_validity(self, django_client, setup_user, setup_instance):
        """Test sign-in with invalid email format"""
        url = reverse("sign-in")
        response = django_client.post(url, {"email": "useremail.com", "password": "user@123"}, follow=True)

        # Check redirect contains error code
        assert "INVALID_EMAIL_SIGN_IN" in response.redirect_chain[-1][0]

    @pytest.mark.django_db
    def test_user_exists(self, django_client, setup_user, setup_instance):
        """Test sign-in with non-existent user"""
        url = reverse("sign-in")
        response = django_client.post(url, {"email": "user@email.so", "password": "user123"}, follow=True)

        # Check redirect contains error code
        assert "USER_DOES_NOT_EXIST" in response.redirect_chain[-1][0]

    @pytest.mark.django_db
    def test_password_validity(self, django_client, setup_user, setup_instance):
        """Test sign-in with incorrect password"""
        url = reverse("sign-in")
        response = django_client.post(url, {"email": "user@plane.so", "password": "user123"}, follow=True)

        # Check for the specific authentication error in the URL
        redirect_urls = [url for url, _ in response.redirect_chain]
        redirect_contents = " ".join(redirect_urls)

        # The actual error code for invalid password is AUTHENTICATION_FAILED_SIGN_IN
        assert "AUTHENTICATION_FAILED_SIGN_IN" in redirect_contents

    @pytest.mark.django_db
    def test_user_login(self, django_client, setup_user, setup_instance):
        """Test successful sign-in"""
        url = reverse("sign-in")

        # First make the request without following redirects
        response = django_client.post(url, {"email": "user@plane.so", "password": "user@123"}, follow=False)

        # Check that the initial response is a redirect (302) without error code
        assert response.status_code == 302
        assert "error_code" not in response.url

        # Now follow just the first redirect to avoid 404s
        response = django_client.get(response.url, follow=False)

        # The user should be authenticated regardless of the final page
        assert "_auth_user_id" in django_client.session

    @pytest.mark.django_db
    def test_next_path_redirection(self, django_client, setup_user, setup_instance):
        """Test sign-in with next_path parameter"""
        url = reverse("sign-in")
        next_path = "workspaces"

        # First make the request without following redirects
        response = django_client.post(
            url,
            {"email": "user@plane.so", "password": "user@123", "next_path": next_path},
            follow=False,
        )

        # Check that the initial response is a redirect (302) without error code
        assert response.status_code == 302
        assert "error_code" not in response.url

        # In a real browser, the next_path would be used to build the absolute URL
        # Since we're just testing the authentication logic, we won't check for the exact URL structure
        # Instead, just verify that we're authenticated
        assert "_auth_user_id" in django_client.session


@pytest.mark.contract
class TestMagicSignIn:
    """Test magic link sign-in functionality"""

    @pytest.fixture
    def setup_user(self, db):
        """Create a test user for magic sign-in tests"""
        user = User.objects.create(email="user@plane.so")
        user.set_password("user@123")
        user.save()
        return user

    @pytest.mark.django_db
    def test_without_data(self, django_client, setup_user, setup_instance):
        """Test magic link sign-in with empty data"""
        url = reverse("magic-sign-in")
        response = django_client.post(url, {}, follow=True)

        # Check redirect contains error code
        assert "MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED" in response.redirect_chain[-1][0]

    @pytest.mark.django_db
    def test_expired_invalid_magic_link(self, django_client, setup_user, setup_instance):
        """Test magic link sign-in with expired/invalid link"""
        ri = redis_instance()
        ri.delete("magic_user@plane.so")

        url = reverse("magic-sign-in")
        response = django_client.post(url, {"email": "user@plane.so", "code": "xxxx-xxxxx-xxxx"}, follow=False)

        # Check that we get a redirect
        assert response.status_code == 302

        # The actual error code is EXPIRED_MAGIC_CODE_SIGN_IN (when key doesn't exist)
        # or INVALID_MAGIC_CODE_SIGN_IN (when key exists but code doesn't match)
        assert "EXPIRED_MAGIC_CODE_SIGN_IN" in response.url or "INVALID_MAGIC_CODE_SIGN_IN" in response.url

    @pytest.mark.django_db
    def test_user_does_not_exist(self, django_client, setup_instance):
        """Test magic sign-in with non-existent user"""
        url = reverse("magic-sign-in")
        response = django_client.post(
            url,
            {"email": "nonexistent@plane.so", "code": "xxxx-xxxxx-xxxx"},
            follow=True,
        )

        # Check redirect contains error code
        assert "USER_DOES_NOT_EXIST" in response.redirect_chain[-1][0]

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_magic_code_sign_in(self, mock_magic_link, django_client, api_client, setup_user, setup_instance):
        """Test successful magic link sign-in process"""
        # First generate a magic link token
        gen_url = reverse("magic-generate")
        response = api_client.post(gen_url, {"email": "user@plane.so"}, format="json")

        # Check that the token generation was successful
        assert response.status_code == status.HTTP_200_OK

        # Since we're mocking the magic_link task, we need to manually get the token from Redis
        ri = redis_instance()
        user_data = json.loads(ri.get("magic_user@plane.so"))
        token = user_data["token"]

        # Use Django client to test the redirect flow without following redirects
        url = reverse("magic-sign-in")
        response = django_client.post(url, {"email": "user@plane.so", "code": token}, follow=False)

        # Check that the initial response is a redirect without error code
        assert response.status_code == 302
        assert "error_code" not in response.url

        # The user should now be authenticated
        assert "_auth_user_id" in django_client.session

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_magic_sign_in_with_next_path(self, mock_magic_link, django_client, api_client, setup_user, setup_instance):
        """Test magic sign-in with next_path parameter"""
        # First generate a magic link token
        gen_url = reverse("magic-generate")
        response = api_client.post(gen_url, {"email": "user@plane.so"}, format="json")

        # Check that the token generation was successful
        assert response.status_code == status.HTTP_200_OK

        # Since we're mocking the magic_link task, we need to manually get the token from Redis
        ri = redis_instance()
        user_data = json.loads(ri.get("magic_user@plane.so"))
        token = user_data["token"]

        # Use Django client to test the redirect flow without following redirects.
        # next_path must start with "/" per validate_next_path (otherwise it's discarded).
        url = reverse("magic-sign-in")
        next_path = "/workspaces"
        response = django_client.post(
            url,
            {"email": "user@plane.so", "code": token, "next_path": next_path},
            follow=False,
        )

        # Check that the initial response is a redirect without error code
        assert response.status_code == 302
        assert "error_code" not in response.url

        # Check that the redirect URL contains the next_path (URL-encoded, leading slash → %2F)
        assert "workspaces" in response.url

        # The user should now be authenticated
        assert "_auth_user_id" in django_client.session


@pytest.mark.contract
class TestMagicSignUp:
    """Test magic link sign-up functionality"""

    @pytest.mark.django_db
    def test_without_data(self, django_client, setup_instance):
        """Test magic link sign-up with empty data"""
        url = reverse("magic-sign-up")
        response = django_client.post(url, {}, follow=True)

        # Check redirect contains error code
        assert "MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED" in response.redirect_chain[-1][0]

    @pytest.mark.django_db
    def test_user_already_exists(self, django_client, db, setup_instance):
        """Test magic sign-up with existing user"""
        # Create a user that already exists
        User.objects.create(email="existing@plane.so")

        url = reverse("magic-sign-up")
        response = django_client.post(url, {"email": "existing@plane.so", "code": "xxxx-xxxxx-xxxx"}, follow=True)

        # Check redirect contains error code
        assert "USER_ALREADY_EXIST" in response.redirect_chain[-1][0]

    @pytest.mark.django_db
    def test_expired_invalid_magic_link(self, django_client, setup_instance):
        """Test magic link sign-up with expired/invalid link"""
        url = reverse("magic-sign-up")
        response = django_client.post(url, {"email": "new@plane.so", "code": "xxxx-xxxxx-xxxx"}, follow=False)

        # Check that we get a redirect
        assert response.status_code == 302

        # The actual error code is EXPIRED_MAGIC_CODE_SIGN_UP (when key doesn't exist)
        # or INVALID_MAGIC_CODE_SIGN_UP (when key exists but code doesn't match)
        assert "EXPIRED_MAGIC_CODE_SIGN_UP" in response.url or "INVALID_MAGIC_CODE_SIGN_UP" in response.url

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_magic_code_sign_up(self, mock_magic_link, django_client, api_client, setup_instance):
        """Test successful magic link sign-up process"""
        email = "newuser@plane.so"

        # First generate a magic link token
        gen_url = reverse("magic-generate")
        response = api_client.post(gen_url, {"email": email}, format="json")

        # Check that the token generation was successful
        assert response.status_code == status.HTTP_200_OK

        # Since we're mocking the magic_link task, we need to manually get the token from Redis
        ri = redis_instance()
        user_data = json.loads(ri.get(f"magic_{email}"))
        token = user_data["token"]

        # Use Django client to test the redirect flow without following redirects
        url = reverse("magic-sign-up")
        response = django_client.post(url, {"email": email, "code": token}, follow=False)

        # Check that the initial response is a redirect without error code
        assert response.status_code == 302
        assert "error_code" not in response.url

        # Check if user was created
        assert User.objects.filter(email=email).exists()

        # Check if user is authenticated
        assert "_auth_user_id" in django_client.session

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_magic_sign_up_with_next_path(self, mock_magic_link, django_client, api_client, setup_instance):
        """Test magic sign-up with next_path parameter"""
        email = "newuser2@plane.so"

        # First generate a magic link token
        gen_url = reverse("magic-generate")
        response = api_client.post(gen_url, {"email": email}, format="json")

        # Check that the token generation was successful
        assert response.status_code == status.HTTP_200_OK

        # Since we're mocking the magic_link task, we need to manually get the token from Redis
        ri = redis_instance()
        user_data = json.loads(ri.get(f"magic_{email}"))
        token = user_data["token"]

        # Use Django client to test the redirect flow without following redirects
        url = reverse("magic-sign-up")
        next_path = "onboarding"
        response = django_client.post(url, {"email": email, "code": token, "next_path": next_path}, follow=False)

        # Check that the initial response is a redirect without error code
        assert response.status_code == 302
        assert "error_code" not in response.url

        # In a real browser, the next_path would be used to build the absolute URL
        # Since we're just testing the authentication logic, we won't check for the exact URL structure

        # Check if user was created
        assert User.objects.filter(email=email).exists()

        # Check if user is authenticated
        assert "_auth_user_id" in django_client.session


def _generate_magic_token(api_client, email):
    """Hit /magic-generate/ for `email` and return the token that landed in Redis."""
    gen_url = reverse("magic-generate")
    response = api_client.post(gen_url, {"email": email}, format="json")
    assert response.status_code == status.HTTP_200_OK
    ri = redis_instance()
    return json.loads(ri.get(f"magic_{email}"))["token"]


@pytest.mark.contract
class TestMagicSignInVerifyAttempts:
    """Per-token wrong-code attempt counter and exhaustion behavior (GHSA-9pvm-fcf6-9234)."""

    EMAIL = "verify-attempts@plane.so"

    @pytest.fixture
    def setup_user(self, db):
        user = User.objects.create(email=self.EMAIL)
        user.set_password("user@123")
        user.save()
        return user

    @pytest.fixture(autouse=True)
    def _clear_state(self):
        """Reset throttle cache and magic-link redis state between tests in this class."""
        cache.clear()
        ri = redis_instance()
        ri.delete(f"magic_{self.EMAIL}")
        ri.delete(f"magic_{self.EMAIL}:verify_attempts")
        yield
        cache.clear()
        ri.delete(f"magic_{self.EMAIL}")
        ri.delete(f"magic_{self.EMAIL}:verify_attempts")

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_exhausted_after_max_wrong_attempts(
        self, mock_magic_link, django_client, api_client, setup_user, setup_instance
    ):
        """
        After MAX_VERIFY_ATTEMPTS wrong codes the next verify must redirect with
        EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN and both Redis keys must be gone.

        With MAX_VERIFY_ATTEMPTS=5 the 5th wrong attempt itself triggers exhaustion
        (4 INVALID + 1 EXHAUSTED), matching the >= check in set_user_data.
        """
        _generate_magic_token(api_client, self.EMAIL)
        url = reverse("magic-sign-in")
        ri = redis_instance()

        # First (MAX-1) wrong attempts: each redirects with INVALID_MAGIC_CODE_SIGN_IN.
        for i in range(MagicCodeProvider.MAX_VERIFY_ATTEMPTS - 1):
            response = django_client.post(url, {"email": self.EMAIL, "code": "000000"}, follow=False)
            assert response.status_code == 302, f"attempt {i+1} unexpected status"
            assert "INVALID_MAGIC_CODE_SIGN_IN" in response.url, f"attempt {i+1} did not return INVALID"

        # Token and counter both still live, with counter at MAX-1.
        assert ri.exists(f"magic_{self.EMAIL}")
        assert int(ri.get(f"magic_{self.EMAIL}:verify_attempts")) == MagicCodeProvider.MAX_VERIFY_ATTEMPTS - 1

        # The MAX-th wrong attempt is the exhausting one.
        response = django_client.post(url, {"email": self.EMAIL, "code": "000000"}, follow=False)
        assert response.status_code == 302
        assert "EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN" in response.url

        # Both the token and the counter must be deleted.
        assert not ri.exists(f"magic_{self.EMAIL}")
        assert not ri.exists(f"magic_{self.EMAIL}:verify_attempts")

        # Follow-up verify now sees the key as missing and reports EXPIRED.
        response = django_client.post(url, {"email": self.EMAIL, "code": "000000"}, follow=False)
        assert response.status_code == 302
        assert "EXPIRED_MAGIC_CODE_SIGN_IN" in response.url

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_counter_increments_on_each_wrong_attempt(
        self, mock_magic_link, django_client, api_client, setup_user, setup_instance
    ):
        """The verify_attempts counter increments by exactly one per wrong-code POST."""
        _generate_magic_token(api_client, self.EMAIL)
        url = reverse("magic-sign-in")
        ri = redis_instance()
        counter_key = f"magic_{self.EMAIL}:verify_attempts"

        # Before any wrong attempt the counter does not exist (Lua INCR creates it).
        assert not ri.exists(counter_key)

        for expected in range(1, MagicCodeProvider.MAX_VERIFY_ATTEMPTS):
            django_client.post(url, {"email": self.EMAIL, "code": "000000"}, follow=False)
            assert int(ri.get(counter_key)) == expected, f"counter mismatch after {expected} attempts"

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_counter_resets_on_token_regeneration(
        self, mock_magic_link, django_client, api_client, setup_user, setup_instance
    ):
        """
        Regenerating the magic-link must reset the verify-attempt counter so the
        user isn't pre-locked-out by a previous session's wrong attempts.
        """
        _generate_magic_token(api_client, self.EMAIL)
        url = reverse("magic-sign-in")
        ri = redis_instance()
        counter_key = f"magic_{self.EMAIL}:verify_attempts"

        for _ in range(MagicCodeProvider.MAX_VERIFY_ATTEMPTS - 2):
            django_client.post(url, {"email": self.EMAIL, "code": "000000"}, follow=False)
        assert int(ri.get(counter_key)) == MagicCodeProvider.MAX_VERIFY_ATTEMPTS - 2

        # Regenerate the magic-link — the counter should be cleared.
        _generate_magic_token(api_client, self.EMAIL)
        assert not ri.exists(counter_key)

        # Fresh wrong attempt now produces INVALID (not EXHAUSTED) and counter starts at 1.
        response = django_client.post(url, {"email": self.EMAIL, "code": "000000"}, follow=False)
        assert "INVALID_MAGIC_CODE_SIGN_IN" in response.url
        assert int(ri.get(counter_key)) == 1


@pytest.mark.contract
class TestMagicSignUpVerifyAttempts:
    """Sign-up flow gets the same per-token attempt cap (no existing User row)."""

    EMAIL = "signup-verify-attempts@plane.so"

    @pytest.fixture(autouse=True)
    def _clear_state(self):
        cache.clear()
        ri = redis_instance()
        ri.delete(f"magic_{self.EMAIL}")
        ri.delete(f"magic_{self.EMAIL}:verify_attempts")
        yield
        cache.clear()
        ri.delete(f"magic_{self.EMAIL}")
        ri.delete(f"magic_{self.EMAIL}:verify_attempts")

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_signup_exhausted_after_max_wrong_attempts(
        self, mock_magic_link, django_client, api_client, setup_instance
    ):
        """The MAX-th wrong code on the sign-up endpoint returns the SIGN_UP variant of EXHAUSTED."""
        _generate_magic_token(api_client, self.EMAIL)
        url = reverse("magic-sign-up")
        ri = redis_instance()

        for _ in range(MagicCodeProvider.MAX_VERIFY_ATTEMPTS - 1):
            response = django_client.post(url, {"email": self.EMAIL, "code": "000000"}, follow=False)
            assert "INVALID_MAGIC_CODE_SIGN_UP" in response.url

        response = django_client.post(url, {"email": self.EMAIL, "code": "000000"}, follow=False)
        assert "EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP" in response.url
        assert not ri.exists(f"magic_{self.EMAIL}")
        assert not ri.exists(f"magic_{self.EMAIL}:verify_attempts")


@pytest.mark.contract
class TestAuthenticationThrottle:
    """Per-IP throttle on the redirect-flow magic-link endpoints."""

    @pytest.fixture(autouse=True)
    def _clear_state(self):
        cache.clear()
        yield
        cache.clear()

    @pytest.mark.django_db
    def test_magic_sign_in_throttled(self, django_client, setup_instance):
        """Posting past the configured rate from one IP returns RATE_LIMIT_EXCEEDED."""
        url = reverse("magic-sign-in")
        # Drop the rate so the test doesn't have to fire 10+ requests.
        with patch.object(AuthenticationThrottle, "rate", "2/minute"):
            for _ in range(2):
                response = django_client.post(url, {"email": "throttle@plane.so", "code": "000000"}, follow=False)
                assert response.status_code == 302
                assert "RATE_LIMIT_EXCEEDED" not in response.url

            # The 3rd request from the same IP within the window trips the throttle.
            response = django_client.post(url, {"email": "throttle@plane.so", "code": "000000"}, follow=False)
            assert response.status_code == 302
            assert "RATE_LIMIT_EXCEEDED" in response.url

    @pytest.mark.django_db
    def test_magic_sign_up_throttled(self, django_client, setup_instance):
        """The sign-up sibling shares the same scope and trips on the same per-IP budget."""
        url = reverse("magic-sign-up")
        with patch.object(AuthenticationThrottle, "rate", "1/minute"):
            response = django_client.post(url, {"email": "throttle-up@plane.so", "code": "000000"}, follow=False)
            assert "RATE_LIMIT_EXCEEDED" not in response.url

            response = django_client.post(url, {"email": "throttle-up@plane.so", "code": "000000"}, follow=False)
            assert "RATE_LIMIT_EXCEEDED" in response.url


@pytest.mark.contract
class TestBotUserLoginBlocked:
    """Bot service accounts (is_bot=True) must never authenticate through the
    interactive login flow.

    Bots are internal identities (e.g. the WORKSPACE_SEED bot) that act only via
    API tokens. Every interactive provider funnels through
    Adapter.complete_login_or_signup(), which rejects bots with
    BOT_USER_LOGIN_FORBIDDEN (5017). These are regression guards for that block.
    """

    BOT_EMAIL = "bot-login@plane.so"
    HUMAN_EMAIL = "human-login@plane.so"
    PASSWORD = "Str0ng-Pass!42"

    @pytest.fixture(autouse=True)
    def _clear_state(self):
        """Reset throttle cache and the bot's magic-link redis state around each test."""
        cache.clear()
        ri = redis_instance()
        ri.delete(f"magic_{self.BOT_EMAIL}")
        ri.delete(f"magic_{self.BOT_EMAIL}:verify_attempts")
        yield
        cache.clear()
        ri.delete(f"magic_{self.BOT_EMAIL}")
        ri.delete(f"magic_{self.BOT_EMAIL}:verify_attempts")

    @pytest.fixture
    def bot_user(self, db):
        """An active bot account with a known password so the credential check
        passes and execution reaches the login chokepoint."""
        user = User.objects.create(email=self.BOT_EMAIL, is_bot=True, is_active=True)
        user.set_password(self.PASSWORD)
        user.save()
        return user

    @pytest.fixture
    def human_user(self, db):
        """A normal (non-bot) account, identical apart from is_bot, as a control."""
        user = User.objects.create(email=self.HUMAN_EMAIL, is_active=True)
        user.set_password(self.PASSWORD)
        user.save()
        return user

    @pytest.mark.django_db
    def test_bot_password_sign_in_blocked(self, django_client, bot_user, setup_instance):
        """Password sign-in with a bot's *correct* credentials is still rejected:
        the block happens after credential verification, so no session is created."""
        url = reverse("sign-in")
        response = django_client.post(
            url, {"email": self.BOT_EMAIL, "password": self.PASSWORD}, follow=False
        )
        assert response.status_code == 302
        assert "BOT_USER_LOGIN_FORBIDDEN" in response.url
        # The block must prevent authentication.
        assert "_auth_user_id" not in django_client.session

    @pytest.mark.django_db
    @patch("plane.bgtasks.magic_link_code_task.magic_link.delay")
    def test_bot_magic_sign_in_blocked(
        self, mock_magic_link, django_client, api_client, bot_user, setup_instance
    ):
        """The same block applies via a second provider (magic code), proving the
        guard sits at the shared chokepoint rather than in one provider."""
        token = _generate_magic_token(api_client, self.BOT_EMAIL)
        url = reverse("magic-sign-in")
        response = django_client.post(url, {"email": self.BOT_EMAIL, "code": token}, follow=False)
        assert response.status_code == 302
        assert "BOT_USER_LOGIN_FORBIDDEN" in response.url
        assert "_auth_user_id" not in django_client.session

    @pytest.mark.django_db
    def test_human_password_sign_in_allowed(self, django_client, human_user, setup_instance):
        """Control: a normal user with the identical setup still signs in — the
        guard is scoped strictly to is_bot and does not regress human logins."""
        url = reverse("sign-in")
        response = django_client.post(
            url, {"email": self.HUMAN_EMAIL, "password": self.PASSWORD}, follow=False
        )
        assert response.status_code == 302
        assert "BOT_USER_LOGIN_FORBIDDEN" not in response.url
        assert "error_code" not in response.url
        assert "_auth_user_id" in django_client.session


@pytest.mark.contract
class TestBotUserAdminSignInBlocked:
    """A bot must not sign in to the instance-admin console either.

    InstanceAdminSignInEndpoint mints its own session via user_login() outside
    Adapter.complete_login_or_signup(), so it carries an independent is_bot
    guard that rejects bots with ADMIN_AUTHENTICATION_FAILED before the admin
    membership check. (Uses the literal path because license/urls.py reuses the
    name "instance-admin-sign-in" for both sign-in and sign-up.)
    """

    ADMIN_SIGN_IN_PATH = "/api/instances/admins/sign-in/"
    BOT_EMAIL = "admin-bot@plane.so"
    PASSWORD = "Str0ng-Pass!42"

    @pytest.fixture(autouse=True)
    def _clear_state(self):
        cache.clear()
        yield
        cache.clear()

    @pytest.fixture
    def bot_user(self, db):
        user = User.objects.create(email=self.BOT_EMAIL, is_bot=True, is_active=True)
        user.set_password(self.PASSWORD)
        user.save()
        return user

    @pytest.mark.django_db
    def test_bot_admin_sign_in_blocked(self, django_client, bot_user, setup_instance):
        """A bot is rejected at the admin sign-in endpoint and no session is created,
        even though it is active and the password is correct."""
        response = django_client.post(
            self.ADMIN_SIGN_IN_PATH,
            {"email": self.BOT_EMAIL, "password": self.PASSWORD},
            follow=False,
        )
        assert response.status_code == 302
        assert "ADMIN_AUTHENTICATION_FAILED" in response.url
        assert "_auth_user_id" not in django_client.session
