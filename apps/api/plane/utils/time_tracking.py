# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime

from django.db import IntegrityError, models
from django.utils import timezone
from plane.db.models import IssueTimeLog


def ensure_actor_is_assignee(issue, actor):
    """Make sure `actor` is an assignee of `issue`.

    If the issue has no assignees, or has assignees that don't include
    `actor`, the assignees are replaced with just `actor`.
    """
    from plane.db.models import IssueAssignee

    if actor is None:
        return

    current_assignee_ids = set(
        IssueAssignee.objects.filter(issue=issue).values_list("assignee_id", flat=True)
    )
    if current_assignee_ids == {actor.id}:
        return

    IssueAssignee.objects.filter(issue=issue).delete()
    try:
        IssueAssignee.objects.create(
            assignee=actor,
            issue=issue,
            project=issue.project,
            workspace=issue.workspace,
            created_by=actor,
            updated_by=actor,
        )
    except IntegrityError:
        pass


def resolve_time_log_user(data, project_id, default_user):
    """Resolve the user a manual time log entry should be attributed to.

    If `user_id` isn't provided, falls back to `default_user`. Otherwise
    validates that `user_id` is an active member of the project.
    Returns (user, error_message).
    """
    from plane.db.models import ProjectMember, User

    user_id = data.get("user_id")
    if not user_id:
        return default_user, None

    if not ProjectMember.objects.filter(project_id=project_id, member_id=user_id, is_active=True).exists():
        return None, "user_id is not a member of this project"

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return None, "user_id is not a member of this project"

    return user, None


def is_time_log_admin(user, project_id, workspace_slug):
    """Return whether a user can manage every time log in a project."""
    from plane.db.models import ProjectMember, WorkspaceMember
    from plane.db.models.project import ROLE

    project_membership = ProjectMember.objects.filter(
        member=user,
        workspace__slug=workspace_slug,
        project_id=project_id,
        is_active=True,
    )

    return project_membership.filter(role=ROLE.ADMIN.value).exists() or (
        project_membership.exists()
        and WorkspaceMember.objects.filter(
            member=user,
            workspace__slug=workspace_slug,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()
    )


def can_manage_time_log(user, time_log, project_id, workspace_slug):
    """Return whether a user can edit or delete a specific time log."""
    return is_time_log_admin(user, project_id, workspace_slug) or time_log.user_id == user.id


def can_assign_time_log_user(requested_user_id, actor, is_admin):
    """Prevent non-admins from attributing time to another project member."""
    return is_admin or not requested_user_id or str(requested_user_id) == str(actor.id)


def handle_issue_state_change(issue, old_state_id, new_state_id, actor=None):
    """Handle time tracking when an issue's state changes.

    When state transitions to STARTED group: start a new time log.
    When state transitions away from STARTED group: stop the active time log.
    """
    from plane.db.models import State

    if old_state_id == new_state_id:
        return

    now = timezone.now()
    today = now.date()

    # Determine old and new state groups
    old_group = None
    new_group = None

    if old_state_id:
        try:
            old_state = State.all_state_objects.get(pk=old_state_id)
            old_group = old_state.group
        except State.DoesNotExist:
            pass

    if new_state_id:
        try:
            new_state = State.all_state_objects.get(pk=new_state_id)
            new_group = new_state.group
        except State.DoesNotExist:
            pass

    old_is_started = old_group == "started"
    new_is_started = new_group == "started"

    if new_is_started and not old_is_started:
        # Transition INTO started: the actor becomes the assignee, then start a new time log
        ensure_actor_is_assignee(issue, actor)
        IssueTimeLog.objects.create(
            issue=issue,
            user=actor,
            date=today,
            started_at=now,
            stopped_at=None,
            duration_seconds=0,
            workspace=issue.workspace,
            project=issue.project,
            created_by=None,
        )
    elif not new_is_started and old_is_started:
        # Transition OUT OF started: close any active time log
        active_logs = IssueTimeLog.objects.filter(
            issue=issue,
            stopped_at__isnull=True,
        )
        for log in active_logs:
            log.stopped_at = now
            log.duration_seconds = int((now - log.started_at).total_seconds())
            log.save(update_fields=["stopped_at", "duration_seconds", "updated_at"])

        # Update total_time_spent on the issue
        recalculate_total_time_spent(issue)


def force_stop_active_logs(issue):
    """Force stop all active time logs for an issue. Used for manual edits."""
    now = timezone.now()
    active_logs = IssueTimeLog.objects.filter(
        issue=issue,
        stopped_at__isnull=True,
    )
    for log in active_logs:
        log.stopped_at = now
        log.duration_seconds = int((now - log.started_at).total_seconds())
        log.save(update_fields=["stopped_at", "duration_seconds", "updated_at"])

    recalculate_total_time_spent(issue)


def recalculate_total_time_spent(issue):
    """Recalculate total_time_spent from all completed logs."""
    total = IssueTimeLog.objects.filter(issue=issue).exclude(
        stopped_at__isnull=True
    ).aggregate(
        total=models.Sum("duration_seconds")
    )["total"] or 0
    issue.total_time_spent = total
    issue.save(update_fields=["total_time_spent", "updated_at"])


def serialize_time_log(log):
    hours, remainder = divmod(log.duration_seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    return {
        "id": str(log.id),
        "user_id": str(log.user_id) if log.user_id else None,
        "date": log.date.isoformat(),
        "created_at": log.created_at.isoformat(),
        "started_at": log.started_at.isoformat(),
        "stopped_at": log.stopped_at.isoformat() if log.stopped_at else None,
        "duration_seconds": log.duration_seconds,
        "duration_formatted": f"{hours:02d}:{minutes:02d}",
    }


def parse_manual_time_log_payload(data, default_date=None, default_duration_seconds=None):
    """Validate and parse a manual time log payload.

    Accepts either `duration_seconds` directly, or `hours`/`minutes` which are combined.
    Returns (date, duration_seconds, error_message).
    """
    date_str = data.get("date")
    if date_str:
        try:
            log_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return None, None, "date must be in YYYY-MM-DD format"
    elif default_date is not None:
        log_date = default_date
    else:
        return None, None, "date is required"

    if "duration_seconds" in data:
        try:
            duration_seconds = int(data.get("duration_seconds"))
        except (TypeError, ValueError):
            return None, None, "duration_seconds must be an integer"
    elif "hours" in data or "minutes" in data:
        try:
            hours = int(data.get("hours") or 0)
            minutes = int(data.get("minutes") or 0)
        except (TypeError, ValueError):
            return None, None, "hours and minutes must be integers"
        duration_seconds = hours * 3600 + minutes * 60
    elif default_duration_seconds is not None:
        duration_seconds = default_duration_seconds
    else:
        return None, None, "duration_seconds (or hours/minutes) is required"

    if duration_seconds <= 0:
        return None, None, "duration must be greater than zero"

    return log_date, duration_seconds, None
