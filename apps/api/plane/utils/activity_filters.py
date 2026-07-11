# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared query-param parsing for the workspace activity feed endpoints.

Used by the internal workspace activity feed, the per-user activity endpoint
and the v1 (token) workspace activities endpoint so the three views validate
`actor` / `project` / `start_date` / `end_date` identically.
"""

# Python imports
import re
import uuid
from datetime import datetime

DATE_FORMAT = "%Y-%m-%d"
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class ActivityFilterError(Exception):
    """Raised when an activity feed query parameter fails validation."""

    def __init__(self, detail):
        self.detail = detail
        super().__init__(detail)


def parse_uuid_list(values, param_name):
    """Validate raw query-param values as UUIDs.

    Returns the canonical string form of each UUID; raises ActivityFilterError
    on the first invalid value.
    """
    parsed = []
    for value in values:
        try:
            parsed.append(str(uuid.UUID(str(value))))
        except (ValueError, TypeError, AttributeError):
            raise ActivityFilterError(f"Invalid {param_name} parameter: '{value}' is not a valid UUID.")
    return parsed


def parse_date_param(value, param_name):
    """Parse a strict YYYY-MM-DD date query parameter (empty/absent passes through)."""
    if value in (None, ""):
        return None
    if not _DATE_RE.match(value):
        raise ActivityFilterError(f"Invalid {param_name} parameter: '{value}'. Expected format YYYY-MM-DD.")
    try:
        return datetime.strptime(value, DATE_FORMAT).date()
    except ValueError:
        raise ActivityFilterError(f"Invalid {param_name} parameter: '{value}' is not a valid calendar date.")


def parse_date_range(query_params):
    """Parse and validate the start_date/end_date pair of an activity request."""
    start_date = parse_date_param(query_params.get("start_date"), "start_date")
    end_date = parse_date_param(query_params.get("end_date"), "end_date")
    if start_date and end_date and start_date > end_date:
        raise ActivityFilterError("start_date cannot be after end_date.")
    return start_date, end_date


def apply_date_range(queryset, start_date, end_date):
    """Filter *queryset* on created_at with inclusive [start_date, end_date] bounds."""
    if start_date:
        queryset = queryset.filter(created_at__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__date__lte=end_date)
    return queryset


def parse_activity_filters(query_params):
    """Parse the full activity feed filter set (actors, projects, date range)."""
    actor_ids = parse_uuid_list(query_params.getlist("actor"), "actor")
    project_ids = parse_uuid_list(query_params.getlist("project"), "project")
    start_date, end_date = parse_date_range(query_params)
    return {
        "actor_ids": actor_ids,
        "project_ids": project_ids,
        "start_date": start_date,
        "end_date": end_date,
    }


def apply_activity_filters(queryset, filters):
    """Apply parsed activity filters to an IssueActivity queryset."""
    if filters["actor_ids"]:
        queryset = queryset.filter(actor_id__in=filters["actor_ids"])
    if filters["project_ids"]:
        queryset = queryset.filter(project_id__in=filters["project_ids"])
    return apply_date_range(queryset, filters["start_date"], filters["end_date"])
