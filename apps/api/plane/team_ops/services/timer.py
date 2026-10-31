# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The running timer: worked time, rest pauses and the "still working?" check-in.

A timer is RUNNING, on a BREAK the person started, or FROZEN because a check-in was not answered.
Breaks and freezes are taken out of the worked time and written down as `WorkInterruption` rows.
Everything is worked out from the stored times, so it does not depend on the browser staying open.
"""

# Python imports
import os
from dataclasses import dataclass
from datetime import timedelta

# Django imports
from django.db import transaction
from django.utils import timezone

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.team_ops.models import MAX_ENTRY_SECONDS, ActiveTimer, TimeEntry, WorkInterruption
from plane.team_ops.services.notifications import managers_of, notify

RUNNING, BREAK, FROZEN = "RUNNING", "BREAK", "FROZEN"
CHECK_IN_SECONDS = int(os.environ.get("TEAM_OPS_CHECK_IN_MINUTES", 30)) * 60
# How long the person has to answer a check-in before the time stops counting.
GRACE_SECONDS = int(os.environ.get("TEAM_OPS_CHECK_IN_GRACE_MINUTES", 5)) * 60


def _confirmed(timer):
    return timer.last_confirmed_at or timer.started_at


def check_in_due_at(timer):
    """When the next "still working?" falls due, or `None` while the timer is not running."""
    return _confirmed(timer) + timedelta(seconds=CHECK_IN_SECONDS) if timer.state == RUNNING else None


def worked_seconds(timer, now=None):
    """Seconds worked so far: elapsed time minus closed breaks and freezes and the one in progress."""
    now = now or timezone.now()
    total = int((now - timer.started_at).total_seconds()) - timer.break_seconds - timer.frozen_seconds
    if timer.paused_at:
        total -= int((now - timer.paused_at).total_seconds())
    return max(0, total)


def _close_pause(timer, now):
    """End the current break or freeze and add it to the totals."""
    if not timer.paused_at:
        return
    seconds = max(0, int((now - timer.paused_at).total_seconds()))
    if timer.state == BREAK:
        timer.break_seconds += seconds
    else:
        timer.frozen_seconds += seconds
    WorkInterruption.objects.filter(
        workspace=timer.workspace, user=timer.user, ended_at__isnull=True, started_at__gte=timer.started_at
    ).update(ended_at=now)
    timer.paused_at = None
    timer.state = RUNNING


def refresh(timer, now=None):
    """Freeze the timer if its check-in was not answered in time. Safe to call as often as needed."""
    now = now or timezone.now()
    if timer.state != RUNNING:
        return timer
    due = check_in_due_at(timer)
    if now < due + timedelta(seconds=GRACE_SECONDS):
        return timer
    # The time stopped counting when the check-in fell due, not when the freeze was noticed.
    timer.state = FROZEN
    timer.paused_at = due
    timer.save(update_fields=["state", "paused_at", "updated_at"])
    WorkInterruption.objects.create(
        workspace=timer.workspace,
        user=timer.user,
        kind=WorkInterruption.Kind.FREEZE,
        issue=timer.issue,
        started_at=due,
    )
    person = timer.user.display_name
    task = f"{timer.issue.project.identifier}-{timer.issue.sequence_id}" if timer.issue_id else "a task"
    notify(
        timer.workspace,
        managers_of(timer.workspace, timer.user),
        "FREEZE",
        f"{person} did not answer the check-in",
        f"The timer on {task} is frozen since {due:%H:%M} UTC. That time is not counted.",
        link="team-ops/workday",
        actor=timer.user,
    )
    return timer


def _lock(workspace, user):
    return (
        ActiveTimer.objects.select_for_update(of=("self",))
        .filter(workspace=workspace, user=user)
        .select_related("workspace", "user", "issue", "issue__project")
        .first()
    )


def get_timer(workspace, user):
    """The person's timer, brought up to date, or `None`."""
    with transaction.atomic():
        timer = _lock(workspace, user)
        return refresh(timer) if timer else None


def _require(timer):
    if timer is None:
        raise ParseError(detail="No timer is running.")
    return timer


def start_break(workspace, user):
    with transaction.atomic():
        timer = refresh(_require(_lock(workspace, user)))
        if timer.state != RUNNING:
            raise ParseError(detail="The timer is already paused.")
        now = timezone.now()
        timer.state, timer.paused_at = BREAK, now
        timer.save(update_fields=["state", "paused_at", "updated_at"])
        WorkInterruption.objects.create(
            workspace=workspace, user=user, kind=WorkInterruption.Kind.BREAK, issue=timer.issue, started_at=now
        )
    return timer


def end_break(workspace, user):
    with transaction.atomic():
        timer = _require(_lock(workspace, user))
        if timer.state != BREAK:
            raise ParseError(detail="You are not on a break.")
        now = timezone.now()
        _close_pause(timer, now)
        timer.last_confirmed_at = now
        timer.save()
    return timer


def check_in(workspace, user):
    """The person says they are still working. A frozen timer starts counting again from now."""
    with transaction.atomic():
        timer = refresh(_require(_lock(workspace, user)))
        now = timezone.now()
        if timer.state == BREAK:
            raise ParseError(detail="End your break first.")
        if timer.state == FROZEN:
            _close_pause(timer, now)
        timer.last_confirmed_at = now
        timer.save()
    return timer


@dataclass
class StopResult:
    entry: TimeEntry
    capped: bool
    location: str
    break_seconds: int
    frozen_seconds: int


def stop_timer(workspace, user):
    """Stop the running timer and turn it into a time entry; `None` when none is running.

    The entry holds the worked time only. A timer left running for days logs at most a day, and
    `capped` says so.
    """
    with transaction.atomic():
        timer = _lock(workspace, user)
        if timer is None:
            return None
        timer = refresh(timer)
        now = timezone.now()
        _close_pause(timer, now)

        elapsed = max(0, int((now - timer.started_at).total_seconds()))
        worked = max(0, elapsed - timer.break_seconds - timer.frozen_seconds)
        capped = worked > MAX_ENTRY_SECONDS
        duration = min(worked, MAX_ENTRY_SECONDS)
        entry = TimeEntry.objects.create(
            workspace=timer.workspace,
            project=timer.issue.project if timer.issue else None,
            issue=timer.issue,
            user=user,
            started_at=timer.started_at,
            ended_at=timer.started_at + timedelta(seconds=elapsed if not capped else duration),
            duration_seconds=duration,
            note=timer.note,
            source=TimeEntry.Source.TIMER,
        )
        result = StopResult(entry, capped, timer.location, timer.break_seconds, timer.frozen_seconds)
        timer.delete(soft=False)
    return result


def stop_active_timer(workspace, user):
    """`(entry, capped)` of the stopped timer, or `None`. Kept for the Time Tracking endpoint."""
    result = stop_timer(workspace, user)
    return None if result is None else (result.entry, result.capped)
