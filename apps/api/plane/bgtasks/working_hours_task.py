# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Background job that stops running timers at the end of working hours.

Runs every minute. It closes each running timer strictly at its stored
`auto_stop_at` boundary (not at the moment the worker happens to run),
recalculates the issue total, moves the issue to an unstarted state (unless the
user has already moved it elsewhere), records a system activity and notifies the
timer's owner. The whole thing is idempotent and safe to run concurrently.
"""

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from plane.db.models import Issue, IssueActivity, IssueTimeLog, Notification, State
from plane.utils.exception_logger import log_exception
from plane.utils.time_tracking import (
    normalize_time_log_duration,
    recalculate_total_time_spent,
)

# Cap per run so a backlog can't blow up a single task; the next tick picks up the rest.
_BATCH_SIZE = 500


def _pick_unstarted_state(issue):
    """Prefer a To Do / Todo state, else the first unstarted state by sequence."""
    unstarted = State.objects.filter(project_id=issue.project_id, group="unstarted")
    todo = (
        unstarted.filter(name__iexact="To Do").first()
        or unstarted.filter(name__iexact="Todo").first()
    )
    return todo or unstarted.order_by("sequence").first()


def _notify_owner(issue, receiver_id, target_state, moved, warning):
    """Create an in-app notification for the timer owner (best effort)."""
    if not receiver_id:
        return
    if moved and target_state is not None:
        message = (
            f"Your timer on {issue.name} was stopped at the end of working hours "
            f"and the work item was moved to {target_state.name}."
        )
    elif warning:
        message = (
            f"Your timer on {issue.name} was stopped at the end of working hours. "
            "The status was left unchanged because no To Do state was available."
        )
    else:
        # The work item was already moved out of a started state before the
        # boundary; we closed the timer but left the chosen status untouched.
        message = (
            f"Your timer on {issue.name} was stopped at the end of working hours."
        )
    Notification.objects.create(
        workspace=issue.workspace,
        project=issue.project,
        sender="in_app:working_hours:timer_stopped",
        triggered_by=None,
        receiver_id=receiver_id,
        entity_identifier=issue.id,
        entity_name="issue",
        title="Timer stopped at end of working hours",
        message={"text": message},
        data={
            "type": "working_hours_timer_stopped",
            "issue": {
                "id": str(issue.id),
                "name": str(issue.name),
                "identifier": str(issue.project.identifier),
                "sequence_id": issue.sequence_id,
                "project_id": str(issue.project_id),
                "workspace_slug": str(issue.workspace.slug),
                "state_id": str(target_state.id) if target_state else None,
                "state_name": target_state.name if target_state else None,
            },
        },
    )


def _close_one(log_id):
    now = timezone.now()

    with transaction.atomic():
        try:
            # of=("self",) so the lock is taken only on the time-log row — avoids
            # "FOR UPDATE cannot be applied to the nullable side of an outer join".
            log = IssueTimeLog.objects.select_for_update(of=("self",)).get(pk=log_id)
        except IssueTimeLog.DoesNotExist:
            return

        # Re-check under the lock: another worker or a manual state change may have
        # already closed it, or the boundary may have been cleared/pushed out.
        if log.stopped_at is not None or log.auto_stop_at is None or log.auto_stop_at > now:
            return

        boundary = log.auto_stop_at
        issue = Issue.objects.select_for_update(of=("self",)).get(pk=log.issue_id)

        # Close the log strictly at its boundary.
        log.stopped_at = boundary
        log.created_by = None
        log.duration_seconds = normalize_time_log_duration(
            (boundary - log.started_at).total_seconds()
        )
        log.stop_reason = IssueTimeLog.StopReason.WORKING_HOURS
        log.auto_stop_at = None
        log.save(
            update_fields=[
                "stopped_at",
                "duration_seconds",
                "created_by",
                "stop_reason",
                "auto_stop_at",
                "updated_at",
            ],
            disable_auto_set_user=True,
        )
        recalculate_total_time_spent(issue)

        old_state = issue.state
        # Only move the issue if it is still in a started state — a manual status
        # change after the boundary must not be overwritten.
        target_state = None
        moved = False
        warning = False
        if old_state and old_state.group == "started":
            target_state = _pick_unstarted_state(issue)
            if target_state and target_state.id != issue.state_id:
                issue.state = target_state
                issue.save(update_fields=["state", "updated_at"])
                moved = True
            elif target_state is None:
                warning = True

        receiver_id = log.user_id

    # Side effects outside the lock; this block runs once because only the worker
    # that actually closed the log reaches here.
    if moved and target_state is not None:
        IssueActivity.objects.create(
            issue_id=issue.id,
            project_id=issue.project_id,
            workspace_id=issue.workspace_id,
            actor=None,
            verb="updated",
            field="state",
            old_value=old_state.name if old_state else None,
            new_value=target_state.name,
            old_identifier=old_state.id if old_state else None,
            new_identifier=target_state.id,
            comment="stopped the timer at the end of working hours and updated the state to",
            epoch=int(now.timestamp()),
        )
    if warning:
        log_exception(
            Exception(
                f"working_hours: no unstarted state for project {issue.project_id}; "
                f"timer {log_id} closed, status left unchanged"
            )
        )
    _notify_owner(issue, receiver_id, target_state, moved, warning)


@shared_task
def auto_stop_working_hours_timers():
    """Close every running timer whose working-hours boundary has passed."""
    now = timezone.now()
    due_ids = list(
        IssueTimeLog.objects.filter(
            stopped_at__isnull=True,
            auto_stop_at__isnull=False,
            auto_stop_at__lte=now,
        )
        .order_by("auto_stop_at")
        .values_list("id", flat=True)[:_BATCH_SIZE]
    )
    for log_id in due_ids:
        try:
            _close_one(log_id)
        except Exception as exc:
            log_exception(exc)
