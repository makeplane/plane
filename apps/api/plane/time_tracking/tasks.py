# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
from datetime import timedelta

# Django imports
from django.db import transaction
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Issue, IssueActivity

from .constants import AUTO_STOP_CHUNK_SIZE, TIMER_AUTO_STOP_SECONDS
from .models import TimeEntry

logger = logging.getLogger("plane.worker")


def format_short(seconds) -> str:
    """5400 → "1h 30m", 2700 → "45m"."""
    seconds = int(seconds or 0)
    hours, minutes = seconds // 3600, (seconds % 3600) // 60
    if hours and minutes:
        return f"{hours}h {minutes}m"
    if hours:
        return f"{hours}h"
    return f"{minutes}m"


def _activity_comment(verb, old_seconds, new_seconds):
    if verb == "created":
        return f"logged {format_short(new_seconds)}"
    if verb == "updated":
        return f"changed logged time from {format_short(old_seconds)} to {format_short(new_seconds)}"
    return f"removed {format_short(old_seconds)} of logged time"


@shared_task
def record_time_entry_activity(entry_id, verb, actor_id, issue_id, old_seconds=None, new_seconds=None, epoch=None):
    """Write a work item activity row for a time entry change (plan 8.2). No notifications are sent.

    The row is created directly so upstream's issue_activities_task stays untouched. ``old_identifier``
    carries the entry's owner so the UI can say "for {owner}" when an admin acted on someone's behalf.
    """
    entry = TimeEntry.all_objects.filter(id=entry_id).first()
    issue = Issue.all_objects.filter(id=issue_id).first()
    if entry is None or issue is None:
        return

    activity = IssueActivity(
        issue_id=issue.id,
        project_id=issue.project_id,
        workspace_id=issue.workspace_id,
        actor_id=actor_id,
        verb=verb,
        field="time_entry",
        old_value=str(old_seconds) if old_seconds is not None else None,
        new_value=str(new_seconds) if new_seconds is not None else None,
        new_identifier=entry.id,
        old_identifier=entry.user_id,
        comment=_activity_comment(verb, old_seconds, new_seconds),
        epoch=epoch or int(timezone.now().timestamp()),
    )
    activity.save(created_by_id=actor_id)


@shared_task
def stop_stale_timers():
    """Stop every timer that has run for 12 hours, at exactly start + 12 h (plan 8.1).

    Because the end time doesn't depend on when this runs, a late or repeated run gives the same result.
    """
    cutoff = timezone.now() - timedelta(seconds=TIMER_AUTO_STOP_SECONDS)
    stopped = 0
    while True:
        with transaction.atomic():
            entries = list(
                TimeEntry.objects.filter(started_at__isnull=False, ended_at__isnull=True, started_at__lte=cutoff)
                .select_for_update(skip_locked=True)
                .order_by("started_at")[:AUTO_STOP_CHUNK_SIZE]
            )
            if not entries:
                break
            now = timezone.now()
            for entry in entries:
                entry.ended_at = entry.started_at + timedelta(seconds=TIMER_AUTO_STOP_SECONDS)
                entry.duration_seconds = TIMER_AUTO_STOP_SECONDS
                entry.auto_stopped = True
                entry.updated_at = now
            TimeEntry.objects.bulk_update(entries, ["ended_at", "duration_seconds", "auto_stopped", "updated_at"])
            for entry in entries:
                if entry.issue_id is not None:
                    record_time_entry_activity(
                        entry_id=str(entry.id),
                        verb="created",
                        actor_id=str(entry.user_id),
                        issue_id=str(entry.issue_id),
                        new_seconds=entry.duration_seconds,
                    )
        stopped += len(entries)
        if len(entries) < AUTO_STOP_CHUNK_SIZE:
            break
    if stopped:
        logger.info("Stopped %s stale timers", stopped)
    return stopped
