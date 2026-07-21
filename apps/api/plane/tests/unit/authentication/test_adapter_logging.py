# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for credential hygiene in the authentication adapters.

The "plane.authentication" logger runs at INFO in production with a JSON
formatter that serializes `extra` fields, so anything handed to a log call on
this logger is written to the production log stream verbatim. These tests lock
in that secrets and PII never reach it:

- the provider access token is never logged when a userinfo request fails
- an invalid email address is never echoed back into the log message
- the GitHub organization id is not logged on a failed membership check

Each test asserts against the record's full `__dict__`, not just the formatted
message, because `extra` values land as record attributes and would otherwise
escape a message-only assertion.
"""

import logging
from unittest.mock import Mock, patch

import pytest
import requests

from plane.authentication.adapter.base import Adapter
from plane.authentication.adapter.error import AuthenticationException
from plane.authentication.adapter.oauth import OauthAdapter
from plane.authentication.provider.oauth.gitea import GiteaOAuthProvider
from plane.authentication.provider.oauth.github import GitHubOAuthProvider
from plane.authentication.provider.oauth.gitlab import GitLabOAuthProvider

ACCESS_TOKEN = "gho_supersecretaccesstoken"
ORGANIZATION_ID = "secret-org-id"


def fake_configuration(values):
    """
    Stands in for get_configuration_value, resolving by key rather than position.

    The providers read their client secret in a separate call from the rest of
    their settings, so a fixed return value would not survive. This resolves each
    requested key independently and returns them in the order asked for, matching
    the real implementation.
    """

    def _resolve(keys):
        return tuple(values.get(key["key"], key.get("default")) for key in keys)

    return _resolve


class _RecordCapture(logging.Handler):
    """Captures records straight off the logger, independent of propagation."""

    def __init__(self):
        super().__init__(level=logging.DEBUG)
        self.records = []

    def emit(self, record):
        self.records.append(record)

    def values(self):
        """Every value emitted across all records, message and `extra` alike."""
        emitted = []
        for record in self.records:
            emitted.append(record.getMessage())
            emitted.extend(str(value) for value in record.__dict__.values())
        return emitted


@pytest.fixture
def captured_logs():
    logger = logging.getLogger("plane.authentication")
    handler = _RecordCapture()
    previous_level = logger.level
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)
    try:
        yield handler
    finally:
        logger.removeHandler(handler)
        logger.setLevel(previous_level)


@pytest.fixture
def oauth_adapter():
    adapter = OauthAdapter(
        request=Mock(),
        provider="github",
        client_id="client-id",
        scope="read:user",
        redirect_uri="https://example.com/auth/github/callback/",
        auth_url="https://github.com/login/oauth/authorize",
        token_url="https://github.com/login/oauth/access_token",
        userinfo_url="https://api.github.com/user",
        client_secret="client-secret",
        code="oauth-code",
    )
    adapter.set_token_data({"access_token": ACCESS_TOKEN})
    return adapter


@pytest.mark.unit
class TestOauthAdapterLogging:
    def test_access_token_is_not_logged_when_userinfo_request_fails(self, oauth_adapter, captured_logs):
        response = Mock(status_code=401)
        with patch(
            "plane.authentication.adapter.oauth.requests.get",
            side_effect=requests.RequestException(response=response),
        ):
            with pytest.raises(AuthenticationException):
                oauth_adapter.get_user_response()

        assert captured_logs.records, "expected the failure to be logged"
        for value in captured_logs.values():
            assert ACCESS_TOKEN not in value
            assert "Bearer" not in value

    def test_provider_and_status_code_replace_the_headers_diagnostic(self, oauth_adapter, captured_logs):
        response = Mock(status_code=401)
        with patch(
            "plane.authentication.adapter.oauth.requests.get",
            side_effect=requests.RequestException(response=response),
        ):
            with pytest.raises(AuthenticationException):
                oauth_adapter.get_user_response()

        record = captured_logs.records[-1]
        assert record.provider == "github"
        assert record.status_code == 401

    def test_status_code_is_none_when_the_request_never_got_a_response(self, oauth_adapter, captured_logs):
        with patch(
            "plane.authentication.adapter.oauth.requests.get",
            side_effect=requests.ConnectionError(),
        ):
            with pytest.raises(AuthenticationException):
                oauth_adapter.get_user_response()

        record = captured_logs.records[-1]
        assert record.status_code is None


@pytest.mark.unit
class TestSanitizeEmailLogging:
    INVALID_EMAIL = "not-an-email-address"

    def test_invalid_email_is_not_echoed_into_the_log(self, captured_logs):
        adapter = Adapter(request=Mock(), provider="github")

        with pytest.raises(AuthenticationException):
            adapter.sanitize_email(self.INVALID_EMAIL)

        assert captured_logs.records, "expected the invalid email to be logged"
        for value in captured_logs.values():
            assert self.INVALID_EMAIL not in value

    def test_provider_replaces_the_email_diagnostic(self, captured_logs):
        adapter = Adapter(request=Mock(), provider="github")

        with pytest.raises(AuthenticationException):
            adapter.sanitize_email(self.INVALID_EMAIL)

        assert captured_logs.records[-1].provider == "github"

    def test_the_email_still_reaches_the_caller_through_the_exception_payload(self):
        adapter = Adapter(request=Mock(), provider="github")

        with pytest.raises(AuthenticationException) as exc_info:
            adapter.sanitize_email(self.INVALID_EMAIL)

        assert exc_info.value.payload == {"email": self.INVALID_EMAIL}


@pytest.mark.unit
class TestGitHubOrganizationLogging:
    @pytest.fixture
    def github_provider(self):
        request = Mock()
        request.is_secure.return_value = True
        request.get_host.return_value = "example.com"
        with patch(
            "plane.authentication.provider.oauth.github.get_configuration_value",
            side_effect=fake_configuration({
                "GITHUB_CLIENT_ID": "client-id",
                "GITHUB_CLIENT_SECRET": "client-secret",
                "GITHUB_ORGANIZATION_ID": ORGANIZATION_ID,
            }),
        ):
            provider = GitHubOAuthProvider(request=request, code="oauth-code", state="state")
        # GitHubOAuthProvider.set_token_data() takes no arguments - it fetches the
        # token itself - so seed the attribute the adapter reads back.
        provider.token_data = {"access_token": ACCESS_TOKEN}
        return provider

    def test_organization_id_is_not_logged_when_membership_check_fails(self, github_provider, captured_logs):
        with (
            patch.object(github_provider, "get_user_response", return_value={"login": "octocat", "id": 1}),
            patch.object(github_provider, "is_user_in_organization", return_value=False),
        ):
            with pytest.raises(AuthenticationException):
                github_provider.set_user_data()

        assert captured_logs.records, "expected the rejected membership to be logged"
        for value in captured_logs.values():
            assert ORGANIZATION_ID not in value

    def test_user_login_is_retained_as_the_diagnostic(self, github_provider, captured_logs):
        with (
            patch.object(github_provider, "get_user_response", return_value={"login": "octocat", "id": 1}),
            patch.object(github_provider, "is_user_in_organization", return_value=False),
        ):
            with pytest.raises(AuthenticationException):
                github_provider.set_user_data()

        assert captured_logs.records[-1].user_login == "octocat"

    def test_email_is_not_logged_on_the_success_path(self, github_provider, captured_logs):
        email = "octocat@example.com"
        with (
            patch.object(github_provider, "get_user_response", return_value={"login": "octocat", "id": 1}),
            patch.object(github_provider, "is_user_in_organization", return_value=True),
            patch.object(GitHubOAuthProvider, "_GitHubOAuthProvider__get_email", return_value=email),
        ):
            github_provider.set_user_data()

        assert github_provider.user_data["email"] == email
        for value in captured_logs.values():
            assert email not in value


@pytest.mark.unit
class TestSplitConfigurationReads:
    """
    The providers read their client secret in a call of its own, separate from
    their non-secret settings, so that the secret is not returned in a tuple
    alongside values that go on to build request URLs.

    These tests assert the split is purely structural: every provider must end up
    with exactly the same configuration it had when the values arrived together.
    """

    def _request(self):
        request = Mock()
        request.is_secure.return_value = True
        request.get_host.return_value = "example.com"
        return request

    def test_github_still_resolves_every_setting(self):
        with patch(
            "plane.authentication.provider.oauth.github.get_configuration_value",
            side_effect=fake_configuration({
                "GITHUB_CLIENT_ID": "gh-client-id",
                "GITHUB_CLIENT_SECRET": "gh-client-secret",
                "GITHUB_ORGANIZATION_ID": "gh-org",
            }),
        ):
            provider = GitHubOAuthProvider(request=self._request(), code="code", state="state")

        assert provider.client_id == "gh-client-id"
        assert provider.client_secret == "gh-client-secret"
        assert provider.organization_id == "gh-org"

    def test_gitea_still_resolves_every_setting_and_builds_urls_from_the_host(self):
        with patch(
            "plane.authentication.provider.oauth.gitea.get_configuration_value",
            side_effect=fake_configuration({
                "GITEA_CLIENT_ID": "gitea-client-id",
                "GITEA_CLIENT_SECRET": "gitea-client-secret",
                "GITEA_HOST": "https://gitea.example.com/",
            }),
        ):
            provider = GiteaOAuthProvider(request=self._request(), code="code", state="state")

        assert provider.client_id == "gitea-client-id"
        assert provider.client_secret == "gitea-client-secret"
        # trailing slash is still normalised away before the URLs are built
        assert provider.userinfo_url == "https://gitea.example.com/api/v1/user"
        assert provider.token_url == "https://gitea.example.com/login/oauth/access_token"

    def test_gitlab_still_resolves_every_setting_and_builds_urls_from_the_host(self):
        with patch(
            "plane.authentication.provider.oauth.gitlab.get_configuration_value",
            side_effect=fake_configuration({
                "GITLAB_CLIENT_ID": "gitlab-client-id",
                "GITLAB_CLIENT_SECRET": "gitlab-client-secret",
                "GITLAB_HOST": "https://gitlab.example.com",
            }),
        ):
            provider = GitLabOAuthProvider(request=self._request(), code="code", state="state")

        assert provider.client_id == "gitlab-client-id"
        assert provider.client_secret == "gitlab-client-secret"
        assert provider.userinfo_url == "https://gitlab.example.com/api/v4/user"
        assert provider.token_url == "https://gitlab.example.com/oauth/token"

    @pytest.mark.parametrize(
        ("module", "provider_class", "missing_key"),
        [
            ("github", GitHubOAuthProvider, "GITHUB_CLIENT_SECRET"),
            ("gitea", GiteaOAuthProvider, "GITEA_CLIENT_SECRET"),
            ("gitlab", GitLabOAuthProvider, "GITLAB_CLIENT_SECRET"),
        ],
    )
    def test_missing_client_secret_is_still_rejected(self, module, provider_class, missing_key):
        """The not-configured guard must still fire now that the secret arrives separately."""
        settings = {
            "GITHUB_CLIENT_ID": "id",
            "GITHUB_CLIENT_SECRET": "secret",
            "GITHUB_ORGANIZATION_ID": "",
            "GITEA_CLIENT_ID": "id",
            "GITEA_CLIENT_SECRET": "secret",
            "GITEA_HOST": "https://gitea.example.com",
            "GITLAB_CLIENT_ID": "id",
            "GITLAB_CLIENT_SECRET": "secret",
            "GITLAB_HOST": "https://gitlab.example.com",
        }
        settings[missing_key] = ""

        with patch(
            f"plane.authentication.provider.oauth.{module}.get_configuration_value",
            side_effect=fake_configuration(settings),
        ):
            with pytest.raises(AuthenticationException):
                provider_class(request=self._request(), code="code", state="state")
