# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared week-window parsing for the timesheet endpoints.

Single source of truth so the grid, cross-workspace grid, and sub-issues
endpoints all snap to the same Monday and validate the same way. Takes the raw
query-param string (not the request) so every caller passes exactly what it has.
"""

from datetime import date as _date
from datetime import timedelta

from django.utils import timezone


def parse_week_start(raw_date_str):
    """Parse an optional ``week_start`` string and snap it to that week's Monday.

    Returns ``(week_start, week_end, error)``. On success ``error`` is ``None``;
    on a malformed date ``week_start``/``week_end`` are ``None`` and ``error`` is a
    user-facing message. Defaults to the current week's Monday when no value given.
    """
    if raw_date_str:
        try:
            d = _date.fromisoformat(raw_date_str)
        except (ValueError, TypeError):
            return None, None, "Invalid date format. Use YYYY-MM-DD."
        week_start = d - timedelta(days=d.weekday())
    else:
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
    return week_start, week_start + timedelta(days=6), None
