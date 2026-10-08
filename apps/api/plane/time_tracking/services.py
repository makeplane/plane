# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Time entry rules: starting and stopping timers, manual entries, edits and deletes.

Views stay thin: they parse input, call into here and serialize the result. Every rule
violation raises ``TimeTrackingError``, which views turn into
``{"error": ..., "code": ..., "field": ...}``.
"""

# Python imports
import zoneinfo
from datetime import timedelta

# Django imports
from django.db import IntegrityError, transaction
from django.utils import timezone

# Module imports
from plane.db.models import Issue, Project, User

from .access import TimeTrackingAccess, is_project_logger
from .constants import (
    BULK_MAX_IDS,
    DESCRIPTION_MAX_LENGTH,
    FUTURE_TOLERANCE_SECONDS,
    MANUAL_MIN_SECONDS,
    TIME_ENTRY_MAX_SECONDS,
    TIMER_AUTO_STOP_SECONDS,
    TIMER_MIN_SECONDS,
)
from .models import ProjectTimeSetting, TimeEntry

UNSET = object()


class TimeTrackingError(Exception):
    def __init__(self, code, message, field=None, status=400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.field = field
        self.status = status

    def as_data(self):
        data = {"error": self.message, "code": self.code}
        if self.field:
            data["field"] = self.field
        return data


def forbidden(message="You don't have permission to do this.", field=None):
    return TimeTrackingError("FORBIDDEN", message, field=field, status=403)


# Helpers


def local_date_for(user, dt):
    """The calendar date of ``dt`` in the user's timezone."""
    try:
        tz = zoneinfo.ZoneInfo(user.user_timezone or "UTC")
    except (zoneinfo.ZoneInfoNotFoundError, ValueError):
        tz = zoneinfo.ZoneInfo("UTC")
    return dt.astimezone(tz).date()


def get_default_billable(project) -> bool:
    value = ProjectTimeSetting.objects.filter(project_id=project.id).values_list("default_billable", flat=True).first()
    return bool(value)


def running_entries():
    return TimeEntry.objects.filter(started_at__isnull=False, ended_at__isnull=True)


def get_running_timer(workspace_id, user_id, lock=False):
    entries = running_entries().filter(workspace_id=workspace_id, user_id=user_id)
    if lock:
        entries = entries.select_for_update(of=("self",))
    return entries.select_related("project", "issue", "issue__state").first()


def _validate_description(description):
    if description is not None and len(description) > DESCRIPTION_MAX_LENGTH:
        raise TimeTrackingError(
            "DESCRIPTION_TOO_LONG",
            f"The description can be at most {DESCRIPTION_MAX_LENGTH} characters.",
            field="description",
        )


def _save(entry, actor=None, fields=None):
    """Save without the request-user magic in BaseModel.save, which clears created_by outside a request."""
    if actor is not None:
        entry.updated_by_id = actor.id
    if fields is not None:
        fields = list(set(fields) | {"updated_at", "updated_by"})
    entry.save(update_fields=fields, disable_auto_set_user=True)


def _soft_delete(entry, actor=None):
    # A time entry has no dependants, so skip the soft-delete cascade task that Model.delete() queues.
    entry.deleted_at = timezone.now()
    _save(entry, actor, ["deleted_at"])


def _get_project(access, project_id):
    project = Project.objects.filter(id=project_id, workspace_id=access.workspace.id).first()
    if project is None:
        raise TimeTrackingError(
            "PROJECT_NOT_LOGGABLE", "This project doesn't exist or can't take time.", "project_id", 403
        )
    return project


def _get_loggable_issue(access, issue_id, project=None):
    """The work item to log against; it must be live and belong to ``project`` (when given)."""
    issue = (
        Issue.all_objects.filter(id=issue_id, workspace_id=access.workspace.id)
        .select_related("project", "state")
        .first()
    )
    if issue is None or issue.deleted_at is not None:
        raise TimeTrackingError("ISSUE_NOT_LOGGABLE", "This work item can't take time.", "issue_id")
    if project is not None and issue.project_id != project.id:
        raise TimeTrackingError(
            "ISSUE_NOT_IN_PROJECT", "This work item doesn't belong to the selected project.", "issue_id"
        )
    # issue_objects excludes archived, draft and triage/intake work items
    if not Issue.issue_objects.filter(id=issue.id).exists():
        raise TimeTrackingError(
            "ISSUE_NOT_LOGGABLE",
            "Time can't be logged on archived, draft or intake work items.",
            "issue_id",
        )
    return issue


def resolve_target(access, project_id=None, issue_id=None):
    """(project, issue) for a new entry. If only the work item is given, its project is used."""
    if issue_id is None and project_id is None:
        raise TimeTrackingError("VALIDATION_ERROR", "Choose a project or a work item.", "project_id")
    project = _get_project(access, project_id) if project_id is not None else None
    if project is not None and (project.archived_at is not None):
        raise TimeTrackingError("PROJECT_NOT_LOGGABLE", "This project is archived.", "project_id", 403)
    issue = None
    if issue_id is not None:
        issue = _get_loggable_issue(access, issue_id, project)
        if project is None:
            project = issue.project
            if project.archived_at is not None or project.deleted_at is not None:
                raise TimeTrackingError("PROJECT_NOT_LOGGABLE", "This project is archived.", "project_id", 403)
    return project, issue


def _check_can_log(access, actor, project, owner):
    """The actor may create time for ``owner`` in ``project``."""
    if owner.id == actor.id:
        if not access.can_log_own(project):
            raise TimeTrackingError(
                "PROJECT_NOT_LOGGABLE",
                "You need to be an admin or member of this project to log time.",
                "project_id",
                403,
            )
        return
    if not access.can_log_for_others(project):
        raise forbidden("Only project admins can log time for someone else.", "user_id")
    if not is_project_logger(project.id, owner.id):
        raise TimeTrackingError(
            "TARGET_USER_NOT_PROJECT_MEMBER",
            "This person isn't an admin or member of the project.",
            "user_id",
        )


def _get_owner(access, user_id, actor):
    if user_id is None or str(user_id) == str(actor.id):
        return actor
    owner = User.objects.filter(id=user_id).first()
    if owner is None:
        raise TimeTrackingError(
            "TARGET_USER_NOT_PROJECT_MEMBER", "This person isn't an admin or member of the project.", "user_id"
        )
    return owner


def _check_duration(seconds, minimum=MANUAL_MIN_SECONDS, field="duration_seconds"):
    if seconds is None or seconds < minimum or seconds > TIME_ENTRY_MAX_SECONDS:
        raise TimeTrackingError(
            "DURATION_OUT_OF_RANGE",
            "A time entry must be between 1 minute and 24 hours.",
            field,
        )


def _check_not_future_date(owner, spent_on, now):
    if spent_on > local_date_for(owner, now):
        raise TimeTrackingError("FUTURE_TIME", "Time can't be logged on a future date.", "spent_on")


def _check_time_range(started_at, ended_at, now):
    if ended_at <= started_at:
        raise TimeTrackingError("INVALID_TIME_RANGE", "The end time must be after the start time.", "ended_at")
    if ended_at > now + timedelta(seconds=FUTURE_TOLERANCE_SECONDS):
        raise TimeTrackingError("FUTURE_TIME", "The end time can't be in the future.", "ended_at")
    seconds = int((ended_at - started_at).total_seconds())
    _check_duration(seconds, field="ended_at")
    return seconds


# Activity


def _queue_activity(entry, verb, actor, issue_id, old_seconds=None, new_seconds=None):
    """Record work item activity after the transaction commits (plan 8.2)."""
    if issue_id is None:
        return
    from .tasks import record_time_entry_activity

    entry_id = str(entry.id)
    actor_id = str(actor.id) if actor is not None else None
    issue_id = str(issue_id)
    epoch = int(timezone.now().timestamp())
    transaction.on_commit(
        lambda: record_time_entry_activity.delay(
            entry_id=entry_id,
            verb=verb,
            actor_id=actor_id,
            issue_id=issue_id,
            old_seconds=old_seconds,
            new_seconds=new_seconds,
            epoch=epoch,
        )
    )


# Timers


def stop_timer(entry, at=None, auto=False, actor=None, description=None):
    """Stop a running entry. Returns ``(entry, discarded)``.

    - over 12 h: capped at exactly start + 12 h and flagged ``auto_stopped``
    - under 60 s: discarded (soft-deleted) as an accidental start (A4)
    - otherwise ends at ``at``; ``spent_on`` stays the start date (A5)
    """
    at = at or timezone.now()
    elapsed = (at - entry.started_at).total_seconds()
    if description is not None:
        _validate_description(description)
        entry.description = description

    if elapsed > TIMER_AUTO_STOP_SECONDS:
        entry.ended_at = entry.started_at + timedelta(seconds=TIMER_AUTO_STOP_SECONDS)
        entry.duration_seconds = TIMER_AUTO_STOP_SECONDS
        entry.auto_stopped = True
    elif elapsed < TIMER_MIN_SECONDS:
        _soft_delete(entry, actor)
        return None, True
    else:
        entry.ended_at = at
        entry.duration_seconds = int(elapsed)
        entry.auto_stopped = auto

    _save(entry, actor, ["ended_at", "duration_seconds", "auto_stopped", "description"])
    _queue_activity(entry, "created", actor or entry.user, entry.issue_id, new_seconds=entry.duration_seconds)
    return entry, False


def start_timer(access: TimeTrackingAccess, actor, project_id=None, issue_id=None, description="", is_billable=None):
    """Start a timer, stopping the current one first. Returns ``(timer, stopped, stopped_discarded)``."""
    _validate_description(description)
    project, issue = resolve_target(access, project_id, issue_id)
    _check_can_log(access, actor, project, actor)

    now = timezone.now()
    try:
        with transaction.atomic():
            stopped, stopped_discarded = None, False
            running = get_running_timer(access.workspace.id, actor.id, lock=True)
            if running is not None:
                stopped, stopped_discarded = stop_timer(running, at=now, actor=actor)

            timer = TimeEntry(
                project=project,
                workspace_id=project.workspace_id,
                issue=issue,
                user=actor,
                spent_on=local_date_for(actor, now),
                started_at=now,
                description=description or "",
                is_billable=get_default_billable(project) if is_billable is None else is_billable,
                source=TimeEntry.Source.TIMER,
            )
            timer.save(created_by_id=actor.id)
    except IntegrityError:
        raise TimeTrackingError(
            "TIMER_CONFLICT", "Another timer was started at the same time. Refresh and try again.", status=409
        )
    return timer, stopped, stopped_discarded


def update_running_timer(access, actor, entry, data, now=None):
    """Edit the owner's running timer: description, work item, project, billable and start time."""
    now = now or timezone.now()
    if entry.user_id != actor.id:
        raise forbidden("Only the owner can change a running timer.")
    fields = set()

    if "description" in data:
        _validate_description(data["description"])
        entry.description = data["description"] or ""
        fields.add("description")

    if "project_id" in data or "issue_id" in data:
        project, issue = _resolve_changed_target(access, entry, data)
        _check_can_log(access, actor, project, actor)
        entry.project, entry.workspace_id, entry.issue = project, project.workspace_id, issue
        fields |= {"project", "issue"}

    if data.get("is_billable") is not None:
        entry.is_billable = data["is_billable"]
        fields.add("is_billable")

    if data.get("started_at") is not None:
        started_at = data["started_at"]
        if started_at > now:
            raise TimeTrackingError("FUTURE_TIME", "The start time can't be in the future.", "started_at")
        if started_at < now - timedelta(seconds=TIMER_AUTO_STOP_SECONDS):
            raise TimeTrackingError(
                "DURATION_OUT_OF_RANGE", "The start time must be within the last 12 hours.", "started_at"
            )
        entry.started_at = started_at
        entry.spent_on = local_date_for(entry.user, started_at)
        fields |= {"started_at", "spent_on"}

    if fields:
        _save(entry, actor, fields)
    return entry


def discard_timer(entry, actor):
    if entry.user_id != actor.id:
        raise forbidden("Only the owner can discard a running timer.")
    _soft_delete(entry, actor)


# Manual entries


def create_manual_entry(access: TimeTrackingAccess, actor, data, now=None):
    """Create a manual entry in duration mode (spent_on + duration) or start/end mode."""
    now = now or timezone.now()
    has_duration = data.get("duration_seconds") is not None
    has_start, has_end = data.get("started_at") is not None, data.get("ended_at") is not None
    if has_duration == (has_start or has_end) or has_start != has_end:
        raise TimeTrackingError(
            "AMBIGUOUS_ENTRY_MODE", "Send either a duration, or a start and an end time.", "duration_seconds"
        )
    description = data.get("description") or ""
    _validate_description(description)

    project, issue = resolve_target(access, data.get("project_id"), data.get("issue_id"))
    owner = _get_owner(access, data.get("user_id"), actor)
    _check_can_log(access, actor, project, owner)

    entry = TimeEntry(
        project=project,
        workspace_id=project.workspace_id,
        issue=issue,
        user=owner,
        description=description,
        source=TimeEntry.Source.MANUAL,
    )
    if has_duration:
        _check_duration(data["duration_seconds"])
        spent_on = data.get("spent_on") or local_date_for(owner, now)
        _check_not_future_date(owner, spent_on, now)
        entry.spent_on = spent_on
        entry.duration_seconds = data["duration_seconds"]
    else:
        entry.duration_seconds = _check_time_range(data["started_at"], data["ended_at"], now)
        entry.started_at, entry.ended_at = data["started_at"], data["ended_at"]
        # in start/end mode spent_on always follows the start time (6.4)
        entry.spent_on = local_date_for(owner, data["started_at"])

    is_billable = data.get("is_billable")
    entry.is_billable = get_default_billable(project) if is_billable is None else is_billable

    with transaction.atomic():
        entry.save(created_by_id=actor.id)
        _queue_activity(entry, "created", actor, entry.issue_id, new_seconds=entry.duration_seconds)
    return entry


def _resolve_changed_target(access, entry, data):
    """The (project, issue) an edit moves an entry to.

    Changing the project without a work item clears the work item, unless it belongs to the new project.
    The loggable-issue check only applies when the work item actually changes.
    """
    project_id = data.get("project_id", entry.project_id) or entry.project_id
    project = entry.project if str(project_id) == str(entry.project_id) else _get_project(access, project_id)

    if "issue_id" in data:
        issue_id = data["issue_id"]
    elif entry.issue_id is not None and entry.issue.project_id == project.id:
        issue_id = entry.issue_id
    else:
        issue_id = None

    if issue_id is None:
        return project, None
    if str(issue_id) == str(entry.issue_id):
        return project, entry.issue
    if "project_id" not in data:
        # only the work item was sent: take the project from it
        issue = _get_loggable_issue(access, issue_id)
        project = issue.project
    else:
        issue = _get_loggable_issue(access, issue_id, project)
    return project, issue


def update_entry(access: TimeTrackingAccess, actor, entry, data, now=None):
    """PATCH semantics from plan 6.5."""
    now = now or timezone.now()
    if not access.can_edit(entry):
        raise forbidden("You can't edit this time entry.")
    if entry.is_running:
        if entry.user_id != actor.id:
            raise forbidden("Only the owner can change a running timer.")
        return update_running_timer(access, actor, entry, data, now)

    is_owner = entry.user_id == actor.id
    if data.get("confirm") and not is_owner:
        raise forbidden("Only the owner can confirm an auto-stopped entry.", "confirm")

    old_issue_id, old_seconds = entry.issue_id, entry.duration_seconds
    fields = set()

    # description, billable
    if "description" in data:
        _validate_description(data["description"])
        entry.description = data["description"] or ""
        fields.add("description")
    if data.get("is_billable") is not None:
        entry.is_billable = data["is_billable"]
        fields.add("is_billable")

    # owner, project, work item
    owner = entry.user
    if data.get("user_id") is not None and str(data["user_id"]) != str(entry.user_id):
        owner = _get_owner(access, data["user_id"], actor)
    if "project_id" in data or "issue_id" in data:
        project, issue = _resolve_changed_target(access, entry, data)
    else:
        project, issue = entry.project, entry.issue

    owner_changed = owner.id != entry.user_id
    project_changed = project.id != entry.project_id
    if owner_changed or project_changed:
        if project.archived_at is not None:
            raise TimeTrackingError("PROJECT_NOT_LOGGABLE", "This project is archived.", "project_id", 403)
        if owner_changed and not (access.is_workspace_admin or access.is_project_admin(project.id)):
            raise forbidden("Only project admins can change who an entry belongs to.", "user_id")
        # the (owner, project) pair must be one the actor could create from scratch
        _check_can_log(access, actor, project, owner)
    if owner_changed:
        entry.user = owner
        fields.add("user")
    if project_changed or issue is not entry.issue:
        entry.project, entry.workspace_id, entry.issue = project, project.workspace_id, issue
        fields |= {"project", "issue"}

    # time
    fields |= _apply_time_changes(entry, data, owner, now)

    # any edit by the owner, or an explicit confirm, clears the "needs review" flag
    if entry.auto_stopped and is_owner and (fields or data.get("confirm")):
        entry.auto_stopped = False
        fields.add("auto_stopped")

    if fields:
        with transaction.atomic():
            _save(entry, actor, fields)
            _queue_update_activity(entry, actor, old_issue_id, old_seconds)
    return entry


def _apply_time_changes(entry, data, owner, now):
    """Apply duration / start / end / spent_on changes. Returns the changed field names."""
    keys = {"duration_seconds", "started_at", "ended_at", "spent_on"} & set(data.keys())
    if not keys:
        return set()

    started_at = data["started_at"] if "started_at" in data else entry.started_at
    ended_at = data["ended_at"] if "ended_at" in data else entry.ended_at
    duration = data.get("duration_seconds")

    if started_at is None and ended_at is None:
        # duration mode (possibly converted from start/end by clearing both times)
        duration = duration if duration is not None else entry.duration_seconds
        _check_duration(duration)
        spent_on = data.get("spent_on") or entry.spent_on
        if "spent_on" in data:
            _check_not_future_date(owner, spent_on, now)
        entry.started_at, entry.ended_at, entry.duration_seconds, entry.spent_on = None, None, duration, spent_on
        return {"started_at", "ended_at", "duration_seconds", "spent_on"}

    if "spent_on" in data:
        raise TimeTrackingError(
            "SPENT_ON_DERIVED", "This entry has times; move the start time to change its date.", "spent_on"
        )
    if started_at is None:
        raise TimeTrackingError("INVALID_TIME_RANGE", "An end time needs a start time.", "started_at")
    if duration is not None and "ended_at" not in data:
        # a new duration on a start/end entry keeps the start and moves the end
        _check_duration(duration)
        ended_at = started_at + timedelta(seconds=duration)
    elif ended_at is None:
        raise TimeTrackingError("INVALID_TIME_RANGE", "A start time needs an end time.", "ended_at")

    entry.duration_seconds = _check_time_range(started_at, ended_at, now)
    entry.started_at, entry.ended_at = started_at, ended_at
    entry.spent_on = local_date_for(owner, started_at)
    return {"started_at", "ended_at", "duration_seconds", "spent_on"}


def _queue_update_activity(entry, actor, old_issue_id, old_seconds):
    new_issue_id, new_seconds = entry.issue_id, entry.duration_seconds
    if old_issue_id == new_issue_id:
        if old_seconds != new_seconds:
            _queue_activity(entry, "updated", actor, new_issue_id, old_seconds, new_seconds)
        return
    _queue_activity(entry, "deleted", actor, old_issue_id, old_seconds=old_seconds)
    _queue_activity(entry, "created", actor, new_issue_id, new_seconds=new_seconds)


def delete_entry(access: TimeTrackingAccess, actor, entry):
    if not access.can_edit(entry):
        raise forbidden("You can't delete this time entry.")
    with transaction.atomic():
        _soft_delete(entry, actor)
        if not entry.is_running:
            _queue_activity(entry, "deleted", actor, entry.issue_id, old_seconds=entry.duration_seconds)


def bulk_update(access: TimeTrackingAccess, actor, action, ids, is_billable=None):
    """All-or-nothing bulk delete / set billable. Returns the number of entries changed."""
    ids = list(dict.fromkeys(str(i) for i in ids))
    if len(ids) > BULK_MAX_IDS:
        raise TimeTrackingError("BULK_LIMIT", f"At most {BULK_MAX_IDS} entries can be changed at once.", "ids")
    if action == "set_billable" and is_billable is None:
        raise TimeTrackingError("VALIDATION_ERROR", "Choose billable or non-billable.", "is_billable")

    with transaction.atomic():
        entries = list(
            access.visible_entries().filter(id__in=ids).select_related("project").select_for_update(of=("self",))
        )
        if len(entries) != len(ids):
            raise forbidden("Some of these entries can't be changed.", "ids")
        for entry in entries:
            if not access.can_edit(entry) or (entry.is_running and entry.user_id != actor.id and action != "delete"):
                raise forbidden("Some of these entries can't be changed.", "ids")

        for entry in entries:
            if action == "delete":
                _soft_delete(entry, actor)
                if not entry.is_running:
                    _queue_activity(entry, "deleted", actor, entry.issue_id, old_seconds=entry.duration_seconds)
            else:
                entry.is_billable = is_billable
                fields = {"is_billable"}
                if entry.auto_stopped and entry.user_id == actor.id:
                    entry.auto_stopped = False
                    fields.add("auto_stopped")
                _save(entry, actor, fields)
    return len(entries)
