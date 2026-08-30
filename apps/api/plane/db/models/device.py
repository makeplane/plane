# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .base import BaseModel


class Device(BaseModel):
    """A registered iOS/macOS device that can receive APNs pushes.

    Registered via a lightweight REST endpoint from the native app after it
    obtains an APNs device token. `apns_push_task` only targets devices that
    are not currently holding a live `/sync` WebSocket connection (tracked in
    Redis by apps/live), and whose per-workspace cursor is behind the latest
    `SyncEvent.seq` — i.e. push is a wakeup signal for stale/offline devices,
    never the primary delivery path.
    """

    class Platform(models.TextChoices):
        IOS = "ios", "iOS"
        MACOS = "macos", "macOS"

    class ApnsEnvironment(models.TextChoices):
        SANDBOX = "sandbox", "Sandbox"
        PRODUCTION = "production", "Production"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="devices")
    platform = models.CharField(max_length=16, choices=Platform.choices)
    apns_token = models.CharField(max_length=255)
    apns_env = models.CharField(
        max_length=16, choices=ApnsEnvironment.choices, default=ApnsEnvironment.PRODUCTION
    )
    last_active_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Device"
        verbose_name_plural = "Devices"
        db_table = "push_devices"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["user", "apns_token"], name="device_unique_user_token")
        ]
        indexes = [models.Index(fields=["user", "platform"], name="device_user_platform_idx")]

    def __str__(self):
        return f"{self.user_id} <{self.platform}>"


class DeviceWorkspaceCursor(BaseModel):
    """Tracks the last `SyncEvent.seq` a device has processed, per workspace.

    Used both to resume WS/replay from the right point and to decide whether a
    device needs an APNs wakeup push (its cursor is behind the workspace's
    latest seq and it has no open WS connection).
    """

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="workspace_cursors")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="+")
    last_seq = models.BigIntegerField(default=0)

    class Meta:
        verbose_name = "Device Workspace Cursor"
        verbose_name_plural = "Device Workspace Cursors"
        db_table = "device_workspace_cursors"
        constraints = [
            models.UniqueConstraint(
                fields=["device", "workspace"], name="device_cursor_unique_device_workspace"
            )
        ]

    def __str__(self):
        return f"{self.device_id} @ {self.workspace_id} -> {self.last_seq}"
