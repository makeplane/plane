# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch
from uuid import uuid4

import pytest

from plane.bgtasks.webhook_task import (
    MODEL_MAPPER,
    SERIALIZER_MAPPER,
    get_model_data,
    webhook_activity,
)
from plane.db.models import Page, Webhook


@pytest.fixture
def page(db, workspace, create_user):
    """A minimal page owned by the test user."""
    return Page.objects.create(
        workspace=workspace,
        owned_by=create_user,
        name="Release Notes",
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.mark.unit
class TestPageWebhookMapping:
    """The webhook fan-out must know how to serialize a ``page`` event."""

    def test_page_registered_in_mappers(self):
        assert "page" in MODEL_MAPPER
        assert MODEL_MAPPER["page"] is Page
        assert "page" in SERIALIZER_MAPPER

    def test_get_model_data_serializes_page(self, page):
        data = get_model_data(event="page", event_id=page.id)
        assert str(data["id"]) == str(page.id)
        assert data["name"] == "Release Notes"
        # Pin the payload contract: the identifying + metadata fields are present.
        expected_keys = {
            "id",
            "name",
            "owned_by",
            "access",
            "is_locked",
            "workspace",
            "created_at",
            "updated_at",
        }
        assert expected_keys <= set(data), f"missing keys: {expected_keys - set(data)}"
        # The Yjs binary blob is never part of the webhook contract.
        assert "description_binary" not in data
        assert "description_json" not in data


@pytest.mark.unit
class TestPageWebhookActivity:
    """``webhook_activity`` must route ``page`` events to page-subscribed webhooks."""

    @pytest.fixture
    def page_webhook(self, workspace):
        return Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/page-hook",
            page=True,
        )

    @pytest.fixture
    def other_webhook(self, workspace):
        """A webhook that subscribes to issues but not pages."""
        return Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/issue-hook",
            issue=True,
            page=False,
        )

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_created_dispatches_only_to_page_webhooks(
        self, mock_send_task, page_webhook, other_webhook, page, create_user, workspace
    ):
        webhook_activity(
            event="page",
            verb="created",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=create_user.id,
            slug=workspace.slug,
            current_site="http://localhost",
            event_id=page.id,
            old_identifier=None,
            new_identifier=None,
        )

        mock_send_task.delay.assert_called_once()
        kwargs = mock_send_task.delay.call_args.kwargs
        assert kwargs["webhook_id"] == page_webhook.id
        assert kwargs["event"] == "page"
        assert kwargs["action"] == "created"
        # On create the full serialized page travels in the payload.
        assert str(kwargs["event_data"]["id"]) == str(page.id)
        assert kwargs["event_data"]["name"] == "Release Notes"

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_deleted_sends_only_the_id(self, mock_send_task, page_webhook, create_user, workspace):
        # A delete fires after the row is gone, so the fan-out never reloads the
        # page — any id stands in for the already-deleted page here.
        deleted_page_id = uuid4()

        webhook_activity(
            event="page",
            verb="deleted",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=create_user.id,
            slug=workspace.slug,
            current_site="http://localhost",
            event_id=deleted_page_id,
            old_identifier=None,
            new_identifier=None,
        )

        mock_send_task.delay.assert_called_once()
        kwargs = mock_send_task.delay.call_args.kwargs
        assert kwargs["action"] == "deleted"
        # A delete cannot serialize a gone row — only the id is sent.
        assert kwargs["event_data"] == {"id": deleted_page_id}

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_inactive_webhook_is_skipped(self, mock_send_task, page, create_user, workspace):
        Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/inactive-hook",
            page=True,
            is_active=False,
        )

        webhook_activity(
            event="page",
            verb="created",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=create_user.id,
            slug=workspace.slug,
            current_site="http://localhost",
            event_id=page.id,
            old_identifier=None,
            new_identifier=None,
        )

        mock_send_task.delay.assert_not_called()
