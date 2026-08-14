# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
import logging
from typing import Any, Dict, Optional

# Third party imports
from celery import shared_task

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction

# Module imports
from plane.db.models import Device, DeviceWorkspaceCursor, SyncEvent, WorkspaceSyncSequence
from plane.settings.redis import redis_instance
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")

# Redis key an apps/live WS process refreshes (with a short TTL) while a user
# holds an open /sync connection for a workspace. Devices matching this key are
# skipped for APNs — they already get the event over the live socket.
ONLINE_KEY_TEMPLATE = "sync:online:{user_id}:{workspace_id}"


def _next_seq(workspace_id: str) -> int:
    """Atomically allocate the next workspace-scoped sequence number.

    Uses a row lock on WorkspaceSyncSequence rather than relying on DB
    autoincrement so the cursor stays workspace-scoped (required for the
    `/sync` since_seq replay contract) instead of a single global counter.
    """
    with transaction.atomic():
        seq_row, _ = WorkspaceSyncSequence.objects.select_for_update().get_or_create(
            workspace_id=workspace_id
        )
        seq_row.last_seq += 1
        seq_row.save(update_fields=["last_seq"])
        return seq_row.last_seq


@shared_task
def sync_event(
    workspace_id: str,
    entity_type: str,
    entity_id: str,
    action: str,
    actor_id: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> None:
    """Emit one canonical real-time sync event for a workspace.

    Called from the same view call-sites that already trigger
    `issue_activity`/`webhook_activity` (see apps/api/plane/app/views/issue/base.py
    etc.) so entity mutations fan out to connected iOS/macOS/web clients without
    introducing a separate signal-based architecture.

    1. Persists a durable `SyncEvent` row (the reconnect/offline replay outbox).
    2. Publishes it on the workspace's Redis channel for any open `/sync` WS
       connections (handled by apps/live) to relay immediately.
    3. Wakes up devices that are both offline (no open WS) and behind on this
       workspace's cursor via a silent APNs push.
    """
    try:
        seq = _next_seq(workspace_id)

        sync_event_row = SyncEvent.objects.create(
            workspace_id=workspace_id,
            seq=seq,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor_id=actor_id,
            payload=payload or {},
        )

        message = {
            "seq": seq,
            "workspace_id": str(workspace_id),
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "action": action,
            "actor_id": str(actor_id) if actor_id else None,
            "payload": payload or {},
            "created_at": sync_event_row.created_at.isoformat(),
        }

        redis_instance().publish(
            f"sync:workspace:{workspace_id}", json.dumps(message, cls=DjangoJSONEncoder)
        )

        alert = None
        if entity_type == "pomodoro_timer" and (payload or {}).get("action") == "phase_end":
            phase = (payload or {}).get("phase", "focus")
            alert = {
                "title": "Pomodoro",
                "body": "Focus session ended" if phase == "focus" else "Break's over",
            }

        _notify_stale_devices(workspace_id=workspace_id, seq=seq, alert=alert)
    except Exception as e:
        log_exception(e)
        logger.error(f"Failed to emit sync event for {entity_type}:{entity_id}: {e}")


def _notify_stale_devices(workspace_id: str, seq: int, alert: Optional[Dict[str, Any]] = None) -> None:
    """Enqueue APNs pushes only for devices that need a wakeup.

    A device is skipped when it already holds a live WS connection for this
    workspace (tracked by apps/live via ONLINE_KEY_TEMPLATE) — the WS delivery
    above already reaches it, so pushing too would be a duplicate notification.
    """
    from plane.bgtasks.apns_push_task import apns_push_task

    ri = redis_instance()
    cursors = DeviceWorkspaceCursor.objects.filter(
        workspace_id=workspace_id, last_seq__lt=seq
    ).select_related("device")

    for cursor in cursors:
        device: Device = cursor.device
        online_key = ONLINE_KEY_TEMPLATE.format(user_id=device.user_id, workspace_id=workspace_id)
        if ri.get(online_key):
            continue
        apns_push_task.delay(
            device_id=str(device.id), workspace_id=str(workspace_id), seq=seq, alert=alert
        )
