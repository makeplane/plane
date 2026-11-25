# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Skipped periods of the project activity (LS-11): single ranges from-to with a description, e.g. a night of
# automated tests, that the time report leaves out for every source (report.person_ranges). The Activity grid
# marks their quarters but keeps counting them. Project admins change them in the app; members and the API
# only read them. Periods may overlap and may lie in the future.

# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone
from django.utils.dateparse import parse_datetime

MAX_LENGTH = timedelta(days=31)
MAX_DESCRIPTION_LENGTH = 500


class InvalidSkipPeriod(ValueError):
    pass


def _moment(value, name, zone):
    try:
        moment = parse_datetime(value.replace(" ", "T")) if isinstance(value, str) else None
    except ValueError:
        moment = None
    if moment is None:
        raise InvalidSkipPeriod(f"'{name}' must be an ISO 8601 date-time")
    return moment.replace(tzinfo=zone) if timezone.is_naive(moment) else moment


def skip_changes(data, zone, current=None):
    """Validated fields of a new period, or of a change to `current`. Times without an offset are in `zone`."""
    changes = {}
    for name in ("starts_at", "ends_at"):
        if name in data:
            changes[name] = _moment(data[name], name, zone)
        elif current is None:
            raise InvalidSkipPeriod(f"'{name}' is required")
    if "description" in data:
        description = data["description"]
        if description is None:
            description = ""
        if not isinstance(description, str) or len(description) > MAX_DESCRIPTION_LENGTH:
            raise InvalidSkipPeriod(f"'description' must be a text of at most {MAX_DESCRIPTION_LENGTH} characters")
        changes["description"] = description.strip()
    starts_at = changes.get("starts_at", current.starts_at if current else None)
    ends_at = changes.get("ends_at", current.ends_at if current else None)
    if ends_at <= starts_at:
        raise InvalidSkipPeriod("'ends_at' must be after 'starts_at'")
    if ends_at - starts_at > MAX_LENGTH:
        raise InvalidSkipPeriod("A skipped period must not be longer than 31 days")
    return changes


def serialize_skip(period, zone):
    return {
        "id": period.id,
        "starts_at": period.starts_at.astimezone(zone).isoformat(),
        "ends_at": period.ends_at.astimezone(zone).isoformat(),
        "description": period.description,
        "created_by": str(period.created_by_id) if period.created_by_id else None,
        "created_at": period.created_at.isoformat(),
        "updated_at": period.updated_at.isoformat(),
    }


def skip_periods(project_id, since=None, until=None):
    """Periods of the project overlapping [since, until), oldest first."""
    # Imported here: the report's pure functions are tested without Django
    from plane.liviere.models import ActivitySkipPeriod

    periods = ActivitySkipPeriod.objects.filter(project_id=project_id)
    if since is not None:
        periods = periods.filter(ends_at__gt=since)
    if until is not None:
        periods = periods.filter(starts_at__lt=until)
    return list(periods.order_by("starts_at", "id"))
