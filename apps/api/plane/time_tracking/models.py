# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import F, Q

# Module imports
from plane.db.models.project import ProjectBaseModel

from .constants import TIME_ENTRY_MAX_SECONDS


class TimeEntry(ProjectBaseModel):
    """A block of time by one person on one project, optionally on one work item.

    A running timer is an entry with ``started_at`` set and ``ended_at`` empty.
    """

    class Source(models.TextChoices):
        TIMER = "timer", "Timer"
        MANUAL = "manual", "Manual"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="time_entries")
    # SET_NULL keeps the hours when a work item is deleted: they become project time
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="time_entries",
    )
    # the calendar date the work counts towards, in the owner's timezone
    spent_on = models.DateField()
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True, default="")
    is_billable = models.BooleanField(default=False)
    source = models.CharField(max_length=16, choices=Source.choices)
    # set by the auto-stop job and lifecycle signals, cleared when the owner edits or confirms
    auto_stopped = models.BooleanField(default=False)

    class Meta:
        db_table = "time_entries"
        verbose_name = "Time Entry"
        verbose_name_plural = "Time Entries"
        ordering = ("-spent_on", "-started_at", "-created_at")
        constraints = [
            # at most one running timer per person per workspace
            models.UniqueConstraint(
                fields=["workspace", "user"],
                condition=Q(started_at__isnull=False, ended_at__isnull=True, deleted_at__isnull=True),
                name="time_entry_one_running_timer_per_user",
            ),
            # a duration is required unless the entry is running
            models.CheckConstraint(
                condition=Q(duration_seconds__isnull=False) | Q(started_at__isnull=False, ended_at__isnull=True),
                name="time_entry_duration_unless_running",
            ),
            # a running entry has no duration yet
            models.CheckConstraint(
                condition=~Q(started_at__isnull=False, ended_at__isnull=True, duration_seconds__isnull=False),
                name="time_entry_running_has_no_duration",
            ),
            # an end needs a start, and must come after it
            models.CheckConstraint(
                condition=Q(ended_at__isnull=True) | Q(started_at__isnull=False, ended_at__gt=F("started_at")),
                name="time_entry_end_after_start",
            ),
            # 1 second .. 24 hours (the 60 second minimum for manual entries is an app-level rule)
            models.CheckConstraint(
                condition=Q(duration_seconds__isnull=True)
                | Q(duration_seconds__gte=1, duration_seconds__lte=TIME_ENTRY_MAX_SECONDS),
                name="time_entry_duration_range",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "spent_on"], name="time_entry_ws_spent_on_idx"),
            models.Index(fields=["project", "spent_on"], name="time_entry_proj_spent_on_idx"),
            models.Index(fields=["user", "spent_on"], name="time_entry_user_spent_on_idx"),
        ]

    @property
    def is_running(self):
        return self.started_at is not None and self.ended_at is None

    def __str__(self):
        return f"{self.user_id} {self.spent_on} {self.duration_seconds}"


class ProjectTimeSetting(ProjectBaseModel):
    """Per-project time tracking defaults. Created lazily by the settings endpoint."""

    default_billable = models.BooleanField(default=False)

    class Meta:
        db_table = "project_time_settings"
        verbose_name = "Project Time Setting"
        verbose_name_plural = "Project Time Settings"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(deleted_at__isnull=True),
                name="project_time_setting_unique_project_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.project_id} default_billable={self.default_billable}"
