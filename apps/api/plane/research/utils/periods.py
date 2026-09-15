# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Report period calculation (P0-RPT-02).

Weekly reports follow the ISO week (Monday to Sunday), monthly reports follow
the natural calendar month. Both are resolved against an explicit timezone so
the boundary never depends on the server locale.
"""

import re
from datetime import date, timedelta

import pytz
from django.utils import timezone as django_timezone

WEEKLY_PATTERN = re.compile(r"^(\d{4})-W(\d{1,2})$")
MONTHLY_PATTERN = re.compile(r"^(\d{4})-(\d{2})$")


class InvalidPeriod(Exception):
    pass


def today_in(timezone_name=None):
    if not timezone_name:
        return django_timezone.localdate()
    try:
        zone = pytz.timezone(timezone_name)
    except pytz.UnknownTimeZoneError:
        return django_timezone.localdate()
    return django_timezone.now().astimezone(zone).date()


def weekly_period(reference=None, timezone_name=None):
    reference = reference or today_in(timezone_name)
    iso_year, iso_week, _ = reference.isocalendar()
    start = date.fromisocalendar(iso_year, iso_week, 1)
    return f"{iso_year}-W{iso_week:02d}", start, start + timedelta(days=6)


def monthly_period(reference=None, timezone_name=None):
    reference = reference or today_in(timezone_name)
    start = reference.replace(day=1)
    next_month = (start + timedelta(days=32)).replace(day=1)
    return f"{start.year}-{start.month:02d}", start, next_month - timedelta(days=1)


def current_period(report_type, reference=None, timezone_name=None):
    if report_type == "WEEKLY":
        return weekly_period(reference, timezone_name)
    if report_type == "MONTHLY":
        return monthly_period(reference, timezone_name)
    raise InvalidPeriod(f"Unknown report type: {report_type}")


def parse_period(report_type, period_key, timezone_name=None):
    """Resolve an explicit ``period_key`` into ``(key, start, end)``."""
    if not period_key:
        return current_period(report_type, timezone_name=timezone_name)

    key = str(period_key).strip().upper()
    if report_type == "WEEKLY":
        match = WEEKLY_PATTERN.match(key)
        if not match:
            raise InvalidPeriod("Weekly period must look like 2026-W38.")
        year, week = int(match.group(1)), int(match.group(2))
        try:
            start = date.fromisocalendar(year, week, 1)
        except ValueError as error:
            raise InvalidPeriod("Weekly period is out of range.") from error
        return f"{year}-W{week:02d}", start, start + timedelta(days=6)

    if report_type == "MONTHLY":
        match = MONTHLY_PATTERN.match(key)
        if not match:
            raise InvalidPeriod("Monthly period must look like 2026-09.")
        year, month = int(match.group(1)), int(match.group(2))
        if not 1 <= month <= 12:
            raise InvalidPeriod("Monthly period is out of range.")
        start = date(year, month, 1)
        next_month = (start + timedelta(days=32)).replace(day=1)
        return f"{year}-{month:02d}", start, next_month - timedelta(days=1)

    raise InvalidPeriod(f"Unknown report type: {report_type}")


def period_keys_between(report_type, start_date, end_date):
    """Every period key that starts inside the inclusive window."""
    keys = []
    cursor = start_date
    while cursor <= end_date:
        key, period_start, _ = current_period(report_type, reference=cursor)
        if key not in keys:
            keys.append(key)
        cursor = period_start + timedelta(days=7 if report_type == "WEEKLY" else 31)
    return keys
