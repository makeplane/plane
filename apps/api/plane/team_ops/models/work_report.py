# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from plane.db.models.base import BaseModel


class WorkReport(BaseModel):
    """What a person did, what blocks them and what is next, for one day or one week."""

    class Kind(models.TextChoices):
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_work_reports")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_work_reports")
    kind = models.CharField(max_length=10, choices=Kind.choices)
    # The day itself, or the Monday of the week.
    period_start = models.DateField()
    done = models.TextField(blank=True, default="")
    blockers = models.TextField(blank=True, default="")
    next_steps = models.TextField(blank=True, default="")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)
    # Time Tracking total for the period, frozen when the report is first submitted.
    logged_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Work Report"
        verbose_name_plural = "Work Reports"
        db_table = "tops_work_report"
        ordering = ("-period_start",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "kind", "period_start"],
                condition=Q(deleted_at__isnull=True),
                name="tops_report_unique_user_period_when_deleted_at_null",
            ),
            models.CheckConstraint(
                condition=Q(status="DRAFT") | Q(submitted_at__isnull=False),
                name="tops_report_submitted_has_time",
            ),
        ]
        indexes = [models.Index(fields=["workspace", "kind", "period_start"], name="tops_wr_ws_kind_start_idx")]

    def __str__(self):
        return f"{self.user_id} {self.kind} {self.period_start}"
