import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock

from plane.authentication.provider.oauth.microsoft import MicrosoftOAuthProvider
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


@pytest.fixture
def mock_request():
    """Create a mock Django request object."""
    request = MagicMock()
    request.is_secure.return_value = False
    request.get_host.return_value = "localhost:8080"
    return request


MICROSOFT_CONFIG = [
    "test-client-id",
    "test-client-secret",
    "test-tenant-id",
]


@pytest.mark.unit
class TestMicrosoftOAuthProviderInit:
    """Test MicrosoftOAuthProvider initialization."""

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_init_sets_urls_and_scope(self, mock_config, mock_request):
        """Test that provider initializes with correct URLs and scope."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, state="test-state"
        )
        assert provider.token_url == (
            "https://login.microsoftonline.com/test-tenant-id/oauth2/v2.0/token"
        )
        assert provider.userinfo_url == "https://graph.microsoft.com/v1.0/me"
        assert provider.scope == "openid profile email User.Read"
        assert provider.provider == "microsoft"

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_init_builds_correct_redirect_uri(self, mock_config, mock_request):
        """Test that redirect_uri uses request host and scheme."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, state="test-state"
        )
        assert provider.redirect_uri == "http://localhost:8080/auth/microsoft/callback/"

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_init_https_redirect_uri(self, mock_config, mock_request):
        """Test that redirect_uri uses https when request is secure."""
        mock_request.is_secure.return_value = True
        provider = MicrosoftOAuthProvider(
            request=mock_request, state="test-state"
        )
        assert provider.redirect_uri.startswith("https://")

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_init_auth_url_contains_required_params(self, mock_config, mock_request):
        """Test that auth_url contains all required OAuth parameters."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, state="abc123"
        )
        auth_url = provider.get_auth_url()
        assert "login.microsoftonline.com/test-tenant-id" in auth_url
        assert "client_id=test-client-id" in auth_url
        assert "response_type=code" in auth_url
        assert "response_mode=query" in auth_url
        assert "state=abc123" in auth_url

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=[None, None, None],
    )
    def test_init_raises_when_not_configured(self, mock_config, mock_request):
        """Test that missing credentials raise MICROSOFT_NOT_CONFIGURED."""
        with pytest.raises(AuthenticationException) as exc_info:
            MicrosoftOAuthProvider(request=mock_request, state="test-state")
        assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES[
            "MICROSOFT_NOT_CONFIGURED"
        ]

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["client-id", None, "tenant-id"],
    )
    def test_init_raises_when_secret_missing(self, mock_config, mock_request):
        """Test that missing client_secret raises MICROSOFT_NOT_CONFIGURED."""
        with pytest.raises(AuthenticationException) as exc_info:
            MicrosoftOAuthProvider(request=mock_request, state="test-state")
        assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES[
            "MICROSOFT_NOT_CONFIGURED"
        ]

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=["client-id", "client-secret", None],
    )
    def test_init_defaults_tenant_to_common(self, mock_config, mock_request):
        """Test that missing tenant_id defaults to 'common'."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, state="test-state"
        )
        assert "login.microsoftonline.com/common" in provider.token_url


@pytest.mark.unit
class TestMicrosoftOAuthProviderTokenData:
    """Test set_token_data method."""

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_set_token_data_success(self, mock_config, mock_request):
        """Test that set_token_data correctly parses token response."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, code="auth-code", state="test-state"
        )
        mock_token_response = {
            "access_token": "access-token-123",
            "refresh_token": "refresh-token-456",
            "expires_in": 3600,
            "id_token": "id-token-789",
        }
        with patch.object(provider, "get_user_token", return_value=mock_token_response):
            provider.set_token_data()

        assert provider.token_data["access_token"] == "access-token-123"
        assert provider.token_data["refresh_token"] == "refresh-token-456"
        assert provider.token_data["id_token"] == "id-token-789"
        assert provider.token_data["access_token_expired_at"] is not None

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_set_token_data_without_refresh_token(self, mock_config, mock_request):
        """Test token data when refresh_token is absent."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, code="auth-code", state="test-state"
        )
        mock_token_response = {
            "access_token": "access-token-123",
            "expires_in": 3600,
        }
        with patch.object(provider, "get_user_token", return_value=mock_token_response):
            provider.set_token_data()

        assert provider.token_data["refresh_token"] is None
        assert provider.token_data["id_token"] == ""


@pytest.mark.unit
class TestMicrosoftOAuthProviderUserData:
    """Test set_user_data method."""

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_set_user_data_with_mail_field(self, mock_config, mock_request):
        """Test user data extraction when 'mail' field is present."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, code="auth-code", state="test-state"
        )
        provider.token_data = {"access_token": "test-token"}
        mock_user_response = {
            "id": "user-id-123",
            "mail": "user@directcloud.io",
            "givenName": "Test",
            "surname": "User",
            "userPrincipalName": "user@directcloud.onmicrosoft.com",
        }
        with patch.object(provider, "get_user_response", return_value=mock_user_response):
            provider.set_user_data()

        assert provider.user_data["email"] == "user@directcloud.io"
        assert provider.user_data["user"]["first_name"] == "Test"
        assert provider.user_data["user"]["last_name"] == "User"
        assert provider.user_data["user"]["provider_id"] == "user-id-123"
        assert provider.user_data["user"]["is_password_autoset"] is True
        assert provider.user_data["user"]["avatar"] == ""

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_set_user_data_falls_back_to_upn(self, mock_config, mock_request):
        """Test user data falls back to userPrincipalName when mail is None."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, code="auth-code", state="test-state"
        )
        provider.token_data = {"access_token": "test-token"}
        mock_user_response = {
            "id": "user-id-456",
            "mail": None,
            "givenName": "",
            "surname": "",
            "userPrincipalName": "user@directcloud.onmicrosoft.com",
        }
        with patch.object(provider, "get_user_response", return_value=mock_user_response):
            provider.set_user_data()

        assert provider.user_data["email"] == "user@directcloud.onmicrosoft.com"

    @patch(
        "plane.authentication.provider.oauth.microsoft.get_configuration_value",
        return_value=MICROSOFT_CONFIG,
    )
    def test_set_user_data_handles_missing_names(self, mock_config, mock_request):
        """Test user data handles missing givenName and surname gracefully."""
        provider = MicrosoftOAuthProvider(
            request=mock_request, code="auth-code", state="test-state"
        )
        provider.token_data = {"access_token": "test-token"}
        mock_user_response = {
            "id": "user-id-789",
            "mail": "user@directcloud.io",
        }
        with patch.object(provider, "get_user_response", return_value=mock_user_response):
            provider.set_user_data()

        assert provider.user_data["user"]["first_name"] == ""
        assert provider.user_data["user"]["last_name"] == ""
