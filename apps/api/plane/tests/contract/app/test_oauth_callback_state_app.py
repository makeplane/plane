# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch
from urllib.parse import urlparse

import pytest
from django.test import Client
from django.urls import reverse

CALLBACKS = [
    ("github-callback", "plane.authentication.views.app.github.GitHubOAuthProvider"),
    ("gitlab-callback", "plane.authentication.views.app.gitlab.GitLabOAuthProvider"),
    ("google-callback", "plane.authentication.views.app.google.GoogleOAuthProvider"),
    ("gitea-callback", "plane.authentication.views.app.gitea.GiteaOAuthProvider"),
    ("space-gitea-callback", "plane.authentication.views.space.gitea.GiteaOAuthProvider"),
]


def _client(session_state=None):
    client = Client()
    session = client.session
    session["host"] = "http://localhost"
    if session_state is not None:
        session["state"] = session_state
    session.save()
    return client


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("url_name,provider_path", CALLBACKS, ids=[c[0] for c in CALLBACKS])
class TestOAuthCallbackState:
    """The OAuth callback proceeds only when the state matches the non-empty one stored in the session."""

    @pytest.mark.parametrize("state_param", [None, ""], ids=["no-state-param", "empty-state-param"])
    def test_refused_without_session_state(self, url_name, provider_path, state_param):
        params = {"code": "oauth-code"}
        if state_param is not None:
            params["state"] = state_param
        client = _client()

        with patch(provider_path) as provider:
            response = client.get(reverse(url_name), params)

        assert response.status_code == 302
        assert "error_code" in response.url
        provider.assert_not_called()
        assert "_auth_user_id" not in client.session

    def test_refused_on_mismatched_state(self, url_name, provider_path):
        client = _client(session_state="expected-state")

        with patch(provider_path) as provider:
            response = client.get(reverse(url_name), {"code": "oauth-code", "state": "other-state"})

        assert response.status_code == 302
        assert "error_code" in response.url
        provider.assert_not_called()
        assert "_auth_user_id" not in client.session

    def test_mismatched_state_keeps_pending_state(self, url_name, provider_path, create_user):
        client = _client(session_state="expected-state")

        with patch(provider_path) as provider:
            response = client.get(reverse(url_name), {"code": "oauth-code", "state": "other-state"})

        assert "error_code" in response.url
        provider.assert_not_called()

        with patch(provider_path) as provider:
            provider.return_value.authenticate.return_value = create_user
            response = client.get(reverse(url_name), {"code": "oauth-code", "state": "expected-state"})

        assert "error_code" not in response.url
        assert client.session["_auth_user_id"] == str(create_user.id)

    def test_matching_state_logs_in_once(self, url_name, provider_path, create_user):
        client = _client(session_state="expected-state")
        params = {"code": "oauth-code", "state": "expected-state"}

        with patch(provider_path) as provider:
            provider.return_value.authenticate.return_value = create_user
            response = client.get(reverse(url_name), params)

        assert response.status_code == 302
        assert "error_code" not in response.url
        assert provider.call_args.kwargs["code"] == "oauth-code"
        assert client.session["_auth_user_id"] == str(create_user.id)
        assert "state" not in client.session

        # The stored state is single-use.
        with patch(provider_path) as provider:
            response = client.get(reverse(url_name), params)

        assert "error_code" in response.url
        provider.assert_not_called()


APP_CALLBACKS = ["github-callback", "gitlab-callback", "google-callback", "gitea-callback"]


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("url_name", APP_CALLBACKS)
def test_refused_without_session_redirects_to_app_host(url_name, settings):
    settings.APP_BASE_URL = "http://app.example.com"

    response = Client().get(reverse(url_name), {"code": "oauth-code", "state": "some-state"})

    assert response.status_code == 302
    location = urlparse(response.url)
    assert (location.scheme, location.netloc) == ("http", "app.example.com")
    assert "error_code" in response.url
