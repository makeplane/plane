# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.utils.dateparse import parse_date

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.team_ops.services.time_entry import MAX_RANGE_DAYS


def parse_day(value, name):
    """A `YYYY-MM-DD` query or path value as a date."""
    try:
        day = parse_date(str(value))
    except ValueError:
        day = None
    if day is None:
        raise ParseError(detail=f"Invalid {name}. Use YYYY-MM-DD.")
    return day


def parse_day_range(params, require=False, max_days=MAX_RANGE_DAYS):
    """Return (first_day, last_day), both inclusive, from `from` / `to` query params.

    Either may be `None` unless `require` is set. Ranges are capped at `max_days` days.
    """
    raw_start = params.get("from")
    raw_end = params.get("to")
    if require and not (raw_start and raw_end):
        raise ParseError(detail="Both from and to are required.")

    start = parse_day(raw_start, "from") if raw_start else None
    end = parse_day(raw_end, "to") if raw_end else None

    if start and end:
        if end < start:
            raise ParseError(detail="to must not be before from.")
        if (end - start).days + 1 > max_days:
            raise ParseError(detail=f"The range cannot be longer than {max_days} days.")
    return start, end
