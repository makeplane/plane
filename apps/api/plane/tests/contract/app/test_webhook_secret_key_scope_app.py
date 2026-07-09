# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for GHSA-83rj-4282-x39v.

WebhookEndpoint list/retrieve/patch passed a fields= allowlist that excluded
secret_key, but DynamicBaseSerializer.__init__ discards the allowlist, so the
HMAC secret_key leaked on every webhook read. WebhookSerializer now hides
secret_key by default and only reveals it on create / secret regeneration.
"""

import pytest
from rest_framework import status

from plane.app.serializers import WebhookSerializer
from plane.db.models import Webhook


def _webhooks_url(slug, pk=None, regenerate=False):
    base = f"/api/workspaces/{slug}/webhooks/"
    if pk and regenerate:
        return f"{base}{pk}/regenerate/"
    if pk:
        return f"{base}{pk}/"
    return base


def _make_webhook(workspace, url="https://example.com/hook"):
    return Webhook.objects.create(workspace=workspace, url=url)


@pytest.mark.contract
class TestWebhookSecretKeyScope:
    @pytest.mark.django_db
    def test_list_does_not_leak_secret_key(self, session_client, workspace):
        _make_webhook(workspace)

        response = session_client.get(_webhooks_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        payload = response.json()
        assert payload, "expected at least one webhook"
        assert all("secret_key" not in item for item in payload)

    @pytest.mark.django_db
    def test_retrieve_does_not_leak_secret_key(self, session_client, workspace):
        webhook = _make_webhook(workspace)

        response = session_client.get(_webhooks_url(workspace.slug, pk=webhook.id))

        assert response.status_code == status.HTTP_200_OK
        assert "secret_key" not in response.json()

    @pytest.mark.django_db
    def test_patch_does_not_leak_secret_key(self, session_client, workspace):
        webhook = _make_webhook(workspace)

        # Patch a non-url field so URL SSRF validation is not exercised.
        response = session_client.patch(
            _webhooks_url(workspace.slug, pk=webhook.id), {"is_active": False}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "secret_key" not in response.json()
        assert response.json()["is_active"] is False

    @pytest.mark.django_db
    def test_regenerate_reveals_secret_key(self, session_client, workspace):
        webhook = _make_webhook(workspace)
        old_secret = webhook.secret_key

        response = session_client.post(_webhooks_url(workspace.slug, pk=webhook.id, regenerate=True))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert "secret_key" in body
        assert body["secret_key"] and body["secret_key"] != old_secret

    @pytest.mark.django_db
    def test_create_reveals_secret_key(self, session_client, workspace, monkeypatch):
        # Bypass the network-dependent SSRF URL validation for this unit.
        monkeypatch.setattr(WebhookSerializer, "_validate_webhook_url", lambda self, url: None)

        response = session_client.post(
            _webhooks_url(workspace.slug), {"url": "https://example.com/hook"}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json().get("secret_key")

    @pytest.mark.django_db
    def test_serializer_hides_secret_by_default_and_reveals_with_flag(self, workspace):
        webhook = _make_webhook(workspace)

        assert "secret_key" not in WebhookSerializer(webhook).data
        revealed = WebhookSerializer(webhook, context={"show_secret_key": True}).data
        assert revealed["secret_key"] == webhook.secret_key
