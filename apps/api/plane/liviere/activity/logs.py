# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Activity log entries: what a person or an AI agent did in a project and when, written through the API or
# the "Activity" page. Stored as ActivityEvent (source "log", kind "log.entry"); occurred_at is the start
# of the work and ended_at its optional end, so an entry fills every heatmap quarter of its range.

# Python imports
from datetime import timedelta
from uuid import UUID

# Django imports
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# Module imports
from plane.app.permissions import ROLE
from plane.db.models import Issue, ProjectMember, ProjectPage, WorkspaceMember

MAX_TEXT_LENGTH = 4000
MAX_RANGE = timedelta(hours=12)
# Clocks of agents and browsers drift a little
FUTURE_TOLERANCE = timedelta(minutes=5)
TIME_FIELDS = ("started_at", "ended_at", "duration_minutes")


class InvalidLog(ValueError):
    pass


def is_project_admin(user, slug, project_id):
    """Project admin, or workspace admin who is a member of the project (as in allow_permission)."""
    members = ProjectMember.objects.filter(member=user, workspace__slug=slug, project_id=project_id, is_active=True)
    if members.filter(role=ROLE.ADMIN.value).exists():
        return True
    return (
        members.exists()
        and WorkspaceMember.objects.filter(
            member=user, workspace__slug=slug, role=ROLE.ADMIN.value, is_active=True
        ).exists()
    )


def _moment(value, name, zone):
    try:
        moment = parse_datetime(value.replace(" ", "T")) if isinstance(value, str) else None
    except ValueError:
        moment = None
    if moment is None:
        raise InvalidLog(f"'{name}' must be an ISO 8601 date-time")
    return moment.replace(tzinfo=zone) if timezone.is_naive(moment) else moment


def _minutes(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value <= 0:
        raise InvalidLog("'duration_minutes' must be a positive number")
    return timedelta(minutes=value)


def _time_range(data, zone, current=None):
    """
    (start, end) from started_at, ended_at and duration_minutes. A new entry with only a duration ends
    now; one with no time at all starts now and has no end. On a change, missing values come from
    `current`, and a new start keeps the length of the entry.
    """
    now = timezone.now()
    if data.get("ended_at") is not None and data.get("duration_minutes") is not None:
        raise InvalidLog("Send 'ended_at' or 'duration_minutes', not both")
    start = _moment(data["started_at"], "started_at", zone) if data.get("started_at") is not None else None
    duration = _minutes(data["duration_minutes"]) if data.get("duration_minutes") is not None else None

    if "ended_at" in data:
        end = _moment(data["ended_at"], "ended_at", zone) if data["ended_at"] is not None else None
    elif current is not None and current.ended_at and start is not None:
        end = start + (current.ended_at - current.occurred_at)
    else:
        end = current.ended_at if current is not None else None

    if duration:
        if start is None and current is None:
            start, end = now - duration, now
        else:
            start = start or current.occurred_at
            end = start + duration
    elif start is None:
        if current is not None:
            start = current.occurred_at
        elif end is not None:
            raise InvalidLog("'ended_at' needs 'started_at'")
        else:
            start = now

    if max(start, end or start) > now + FUTURE_TOLERANCE:
        raise InvalidLog("The entry must not end in the future")
    if end is not None:
        if end <= start:
            raise InvalidLog("The end must be after the start")
        if end - start > MAX_RANGE:
            raise InvalidLog(f"An entry must not be longer than {int(MAX_RANGE.total_seconds() // 3600)} hours")
    return start, end


def _issue_id(project, value):
    """Work item of the project by UUID or identifier such as "ORD-12"."""
    issues = Issue.objects.filter(project_id=project.id)
    try:
        issue_id = issues.filter(id=UUID(str(value))).values_list("id", flat=True).first()
    except ValueError:
        identifier, _, sequence = str(value).strip().rpartition("-")
        issue_id = None
        if identifier.upper() == project.identifier.upper() and sequence.isdigit():
            issue_id = issues.filter(sequence_id=int(sequence)).values_list("id", flat=True).first()
    if issue_id is None:
        raise InvalidLog(f"Work item {value} not found in this project")
    return issue_id


def _page_id(project, value):
    try:
        page_id = UUID(str(value))
    except ValueError:
        raise InvalidLog("'page' must be a page UUID")
    if not ProjectPage.objects.filter(project_id=project.id, page_id=page_id, page__deleted_at__isnull=True).exists():
        raise InvalidLog(f"Page {value} not found in this project")
    return page_id


def log_changes(data, project, zone, current=None):
    """Validated model fields from a request body; `current` is the entry being changed (PATCH)."""
    if not isinstance(data, dict):
        raise InvalidLog("The body must be a JSON object")
    unknown = set(data) - {"text", "issue", "page", *TIME_FIELDS}
    if unknown:
        raise InvalidLog(f"Unknown fields: {', '.join(sorted(unknown))}")
    changes = {}

    if current is None or "text" in data:
        text = data.get("text")
        if not isinstance(text, str) or not text.strip():
            raise InvalidLog("'text' is required")
        if len(text.strip()) > MAX_TEXT_LENGTH:
            raise InvalidLog(f"'text' must not be longer than {MAX_TEXT_LENGTH} characters")
        changes["note"] = text.strip()

    if current is None or any(name in data for name in TIME_FIELDS):
        changes["occurred_at"], changes["ended_at"] = _time_range(data, zone, current)

    for name, field, resolve in (("issue", "issue_id", _issue_id), ("page", "page_id", _page_id)):
        if name in data:
            changes[field] = resolve(project, data[name]) if data[name] not in (None, "") else None

    if current is not None and not changes:
        raise InvalidLog(f"Nothing to change: send 'text', 'issue', 'page' or {', '.join(TIME_FIELDS)}")
    return changes
