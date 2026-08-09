# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

# Module imports
from .project import ProjectBaseModel


class TimeLog(ProjectBaseModel):
    """A single entry of time logged against a work item.

    `logged_by` is whose time the entry counts toward, while the inherited
    `created_by` is whoever actually submitted it — these differ when an
    admin logs time on behalf of another member.
    """

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="time_logs")
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="time_logs"
    )
    duration_minutes = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    description = models.TextField(blank=True)
    logged_date = models.DateField()

    class Meta:
        verbose_name = "Time Log"
        verbose_name_plural = "Time Logs"
        db_table = "issue_time_logs"
        ordering = ("-logged_date", "-created_at")
        indexes = [
            models.Index(fields=["project", "logged_date"], name="time_log_project_date_idx"),
            models.Index(fields=["workspace", "logged_by", "logged_date"], name="time_log_ws_user_date_idx"),
            models.Index(fields=["issue"], name="time_log_issue_idx"),
        ]

    def __str__(self):
        return f"{self.issue.name} <{self.duration_minutes}m>"
