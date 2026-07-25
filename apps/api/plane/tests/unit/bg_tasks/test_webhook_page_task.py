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
    _page_update_webhook_debounce_key,
)
from plane.db.models import Page, Webhook


class _FakeRedis:
    """In-memory stand-in for the subset of redis ``webhook_activity`` uses.

    Models ``set`` with ``nx``/``ex`` exactly like redis-py: a plain ``set``
    returns ``True``; ``set(nx=True)`` returns ``True`` only when the key is
    absent and ``None`` when it already exists. TTL is not wall-clock driven —
    tests simulate the debounce window elapsing by calling :meth:`delete`.
    """

    def __init__(self):
        """Start with an empty keyspace."""
        self.store = {}

    def set(self, key, value, nx=False, ex=None):
        """Mimic redis SET with optional NX/EX semantics."""
        if nx and key in self.store:
            return None
        self.store[key] = value
        return True

    def get(self, key):
        """Return the stored value, or None."""
        return self.store.get(key)

    def delete(self, *keys):
        """Remove keys, returning how many existed."""
        removed = 0
        for key in keys:
            if self.store.pop(key, None) is not None:
                removed += 1
        return removed


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
        """The page event has both a model and a serializer."""
        assert "page" in MODEL_MAPPER
        assert MODEL_MAPPER["page"] is Page
        assert "page" in SERIALIZER_MAPPER

    def test_get_model_data_serializes_page(self, page):
        """A page serializes to the webhook payload contract."""
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
        """A workspace webhook subscribed to page events."""
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
        """Only page-subscribed webhooks receive page events."""
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
        """A delete carries just the page id."""
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
        """Inactive webhooks receive nothing."""
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


@pytest.mark.unit
class TestPageUpdateWebhookDebounce:
    """``page`` update webhooks: property edits always fire, content flushes are
    debounced per page so a live editing session does not emit a webhook each
    time the collab server persists the document."""

    @pytest.fixture
    def page_webhook(self, workspace):
        """A workspace webhook subscribed to page events."""
        return Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/page-hook",
            page=True,
        )

    @pytest.fixture
    def fake_redis(self):
        """An in-memory stand-in for the debounce keyspace."""
        return _FakeRedis()

    def _fire_update(self, page, create_user, workspace, *, debounce, field):
        """Invoke webhook_activity for a page update."""
        webhook_activity(
            event="page",
            verb="updated",
            field=field,
            old_value=None,
            new_value=None,
            actor_id=create_user.id,
            slug=workspace.slug,
            current_site="http://localhost",
            event_id=page.id,
            old_identifier=None,
            new_identifier=None,
            debounce=debounce,
        )

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_property_update_fires_once(self, mock_send_task, fake_redis, page_webhook, page, create_user, workspace):
        """A discrete property edit (debounce=False) always delivers exactly one
        update webhook."""
        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
            self._fire_update(page, create_user, workspace, debounce=False, field="name")

        mock_send_task.delay.assert_called_once()
        kwargs = mock_send_task.delay.call_args.kwargs
        assert kwargs["event"] == "page"
        assert kwargs["action"] == "updated"
        assert str(kwargs["event_data"]["id"]) == str(page.id)

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_two_rapid_content_persists_fire_once(
        self, mock_send_task, fake_redis, page_webhook, page, create_user, workspace
    ):
        """Two content flushes inside the debounce window collapse to one
        delivery."""
        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
            self._fire_update(page, create_user, workspace, debounce=True, field="description_html")
            self._fire_update(page, create_user, workspace, debounce=True, field="description_html")

        mock_send_task.delay.assert_called_once()

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_content_persist_after_window_fires_again(
        self, mock_send_task, fake_redis, page_webhook, page, create_user, workspace
    ):
        """Once the debounce window elapses (marker gone), the next flush fires
        again."""
        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
            self._fire_update(page, create_user, workspace, debounce=True, field="description_html")
            # Simulate the debounce window expiring (redis TTL) by dropping the marker.
            fake_redis.delete(_page_update_webhook_debounce_key(page.id))
            self._fire_update(page, create_user, workspace, debounce=True, field="description_html")

        assert mock_send_task.delay.call_count == 2

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_property_edit_refreshes_window_and_suppresses_following_flush(
        self, mock_send_task, fake_redis, page_webhook, page, create_user, workspace
    ):
        """A property edit refreshes the window, so a content flush landing right
        after it is coalesced (no duplicate)."""
        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
            self._fire_update(page, create_user, workspace, debounce=False, field="name")
            self._fire_update(page, create_user, workspace, debounce=True, field="description_html")

        mock_send_task.delay.assert_called_once()

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_toggle_off_no_delivery(self, mock_send_task, fake_redis, page, create_user, workspace):
        """With no page-subscribed webhook, an update is never delivered."""
        Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/issue-hook",
            issue=True,
            page=False,
        )
        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
            self._fire_update(page, create_user, workspace, debounce=False, field="name")

        mock_send_task.delay.assert_not_called()

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_update_payload_matches_create_serializer(
        self, mock_send_task, fake_redis, page_webhook, page, create_user, workspace
    ):
        """The update event carries the same PageSerializer payload as create."""
        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
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
            created_payload = mock_send_task.delay.call_args.kwargs["event_data"]

            mock_send_task.reset_mock()

            self._fire_update(page, create_user, workspace, debounce=True, field="description_html")
            updated_payload = mock_send_task.delay.call_args.kwargs["event_data"]

        # Same read-only PageSerializer projection for both create and update.
        assert updated_payload == created_payload
        assert "description_binary" not in updated_payload


@pytest.mark.unit
class TestPageUpdateWebhookDebounceSafety:
    """The debounce window must only be spent on a delivery that actually happens.

    Claiming it earlier means a no-subscriber call or a transient failure silences
    every page change for the rest of the window."""

    @pytest.fixture
    def fake_redis(self):
        """An in-memory stand-in for the debounce keyspace."""
        return _FakeRedis()

    def _fire_content_update(self, page, create_user, workspace):
        """Invoke webhook_activity for a debounced content update."""
        webhook_activity(
            event="page",
            verb="updated",
            field="description_html",
            old_value=None,
            new_value=None,
            actor_id=create_user.id,
            slug=workspace.slug,
            current_site="http://localhost",
            event_id=page.id,
            old_identifier=None,
            new_identifier=None,
            debounce=True,
        )

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_no_subscriber_does_not_claim_the_window(self, mock_send_task, fake_redis, page, create_user, workspace):
        """With nothing subscribed the window stays free, so the next deliverable
        change is not swallowed."""
        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
            self._fire_content_update(page, create_user, workspace)

            mock_send_task.delay.assert_not_called()
            assert fake_redis.get(_page_update_webhook_debounce_key(page.id)) is None

            # A subscriber appears; the very next flush must still deliver.
            Webhook.objects.create(workspace=workspace, url="https://example.com/page-hook", page=True)
            self._fire_content_update(page, create_user, workspace)

        mock_send_task.delay.assert_called_once()

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_failed_dispatch_releases_the_window(self, mock_send_task, fake_redis, page, create_user, workspace):
        """A broker error must cost one webhook, not a whole window."""
        Webhook.objects.create(workspace=workspace, url="https://example.com/page-hook", page=True)
        mock_send_task.delay.side_effect = RuntimeError("broker down")

        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
            # webhook_activity swallows the error (logged) — the point is the marker.
            self._fire_content_update(page, create_user, workspace)
            assert fake_redis.get(_page_update_webhook_debounce_key(page.id)) is None

            # The next flush gets a working broker and delivers immediately.
            mock_send_task.delay.side_effect = None
            self._fire_content_update(page, create_user, workspace)

        assert mock_send_task.delay.call_count == 2

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_successful_dispatch_keeps_the_window(self, mock_send_task, fake_redis, page, create_user, workspace):
        """A delivered webhook holds the window so the flood stays collapsed."""
        Webhook.objects.create(workspace=workspace, url="https://example.com/page-hook", page=True)

        with patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis):
            self._fire_content_update(page, create_user, workspace)
            assert fake_redis.get(_page_update_webhook_debounce_key(page.id)) is not None
            self._fire_content_update(page, create_user, workspace)

        mock_send_task.delay.assert_called_once()


@pytest.mark.unit
class TestPageWebhookPayloadBuiltOnce:
    """The payload is identical for every subscriber, so it is built once."""

    @pytest.fixture
    def three_page_webhooks(self, workspace):
        """Three active webhooks all subscribed to page events."""
        return [
            Webhook.objects.create(workspace=workspace, url=f"https://example.com/hook-{i}", page=True)
            for i in range(3)
        ]

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_object_and_actor_serialized_once_for_many_subscribers(
        self, mock_send_task, three_page_webhooks, page, create_user, workspace
    ):
        """Serializing per subscriber would re-query the page and actor N times."""
        with patch(
            "plane.bgtasks.webhook_task.get_model_data",
            side_effect=lambda event, event_id, **kw: {"id": str(event_id), "event": event},
        ) as mocked_get_model_data:
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

        # All three subscribers were dispatched to...
        assert mock_send_task.delay.call_count == 3
        # ...from a single page lookup plus a single actor lookup.
        assert mocked_get_model_data.call_count == 2
        events = sorted(call.kwargs["event"] for call in mocked_get_model_data.call_args_list)
        assert events == ["page", "user"]
        # Every subscriber received the same payload.
        payloads = [call.kwargs["event_data"] for call in mock_send_task.delay.call_args_list]
        assert all(p == payloads[0] for p in payloads)

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_missing_object_dispatches_nothing(self, mock_send_task, three_page_webhooks, create_user, workspace):
        """A page deleted before the fan-out runs delivers to nobody, rather than
        to whichever subscribers came before the failure."""
        webhook_activity(
            event="page",
            verb="created",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=create_user.id,
            slug=workspace.slug,
            current_site="http://localhost",
            event_id=uuid4(),
            old_identifier=None,
            new_identifier=None,
        )

        mock_send_task.delay.assert_not_called()


@pytest.mark.unit
class TestPageWebhookDebounceFastPath:
    """A suppressed content flush must not pay for serialization."""

    @pytest.fixture
    def fake_redis(self):
        """An in-memory stand-in for the debounce keyspace."""
        return _FakeRedis()

    @pytest.fixture
    def page_webhook(self, workspace):
        """A workspace webhook subscribed to page events."""
        return Webhook.objects.create(workspace=workspace, url="https://example.com/page-hook", page=True)

    def _fire_content_update(self, page, create_user, workspace):
        """Invoke webhook_activity for a debounced content update."""
        webhook_activity(
            event="page",
            verb="updated",
            field="description_html",
            old_value=None,
            new_value=None,
            actor_id=create_user.id,
            slug=workspace.slug,
            current_site="http://localhost",
            event_id=page.id,
            old_identifier=None,
            new_identifier=None,
            debounce=True,
        )

    @patch("plane.bgtasks.webhook_task.webhook_send_task")
    def test_suppressed_flush_does_not_serialize(
        self, mock_send_task, fake_redis, page_webhook, page, create_user, workspace
    ):
        """Debouncing exists to shed load, so a flush inside an open window must
        bail before loading and serializing the page and actor."""
        with (
            patch("plane.bgtasks.webhook_task.redis_instance", return_value=fake_redis),
            patch(
                "plane.bgtasks.webhook_task.get_model_data",
                side_effect=lambda event, event_id, **kw: {"id": str(event_id)},
            ) as mocked_get_model_data,
        ):
            self._fire_content_update(page, create_user, workspace)
            first_round = mocked_get_model_data.call_count

            self._fire_content_update(page, create_user, workspace)
            second_round = mocked_get_model_data.call_count

        # The delivered flush serialized page + actor; the suppressed one added nothing.
        assert first_round == 2
        assert second_round == first_round
        mock_send_task.delay.assert_called_once()
