# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models
from .project import ProjectBaseModel


class IssueTimeLog(ProjectBaseModel):
    """Logs time spent on an issue, created when state transitions to/from STARTED group."""

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

    class Meta:
        verbose_name = "Issue Time Log"
        verbose_name_plural = "Issue Time Logs"
        db_table = "issue_time_logs"
        ordering = ("-date", "-started_at")

    def __str__(self):
        hours, remainder = divmod(self.duration_seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return f"{self.issue.name} - {self.date} - {hours:02d}:{minutes:02d}"
