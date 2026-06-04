# Python imports
import uuid

# Django imports
from django.conf import settings
from django.db import models, transaction
from django.utils import timezone

# Module imports
from .base import BaseModel


class IssueTimer(BaseModel):
    """
    Tracks time spent working on an issue.

    A user can only have ONE active (is_running=True) timer at a time
    within a workspace. Starting a new timer auto-pauses the existing one.
    """

    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="issue_timers",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_timers",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_issue_timers",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="project_issue_timers",
    )
    started_at = models.DateTimeField(default=timezone.now)
    paused_at = models.DateTimeField(null=True, blank=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    total_duration_seconds = models.IntegerField(default=0)
    is_running = models.BooleanField(default=False)
    is_paused = models.BooleanField(default=False)
    is_manual = models.BooleanField(default=False)
    note = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Issue Timer"
        verbose_name_plural = "Issue Timers"
        db_table = "issue_timers"
        ordering = ("-created_at",)

    def __str__(self):
        return f"Timer({self.user}) on {self.issue} - running={self.is_running}"

    def compute_duration(self):
        """
        Recompute total duration from segments.
        Source of truth = IssueTimerSegment rows.
        """
        total = 0
        for seg in self.segments.all():
            end = seg.segment_end or timezone.now()
            total += (end - seg.segment_start).total_seconds()
        return int(total)

    def save(self, *args, **kwargs):
        # Auto-set workspace from project
        if self.project_id and not self.workspace_id:
            self.workspace_id = self.project.workspace_id
        super().save(*args, **kwargs)


class IssueTimerSegment(BaseModel):
    """
    Represents a continuous segment of timer activity.
    A null segment_end means this segment is currently active/running.
    """

    timer = models.ForeignKey(
        IssueTimer,
        on_delete=models.CASCADE,
        related_name="segments",
    )
    segment_start = models.DateTimeField(default=timezone.now)
    segment_end = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Issue Timer Segment"
        verbose_name_plural = "Issue Timer Segments"
        db_table = "issue_timer_segments"
        ordering = ("segment_start",)

    def __str__(self):
        return f"Segment({self.timer_id}) {self.segment_start} - {self.segment_end or 'active'}"


def stop_running_timers_for_issue(issue_id):
    """
    Utility function to stop all running timers for a given issue.
    Called when an issue transitions to a completed/cancelled state.
    Must be called inside a transaction.
    """
    now = timezone.now()
    running_timers = IssueTimer.objects.filter(
        issue_id=issue_id,
        is_running=True,
    ).select_for_update()

    for timer in running_timers:
        # Close any open segments
        open_segments = timer.segments.filter(segment_end__isnull=True)
        open_segments.update(segment_end=now)

        # Recompute duration
        timer.total_duration_seconds = timer.compute_duration()
        timer.is_running = False
        timer.is_paused = False
        timer.stopped_at = now
        timer.save(
            update_fields=[
                "total_duration_seconds",
                "is_running",
                "is_paused",
                "stopped_at",
                "updated_at",
            ]
        )
