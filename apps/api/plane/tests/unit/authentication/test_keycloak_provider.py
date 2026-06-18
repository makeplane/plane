# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
import pytz

from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.oauth.keycloak import KeycloakOAuthProvider


# Default valid config values for mocking get_configuration_value
VALID_CONFIG = ("1", "https://keycloak.example.com", "my-realm", "client-id", "client-secret")


def _mock_request(host="app.plane.so", secure=True):
    """Create a mock Django request."""
    request = MagicMock()
    request.get_host.return_value = host
    request.is_secure.return_value = secure
    return request


@pytest.mark.unit
class TestKeycloakProviderInit:
    """Test KeycloakOAuthProvider initialization and configuration validation."""

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    @patch.object(KeycloakOAuthProvider, "__init__", wraps=KeycloakOAuthProvider.__init__)
    def test_successful_init(self, mock_init, mock_get_config):
        """Provider initializes correctly with valid configuration."""
        mock_get_config.return_value = VALID_CONFIG
        request = _mock_request()

        provider = KeycloakOAuthProvider.__new__(KeycloakOAuthProvider)
        # We need to mock super().__init__ since OauthAdapter depends on Django
        with patch("plane.authentication.provider.oauth.keycloak.OauthAdapter.__init__"):
            KeycloakOAuthProvider.__init__(provider, request, code="test-code", state="test-state")

        assert provider.token_url == "https://keycloak.example.com/realms/my-realm/protocol/openid-connect/token"
        assert provider.userinfo_url == "https://keycloak.example.com/realms/my-realm/protocol/openid-connect/userinfo"

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_raises_when_not_enabled(self, mock_get_config):
        """Provider raises KEYCLOAK_NOT_CONFIGURED when IS_KEYCLOAK_ENABLED is not '1'."""
        mock_get_config.return_value = ("0", "https://keycloak.example.com", "realm", "id", "secret")

        with pytest.raises(AuthenticationException) as exc_info:
            KeycloakOAuthProvider(_mock_request())

        assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["KEYCLOAK_NOT_CONFIGURED"]

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_raises_when_enabled_is_empty(self, mock_get_config):
        """Provider raises when IS_KEYCLOAK_ENABLED is empty/None."""
        mock_get_config.return_value = (None, "https://keycloak.example.com", "realm", "id", "secret")

        with pytest.raises(AuthenticationException):
            KeycloakOAuthProvider(_mock_request())

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_raises_when_host_missing(self, mock_get_config):
        """Provider raises when KEYCLOAK_HOST is empty."""
        mock_get_config.return_value = ("1", "", "realm", "id", "secret")

        with pytest.raises(AuthenticationException):
            KeycloakOAuthProvider(_mock_request())

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_raises_when_realm_missing(self, mock_get_config):
        """Provider raises when KEYCLOAK_REALM is empty."""
        mock_get_config.return_value = ("1", "https://keycloak.example.com", "", "id", "secret")

        with pytest.raises(AuthenticationException):
            KeycloakOAuthProvider(_mock_request())

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_raises_when_client_id_missing(self, mock_get_config):
        """Provider raises when KEYCLOAK_CLIENT_ID is empty."""
        mock_get_config.return_value = ("1", "https://keycloak.example.com", "realm", "", "secret")

        with pytest.raises(AuthenticationException):
            KeycloakOAuthProvider(_mock_request())

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_raises_when_client_secret_missing(self, mock_get_config):
        """Provider raises when KEYCLOAK_CLIENT_SECRET is empty."""
        mock_get_config.return_value = ("1", "https://keycloak.example.com", "realm", "id", "")

        with pytest.raises(AuthenticationException):
            KeycloakOAuthProvider(_mock_request())

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_raises_when_host_has_no_scheme(self, mock_get_config):
        """Provider raises when KEYCLOAK_HOST has no URL scheme."""
        mock_get_config.return_value = ("1", "keycloak.example.com", "realm", "id", "secret")

        with pytest.raises(AuthenticationException):
            KeycloakOAuthProvider(_mock_request())

    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_raises_when_host_has_invalid_scheme(self, mock_get_config):
        """Provider raises when KEYCLOAK_HOST has non-http(s) scheme."""
        mock_get_config.return_value = ("1", "ftp://keycloak.example.com", "realm", "id", "secret")

        with pytest.raises(AuthenticationException):
            KeycloakOAuthProvider(_mock_request())

    @patch("plane.authentication.provider.oauth.keycloak.OauthAdapter.__init__")
    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_trailing_slash_stripped(self, mock_get_config, mock_super_init):
        """Provider strips trailing slashes from host."""
        mock_get_config.return_value = ("1", "https://keycloak.example.com///", "realm", "id", "secret")
        mock_super_init.return_value = None

        provider = KeycloakOAuthProvider(_mock_request())
        assert "keycloak.example.com///" not in provider.token_url
        assert provider.token_url.startswith("https://keycloak.example.com/realms/")

    @patch("plane.authentication.provider.oauth.keycloak.OauthAdapter.__init__")
    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_redirect_uri_uses_request_scheme(self, mock_get_config, mock_super_init):
        """Provider builds redirect_uri using request's scheme and host."""
        mock_get_config.return_value = VALID_CONFIG
        mock_super_init.return_value = None

        # Check the args passed to super().__init__
        provider = KeycloakOAuthProvider(_mock_request(host="my.plane.app", secure=True))
        call_args = mock_super_init.call_args
        redirect_uri = call_args[0][4]  # 5th positional arg
        assert redirect_uri == "https://my.plane.app/auth/keycloak/callback/"

    @patch("plane.authentication.provider.oauth.keycloak.OauthAdapter.__init__")
    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value")
    def test_redirect_uri_http_when_not_secure(self, mock_get_config, mock_super_init):
        """Provider uses http scheme when request is not secure."""
        mock_get_config.return_value = VALID_CONFIG
        mock_super_init.return_value = None

        provider = KeycloakOAuthProvider(_mock_request(host="localhost:8000", secure=False))
        call_args = mock_super_init.call_args
        redirect_uri = call_args[0][4]
        assert redirect_uri == "http://localhost:8000/auth/keycloak/callback/"


@pytest.mark.unit
class TestKeycloakProviderTokenData:
    """Test set_token_data parsing."""

    @patch("plane.authentication.provider.oauth.keycloak.OauthAdapter.__init__", return_value=None)
    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value", return_value=VALID_CONFIG)
    def _create_provider(self, mock_get_config, mock_super_init):
        return KeycloakOAuthProvider(_mock_request())

    def test_set_token_data_parses_response(self):
        """set_token_data extracts access_token, refresh_token, and expiry times."""
        provider = self._create_provider()
        provider.code = "test-code"
        provider.client_id = "client-id"
        provider.client_secret = "client-secret"
        provider.redirect_uri = "https://app.plane.so/auth/keycloak/callback/"

        token_response = {
            "access_token": "access-123",
            "refresh_token": "refresh-456",
            "expires_in": 300,
            "refresh_expires_in": 1800,
            "id_token": "id-token-789",
        }

        with patch.object(provider, "get_user_token", return_value=token_response):
            with patch("plane.authentication.adapter.oauth.OauthAdapter.set_token_data") as mock_set:
                KeycloakOAuthProvider.set_token_data(provider)

                call_data = mock_set.call_args[0][0]
                assert call_data["access_token"] == "access-123"
                assert call_data["refresh_token"] == "refresh-456"
                assert call_data["id_token"] == "id-token-789"
                assert call_data["access_token_expired_at"] is not None
                assert call_data["refresh_token_expired_at"] is not None

    def test_set_token_data_handles_missing_expiry(self):
        """set_token_data returns None for expiry when not provided."""
        provider = self._create_provider()
        provider.code = "test-code"
        provider.client_id = "client-id"
        provider.client_secret = "client-secret"
        provider.redirect_uri = "https://app.plane.so/auth/keycloak/callback/"

        token_response = {
            "access_token": "access-123",
        }

        with patch.object(provider, "get_user_token", return_value=token_response):
            with patch("plane.authentication.adapter.oauth.OauthAdapter.set_token_data") as mock_set:
                KeycloakOAuthProvider.set_token_data(provider)

                call_data = mock_set.call_args[0][0]
                assert call_data["access_token"] == "access-123"
                assert call_data["access_token_expired_at"] is None
                assert call_data["refresh_token_expired_at"] is None


@pytest.mark.unit
class TestKeycloakProviderUserData:
    """Test set_user_data OIDC claim mapping."""

    @patch("plane.authentication.provider.oauth.keycloak.OauthAdapter.__init__", return_value=None)
    @patch("plane.authentication.provider.oauth.keycloak.get_configuration_value", return_value=VALID_CONFIG)
    def _create_provider(self, mock_get_config, mock_super_init):
        return KeycloakOAuthProvider(_mock_request())

    def test_set_user_data_maps_oidc_claims(self):
        """set_user_data maps Keycloak OIDC claims correctly."""
        provider = self._create_provider()

        userinfo = {
            "sub": "kc-user-123",
            "email": "user@example.com",
            "given_name": "John",
            "family_name": "Doe",
            "picture": "https://example.com/avatar.jpg",
        }

        with patch.object(provider, "get_user_response", return_value=userinfo):
            with patch("plane.authentication.adapter.oauth.OauthAdapter.set_user_data") as mock_set:
                KeycloakOAuthProvider.set_user_data(provider)

                call_data = mock_set.call_args[0][0]
                assert call_data["email"] == "user@example.com"
                assert call_data["user"]["provider_id"] == "kc-user-123"
                assert call_data["user"]["first_name"] == "John"
                assert call_data["user"]["last_name"] == "Doe"
                assert call_data["user"]["avatar"] == "https://example.com/avatar.jpg"
                assert call_data["user"]["is_password_autoset"] is True

    def test_set_user_data_falls_back_to_name(self):
        """set_user_data uses 'name' when 'given_name' is missing."""
        provider = self._create_provider()

        userinfo = {
            "sub": "kc-user-456",
            "email": "user2@example.com",
            "name": "Jane Smith",
        }

        with patch.object(provider, "get_user_response", return_value=userinfo):
            with patch("plane.authentication.adapter.oauth.OauthAdapter.set_user_data") as mock_set:
                KeycloakOAuthProvider.set_user_data(provider)

                call_data = mock_set.call_args[0][0]
                assert call_data["user"]["first_name"] == "Jane Smith"
                assert call_data["user"]["last_name"] == ""
                assert call_data["user"]["avatar"] is None
