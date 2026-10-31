# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import timedelta

# Django imports
from django.db import transaction
from django.utils import timezone

# Module imports
from plane.team_ops.models import MAX_ENTRY_SECONDS, ActiveTimer, TimeEntry


def stop_active_timer(workspace, user):
    """Stop the person's running timer and turn it into a time entry.

    Returns `(entry, capped)`, or `None` when no timer is running. A timer left running for days
    logs at most a day of work, and `capped` says so.
    """
    with transaction.atomic():
        timer = (
            ActiveTimer.objects.select_for_update(of=("self",))
            .filter(workspace=workspace, user=user)
            .select_related("workspace", "issue", "issue__project")
            .first()
        )
        if timer is None:
            return None

        elapsed = max(0, int((timezone.now() - timer.started_at).total_seconds()))
        capped = elapsed > MAX_ENTRY_SECONDS
        duration = min(elapsed, MAX_ENTRY_SECONDS)

        entry = TimeEntry.objects.create(
            workspace=timer.workspace,
            project=timer.issue.project if timer.issue else None,
            issue=timer.issue,
            user=user,
            started_at=timer.started_at,
            ended_at=timer.started_at + timedelta(seconds=duration),
            duration_seconds=duration,
            note=timer.note,
            source=TimeEntry.Source.TIMER,
        )
        timer.delete(soft=False)
    return entry, capped
