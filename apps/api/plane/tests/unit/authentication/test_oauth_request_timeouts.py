# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch

import pytest
import requests

from plane.authentication.adapter.error import AuthenticationException
from plane.authentication.adapter.oauth import OAUTH_REQUEST_TIMEOUT, OauthAdapter
from plane.authentication.provider.oauth.gitea import GiteaOAuthProvider
from plane.authentication.provider.oauth.github import GitHubOAuthProvider


def _oauth_adapter():
    return OauthAdapter(
        request=MagicMock(),
        provider="gitea",
        client_id="client-id",
        scope="read:user",
        redirect_uri="https://plane.example.com/auth/gitea/callback/",
        auth_url="https://git.example.com/login/oauth/authorize",
        token_url="https://git.example.com/login/oauth/access_token",
        userinfo_url="https://git.example.com/api/v1/user",
        client_secret="client-secret",
        code="code",
    )


def _github_provider(organization_id="plane-org"):
    with patch(
        "plane.authentication.provider.oauth.github.get_configuration_value",
        return_value=("client-id", "client-secret", organization_id),
    ):
        provider = GitHubOAuthProvider(request=MagicMock(), code="code")
    provider.token_data = {"access_token": "token"}
    return provider


def _gitea_provider():
    with patch(
        "plane.authentication.provider.oauth.gitea.get_configuration_value",
        return_value=("client-id", "client-secret", "https://git.example.com"),
    ):
        return GiteaOAuthProvider(request=MagicMock(), code="code")


@pytest.mark.unit
class TestOAuthAdapterRequestTimeouts:
    @patch("plane.authentication.adapter.oauth.requests.post")
    def test_token_request_has_timeout(self, mock_post):
        mock_post.return_value = MagicMock(json=MagicMock(return_value={"access_token": "token"}))
        _oauth_adapter().get_user_token(data={"code": "code"})
        assert mock_post.call_args.kwargs["timeout"] == OAUTH_REQUEST_TIMEOUT

    @patch("plane.authentication.adapter.oauth.requests.get")
    def test_user_info_request_has_timeout(self, mock_get):
        mock_get.return_value = MagicMock(json=MagicMock(return_value={"id": 1}))
        adapter = _oauth_adapter()
        adapter.token_data = {"access_token": "token"}
        adapter.get_user_response()
        assert mock_get.call_args.kwargs["timeout"] == OAUTH_REQUEST_TIMEOUT

    @patch("plane.authentication.adapter.oauth.requests.post", side_effect=requests.Timeout)
    def test_token_request_timeout_raises_authentication_exception(self, _mock_post):
        with pytest.raises(AuthenticationException):
            _oauth_adapter().get_user_token(data={"code": "code"})

    @patch("plane.authentication.adapter.oauth.requests.get", side_effect=requests.Timeout)
    def test_user_info_request_timeout_raises_authentication_exception(self, _mock_get):
        adapter = _oauth_adapter()
        adapter.token_data = {"access_token": "token"}
        with pytest.raises(AuthenticationException):
            adapter.get_user_response()


@pytest.mark.unit
class TestGitHubRequestTimeouts:
    @patch("plane.authentication.provider.oauth.github.requests.get")
    def test_organization_check_has_timeout(self, mock_get):
        mock_get.return_value = MagicMock(status_code=200)
        assert _github_provider().is_user_in_organization("octocat") is True
        assert mock_get.call_args.kwargs["timeout"] == OAUTH_REQUEST_TIMEOUT

    @patch("plane.authentication.provider.oauth.github.requests.get", side_effect=requests.Timeout)
    def test_organization_check_timeout_raises_authentication_exception(self, _mock_get):
        with pytest.raises(AuthenticationException):
            _github_provider().is_user_in_organization("octocat")

    @patch("plane.authentication.provider.oauth.github.requests.get", side_effect=requests.ConnectionError)
    def test_organization_check_connection_error_raises_authentication_exception(self, _mock_get):
        with pytest.raises(AuthenticationException):
            _github_provider().is_user_in_organization("octocat")

    @patch("plane.authentication.provider.oauth.github.requests.get")
    def test_email_request_has_timeout(self, mock_get):
        mock_get.return_value = MagicMock(
            json=MagicMock(return_value=[{"email": "a@example.com", "primary": True, "verified": True}])
        )
        provider = _github_provider()
        assert provider._GitHubOAuthProvider__get_email(headers={}) == "a@example.com"
        assert mock_get.call_args.kwargs["timeout"] == OAUTH_REQUEST_TIMEOUT

    @patch("plane.authentication.provider.oauth.github.requests.get", side_effect=requests.Timeout)
    def test_email_request_timeout_raises_authentication_exception(self, _mock_get):
        with pytest.raises(AuthenticationException):
            _github_provider()._GitHubOAuthProvider__get_email(headers={})


@pytest.mark.unit
class TestGiteaRequestTimeouts:
    @patch("plane.authentication.provider.oauth.gitea.requests.get")
    def test_email_request_has_timeout(self, mock_get):
        mock_get.return_value = MagicMock(
            ok=True,
            json=MagicMock(return_value=[{"email": "a@example.com", "primary": True, "verified": True}]),
        )
        assert _gitea_provider()._GiteaOAuthProvider__get_email(headers={}) == "a@example.com"
        assert mock_get.call_args.kwargs["timeout"] == OAUTH_REQUEST_TIMEOUT

    @patch("plane.authentication.provider.oauth.gitea.requests.get", side_effect=requests.Timeout)
    def test_email_request_timeout_raises_authentication_exception(self, _mock_get):
        with pytest.raises(AuthenticationException):
            _gitea_provider()._GiteaOAuthProvider__get_email(headers={})
