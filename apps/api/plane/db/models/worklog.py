# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from plane.utils.worklog import WORKLOG_DURATION_MAX_SECONDS, WORKLOG_DURATION_MIN_SECONDS

from .project import ProjectBaseModel


class IssueWorklog(ProjectBaseModel):
    """Time logged against a work item."""

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_worklogs")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_worklogs",
    )
    duration = models.PositiveIntegerField(
        verbose_name="Duration (seconds)",
        validators=[
            MinValueValidator(WORKLOG_DURATION_MIN_SECONDS),
            MaxValueValidator(WORKLOG_DURATION_MAX_SECONDS),
        ],
    )
    description = models.TextField(blank=True, default="")
    logged_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Issue Worklog"
        verbose_name_plural = "Issue Worklogs"
        db_table = "issue_worklogs"
        ordering = ("-logged_at", "-created_at")
        indexes = [
            models.Index(fields=["issue", "logged_at"], name="worklog_issue_logged_idx"),
            models.Index(fields=["actor", "logged_at"], name="worklog_actor_logged_idx"),
            models.Index(fields=["project", "logged_at"], name="worklog_proj_logged_idx"),
            models.Index(fields=["workspace", "logged_at"], name="worklog_ws_logged_idx"),
        ]

    def __str__(self):
        return f"{self.issue_id} {self.duration}s"
