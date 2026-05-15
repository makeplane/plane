# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command

from plane.license.models import InstanceConfiguration


@pytest.mark.unit
class TestConfigureInstanceOAuthSeeding:
    """Test that configure_instance seeds IS_*_ENABLED flags individually."""

    @pytest.mark.django_db
    def test_creates_all_enabled_flags_when_none_exist(self):
        """All four IS_*_ENABLED flags should be created on a fresh database."""
        out = StringIO()
        with patch.dict("os.environ", {"SECRET_KEY": "test-secret"}):
            call_command("configure_instance", stdout=out)

        keys = [
            "IS_GOOGLE_ENABLED",
            "IS_GITHUB_ENABLED",
            "IS_GITLAB_ENABLED",
            "IS_GITEA_ENABLED",
        ]
        for key in keys:
            assert InstanceConfiguration.objects.filter(key=key).exists(), (
                f"{key} should have been created"
            )

    @pytest.mark.django_db
    def test_creates_missing_flags_when_some_already_exist(self):
        """Missing IS_*_ENABLED flags should be created even if others already exist.

        Each flag uses get_or_create so the presence of one should never
        prevent creation of the others.
        """
        InstanceConfiguration.objects.create(
            key="IS_GITHUB_ENABLED",
            value="1",
            category="AUTHENTICATION",
            is_encrypted=False,
        )
        InstanceConfiguration.objects.create(
            key="IS_GITEA_ENABLED",
            value="0",
            category="AUTHENTICATION",
            is_encrypted=False,
        )

        out = StringIO()
        with patch.dict("os.environ", {"SECRET_KEY": "test-secret"}):
            call_command("configure_instance", stdout=out)

        for key in ["IS_GOOGLE_ENABLED", "IS_GITLAB_ENABLED"]:
            assert InstanceConfiguration.objects.filter(key=key).exists(), (
                f"{key} should have been created even though other IS_*_ENABLED flags already existed"
            )

    @pytest.mark.django_db
    def test_does_not_overwrite_existing_enabled_flags(self):
        """Existing IS_*_ENABLED values should not be overwritten on re-run."""
        InstanceConfiguration.objects.create(
            key="IS_GITHUB_ENABLED",
            value="1",
            category="AUTHENTICATION",
            is_encrypted=False,
        )

        out = StringIO()
        with patch.dict("os.environ", {"SECRET_KEY": "test-secret"}):
            call_command("configure_instance", stdout=out)

        config = InstanceConfiguration.objects.get(key="IS_GITHUB_ENABLED")
        assert config.value == "1", "Existing IS_GITHUB_ENABLED=1 should not be overwritten"

    @pytest.mark.django_db
    def test_enabled_flags_default_to_zero_without_credentials(self):
        """Without OAuth env vars, IS_*_ENABLED flags should default to '0'."""
        out = StringIO()
        env = {
            "SECRET_KEY": "test-secret",
            "GITHUB_CLIENT_ID": "",
            "GITHUB_CLIENT_SECRET": "",
            "GOOGLE_CLIENT_ID": "",
            "GOOGLE_CLIENT_SECRET": "",
            "GITLAB_HOST": "",
            "GITLAB_CLIENT_ID": "",
            "GITLAB_CLIENT_SECRET": "",
            "GITEA_HOST": "",
            "GITEA_CLIENT_ID": "",
            "GITEA_CLIENT_SECRET": "",
        }
        with patch.dict("os.environ", env):
            call_command("configure_instance", stdout=out)

        for key in ["IS_GOOGLE_ENABLED", "IS_GITHUB_ENABLED", "IS_GITLAB_ENABLED", "IS_GITEA_ENABLED"]:
            config = InstanceConfiguration.objects.get(key=key)
            assert config.value == "0", f"{key} should be '0' without credentials"

    @pytest.mark.django_db
    def test_all_enabled_flags_use_authentication_category(self):
        """All IS_*_ENABLED flags should be created with category AUTHENTICATION."""
        out = StringIO()
        with patch.dict("os.environ", {"SECRET_KEY": "test-secret"}):
            call_command("configure_instance", stdout=out)

        for key in ["IS_GOOGLE_ENABLED", "IS_GITHUB_ENABLED", "IS_GITLAB_ENABLED", "IS_GITEA_ENABLED"]:
            config = InstanceConfiguration.objects.get(key=key)
            assert config.category == "AUTHENTICATION", (
                f"{key} should have category AUTHENTICATION, got {config.category}"
            )
