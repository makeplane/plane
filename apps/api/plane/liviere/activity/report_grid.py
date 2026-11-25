# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# The activity grid of the report PDF (report_pdf.py) without drawing: levels of the quarters and the quarters
# of skipped periods. The levels are those of the Activity page (apps/web/liviere/activity/grid.ts,
# levelThresholds and levelOf); keep both in step.

# Python imports
from datetime import datetime

SLOTS_PER_DAY = 96
LEVELS = 5  # 0 = no activity, 1-4 = quartiles of the non-empty quarters
QUARTER_SECONDS = 15 * 60


def level_thresholds(counts):
    """Upper bounds of levels 1-3 (level 4 is everything above), from the quartiles of the non-empty counts."""
    ordered = sorted(count for count in counts if count > 0)
    if not ordered:
        return (1, 1, 1)

    def quantile(q):
        return ordered[min(len(ordered) - 1, int(q * len(ordered)))]

    return (quantile(0.25), quantile(0.5), quantile(0.75))


def level_of(count, thresholds):
    if count <= 0:
        return 0
    if count <= thresholds[0]:
        return 1
    if count <= thresholds[1]:
        return 2
    if count <= thresholds[2]:
        return 3
    return 4


def skipped_quarters(periods, zone):
    """
    (local date as YYYY-MM-DD, slot 0-95) of the quarters that overlap the skipped periods of the report
    (serialized, with offsets). Time zone offsets are whole quarters, so UTC quarters are local quarters too.
    """
    keys = set()
    for period in periods:
        start = int(datetime.fromisoformat(period["starts_at"]).timestamp())
        end = datetime.fromisoformat(period["ends_at"]).timestamp()
        moment = start - start % QUARTER_SECONDS
        while moment < end:
            local = datetime.fromtimestamp(moment, zone)
            keys.add((local.date().isoformat(), local.hour * 4 + local.minute // 15))
            moment += QUARTER_SECONDS
    return keys
