# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Canonical worklog duration helpers.

Duration is stored as a positive integer number of seconds. Human-readable
strings such as ``1h 30m`` are never persisted.
"""

WORKLOG_DURATION_MIN_SECONDS = 1
# 10,000 hours — a single entry larger than this is treated as overflow.
WORKLOG_DURATION_MAX_SECONDS = 10_000 * 3600


def validate_worklog_duration(value):
    """Return a validated integer duration in seconds or raise ValueError."""
    if isinstance(value, bool) or value is None:
        raise ValueError("Duration must be a positive integer number of seconds.")
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped.isdigit():
            raise ValueError("Duration must be a positive integer number of seconds.")
        value = int(stripped)
    if isinstance(value, float):
        if not value.is_integer():
            raise ValueError("Duration must be a whole number of seconds.")
        value = int(value)
    if not isinstance(value, int):
        raise ValueError("Duration must be a positive integer number of seconds.")
    if value < WORKLOG_DURATION_MIN_SECONDS:
        raise ValueError("Duration must be greater than zero.")
    if value > WORKLOG_DURATION_MAX_SECONDS:
        raise ValueError("Duration exceeds the maximum allowed value.")
    return value
