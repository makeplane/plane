# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models
from .project import ProjectBaseModel


class IssueTimeLog(ProjectBaseModel):
    """Logs time spent on an issue, created when state transitions to/from STARTED group."""

    class StopReason(models.TextChoices):
        STATE_CHANGE = "state_change", "State change"
        WORKING_HOURS = "working_hours", "Working hours"
        MANUAL_ENTRY = "manual_entry", "Manual entry"

    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="time_logs",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="issue_time_logs",
        verbose_name="Spent By",
    )
    date = models.DateField(verbose_name="Log Date")
    started_at = models.DateTimeField(verbose_name="Started At")
    stopped_at = models.DateTimeField(verbose_name="Stopped At", null=True, blank=True)
    duration_seconds = models.IntegerField(
        default=0,
        verbose_name="Duration (seconds)",
    )
    # UTC boundary at which a running timer should be auto-stopped by the
    # working-hours background job. Null when the workspace has no working-hours
    # schedule enabled, or once the log has been stopped.
    auto_stop_at = models.DateTimeField(null=True, blank=True, verbose_name="Auto Stop At")
    stop_reason = models.CharField(
        max_length=20,
        choices=StopReason.choices,
        null=True,
        blank=True,
        verbose_name="Stop Reason",
    )

    class Meta:
        verbose_name = "Issue Time Log"
        verbose_name_plural = "Issue Time Logs"
        db_table = "issue_time_logs"
        ordering = ("-date", "-started_at")
        indexes = [
            # Partial index the working-hours sweep uses to cheaply find running
            # timers that have a boundary due.
            models.Index(
                fields=["auto_stop_at"],
                name="itl_open_autostop_idx",
                condition=models.Q(stopped_at__isnull=True, auto_stop_at__isnull=False),
            ),
        ]

    def __str__(self):
        hours, remainder = divmod(self.duration_seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return f"{self.issue.name} - {self.date} - {hours:02d}:{minutes:02d}"
