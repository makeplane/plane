# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Day summaries of the project activity (LS-10): a few sentences on what happened in a project on one day,
# written by a person or an AI agent. One per project, local day and author; a POST for a day that already
# has the author's summary replaces it ("replaced": true), so an agent can rewrite its summary at the end of
# the day. Admins and members write; the author or a project admin changes and deletes. Writing a summary is
# not an activity event, so it adds no time to the heatmap or the report.

# Python imports
from datetime import date

# Django imports
from django.utils import timezone

MAX_TEXT_LENGTH = 8000


class InvalidSummary(ValueError):
    pass


def summary_text(value):
    if not isinstance(value, str) or not value.strip():
        raise InvalidSummary("'text' is required")
    if len(value) > MAX_TEXT_LENGTH:
        raise InvalidSummary(f"'text' must not be longer than {MAX_TEXT_LENGTH} characters")
    return value.strip()


def summary_day(value, zone):
    """The local day of a summary: `date` (YYYY-MM-DD) or today in the project time zone; not in the future."""
    today = timezone.now().astimezone(zone).date()
    if value in (None, ""):
        return today
    try:
        day = date.fromisoformat(value) if isinstance(value, str) else None
    except ValueError:
        day = None
    if day is None:
        raise InvalidSummary("'date' must be a date in the YYYY-MM-DD format")
    if day > today:
        raise InvalidSummary("'date' must not be in the future")
    return day


def serialize_summary(summary, replaced=None):
    data = {
        "id": summary.id,
        "date": summary.day.isoformat(),
        "author": (
            {
                "id": str(summary.author_id),
                "display_name": summary.author.display_name,
                "avatar_url": summary.author.avatar_url,
            }
            if summary.author_id
            else None
        ),
        "text": summary.text,
        "created_at": summary.created_at.isoformat(),
        "updated_at": summary.updated_at.isoformat(),
    }
    if replaced is not None:
        data["replaced"] = replaced
    return data


def summaries_by_day(project_id, start, end, actor=None):
    """{date: [{"author", "text"}]} of the period, for the report; authors in name order."""
    # Imported here: the report's pure functions are tested without Django
    from plane.liviere.models import ActivityDaySummary

    rows = ActivityDaySummary.objects.filter(project_id=project_id, day__gte=start, day__lte=end).select_related(
        "author"
    )
    if actor:
        rows = rows.filter(author_id=actor)
    result = {}
    for row in sorted(rows, key=lambda r: (r.day, (r.author.display_name if r.author_id else "~") or "", r.id)):
        result.setdefault(row.day, []).append(
            {
                "id": row.id,
                "author": (
                    {"id": str(row.author_id), "display_name": row.author.display_name} if row.author_id else None
                ),
                "text": row.text,
            }
        )
    return result
