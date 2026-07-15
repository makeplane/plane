# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Working-hours schedule helpers.

Pure functions for computing when a running timer should be automatically
stopped, based on a workspace's working-hours configuration, its timezone and
an offline public-holiday calendar (`python-holidays`). No external HTTP calls.
"""

from datetime import datetime, time, timedelta

import holidays
import pytz

WEEKDAYS = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)

# Guard against infinite scans when a schedule has no working days at all.
_MAX_LOOKAHEAD_DAYS = 366


def _parse_hhmm(value):
    """Parse an "HH:mm" string into a time, or None if malformed."""
    if not value or not isinstance(value, str):
        return None
    try:
        hour_str, minute_str = value.split(":")
        return time(hour=int(hour_str), minute=int(minute_str))
    except (ValueError, TypeError):
        return None


def _localize(tz, naive_dt):
    """Localize a naive datetime, tolerating DST gaps/overlaps."""
    try:
        return tz.localize(naive_dt, is_dst=None)
    except (pytz.exceptions.AmbiguousTimeError, pytz.exceptions.NonExistentTimeError):
        return tz.localize(naive_dt, is_dst=False)


def _validate_interval(start_str, end_str, label, errors):
    start = _parse_hhmm(start_str)
    end = _parse_hhmm(end_str)
    if start is None or end is None:
        errors.append(f"{label}: start and end must be in HH:mm format.")
    elif start >= end:
        errors.append(f"{label}: start must be before end.")


def validate_working_hours_config(value):
    """Validate a working-hours config dict. Returns a list of error strings."""
    errors = []
    if not isinstance(value, dict):
        return ["working_hours must be an object."]

    enabled = bool(value.get("enabled"))

    global_hours = value.get("global_hours") or {}
    _validate_interval(
        global_hours.get("start"), global_hours.get("end"), "global_hours", errors
    )

    days = value.get("days") or {}
    if not isinstance(days, dict):
        errors.append("days must be an object.")
        days = {}
    enabled_day_count = 0
    for weekday in WEEKDAYS:
        day_config = days.get(weekday)
        if not isinstance(day_config, dict):
            errors.append(f"days.{weekday} is required.")
            continue
        if day_config.get("enabled"):
            enabled_day_count += 1
        mode = day_config.get("hours_mode", "global")
        if mode not in ("global", "custom"):
            errors.append(f"days.{weekday}.hours_mode must be 'global' or 'custom'.")
        if day_config.get("enabled") and mode == "custom":
            _validate_interval(
                day_config.get("start"), day_config.get("end"), f"days.{weekday}", errors
            )

    calendar = value.get("holiday_calendar") or {}
    country_code = calendar.get("country_code")
    if country_code is not None:
        supported = holidays.list_supported_countries()
        if country_code not in supported:
            errors.append(f"holiday_calendar.country_code '{country_code}' is not supported.")
        else:
            subdivision = calendar.get("subdivision_code")
            if subdivision and subdivision not in supported[country_code]:
                errors.append(
                    f"holiday_calendar.subdivision_code '{subdivision}' is not valid for "
                    f"country '{country_code}'."
                )

    if enabled:
        if enabled_day_count == 0:
            errors.append("At least one working day must be enabled.")
        if not country_code:
            errors.append("A holiday calendar country is required when working hours are enabled.")

    return errors


def build_holiday_calendar(config):
    """Build an offline holidays object for the configured country/subdivision.

    Returns None when no country is configured or the country is unsupported.
    Includes observed holidays. Years auto-expand on lookup.
    """
    calendar = (config or {}).get("holiday_calendar") or {}
    country_code = calendar.get("country_code")
    if not country_code:
        return None
    subdivision = calendar.get("subdivision_code") or None
    try:
        return holidays.country_holidays(country_code, subdiv=subdivision, observed=True)
    except (NotImplementedError, KeyError):
        return None


def _working_interval(config, holiday_calendar, local_date):
    """Return (start_time, end_time) for a working date, or None if it's off.

    A date is non-working when its weekday is disabled, or it is a public
    holiday in the configured calendar.
    """
    days = (config or {}).get("days") or {}
    weekday_name = WEEKDAYS[local_date.weekday()]
    day_config = days.get(weekday_name) or {}
    if not day_config.get("enabled"):
        return None

    if holiday_calendar is not None and local_date in holiday_calendar:
        return None

    if day_config.get("hours_mode") == "custom":
        start = _parse_hhmm(day_config.get("start"))
        end = _parse_hhmm(day_config.get("end"))
    else:
        global_hours = (config or {}).get("global_hours") or {}
        start = _parse_hhmm(global_hours.get("start"))
        end = _parse_hhmm(global_hours.get("end"))

    if start is None or end is None or start >= end:
        return None
    return start, end


def compute_auto_stop_at(workspace, started_at):
    """Compute the UTC boundary at which a timer started at `started_at` should stop.

    Rules (all evaluated in the workspace timezone):
      - started before or during a working day -> end of that same day;
      - started exactly at or after the day's end -> end of the next working day;
      - started on a weekend / disabled day / holiday -> end of the nearest
        following working day.

    Returns an aware UTC datetime, or None when working hours are disabled or no
    working day can be found within the lookahead window.
    """
    config = getattr(workspace, "working_hours", None) or {}
    if not config.get("enabled"):
        return None

    tz = pytz.timezone(getattr(workspace, "timezone", None) or "UTC")
    holiday_calendar = build_holiday_calendar(config)

    local_started = started_at.astimezone(tz)
    local_date = local_started.date()

    interval = _working_interval(config, holiday_calendar, local_date)
    if interval is not None:
        _, end_time = interval
        end_dt = _localize(tz, datetime.combine(local_date, end_time))
        if local_started < end_dt:
            return end_dt.astimezone(pytz.utc)

    # Otherwise, the end of the next working day strictly after local_date.
    candidate = local_date + timedelta(days=1)
    for _ in range(_MAX_LOOKAHEAD_DAYS):
        interval = _working_interval(config, holiday_calendar, candidate)
        if interval is not None:
            _, end_time = interval
            end_dt = _localize(tz, datetime.combine(candidate, end_time))
            return end_dt.astimezone(pytz.utc)
        candidate += timedelta(days=1)

    return None


def recompute_active_auto_stops(workspace):
    """Recompute auto_stop_at for every running timer in a workspace.

    Called after the schedule, country, subdivision or timezone changes. When
    the schedule is disabled, boundaries are cleared without stopping timers.
    """
    from plane.db.models import IssueTimeLog

    running = list(
        IssueTimeLog.objects.filter(workspace=workspace, stopped_at__isnull=True)
    )
    if not running:
        return
    for log in running:
        log.auto_stop_at = compute_auto_stop_at(workspace, log.started_at)
    IssueTimeLog.objects.bulk_update(
        running, ["auto_stop_at", "updated_at"], batch_size=100
    )
