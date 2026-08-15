# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""P8A configuration-dependent activation contract tests.

These tests prove existing AI/SMTP/storage/OAuth capability state matches
callable runtime behavior, without live provider, SMTP, or object-store calls.
"""

import uuid
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, Workspace, WorkspaceMember
from plane.license.models import Instance


def _unique(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _create_user(email):
    user = User.objects.create(email=email, username=_unique("user"), first_name="Member", last_name="User")
    user.set_password("member@123")
    user.save()
    return user


def _create_workspace_project(owner):
    workspace = Workspace.objects.create(name="Config workspace", owner=owner, slug=_unique("cfg"))
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    project = Project.objects.create(
        name="Config project",
        identifier="CFG",
        workspace=workspace,
        created_by=owner,
    )
    ProjectMember.objects.create(project=project, member=owner, role=20, is_active=True)
    return workspace, project


def _create_instance():
    return Instance.objects.create(
        instance_name="Plane",
        instance_id=str(uuid.uuid4()),
        current_version="1.0.0",
        last_checked_at=timezone.now(),
        is_setup_done=True,
    )


@pytest.mark.contract
class TestAIAssistantRuntimeMatchesReadiness:
    def test_unconfigured_ai_returns_400_without_provider_call(self, db):
        owner = _create_user(_unique("owner") + "@plane.so")
        workspace, project = _create_workspace_project(owner)
        client = APIClient()
        client.force_authenticate(user=owner)

        with (
            patch("plane.app.views.external.base.get_llm_config", return_value=(None, None, None)),
            patch("plane.app.views.external.base.get_llm_response") as llm_call,
        ):
            response = client.post(
                f"/api/workspaces/{workspace.slug}/projects/{project.id}/ai-assistant/",
                {"task": "summarize", "prompt": "hello"},
                format="json",
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "LLM provider API key and model are required"
        llm_call.assert_not_called()

    def test_configured_ai_returns_completion_without_live_provider_call(self, db):
        owner = _create_user(_unique("owner") + "@plane.so")
        workspace, project = _create_workspace_project(owner)
        client = APIClient()
        client.force_authenticate(user=owner)

        with (
            patch(
                "plane.app.views.external.base.get_llm_config",
                return_value=("llm-secret", "gpt-4o-mini", "openai"),
            ),
            patch(
                "plane.app.views.external.base.get_llm_response",
                return_value=("generated text", None),
            ) as llm_call,
        ):
            response = client.post(
                f"/api/workspaces/{workspace.slug}/projects/{project.id}/ai-assistant/",
                {"task": "summarize", "prompt": "hello"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["response"] == "generated text"
        assert "llm-secret" not in str(response.data)
        llm_call.assert_called_once()

    def test_guest_cannot_call_ai_assistant(self, db):
        owner = _create_user(_unique("owner") + "@plane.so")
        guest = _create_user(_unique("guest") + "@plane.so")
        workspace, project = _create_workspace_project(owner)
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
        ProjectMember.objects.create(project=project, member=guest, role=5, is_active=True)
        client = APIClient()
        client.force_authenticate(user=guest)

        with patch("plane.app.views.external.base.get_llm_response") as llm_call:
            response = client.post(
                f"/api/workspaces/{workspace.slug}/projects/{project.id}/ai-assistant/",
                {"task": "summarize", "prompt": "hello"},
                format="json",
            )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        llm_call.assert_not_called()


@pytest.mark.contract
class TestPublicCapabilityResponseHasNoSecrets:
    def test_instance_capabilities_omit_credentials_and_paid_requirement(self, db, monkeypatch, settings):
        cache.clear()
        _create_instance()
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", "s3-access-key")
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "s3-secret")
        monkeypatch.setenv("AWS_S3_BUCKET_NAME", "uploads")
        settings.AWS_ACCESS_KEY_ID = "s3-access-key"
        settings.AWS_SECRET_ACCESS_KEY = "s3-secret"
        settings.AWS_STORAGE_BUCKET_NAME = "uploads"

        from plane.license.utils import capabilities

        values = {
            "IS_GOOGLE_ENABLED": "1",
            "GOOGLE_CLIENT_ID": "google-client",
            "GOOGLE_CLIENT_SECRET": "oauth-secret",
            "ENABLE_SMTP": "1",
            "EMAIL_HOST": "smtp.local",
            "EMAIL_PORT": "587",
            "EMAIL_FROM": "Plane <noreply.local>",
            "EMAIL_HOST_PASSWORD": "smtp-secret",
            "LLM_API_KEY": "llm-secret",
            "LLM_PROVIDER": "openai",
            "LLM_MODEL": "gpt-4o-mini",
        }
        monkeypatch.setattr(
            capabilities,
            "get_configuration_value",
            lambda keys: tuple(values.get(key["key"], key["default"]) for key in keys),
        )

        client = APIClient()
        response = client.get("/api/instances/")

        serialized = str(response.data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["capabilities"]["ai"]["ready"] is True
        assert response.data["config"]["has_llm_configured"] is True
        assert response.data["capabilities"]["smtp"]["ready"] is True
        assert response.data["capabilities"]["object_storage"]["ready"] is True
        assert response.data["capabilities"]["oauth"]["providers"]["google"]["ready"] is True
        assert response.data["capabilities"]["policy"]["commercial_gating"] is False
        assert "llm-secret" not in serialized
        assert "oauth-secret" not in serialized
        assert "smtp-secret" not in serialized
        assert "s3-secret" not in serialized
        assert "s3-access-key" not in serialized
        assert "subscription" not in response.data["capabilities"]["policy"]
