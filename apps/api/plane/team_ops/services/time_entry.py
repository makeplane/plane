# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import datetime, time, timedelta
from uuid import UUID

# Django imports
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.db.models import WorkspaceMember
from plane.app.permissions import ROLE

# Longest window the summary endpoint will aggregate over.
MAX_RANGE_DAYS = 366


def is_workspace_admin(user, slug):
    return WorkspaceMember.objects.filter(
        member=user, workspace__slug=slug, role=ROLE.ADMIN.value, is_active=True
    ).exists()


def parse_uuid(value, name):
    try:
        return UUID(str(value))
    except ValueError:
        raise ParseError(detail=f"Invalid {name}.")


def _parse_bound(value, name, end):
    """Parse a date or datetime query value into an aware datetime.

    A bare date means the whole local day, so as an upper bound it becomes the
    start of the next day (exclusive). A full datetime is taken as given.
    """
    dt = parse_datetime(value)
    if dt is not None:
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        return dt + timedelta(microseconds=1) if end else dt

    day = parse_date(value)
    if day is None:
        raise ParseError(detail=f"Invalid {name}.")
    start_of_day = timezone.make_aware(datetime.combine(day, time.min))
    return start_of_day + timedelta(days=1) if end else start_of_day


def parse_range(params, require=False):
    """Return (start, end_exclusive) from `from` / `to` query params; either may be None."""
    start = params.get("from")
    end = params.get("to")
    if require and not (start and end):
        raise ParseError(detail="Both from and to are required.")

    start_dt = _parse_bound(start, "from", end=False) if start else None
    end_dt = _parse_bound(end, "to", end=True) if end else None

    if start_dt and end_dt:
        if end_dt <= start_dt:
            raise ParseError(detail="to must be after from.")
        if end_dt - start_dt > timedelta(days=MAX_RANGE_DAYS):
            raise ParseError(detail=f"The range cannot be longer than {MAX_RANGE_DAYS} days.")
    return start_dt, end_dt
