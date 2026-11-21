# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.test import RequestFactory

from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES, AuthenticationException
from plane.authentication.provider.oauth.gitea import GiteaOAuthProvider
from plane.authentication.provider.oauth.github import GitHubOAuthProvider
from plane.authentication.provider.oauth.gitlab import GitLabOAuthProvider
from plane.authentication.provider.oauth.google import GoogleOAuthProvider

PROVIDERS = [
    ("GOOGLE", GoogleOAuthProvider),
    ("GITHUB", GitHubOAuthProvider),
    ("GITLAB", GitLabOAuthProvider),
    ("GITEA", GiteaOAuthProvider),
]


@pytest.mark.unit
@pytest.mark.parametrize("name,provider_class", PROVIDERS, ids=[p[0].lower() for p in PROVIDERS])
class TestOAuthProviderEnabledFlag:
    """A provider with credentials set is usable only while its IS_<PROVIDER>_ENABLED value is "1"."""

    @pytest.fixture(autouse=True)
    def _credentials(self, name, monkeypatch, settings):
        # Read the configuration from the environment instead of the database
        settings.SKIP_ENV_VAR = False
        monkeypatch.setenv(f"{name}_CLIENT_ID", "client-id")
        monkeypatch.setenv(f"{name}_CLIENT_SECRET", "client-secret")
        monkeypatch.setenv(f"{name}_HOST", "https://git.example.com")

    def test_disabled_provider_is_not_configured(self, name, provider_class, monkeypatch):
        monkeypatch.setenv(f"IS_{name}_ENABLED", "0")

        with pytest.raises(AuthenticationException) as exc_info:
            provider_class(request=RequestFactory().get("/"), state="state")

        assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES[f"{name}_NOT_CONFIGURED"]

    def test_enabled_provider_is_constructed(self, name, provider_class, monkeypatch):
        monkeypatch.setenv(f"IS_{name}_ENABLED", "1")

        provider = provider_class(request=RequestFactory().get("/"), state="state")

        assert provider.get_auth_url()
