# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.utils import timezone

from plane.license.models import Instance
from plane.license.utils import capabilities
from plane.license.utils.capabilities import InstanceCapabilityService


SECRET_VALUES = ["llm-secret", "smtp-secret", "s3-secret", "oauth-secret", "s3-access-key"]


def _assert_no_secret(value):
    serialized = str(value)
    for secret in SECRET_VALUES:
        assert secret not in serialized


@pytest.mark.unit
class TestInstanceCapabilityService:
    def test_ai_not_configured_without_api_key(self, monkeypatch):
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda _keys: ("", "openai", "gpt-4o-mini"))

        state = InstanceCapabilityService()._ai()

        assert state == {"available": True, "enabled": True, "configured": False, "ready": False}

    def test_ai_configured_with_supported_provider_model(self, monkeypatch):
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda _keys: ("llm-secret", "openai", "gpt-4o-mini"))

        state = InstanceCapabilityService()._ai()

        assert state == {"available": True, "enabled": True, "configured": True, "ready": True}
        _assert_no_secret(state)

    def test_ai_not_configured_with_invalid_provider(self, monkeypatch):
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda _keys: ("llm-secret", "unknown", "gpt-4o-mini"))

        state = InstanceCapabilityService()._ai()

        assert state["configured"] is False
        assert state["ready"] is False

    def test_ai_not_ready_with_unsupported_model(self, monkeypatch):
        monkeypatch.setattr(
            capabilities, "get_configuration_value", lambda _keys: ("llm-secret", "openai", "not-a-supported-model")
        )

        state = InstanceCapabilityService()._ai()

        assert state["configured"] is False
        assert state["ready"] is False
        _assert_no_secret(state)

    def test_smtp_disabled_when_configuration_absent(self, monkeypatch):
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda _keys: ("0", "", "587", ""))

        state = InstanceCapabilityService()._smtp()

        assert state == {"available": True, "enabled": False, "configured": False, "ready": False}

    def test_smtp_ready_when_enabled_and_configured(self, monkeypatch):
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda _keys: ("1", "smtp.local", "587", "Plane <noreply.local>"))

        state = InstanceCapabilityService()._smtp()

        assert state == {"available": True, "enabled": True, "configured": True, "ready": True}
        _assert_no_secret(state)

    def test_object_storage_missing_configuration(self, settings, monkeypatch):
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", "")
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "")
        monkeypatch.setenv("AWS_S3_BUCKET_NAME", "")
        settings.AWS_ACCESS_KEY_ID = ""
        settings.AWS_SECRET_ACCESS_KEY = ""
        settings.AWS_STORAGE_BUCKET_NAME = ""

        state = InstanceCapabilityService()._object_storage()

        assert state == {"available": True, "configured": False, "ready": False}

    def test_object_storage_ready_with_configuration(self, settings, monkeypatch):
        monkeypatch.delenv("AWS_ACCESS_KEY_ID", raising=False)
        monkeypatch.delenv("AWS_SECRET_ACCESS_KEY", raising=False)
        monkeypatch.delenv("AWS_S3_BUCKET_NAME", raising=False)
        settings.AWS_ACCESS_KEY_ID = "s3-access-key"
        settings.AWS_SECRET_ACCESS_KEY = "s3-secret"
        settings.AWS_STORAGE_BUCKET_NAME = "uploads"

        state = InstanceCapabilityService()._object_storage()
        assert state == {"available": True, "configured": True, "ready": True}
        _assert_no_secret(state)

    def test_object_storage_not_ready_when_env_bucket_missing(self, settings, monkeypatch):
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", "s3-access-key")
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "s3-secret")
        monkeypatch.setenv("AWS_S3_BUCKET_NAME", "")
        settings.AWS_ACCESS_KEY_ID = "s3-access-key"
        settings.AWS_SECRET_ACCESS_KEY = "s3-secret"
        settings.AWS_STORAGE_BUCKET_NAME = "uploads"

        state = InstanceCapabilityService()._object_storage()

        assert state == {"available": True, "configured": False, "ready": False}
        _assert_no_secret(state)

    def test_oauth_no_configured_providers(self, monkeypatch):
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda keys: tuple(key["default"] for key in keys))

        state = InstanceCapabilityService()._oauth()

        assert state["available"] is True
        assert all(provider["configured"] is False for provider in state["providers"].values())
        assert all(provider["ready"] is False for provider in state["providers"].values())

    def test_oauth_one_configured_provider(self, monkeypatch):
        values = {
            "IS_GOOGLE_ENABLED": "1",
            "GOOGLE_CLIENT_ID": "google-client",
            "GOOGLE_CLIENT_SECRET": "oauth-secret",
        }
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda keys: tuple(values.get(key["key"], key["default"]) for key in keys))

        providers = InstanceCapabilityService()._oauth()["providers"]

        assert providers["google"] == {"available": True, "enabled": True, "configured": True, "ready": True}
        assert providers["github"]["configured"] is False
        _assert_no_secret(providers)

    def test_oauth_multiple_configured_providers(self, monkeypatch):
        values = {
            "IS_GOOGLE_ENABLED": "1",
            "GOOGLE_CLIENT_ID": "google-client",
            "GOOGLE_CLIENT_SECRET": "oauth-secret",
            "IS_GITEA_ENABLED": "1",
            "GITEA_CLIENT_ID": "gitea-client",
            "GITEA_CLIENT_SECRET": "oauth-secret",
            "GITEA_HOST": "https://gitea.example.com",
        }
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda keys: tuple(values.get(key["key"], key["default"]) for key in keys))

        providers = InstanceCapabilityService()._oauth()["providers"]

        assert providers["google"]["ready"] is True
        assert providers["gitea"]["ready"] is True
        assert providers["gitlab"]["ready"] is False
        _assert_no_secret(providers)

    def test_gitlab_ready_with_runtime_default_host(self, monkeypatch):
        values = {
            "IS_GITLAB_ENABLED": "1",
            "GITLAB_CLIENT_ID": "gitlab-client",
            "GITLAB_CLIENT_SECRET": "oauth-secret",
        }
        monkeypatch.setattr(
            capabilities, "get_configuration_value", lambda keys: tuple(values.get(key["key"], key["default"]) for key in keys)
        )

        providers = InstanceCapabilityService()._oauth()["providers"]

        assert providers["gitlab"] == {"available": True, "enabled": True, "configured": True, "ready": True}
        _assert_no_secret(providers)

    def test_gitea_not_ready_without_host(self, monkeypatch):
        values = {
            "IS_GITEA_ENABLED": "1",
            "GITEA_CLIENT_ID": "gitea-client",
            "GITEA_CLIENT_SECRET": "oauth-secret",
            "GITEA_HOST": "",
        }
        monkeypatch.setattr(
            capabilities, "get_configuration_value", lambda keys: tuple(values.get(key["key"], key["default"]) for key in keys)
        )

        providers = InstanceCapabilityService()._oauth()["providers"]

        assert providers["gitea"]["configured"] is False
        assert providers["gitea"]["ready"] is False
        _assert_no_secret(providers)

    def test_telemetry_enabled_and_disabled(self, db):
        instance = Instance.objects.create(
            instance_name="Plane",
            instance_id="instance-id",
            current_version="1.0.0",
            last_checked_at=timezone.now() - timedelta(days=1),
            is_telemetry_enabled=True,
        )

        assert InstanceCapabilityService()._telemetry() == {"available": True, "enabled": True}

        instance.is_telemetry_enabled = False
        instance.save()

        assert InstanceCapabilityService()._telemetry() == {"available": True, "enabled": False}

    def test_project_features_expose_implementation_only(self):
        state = InstanceCapabilityService()._project_features()

        assert state == {
            "cycles": {"available": True},
            "modules": {"available": True},
            "views": {"available": True},
            "pages": {"available": True},
            "intake": {"available": True},
        }

    def test_active_cycles_exposes_self_hosted_implementation_availability(self):
        assert InstanceCapabilityService()._active_cycles() == {"available": True, "enabled": True}
