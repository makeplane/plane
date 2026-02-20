# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for LDAPSignInEndpoint view.

All tests mock the LDAPProvider and Instance model so no real
LDAP server or database setup is required beyond Django test DB.
"""

import pytest
from unittest.mock import patch, MagicMock

from django.test import RequestFactory

from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.views.app.ldap import LDAPSignInEndpoint


INSTANCE_PATCH = "plane.authentication.views.app.ldap.Instance"
PROVIDER_PATCH = "plane.authentication.views.app.ldap.LDAPProvider"
LOGIN_PATCH = "plane.authentication.views.app.ldap.user_login"
REDIRECT_PATH_PATCH = "plane.authentication.views.app.ldap.get_redirection_path"
BASE_HOST_PATCH = "plane.authentication.views.app.ldap.base_host"
SAFE_URL_PATCH = "plane.authentication.views.app.ldap.get_safe_redirect_url"


def _post_request(data=None):
    """Build a POST request via Django RequestFactory."""
    factory = RequestFactory()
    return factory.post("/auth/ldap/sign-in/", data=data or {})


@pytest.mark.unit
class TestLDAPSignInEndpointInstanceCheck:
    """Instance configuration guard."""

    def test_redirect_when_instance_not_configured(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "jdoe", "password": "secret"})
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5000"),
        ):
            mock_instance_cls.objects.first.return_value = None
            response = view.post(request)
        assert response.status_code == 302
        assert "5000" in response.url  # INSTANCE_NOT_CONFIGURED

    def test_redirect_when_setup_not_done(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "jdoe", "password": "secret"})
        mock_instance = MagicMock(is_setup_done=False)
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5000"),
        ):
            mock_instance_cls.objects.first.return_value = mock_instance
            response = view.post(request)
        assert response.status_code == 302
        assert "5000" in response.url


@pytest.mark.unit
class TestLDAPSignInEndpointValidation:
    """Input validation tests."""

    def _configured_instance(self):
        return MagicMock(is_setup_done=True)

    def test_redirect_when_username_missing(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"password": "secret"})
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5201"),
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            response = view.post(request)
        assert response.status_code == 302
        assert "5201" in response.url  # LDAP_AUTHENTICATION_FAILED

    def test_redirect_when_password_missing(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "jdoe"})
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5201"),
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            response = view.post(request)
        assert response.status_code == 302
        assert "5201" in response.url

    def test_redirect_when_both_fields_empty(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "", "password": ""})
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5201"),
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            response = view.post(request)
        assert response.status_code == 302
        assert "5201" in response.url

    def test_username_whitespace_only_treated_as_empty(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "   ", "password": "secret"})
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5201"),
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            response = view.post(request)
        assert response.status_code == 302
        assert "5201" in response.url


@pytest.mark.unit
class TestLDAPSignInEndpointAuth:
    """Authentication flow tests."""

    def _configured_instance(self):
        return MagicMock(is_setup_done=True)

    def test_successful_login_redirects(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "jdoe", "password": "secret"})
        mock_user = MagicMock()
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(PROVIDER_PATCH) as mock_provider_cls,
            patch(LOGIN_PATCH) as mock_login,
            patch(REDIRECT_PATH_PATCH, return_value="/dashboard/"),
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/dashboard/"),
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            mock_provider_cls.return_value.authenticate.return_value = mock_user
            response = view.post(request)
        assert response.status_code == 302
        assert "dashboard" in response.url
        mock_login.assert_called_once()

    def test_next_path_used_when_provided(self):
        view = LDAPSignInEndpoint()
        request = _post_request({
            "username": "jdoe",
            "password": "secret",
            "next_path": "/projects/abc/",
        })
        mock_user = MagicMock()
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(PROVIDER_PATCH) as mock_provider_cls,
            patch(LOGIN_PATCH),
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/projects/abc/") as mock_safe,
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            mock_provider_cls.return_value.authenticate.return_value = mock_user
            response = view.post(request)
        # Verify next_path was passed through
        call_kwargs = mock_safe.call_args
        assert call_kwargs[1].get("next_path") == "/projects/abc/" or \
            (call_kwargs[0] if call_kwargs[0] else None)
        assert response.status_code == 302

    def test_provider_exception_redirects_with_error(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "jdoe", "password": "wrong"})
        auth_exc = AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"],
            error_message="LDAP_AUTHENTICATION_FAILED",
        )
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(PROVIDER_PATCH) as mock_provider_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5201"),
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            mock_provider_cls.return_value.authenticate.side_effect = auth_exc
            response = view.post(request)
        assert response.status_code == 302
        assert "5201" in response.url

    def test_ldap_not_configured_error_from_provider(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "jdoe", "password": "secret"})
        auth_exc = AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["LDAP_NOT_CONFIGURED"],
            error_message="LDAP_NOT_CONFIGURED",
        )
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(PROVIDER_PATCH) as mock_provider_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5200"),
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            mock_provider_cls.side_effect = auth_exc
            response = view.post(request)
        assert response.status_code == 302
        assert "5200" in response.url

    def test_server_unreachable_error(self):
        view = LDAPSignInEndpoint()
        request = _post_request({"username": "jdoe", "password": "secret"})
        auth_exc = AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["LDAP_SERVER_UNREACHABLE"],
            error_message="LDAP_SERVER_UNREACHABLE",
        )
        with (
            patch(INSTANCE_PATCH) as mock_instance_cls,
            patch(PROVIDER_PATCH) as mock_provider_cls,
            patch(BASE_HOST_PATCH, return_value="http://localhost"),
            patch(SAFE_URL_PATCH, return_value="http://localhost/?error_code=5202"),
        ):
            mock_instance_cls.objects.first.return_value = self._configured_instance()
            mock_provider_cls.side_effect = auth_exc
            response = view.post(request)
        assert response.status_code == 302
        assert "5202" in response.url
