# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.core.cache import cache
from django.utils import timezone

from plane.license.models import Instance
from plane.license.utils import capabilities


@pytest.mark.contract
class TestInstanceCapabilitiesEndpoint:
    def test_public_instance_endpoint_includes_sanitized_capabilities(self, api_client, db, monkeypatch, settings):
        cache.clear()
        Instance.objects.create(
            instance_name="Plane",
            instance_id="instance-id",
            current_version="1.0.0",
            last_checked_at=timezone.now() - timedelta(days=1),
            is_setup_done=True,
        )
        settings.AWS_ACCESS_KEY_ID = "s3-access-key"
        settings.AWS_SECRET_ACCESS_KEY = "s3-secret"
        settings.AWS_STORAGE_BUCKET_NAME = "uploads"
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", "s3-access-key")
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "s3-secret")
        monkeypatch.setenv("AWS_S3_BUCKET_NAME", "uploads")
        values = {
            "ENABLE_SIGNUP": "1",
            "DISABLE_WORKSPACE_CREATION": "0",
            "IS_GOOGLE_ENABLED": "1",
            "GOOGLE_CLIENT_ID": "google-client",
            "GOOGLE_CLIENT_SECRET": "oauth-secret",
            "IS_GITHUB_ENABLED": "0",
            "IS_GITLAB_ENABLED": "0",
            "IS_GITEA_ENABLED": "0",
            "EMAIL_HOST": "smtp.local",
            "ENABLE_SMTP": "1",
            "EMAIL_PORT": "587",
            "EMAIL_FROM": "Plane <noreply.local>",
            "ENABLE_MAGIC_LINK_LOGIN": "1",
            "ENABLE_EMAIL_PASSWORD": "1",
            "LLM_API_KEY": "llm-secret",
            "LLM_PROVIDER": "openai",
            "LLM_MODEL": "gpt-4o-mini",
        }
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda keys: tuple(values.get(key["key"], key["default"]) for key in keys))

        response = api_client.get("/api/instances/")

        assert response.status_code == 200
        assert set(response.data["capabilities"].keys()) == {
            "ai",
            "smtp",
            "object_storage",
            "oauth",
            "telemetry",
            "public_projects",
            "active_cycles",
            "project_features",
            "policy",
        }
        assert response.data["capabilities"]["ai"]["ready"] is True
        assert response.data["config"]["has_llm_configured"] is True
        assert response.data["capabilities"]["smtp"]["ready"] is True
        assert response.data["capabilities"]["object_storage"]["ready"] is True
        assert response.data["capabilities"]["oauth"]["providers"]["google"]["ready"] is True
        assert response.data["capabilities"]["active_cycles"] == {"available": True, "enabled": True}
        assert response.data["capabilities"]["project_features"]["cycles"] == {"available": True}
        assert response.data["capabilities"]["policy"]["commercial_gating"] is False
        assert response.data["capabilities"]["policy"]["seat_limit"] is None
        assert "build_revision" in response.data["config"]
        assert isinstance(response.data["config"]["build_revision"], str)

        serialized = str(response.data)
        assert "llm-secret" not in serialized
        assert "s3-secret" not in serialized
        assert "s3-access-key" not in serialized
        assert "oauth-secret" not in serialized
        assert "smtp-secret" not in serialized

    def test_public_instance_endpoint_reports_partial_configuration(self, api_client, db, monkeypatch, settings):
        cache.clear()
        Instance.objects.create(
            instance_name="Plane",
            instance_id="instance-id",
            current_version="1.0.0",
            last_checked_at=timezone.now() - timedelta(days=1),
        )
        settings.AWS_ACCESS_KEY_ID = ""
        settings.AWS_SECRET_ACCESS_KEY = ""
        settings.AWS_STORAGE_BUCKET_NAME = "uploads"
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", "")
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "")
        monkeypatch.setenv("AWS_S3_BUCKET_NAME", "")
        values = {
            "ENABLE_SIGNUP": "1",
            "DISABLE_WORKSPACE_CREATION": "0",
            "IS_GOOGLE_ENABLED": "1",
            "GOOGLE_CLIENT_ID": "google-client",
            "GOOGLE_CLIENT_SECRET": "",
            "IS_GITHUB_ENABLED": "0",
            "IS_GITLAB_ENABLED": "0",
            "IS_GITEA_ENABLED": "0",
            "EMAIL_HOST": "smtp.local",
            "ENABLE_SMTP": "0",
            "EMAIL_PORT": "587",
            "EMAIL_FROM": "",
            "ENABLE_MAGIC_LINK_LOGIN": "1",
            "ENABLE_EMAIL_PASSWORD": "1",
            "LLM_API_KEY": "",
            "LLM_PROVIDER": "openai",
            "LLM_MODEL": "gpt-4o-mini",
        }
        monkeypatch.setattr(capabilities, "get_configuration_value", lambda keys: tuple(values.get(key["key"], key["default"]) for key in keys))

        response = api_client.get("/api/instances/")

        assert response.status_code == 200
        assert response.data["capabilities"]["ai"]["ready"] is False
        assert response.data["config"]["has_llm_configured"] is False
        assert response.data["capabilities"]["smtp"] == {
            "available": True,
            "enabled": False,
            "configured": False,
            "ready": False,
        }
        assert response.data["capabilities"]["object_storage"]["ready"] is False
        assert response.data["capabilities"]["oauth"]["providers"]["google"] == {
            "available": True,
            "enabled": True,
            "configured": False,
            "ready": False,
        }

    def test_public_instance_endpoint_includes_capabilities_before_setup(self, api_client, db):
        cache.clear()

        response = api_client.get("/api/instances/")

        assert response.status_code == 200
        assert response.data["is_activated"] is False
        assert response.data["is_setup_done"] is False
        assert "capabilities" in response.data
        assert "build_revision" in response.data
        assert isinstance(response.data["build_revision"], str)

    def test_public_instance_endpoint_reports_build_revision(self, api_client, db, monkeypatch):
        cache.clear()
        Instance.objects.create(
            instance_name="Plane",
            instance_id="instance-id",
            current_version="1.0.0",
            last_checked_at=timezone.now() - timedelta(days=1),
            is_setup_done=True,
        )
        monkeypatch.setenv("PLANE_GIT_REVISION", "abc123def456")

        response = api_client.get("/api/instances/")

        assert response.status_code == 200
        assert response.data["config"]["build_revision"] == "abc123def456"
