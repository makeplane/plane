# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Webhook


def webhooks_url(slug, pk=None):
    """URL of the workspace webhook collection."""
    base = f"/api/workspaces/{slug}/webhooks/"
    return f"{base}{pk}/" if pk else base


@pytest.mark.contract
class TestWebhookPageField:
    """The workspace webhook API must let callers provision the ``page`` flag."""

    @pytest.fixture(autouse=True)
    def _no_ssrf(self):
        # The create/update path runs an SSRF check that resolves DNS; stub it so
        # the test stays hermetic and focused on the `page` flag wiring.
        """Allow the test webhook URL past the SSRF guard."""
        with mock.patch("plane.app.serializers.webhook.validate_url"):
            yield

    @pytest.mark.django_db
    def test_create_webhook_with_page_flag(self, session_client, workspace):
        """A webhook can subscribe to page events on create."""
        response = session_client.post(
            webhooks_url(workspace.slug),
            {"url": "https://example.com/hook", "page": True},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        assert response.data["page"] is True
        webhook = Webhook.objects.get(id=response.data["id"])
        assert webhook.page is True

    @pytest.mark.django_db
    def test_get_and_patch_page_flag(self, session_client, workspace):
        """The page flag round-trips through GET and PATCH."""
        webhook = Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/hook",
            page=False,
        )
        detail = webhooks_url(workspace.slug, webhook.id)

        # GET must expose the page flag.
        get_resp = session_client.get(detail)
        assert get_resp.status_code == status.HTTP_200_OK
        assert get_resp.data["page"] is False

        # PATCH must be able to toggle it.
        patch_resp = session_client.patch(detail, {"page": True}, format="json")
        assert patch_resp.status_code == status.HTTP_200_OK
        assert patch_resp.data["page"] is True

        webhook.refresh_from_db()
        assert webhook.page is True
