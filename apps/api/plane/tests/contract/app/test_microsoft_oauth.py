import uuid
import pytest
from django.urls import reverse
from django.test import Client
from unittest.mock import patch, MagicMock

from plane.db.models import User
from plane.license.models import Instance
from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES


@pytest.fixture
def setup_instance(db):
    """Create and configure an instance for authentication tests."""
    instance_id = (
        uuid.uuid4()
        if not Instance.objects.exists()
        else Instance.objects.first().id
    )
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.0.0",
            "domain": "http://localhost:8000",
            "last_checked_at": __import__("django.utils.timezone", fromlist=["now"]).now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def django_client():
    """Return a Django test client with User-Agent header."""
    return Client(
        HTTP_USER_AGENT="Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1"
    )


MICROSOFT_ENV = {
    "MICROSOFT_CLIENT_ID": "test-client-id",
    "MICROSOFT_CLIENT_SECRET": "test-client-secret",
    "MICROSOFT_TENANT_ID": "test-tenant-id",
    "IS_MICROSOFT_ENABLED": "1",
}


@pytest.mark.contract
class TestMicrosoftOauthInitiate:
    """Test Microsoft OAuth initiate endpoint (app)."""

    @pytest.mark.django_db
    def test_instance_not_configured(self, django_client, db):
        """Test redirect with error when instance is not set up."""
        # Ensure no instance exists
        Instance.objects.all().delete()
        url = reverse("microsoft-initiate")
        response = django_client.get(url, follow=False)

        assert response.status_code == 302
        assert "INSTANCE_NOT_CONFIGURED" in response.url or str(
            AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"]
        ) in response.url

    @pytest.mark.django_db
    def test_instance_setup_not_done(self, django_client, db):
        """Test redirect with error when instance setup is not done."""
        from django.utils import timezone

        Instance.objects.all().delete()
        Instance.objects.create(
            instance_name="Test",
            instance_id=str(uuid.uuid4()),
            current_version="1.0.0",
            last_checked_at=timezone.now(),
            is_setup_done=False,
        )
        url = reverse("microsoft-initiate")
        response = django_client.get(url, follow=False)

        assert response.status_code == 302
        assert "INSTANCE_NOT_CONFIGURED" in response.url or str(
            AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"]
        ) in response.url

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["test-client-id", "test-client-secret", "test-tenant-id"],
    )
    def test_redirects_to_azure_ad(self, mock_config, django_client, setup_instance):
        """Test successful redirect to Azure AD login page."""
        url = reverse("microsoft-initiate")
        response = django_client.get(url, follow=False)

        assert response.status_code == 302
        assert "login.microsoftonline.com" in response.url
        assert "test-client-id" in response.url
        assert "response_type=code" in response.url

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["test-client-id", "test-client-secret", "test-tenant-id"],
    )
    def test_state_stored_in_session(self, mock_config, django_client, setup_instance):
        """Test that state parameter is stored in session."""
        url = reverse("microsoft-initiate")
        django_client.get(url, follow=False)
        assert "state" in django_client.session

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["test-client-id", "test-client-secret", "test-tenant-id"],
    )
    def test_next_path_stored_in_session(self, mock_config, django_client, setup_instance):
        """Test that next_path is stored in session when provided."""
        url = reverse("microsoft-initiate")
        django_client.get(url + "?next_path=/dashboard", follow=False)
        assert django_client.session.get("next_path") == "/dashboard"

    @pytest.mark.django_db
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=[None, None, None],
    )
    def test_microsoft_not_configured_error(self, mock_config, django_client, setup_instance):
        """Test redirect with error when Microsoft OAuth is not configured."""
        url = reverse("microsoft-initiate")
        response = django_client.get(url, follow=False)

        assert response.status_code == 302
        assert "MICROSOFT_NOT_CONFIGURED" in response.url or str(
            AUTHENTICATION_ERROR_CODES["MICROSOFT_NOT_CONFIGURED"]
        ) in response.url


@pytest.mark.contract
class TestMicrosoftOauthCallback:
    """Test Microsoft OAuth callback endpoint (app)."""

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    def test_state_mismatch_error(self, django_client, setup_instance):
        """Test error when callback state doesn't match session state."""
        # Set a different state in session
        session = django_client.session
        session["state"] = "original-state"
        session.save()

        url = reverse("microsoft-callback")
        response = django_client.get(
            url + "?code=auth-code&state=wrong-state", follow=False
        )

        assert response.status_code == 302
        assert "MICROSOFT_OAUTH_PROVIDER_ERROR" in response.url or str(
            AUTHENTICATION_ERROR_CODES["MICROSOFT_OAUTH_PROVIDER_ERROR"]
        ) in response.url

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    def test_missing_code_error(self, django_client, setup_instance):
        """Test error when authorization code is missing."""
        session = django_client.session
        session["state"] = "test-state"
        session.save()

        url = reverse("microsoft-callback")
        response = django_client.get(url + "?state=test-state", follow=False)

        assert response.status_code == 302
        assert "MICROSOFT_OAUTH_PROVIDER_ERROR" in response.url or str(
            AUTHENTICATION_ERROR_CODES["MICROSOFT_OAUTH_PROVIDER_ERROR"]
        ) in response.url

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["test-client-id", "test-client-secret", "test-tenant-id"],
    )
    @patch("plane.authentication.adapter.oauth.requests.post")
    @patch("plane.authentication.adapter.oauth.requests.get")
    def test_successful_login_new_user(
        self, mock_get, mock_post, mock_config, django_client, setup_instance
    ):
        """Test successful OAuth flow creates user and authenticates."""
        # Set session state
        session = django_client.session
        session["state"] = "valid-state"
        session["host"] = "http://localhost:8000"
        session.save()

        # Mock token response
        mock_token_resp = MagicMock()
        mock_token_resp.json.return_value = {
            "access_token": "access-token-123",
            "refresh_token": "refresh-token-456",
            "expires_in": 3600,
            "id_token": "id-token-789",
        }
        mock_token_resp.raise_for_status = MagicMock()
        mock_post.return_value = mock_token_resp

        # Mock user info response
        mock_user_resp = MagicMock()
        mock_user_resp.json.return_value = {
            "id": "ms-user-id-123",
            "mail": "newuser@directcloud.io",
            "givenName": "New",
            "surname": "User",
            "userPrincipalName": "newuser@directcloud.io",
        }
        mock_user_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_user_resp

        url = reverse("microsoft-callback")
        response = django_client.get(
            url + "?code=auth-code&state=valid-state", follow=False
        )

        assert response.status_code == 302
        assert "error_code" not in response.url

        # Verify user was created
        assert User.objects.filter(email="newuser@directcloud.io").exists()

        # Verify user is authenticated
        assert "_auth_user_id" in django_client.session

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["test-client-id", "test-client-secret", "test-tenant-id"],
    )
    @patch("plane.authentication.adapter.oauth.requests.post")
    @patch("plane.authentication.adapter.oauth.requests.get")
    def test_successful_login_existing_user(
        self, mock_get, mock_post, mock_config, django_client, setup_instance
    ):
        """Test successful OAuth flow with existing user."""
        # Create existing user
        existing_user = User.objects.create(
            email="existing@directcloud.io",
            username=uuid.uuid4().hex,
        )
        existing_user.set_password(uuid.uuid4().hex)
        existing_user.save()

        # Set session state
        session = django_client.session
        session["state"] = "valid-state"
        session["host"] = "http://localhost:8000"
        session.save()

        # Mock token response
        mock_token_resp = MagicMock()
        mock_token_resp.json.return_value = {
            "access_token": "access-token-123",
            "expires_in": 3600,
        }
        mock_token_resp.raise_for_status = MagicMock()
        mock_post.return_value = mock_token_resp

        # Mock user info response
        mock_user_resp = MagicMock()
        mock_user_resp.json.return_value = {
            "id": "ms-user-id-456",
            "mail": "existing@directcloud.io",
            "givenName": "Existing",
            "surname": "User",
        }
        mock_user_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_user_resp

        url = reverse("microsoft-callback")
        response = django_client.get(
            url + "?code=auth-code&state=valid-state", follow=False
        )

        assert response.status_code == 302
        assert "error_code" not in response.url
        assert "_auth_user_id" in django_client.session

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["test-client-id", "test-client-secret", "test-tenant-id"],
    )
    @patch("plane.authentication.adapter.oauth.requests.post")
    def test_token_exchange_failure(
        self, mock_post, mock_config, django_client, setup_instance
    ):
        """Test error handling when token exchange fails."""
        import requests as req_lib

        session = django_client.session
        session["state"] = "valid-state"
        session["host"] = "http://localhost:8000"
        session.save()

        # Mock token request failure
        mock_post.side_effect = req_lib.RequestException("Token exchange failed")

        url = reverse("microsoft-callback")
        response = django_client.get(
            url + "?code=bad-code&state=valid-state", follow=False
        )

        assert response.status_code == 302
        assert "error_code" in response.url


@pytest.mark.contract
class TestMicrosoftOauthInitiateSpace:
    """Test Microsoft OAuth initiate endpoint (space)."""

    @pytest.mark.django_db
    def test_instance_not_configured(self, django_client, db):
        """Test redirect with error when instance is not set up."""
        Instance.objects.all().delete()
        url = reverse("space-microsoft-initiate")
        response = django_client.get(url, follow=False)

        assert response.status_code == 302
        assert "INSTANCE_NOT_CONFIGURED" in response.url or str(
            AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"]
        ) in response.url

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["test-client-id", "test-client-secret", "test-tenant-id"],
    )
    def test_redirects_to_azure_ad(self, mock_config, django_client, setup_instance):
        """Test successful redirect to Azure AD login page for space."""
        url = reverse("space-microsoft-initiate")
        response = django_client.get(url, follow=False)

        assert response.status_code == 302
        assert "login.microsoftonline.com" in response.url


@pytest.mark.contract
class TestMicrosoftOauthCallbackSpace:
    """Test Microsoft OAuth callback endpoint (space)."""

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    def test_state_mismatch_error(self, django_client, setup_instance):
        """Test error when callback state doesn't match session state."""
        session = django_client.session
        session["state"] = "original-state"
        session.save()

        url = reverse("space-microsoft-callback")
        response = django_client.get(
            url + "?code=auth-code&state=wrong-state", follow=False
        )

        assert response.status_code == 302
        assert "MICROSOFT_OAUTH_PROVIDER_ERROR" in response.url or str(
            AUTHENTICATION_ERROR_CODES["MICROSOFT_OAUTH_PROVIDER_ERROR"]
        ) in response.url

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    def test_missing_code_error(self, django_client, setup_instance):
        """Test error when authorization code is missing."""
        session = django_client.session
        session["state"] = "test-state"
        session.save()

        url = reverse("space-microsoft-callback")
        response = django_client.get(url + "?state=test-state", follow=False)

        assert response.status_code == 302
        assert "MICROSOFT_OAUTH_PROVIDER_ERROR" in response.url or str(
            AUTHENTICATION_ERROR_CODES["MICROSOFT_OAUTH_PROVIDER_ERROR"]
        ) in response.url

    @pytest.mark.django_db
    @patch.dict("os.environ", MICROSOFT_ENV)
    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["test-client-id", "test-client-secret", "test-tenant-id"],
    )
    @patch("plane.authentication.adapter.oauth.requests.post")
    @patch("plane.authentication.adapter.oauth.requests.get")
    def test_successful_login(
        self, mock_get, mock_post, mock_config, django_client, setup_instance
    ):
        """Test successful OAuth flow for space endpoint."""
        session = django_client.session
        session["state"] = "valid-state"
        session["host"] = "http://localhost:8000"
        session.save()

        # Mock token response
        mock_token_resp = MagicMock()
        mock_token_resp.json.return_value = {
            "access_token": "access-token-123",
            "expires_in": 3600,
        }
        mock_token_resp.raise_for_status = MagicMock()
        mock_post.return_value = mock_token_resp

        # Mock user info response
        mock_user_resp = MagicMock()
        mock_user_resp.json.return_value = {
            "id": "ms-user-id-space",
            "mail": "spaceuser@directcloud.io",
            "givenName": "Space",
            "surname": "User",
        }
        mock_user_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_user_resp

        url = reverse("space-microsoft-callback")
        response = django_client.get(
            url + "?code=auth-code&state=valid-state", follow=False
        )

        assert response.status_code == 302
        assert "error_code" not in response.url
        assert User.objects.filter(email="spaceuser@directcloud.io").exists()
        assert "_auth_user_id" in django_client.session
