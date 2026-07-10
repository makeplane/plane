# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Weekend-only working-day scheduling helpers.

This is the narrow predecessor to ADR 0002's project Working Calendar. It treats
Monday through Friday as working days and Saturday/Sunday as non-working days.
"""

from datetime import date, timedelta

MAX_WORKING_DAY_DURATION = 366
_MISSING = object()


def is_weekend(d: date) -> bool:
    """Return True for Saturday or Sunday."""
    return d.weekday() >= 5


def is_working_day(d: date) -> bool:
    """Return True for Monday through Friday."""
    return not is_weekend(d)


def add_working_days(start: date, duration: int) -> date:
    """Return the final working day for an inclusive working-day duration.

    If `start` is a weekend, counting begins at the next Monday while the input
    start date remains unchanged by callers.
    """
    if duration < 1:
        raise ValueError("duration must be at least 1")

    current = start
    counted = 0
    while True:
        if is_working_day(current):
            counted += 1
            if counted == duration:
                return current
        current += timedelta(days=1)


def subtract_working_days(target: date, duration: int) -> date:
    """Return the first working day for an inclusive duration ending at target.

    If `target` is a weekend, counting begins at the previous Friday.
    """
    if duration < 1:
        raise ValueError("duration must be at least 1")

    current = target
    counted = 0
    while True:
        if is_working_day(current):
            counted += 1
            if counted == duration:
                return current
        current -= timedelta(days=1)


def latest_working_day_on_or_before(d: date) -> date:
    """Return `d` when it is a working day, else the closest earlier working day."""
    current = d
    while is_weekend(current):
        current -= timedelta(days=1)
    return current


def count_working_days(start: date, target: date) -> int:
    """Count working days in the inclusive range from start to target."""
    if target < start:
        raise ValueError("target must be on or after start")

    current = start
    counted = 0
    while current <= target:
        if is_working_day(current):
            counted += 1
        current += timedelta(days=1)
    return counted


def normalize_working_day_schedule(
    *,
    current_start_date: date | None,
    current_target_date: date | None,
    current_planned_duration_working_days: int | None,
    start_date: date | None | object = _MISSING,
    target_date: date | None | object = _MISSING,
    planned_duration_working_days: int | None | object = _MISSING,
) -> tuple[date | None, date | None, int | None]:
    """Normalize a schedule patch using weekend-only working-day duration.

    The returned tuple is `(start_date, target_date, planned_duration_working_days)`.
    Explicit duration wins over an explicit target date when a start date exists.
    Explicit target-date edits recalculate duration. Start-date edits preserve an
    existing duration by deriving a new target date.
    """
    start_provided = start_date is not _MISSING
    target_provided = target_date is not _MISSING
    duration_provided = planned_duration_working_days is not _MISSING

    start = start_date if start_provided else current_start_date
    target = target_date if target_provided else current_target_date
    duration = planned_duration_working_days if duration_provided else current_planned_duration_working_days

    if duration is not None:
        if not isinstance(duration, int):
            raise ValueError("duration must be an integer")
        if duration < 1:
            raise ValueError("duration must be at least 1")
        if duration > MAX_WORKING_DAY_DURATION:
            raise ValueError(f"duration must be at most {MAX_WORKING_DAY_DURATION}")

    if duration_provided:
        if duration is not None and start is not None:
            target = add_working_days(start, duration)
    elif target_provided:
        if target is None:
            duration = None
        elif start is not None:
            if target < start:
                raise ValueError("Start date cannot exceed target date")
            working_days = count_working_days(start, target)
            duration = working_days if working_days >= 1 else None
    elif start_provided and duration is not None and start is not None:
        target = add_working_days(start, duration)

    if start is not None and target is not None and start > target:
        raise ValueError("Start date cannot exceed target date")

    return start, target, duration
