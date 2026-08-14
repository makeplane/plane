# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from .base import BaseModel


class SyncEvent(BaseModel):
    """A single real-time sync event emitted for a workspace.

    Acts as a short-lived, durable outbox: connected clients (web / iOS / macOS)
    receive events live over the `/sync` WebSocket, and offline/reconnecting
    clients replay everything with `seq > since_seq` from this table before
    switching to the live stream. Not an audit log — see `IssueActivity` /
    `Webhook` for that; rows here are pruned after a short retention window by a
    periodic cleanup task.
    """

    class EntityType(models.TextChoices):
        ISSUE = "issue", "Issue"
        ISSUE_COMMENT = "issue_comment", "Issue Comment"
        CYCLE = "cycle", "Cycle"
        MODULE = "module", "Module"
        PROJECT = "project", "Project"
        POMODORO_TIMER = "pomodoro_timer", "Pomodoro Timer"

    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        DELETED = "deleted", "Deleted"
        MOVED = "moved", "Moved"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="sync_events")
    # Workspace-scoped monotonically increasing cursor. Assigned by sync_event_task
    # via a per-workspace counter row (SELECT ... FOR UPDATE) so it is gap-free
    # enough for cursor replay (small gaps from rolled-back transactions are fine;
    # what matters is strict ordering, not contiguity).
    seq = models.BigIntegerField()
    entity_type = models.CharField(max_length=32, choices=EntityType.choices)
    entity_id = models.UUIDField()
    action = models.CharField(max_length=16, choices=Action.choices)
    actor = models.ForeignKey(
        "db.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    # Small, diffable payload (changed fields / new state) — never a full
    # re-fetch requirement. Clients apply it directly to their local cache/store.
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Sync Event"
        verbose_name_plural = "Sync Events"
        db_table = "sync_events"
        ordering = ("workspace", "seq")
        constraints = [
            models.UniqueConstraint(fields=["workspace", "seq"], name="sync_event_unique_workspace_seq")
        ]
        indexes = [
            models.Index(fields=["workspace", "seq"], name="sync_event_workspace_seq_idx"),
            models.Index(
                fields=["workspace", "entity_type", "entity_id"], name="sync_event_entity_idx"
            ),
        ]

    def __str__(self):
        return f"{self.workspace_id} <{self.entity_type}:{self.entity_id}> seq={self.seq}"


class WorkspaceSyncSequence(BaseModel):
    """Per-workspace monotonic counter backing `SyncEvent.seq`.

    A dedicated row (rather than relying on autoincrement) lets sync_event_task
    take a row lock (`SELECT ... FOR UPDATE`) scoped to a single workspace,
    avoiding cross-workspace contention while guaranteeing strictly increasing,
    workspace-scoped sequence numbers usable as a reconnect cursor.
    """

    workspace = models.OneToOneField(
        "db.Workspace", on_delete=models.CASCADE, related_name="sync_sequence"
    )
    last_seq = models.BigIntegerField(default=0)

    class Meta:
        verbose_name = "Workspace Sync Sequence"
        verbose_name_plural = "Workspace Sync Sequences"
        db_table = "workspace_sync_sequences"

    def __str__(self):
        return f"{self.workspace_id} -> {self.last_seq}"
