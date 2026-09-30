# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Work item duration is measured in whole days, inclusive of both the start and the target date.
A work item that starts and ends on the same day lasts 1 day, so the shortest valid duration is 1.
Non-working days (weekends, holidays) are intentionally not excluded.

This module mirrors `packages/utils/src/work-item/duration.ts`. The web app derives the same values
optimistically because `PATCH` on a work item answers with `204 No Content`, so both sides have to
agree. Keep the two implementations in sync.
"""

import math
from datetime import date, datetime, timedelta

WORK_ITEM_DURATION_MIN = 1

DURATION_DATE_FIELDS = ("start_date", "target_date")


def to_work_item_date(value):
    """
    Parse a date coming from a model instance or a JSON payload.

    Callers that hand the reconciled values to a serializer rather than to a raw request payload
    need this to turn the returned ISO strings back into `date` objects.
    """
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    raise TypeError(f"Unsupported date value: {type(value)!r}")


def normalize_work_item_duration(value):
    """Coerce any user or API supplied duration into a valid stored value."""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(parsed) or math.isinf(parsed):
        return None
    # floor(x + 0.5) matches JavaScript's Math.round, unlike Python's banker's rounding
    rounded = int(math.floor(parsed + 0.5))
    return max(rounded, WORK_ITEM_DURATION_MIN)


def calculate_work_item_duration(start_date, target_date):
    """
    Derive the duration in days from a date range, counting both ends.

    Returns None when either date is missing. The result may be <= 0 when the dates are ordered
    incorrectly, which lets callers detect an invalid range.
    """
    start = to_work_item_date(start_date)
    target = to_work_item_date(target_date)
    if start is None or target is None:
        return None
    return (target - start).days + 1


def calculate_target_date_from_duration(start_date, duration):
    """Derive the target date by treating the start date as the anchor."""
    start = to_work_item_date(start_date)
    normalized = normalize_work_item_duration(duration)
    if start is None or normalized is None:
        return None
    return (start + timedelta(days=normalized - 1)).isoformat()


def calculate_start_date_from_duration(target_date, duration):
    """Derive the start date by treating the target date as the anchor."""
    target = to_work_item_date(target_date)
    normalized = normalize_work_item_duration(duration)
    if target is None or normalized is None:
        return None
    return (target - timedelta(days=normalized - 1)).isoformat()


def reconcile_work_item_duration(instance, payload):
    """
    Keep `duration`, `start_date` and `target_date` consistent after a single edit.

    Rules, in the order they are applied:
      - Editing ``duration``
          * cleared            -> dates are left untouched
          * start date present -> start date is the anchor, target date is recalculated
          * only target date   -> target date is the anchor, start date is recalculated
          * no dates at all    -> duration is stored on its own
      - Editing ``start_date`` / ``target_date``
          * both dates present -> duration is recalculated from the range
          * both dates present but ordered backwards -> the existing length is preserved and the
            date the caller did not touch is shifted, so the payload stays valid
          * only one date left and a duration exists -> the still empty date is derived from the
            duration, but a date the caller explicitly cleared is never resurrected
          * both dates cleared -> duration survives as a standalone estimate

    :param instance: the work item before the edit, or None when creating one
    :param payload: the incoming request data; presence of a key signals intent, including None
    :return: dict of fields to overwrite in the payload, containing only the derived values
    """
    if payload is None:
        return {}

    current_start = to_work_item_date(getattr(instance, "start_date", None))
    current_target = to_work_item_date(getattr(instance, "target_date", None))
    current_duration = getattr(instance, "duration", None)

    start_date_changed = "start_date" in payload
    target_date_changed = "target_date" in payload

    start_date = to_work_item_date(payload.get("start_date")) if start_date_changed else current_start
    target_date = to_work_item_date(payload.get("target_date")) if target_date_changed else current_target

    result = {}

    # Duration driven: the caller sent a duration, so the dates follow it.
    if "duration" in payload:
        duration = normalize_work_item_duration(payload.get("duration"))
        result["duration"] = duration
        if duration is None:
            return result

        if start_date:
            result["target_date"] = calculate_target_date_from_duration(start_date, duration)
        elif target_date:
            result["start_date"] = calculate_start_date_from_duration(target_date, duration)
        return result

    if not start_date_changed and not target_date_changed:
        return result

    # Date driven: the caller sent a date, so the duration follows the dates.
    if start_date and target_date:
        next_duration = calculate_work_item_duration(start_date, target_date)

        if next_duration is not None and next_duration >= WORK_ITEM_DURATION_MIN:
            result["duration"] = next_duration
            return result

        # The new range is ordered backwards. Keep the length the work item already had and move the
        # opposite end instead, so a slipped start date drags the target date along with it.
        previous_duration = (
            normalize_work_item_duration(current_duration)
            or normalize_work_item_duration(calculate_work_item_duration(current_start, current_target))
            or WORK_ITEM_DURATION_MIN
        )

        result["duration"] = previous_duration
        if start_date_changed:
            result["target_date"] = calculate_target_date_from_duration(start_date, previous_duration)
        else:
            result["start_date"] = calculate_start_date_from_duration(target_date, previous_duration)
        return result

    duration = normalize_work_item_duration(current_duration)
    if duration is None:
        return result

    # Only fill in a date that is still empty and that the caller did not just clear.
    if start_date and not target_date and not target_date_changed:
        result["target_date"] = calculate_target_date_from_duration(start_date, duration)
    elif target_date and not start_date and not start_date_changed:
        result["start_date"] = calculate_start_date_from_duration(target_date, duration)

    return result
