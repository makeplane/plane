# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Limits for time tracking. Mirrored in @plane/constants (packages/constants/src/time-tracking.ts)."""

# a single entry is at most 24 hours
TIME_ENTRY_MAX_SECONDS = 86_400
# a running timer is stopped automatically after 12 hours
TIMER_AUTO_STOP_SECONDS = 43_200
# a timer stopped before this is discarded as an accidental start
TIMER_MIN_SECONDS = 60
# manual entries must be at least a minute long
MANUAL_MIN_SECONDS = 60
DESCRIPTION_MAX_LENGTH = 2_000

TIME_ENTRIES_PER_PAGE = 50
TIME_ENTRIES_MAX_PER_PAGE = 200
BULK_MAX_IDS = 500
EXPORT_MAX_ROWS = 50_000
REPORT_MAX_GROUPS = 500

# clock skew allowed between the browser and the server for "ended in the future" checks
FUTURE_TOLERANCE_SECONDS = 60
# the auto-stop job processes running timers in chunks of this size
AUTO_STOP_CHUNK_SIZE = 500
