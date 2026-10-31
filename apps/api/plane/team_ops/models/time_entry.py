# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import F, Q

# Module imports
from plane.db.models.base import BaseModel
from plane.db.models.workspace import WorkspaceBaseModel

# A single entry (or a running timer) can never cover more than a day.
MAX_ENTRY_SECONDS = 24 * 60 * 60


class TimeEntry(WorkspaceBaseModel):
    """Time a user spent working, optionally against a work item."""

    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        TIMER = "timer", "Timer"

    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="team_ops_time_entries",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_ops_time_entries",
    )
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField()
    duration_seconds = models.PositiveIntegerField()
    note = models.TextField(blank=True, default="")
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.MANUAL)
    is_billable = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Time Entry"
        verbose_name_plural = "Time Entries"
        db_table = "tops_time_entry"
        ordering = ("-started_at",)
        constraints = [
            models.CheckConstraint(
                condition=Q(ended_at__gte=F("started_at")),
                name="tops_time_entry_end_after_start",
            ),
            models.CheckConstraint(
                condition=Q(duration_seconds__lte=MAX_ENTRY_SECONDS),
                name="tops_time_entry_max_duration",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "user", "started_at"], name="tops_te_ws_user_start_idx"),
            models.Index(fields=["issue", "started_at"], name="tops_te_issue_start_idx"),
        ]

    def __str__(self):
        return f"{self.user_id} {self.duration_seconds}s"


class ActiveTimer(BaseModel):
    """A running timer. At most one per user and workspace; removed when stopped."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_timers")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_ops_timers",
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="team_ops_timers",
    )
    started_at = models.DateTimeField()
    note = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Active Timer"
        verbose_name_plural = "Active Timers"
        db_table = "tops_timer"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="tops_timer_unique_user_workspace_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.user_id} {self.started_at}"
