# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch

import pytest

from plane.bgtasks.sync_event_task import sync_event
from plane.db.models import Device, DeviceWorkspaceCursor, SyncEvent, WorkspaceSyncSequence


@pytest.mark.django_db
class TestSyncEventTask:
    def test_creates_monotonically_increasing_seq_per_workspace(self, workspace, create_user):
        with patch("plane.bgtasks.sync_event_task.redis_instance") as mocked_redis:
            mocked_redis.return_value.get.return_value = None
            sync_event(
                workspace_id=str(workspace.id),
                entity_type=SyncEvent.EntityType.ISSUE,
                entity_id=str(workspace.id),  # any uuid is fine for this assertion
                action=SyncEvent.Action.CREATED,
                actor_id=str(create_user.id),
            )
            sync_event(
                workspace_id=str(workspace.id),
                entity_type=SyncEvent.EntityType.ISSUE,
                entity_id=str(workspace.id),
                action=SyncEvent.Action.UPDATED,
                actor_id=str(create_user.id),
            )

        events = list(SyncEvent.objects.filter(workspace=workspace).order_by("seq"))
        assert [e.seq for e in events] == [1, 2]
        assert WorkspaceSyncSequence.objects.get(workspace=workspace).last_seq == 2

    def test_publishes_to_workspace_redis_channel(self, workspace, create_user):
        with patch("plane.bgtasks.sync_event_task.redis_instance") as mocked_redis:
            redis_client = MagicMock()
            redis_client.get.return_value = None
            mocked_redis.return_value = redis_client

            sync_event(
                workspace_id=str(workspace.id),
                entity_type=SyncEvent.EntityType.ISSUE,
                entity_id=str(workspace.id),
                action=SyncEvent.Action.CREATED,
                actor_id=str(create_user.id),
            )

            redis_client.publish.assert_called_once()
            channel = redis_client.publish.call_args.args[0]
            assert channel == f"sync:workspace:{workspace.id}"

    def test_skips_apns_push_for_devices_marked_online(self, workspace, create_user):
        device = Device.objects.create(user=create_user, platform=Device.Platform.IOS, apns_token="tok")
        DeviceWorkspaceCursor.objects.create(device=device, workspace=workspace, last_seq=0)

        with (
            patch("plane.bgtasks.sync_event_task.redis_instance") as mocked_redis,
            patch("plane.bgtasks.apns_push_task.apns_push_task.delay") as mocked_push,
        ):
            redis_client = MagicMock()
            redis_client.get.return_value = b"1"  # device is online -> should be skipped
            mocked_redis.return_value = redis_client

            sync_event(
                workspace_id=str(workspace.id),
                entity_type=SyncEvent.EntityType.ISSUE,
                entity_id=str(workspace.id),
                action=SyncEvent.Action.CREATED,
                actor_id=str(create_user.id),
            )

            mocked_push.assert_not_called()

    def test_pushes_apns_for_offline_stale_devices(self, workspace, create_user):
        device = Device.objects.create(user=create_user, platform=Device.Platform.IOS, apns_token="tok")
        DeviceWorkspaceCursor.objects.create(device=device, workspace=workspace, last_seq=0)

        with (
            patch("plane.bgtasks.sync_event_task.redis_instance") as mocked_redis,
            patch("plane.bgtasks.apns_push_task.apns_push_task.delay") as mocked_push,
        ):
            redis_client = MagicMock()
            redis_client.get.return_value = None  # not online -> should be pushed
            mocked_redis.return_value = redis_client

            sync_event(
                workspace_id=str(workspace.id),
                entity_type=SyncEvent.EntityType.ISSUE,
                entity_id=str(workspace.id),
                action=SyncEvent.Action.CREATED,
                actor_id=str(create_user.id),
            )

            mocked_push.assert_called_once()
            assert mocked_push.call_args.kwargs["device_id"] == str(device.id)
