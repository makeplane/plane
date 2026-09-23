# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from types import SimpleNamespace
from django.utils import timezone
import pytest
from unittest.mock import patch
from uuid import uuid4

from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin, AIProviderProfile


@pytest.fixture
def instance_with_admin(db, create_user):
    instance = Instance.objects.create(
        instance_name="Test",
        instance_id="api-test-instance",
        current_version="0.0.0",
        last_checked_at=timezone.now(),
    )
    InstanceAdmin.objects.create(instance=instance, user=create_user, role=20)
    return instance


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_api_requires_instance_admin(api_client, create_user, instance_with_admin):
    non_admin = User.objects.create(email="not-admin@plane.so", username=f"not-admin-{uuid4().hex}")
    api_client.force_authenticate(user=non_admin)
    response = api_client.get("/api/instances/ai/providers/")
    assert response.status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_create_masks_secret(session_client, instance_with_admin):
    with patch("plane.app.views.external.ai_provider.validate_url"):
        response = session_client.post(
            "/api/instances/ai/providers/",
            {
                "name": "Gateway",
                "slug": "gateway",
                "base_url": "https://api.example.com/v1",
                "default_model": "gpt-test",
                "api_key": "super-secret",
                "is_default": True,
            },
            format="json",
        )

    assert response.status_code == 201
    assert "api_key" not in response.data
    assert response.data["has_api_key"] is True
    assert AIProviderProfile.objects.get(slug="gateway").api_key_encrypted != "super-secret"


DRAFT_TEST_URL = "/api/instances/ai/providers/test-connection/"


def _upstream_response(status_code, body):
    return SimpleNamespace(
        status_code=status_code,
        json=lambda: body,
        headers={},
        text=json.dumps(body),
        close=lambda: None,
    )


def _draft_payload(**overrides):
    payload = {
        "base_url": "https://api.example.com/v1",
        "api_key": "draft-secret",
        "default_model": "gpt-test",
        "timeout_seconds": 30,
    }
    payload.update(overrides)
    return payload


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_draft_test_connection_probes_without_persisting(session_client, instance_with_admin):
    ok = _upstream_response(200, {"choices": [{"message": {"content": "ok"}}]})

    with patch("plane.app.views.external.ai_provider.validate_url"), patch(
        "plane.app.views.external.ai_provider.pinned_fetch", return_value=ok
    ) as fetch:
        response = session_client.post(DRAFT_TEST_URL, _draft_payload(), format="json")

    assert response.status_code == 200
    assert response.data["success"] is True
    assert response.data["model"] == "gpt-test"
    assert response.data["provider_status"] == "ok"
    # The point of testing a draft: the config is never written.
    assert AIProviderProfile.objects.count() == 0
    assert fetch.call_args.args[:2] == ("POST", "https://api.example.com/v1/chat/completions")
    assert fetch.call_args.kwargs["headers"]["Authorization"] == "Bearer draft-secret"


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_draft_test_connection_reports_upstream_failure(session_client, instance_with_admin):
    unauthorized = _upstream_response(401, {"error": {"message": "invalid api key"}})

    with patch("plane.app.views.external.ai_provider.validate_url"), patch(
        "plane.app.views.external.ai_provider.pinned_fetch", return_value=unauthorized
    ):
        response = session_client.post(DRAFT_TEST_URL, _draft_payload(), format="json")

    assert response.status_code == 200
    assert response.data["success"] is False
    assert response.data["provider_status"] == "error"
    assert response.data["error_code"]
    assert AIProviderProfile.objects.count() == 0


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_draft_test_connection_rejects_private_base_url(session_client, instance_with_admin):
    response = session_client.post(DRAFT_TEST_URL, _draft_payload(base_url="https://127.0.0.1/v1"), format="json")

    assert response.status_code == 400
    assert AIProviderProfile.objects.count() == 0


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_draft_test_connection_requires_a_model(session_client, instance_with_admin):
    with patch("plane.app.views.external.ai_provider.validate_url"):
        response = session_client.post(
            DRAFT_TEST_URL,
            {"base_url": "https://api.example.com/v1", "api_key": "draft-secret"},
            format="json",
        )

    assert response.status_code == 400


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_draft_test_connection_requires_instance_admin(api_client, create_user, instance_with_admin):
    non_admin = User.objects.create(email="draft-not-admin@plane.so", username=f"draft-not-admin-{uuid4().hex}")
    api_client.force_authenticate(user=non_admin)

    response = api_client.post(DRAFT_TEST_URL, _draft_payload(), format="json")

    assert response.status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_draft_test_connection_uses_the_stored_key_when_blank(session_client, instance_with_admin):
    """Editing a saved provider and leaving the key field blank tests the stored secret."""
    provider = AIProviderProfile.objects.create(
        instance=instance_with_admin,
        name="Saved",
        slug="saved",
        base_url="https://api.example.com/v1",
        api_key_encrypted="stored-secret",
        default_model="gpt-test",
    )
    ok = _upstream_response(200, {"choices": [{"message": {"content": "ok"}}]})

    with patch("plane.app.views.external.ai_provider.validate_url"), patch(
        "plane.app.views.external.ai_provider.pinned_fetch", return_value=ok
    ) as fetch:
        response = session_client.post(
            DRAFT_TEST_URL,
            {
                "base_url": provider.base_url,
                "default_model": "gpt-test",
                "provider_id": str(provider.id),
            },
            format="json",
        )

    assert response.status_code == 200
    assert response.data["success"] is True
    assert fetch.call_args.kwargs["headers"]["Authorization"] == "Bearer stored-secret"
    assert AIProviderProfile.objects.count() == 1


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_draft_test_connection_never_sends_a_stored_key_to_a_request_host(
    session_client, instance_with_admin
):
    """A stored secret is only ever sent to the host stored alongside it."""
    provider = AIProviderProfile.objects.create(
        instance=instance_with_admin,
        name="Saved",
        slug="saved",
        base_url="https://api.example.com/v1",
        api_key_encrypted="stored-secret",
        default_model="gpt-test",
    )
    ok = _upstream_response(200, {"choices": [{"message": {"content": "ok"}}]})

    with patch("plane.app.views.external.ai_provider.validate_url"), patch(
        "plane.app.views.external.ai_provider.pinned_fetch", return_value=ok
    ) as fetch:
        response = session_client.post(
            DRAFT_TEST_URL,
            {
                "base_url": "https://attacker.example/v1",
                "default_model": "gpt-test",
                "provider_id": str(provider.id),
            },
            format="json",
        )

    assert response.status_code == 200
    # The probe went to the stored host, not the one from the request.
    assert fetch.call_args.args[:2] == ("POST", "https://api.example.com/v1/chat/completions")


@pytest.mark.contract
@pytest.mark.django_db
def test_ai_provider_draft_test_connection_reports_a_missing_provider(session_client, instance_with_admin):
    with patch("plane.app.views.external.ai_provider.validate_url"), patch(
        "plane.app.views.external.ai_provider.pinned_fetch"
    ) as fetch:
        response = session_client.post(
            DRAFT_TEST_URL,
            {
                "base_url": "https://api.example.com/v1",
                "default_model": "gpt-test",
                "provider_id": str(uuid4()),
            },
            format="json",
        )

    assert response.status_code == 200
    assert response.data["success"] is False
    assert response.data["error_code"] == "PROVIDER_NOT_FOUND"
    fetch.assert_not_called()
