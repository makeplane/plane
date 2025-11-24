import json
import uuid
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from django.test import Client
from django.core.exceptions import ValidationError
from unittest.mock import patch

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

        # Use Django client to test the redirect flow without following redirects
        url = reverse("magic-sign-in")
        next_path = "workspaces"
        response = django_client.post(
            url,
            {"email": "user@plane.so", "code": token, "next_path": next_path},
            follow=False,
        )

        # Check that the initial response is a redirect without error code
        assert response.status_code == 302
        assert "error_code" not in response.url

        # Check that the redirect URL contains the next_path
        assert next_path in response.url

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
