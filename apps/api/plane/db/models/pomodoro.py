# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

# Module imports
from .base import BaseModel


def get_default_pomodoro_settings():
    return {
        "focus_minutes": 25,
        "short_break_minutes": 5,
        "long_break_minutes": 15,
        "sessions_before_long_break": 4,
        "auto_start_break": True,
        "auto_start_focus": True,
        "auto_create_time_log": True,
        "browser_notifications": False,
        "discord_webhook_url": "",
    }


class PomodoroTimer(BaseModel):
    """A single pomodoro focus session.

    One active (running/paused) timer per user is enforced via a partial unique
    constraint. A completed focus session is converted into a `TimeLog` entry so
    it flows through the existing worklog pipeline (activity, analytics, export).
    """

    class Status(models.TextChoices):
        RUNNING = "running", "Running"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"
        DISCARDED = "discarded", "Discarded"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_%(class)s")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="project_%(class)s")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="pomodoro_timers")
    started_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pomodoro_timers"
    )
    started_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    paused_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.RUNNING)
    description = models.TextField(blank=True)
    # Which focus session (1-indexed) this is within the run leading up to a long
    # break, i.e. counts up to `sessions_before_long_break` before resetting.
    # Lets every device render "Session 2 of 4" identically without recomputing
    # it from TimeLog history.
    session_index = models.PositiveIntegerField(default=1)
    # Idempotency key supplied by the client on start/pause/resume/skip/complete.
    # Two devices racing the same logical action (e.g. both issue "pause" within
    # the same round-trip) collapse to a single state transition instead of a
    # double-pause / duplicate TimeLog. Nullable: only the most recent mutation's
    # key is kept, it is not a log of every key ever seen.
    client_mutation_id = models.UUIDField(null=True, blank=True)

    class Meta:
        verbose_name = "Pomodoro Timer"
        verbose_name_plural = "Pomodoro Timers"
        db_table = "pomodoro_timers"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["started_by"],
                condition=models.Q(status__in=["running", "paused"], deleted_at__isnull=True),
                name="pomodoro_timer_unique_active_per_user",
            )
        ]
        indexes = [
            models.Index(fields=["started_by", "status"], name="pomodoro_timer_user_status_idx"),
            models.Index(fields=["issue"], name="pomodoro_timer_issue_idx"),
        ]

    def __str__(self):
        return f"{self.started_by} <{self.issue.name}> <{self.status}>"
