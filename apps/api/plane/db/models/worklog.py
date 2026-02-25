# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .project import ProjectBaseModel


class IssueWorkLog(ProjectBaseModel):
    """Tracks time logged by members against issues."""

    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="issue_worklogs",
    )
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="worklogs",
    )
    duration_minutes = models.PositiveIntegerField()
    description = models.TextField(blank=True, default="")
    logged_at = models.DateField()

    class Meta:
        verbose_name = "Issue Work Log"
        verbose_name_plural = "Issue Work Logs"
        db_table = "issue_worklogs"
        ordering = ("-logged_at", "-created_at")
        indexes = [
            models.Index(fields=["issue", "logged_by"]),
            models.Index(fields=["project", "logged_at"]),
        ]

    def __str__(self):
        return f"{self.logged_by} - {self.duration_minutes}m on {self.logged_at}"
