# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Project time report for a period (LS-9): time from the activity log, from series of actions, or both.
# Pure functions on time ranges first (tested in plane/tests/unit/liviere/test_activity_report.py), then
# the report built from the database. The app view, the files (report_export.py) and /api/v1/ all read the
# same dictionary, so they show the same numbers.
#
# Time is counted in UTC; the project time zone only places the midnights the ranges are split at, so the
# day clocks go back has 25 hours. Every cell (one day of one source, for the project or for one person) is
# rounded to whole minutes, half up; totals and differences add up rounded cells, so the tables always sum up.

# Python imports
from collections import defaultdict
from datetime import datetime, time, timedelta, timezone as dt_timezone

# Module imports
from plane.liviere.activity.kinds import LOG_ENTRY

SOURCE_GRID = "grid"
SOURCE_LOG = "log"
SOURCE_MIXED = "mixed"
SOURCES = (SOURCE_GRID, SOURCE_LOG, SOURCE_MIXED)
DEFAULT_SOURCE = SOURCE_MIXED
# The result of "mixed": the time covered by a log entry or by a series of actions, counted once
MIXED_RULE = "log_plus_actions"

DEFAULT_SERIES_GAP = 15
DEFAULT_SERIES_PADDING = 5
SERIES_GAP_RANGE = (1, 120)
SERIES_PADDING_RANGE = (0, 60)
# A log entry without an end counts like this (as in the "Work log" list of the Activity page)
OPEN_ENTRY_MINUTES = 15

UTC = dt_timezone.utc
MINUTE = timedelta(minutes=1)


def merge(ranges):
    """Sorted, non-overlapping ranges covering the same time; touching ranges join."""
    merged = []
    for start, end in sorted(r for r in ranges if r[1] > r[0]):
        if merged and start <= merged[-1][1]:
            if end > merged[-1][1]:
                merged[-1] = (merged[-1][0], end)
        else:
            merged.append((start, end))
    return merged


def series(moments, gap, padding):
    """
    Series of actions: actions closer than `gap` to the previous one join it. A series lasts from its first
    action to its last one plus `padding`, so a single action counts `padding`.
    """
    ranges = []
    first = last = None
    for moment in sorted(moments):
        if last is not None and moment - last < gap:
            last = moment
            continue
        if last is not None:
            ranges.append((first, last + padding))
        first = last = moment
    if last is not None:
        ranges.append((first, last + padding))
    # Padding longer than the gap would make series overlap; merged they still count once
    return merge(ranges)


def clip(ranges, since, until):
    return [(max(start, since), min(end, until)) for start, end in ranges if end > since and start < until]


def subtract(ranges, holes):
    """The parts of `ranges` outside `holes` (both lists of ranges)."""
    holes = merge(holes)
    result = []
    for start, end in ranges:
        for hole_start, hole_end in holes:
            if hole_end <= start or hole_start >= end:
                continue
            if hole_start > start:
                result.append((start, hole_start))
            start = max(start, hole_end)
            if start >= end:
                break
        if start < end:
            result.append((start, end))
    return result


def day_bounds(days, zone):
    """Each local day as a UTC range [midnight, next midnight)."""
    return [
        (
            day,
            datetime.combine(day, time.min, zone).astimezone(UTC),
            datetime.combine(day + timedelta(days=1), time.min, zone).astimezone(UTC),
        )
        for day in days
    ]


def round_minutes(duration):
    """Whole minutes, half a minute and more rounds up."""
    return (duration + timedelta(seconds=30)) // MINUTE


def minutes_per_day(ranges, bounds):
    """Rounded minutes of the merged `ranges` in every local day of `bounds`, {day: minutes}."""
    ranges = merge(ranges)
    result = {}
    for day, since, until in bounds:
        covered = sum((end - start for start, end in clip(ranges, since, until)), timedelta())
        result[day] = round_minutes(covered)
    return result


def entry_range(occurred_at, ended_at):
    return (occurred_at, ended_at or occurred_at + timedelta(minutes=OPEN_ENTRY_MINUTES))


def person_ranges(actions, entries, gap, padding, skipped=()):
    """
    The log, series and mixed ranges of one person. `actions` are moments of actions (no log entries),
    `entries` (start, end or None) of log entries; `skipped` ranges are left out of every source: their
    actions do not start or extend a series, and what remains of series and entries inside them is cut.
    """
    skipped = merge(skipped)
    kept = [moment for moment in actions if not any(start <= moment < end for start, end in skipped)]
    grid = subtract(series(kept, gap, padding), skipped)
    log = subtract(merge(entry_range(*entry) for entry in entries), skipped)
    return {SOURCE_LOG: log, SOURCE_GRID: grid, SOURCE_MIXED: merge(log + grid)}


def cells(ranges, bounds):
    """Rounded minutes per day and source, {day: {source: minutes}}."""
    per_source = {source: minutes_per_day(ranges[source], bounds) for source in SOURCES}
    return {day: {source: per_source[source][day] for source in SOURCES} for day, _, _ in bounds}


def compute(actions, entries, days, zone, gap, padding, skipped=()):
    """
    Minutes per day for the project and per person.

    `actions` are (actor id or None, moment), `entries` (actor id or None, start, end or None). The project
    time is the time anyone worked: the union of everybody's ranges, so parallel work counts once. Each
    person's own time also counts parallel sessions once. Returns
    {"days": {day: {source: minutes}}, "people": {actor: {day: {source: minutes}}}}.
    """
    bounds = day_bounds(days, zone)
    by_actor = defaultdict(lambda: ([], []))
    for actor, moment in actions:
        by_actor[actor][0].append(moment)
    for actor, start, end in entries:
        by_actor[actor][1].append((start, end))

    project = {source: [] for source in SOURCES}
    people = {}
    for actor, (moments, actor_entries) in by_actor.items():
        ranges = person_ranges(moments, actor_entries, gap, padding, skipped)
        for source in SOURCES:
            project[source].extend(ranges[source])
        people[actor] = cells(ranges, bounds)
    return {"days": cells(project, bounds), "people": people}


def with_totals(day_cells, source):
    """A row of the tables: minutes of each source, the difference (log minus series) and the result."""
    log, grid = day_cells[SOURCE_LOG], day_cells[SOURCE_GRID]
    return {
        "log_minutes": log,
        "grid_minutes": grid,
        "difference_minutes": log - grid,
        "result_minutes": day_cells[source],
    }


def sum_rows(rows):
    keys = ("log_minutes", "grid_minutes", "difference_minutes", "result_minutes")
    return {key: sum(row[key] for row in rows) for key in keys}


# Reading the database


def margin(gap):
    """How far before the window actions and entries still reach into it."""
    return max(gap, timedelta(minutes=OPEN_ENTRY_MINUTES))


def build_report(project, query, source, report_settings, with_entries=True):
    """
    The report dictionary. `query` comes from queries.parse_params; its kinds count for the series (log
    entries never do: the log is the other source). Log entries count whatever the project settings count.
    The project's skipped periods are left out of every source.
    """
    # Imported here: the pure functions above are tested without Django
    from plane.liviere.activity.queries import filtered_events, serialize_events
    from plane.liviere.activity.skips import serialize_skip, skip_periods
    from plane.liviere.activity.summaries import summaries_by_day
    from plane.db.models import User

    zone = query["zone"]
    gap = timedelta(minutes=report_settings["series_gap_minutes"])
    padding = timedelta(minutes=report_settings["series_padding_minutes"])
    days = [query["start"] + timedelta(days=i) for i in range((query["end"] - query["start"]).days + 1)]
    since = query["since"] - margin(gap)
    until = query["until"]

    action_kinds = [kind for kind in query["kinds"] if kind != LOG_ENTRY]
    actions = list(
        filtered_events(project.id, {**query, "kinds": action_kinds}, since, until)
        .filter(ended_at__isnull=True)
        .values_list("actor_id", "occurred_at")
    )
    entry_events = list(
        filtered_events(project.id, {**query, "kinds": [LOG_ENTRY]}, since, until)
        .select_related("actor")
        .order_by("occurred_at", "id")
    )
    entries = [(e.actor_id, e.occurred_at, e.ended_at) for e in entry_events]

    periods = skip_periods(project.id, since, until)
    skipped = [(period.starts_at, period.ends_at) for period in periods]
    result = compute(actions, entries, days, zone, gap, padding, skipped)

    actor_ids = {str(actor) for actor in result["people"] if actor is not None}
    if query["actor"]:
        actor_ids.add(str(query["actor"]))
    names = {
        str(user["id"]): user["display_name"]
        for user in User.objects.filter(id__in=actor_ids).values("id", "display_name")
    }

    def actor_ref(actor):
        if actor is None:
            return None
        return {"id": str(actor), "display_name": names.get(str(actor))}

    # Entries listed under the local day they start on, only those that start in the period
    listed = defaultdict(list)
    if with_entries:
        in_period = [e for e in entry_events if query["since"] <= e.occurred_at < until]
        for entry in serialize_events(in_period):
            start = datetime.fromisoformat(entry["occurred_at"]).astimezone(zone)
            end = datetime.fromisoformat(entry["ended_at"]).astimezone(zone) if entry["ended_at"] else None
            listed[start.date()].append(
                {
                    "id": entry["id"],
                    "start": start.isoformat(),
                    "end": end.isoformat() if end else None,
                    "actor": entry["actor"]
                    and {
                        "id": entry["actor"]["id"],
                        "display_name": entry["actor"]["display_name"],
                    },
                    "issue": entry["issue"]
                    and {
                        "id": entry["issue"]["id"],
                        "identifier": entry["issue"]["identifier"],
                        "name": entry["issue"]["name"],
                    },
                    "note": entry["note"],
                }
            )

    summaries = summaries_by_day(project.id, query["start"], query["end"], query["actor"])
    day_rows = [
        {
            "date": day.isoformat(),
            **with_totals(result["days"][day], source),
            "summaries": summaries.get(day, []),
            "entries": listed.get(day, []),
        }
        for day in days
    ]
    people_rows = []
    for actor, per_day in result["people"].items():
        rows = [with_totals(per_day[day], source) for day in days]
        totals = sum_rows(rows)
        if any(totals[key] for key in ("log_minutes", "grid_minutes")):
            people_rows.append({"actor": actor_ref(actor), **totals})
    people_rows.sort(key=lambda row: (-row["result_minutes"], (row["actor"] or {}).get("display_name") or "~"))

    return {
        "project": {"id": str(project.id), "name": project.name, "identifier": project.identifier},
        "from": query["start"].isoformat(),
        "to": query["end"].isoformat(),
        "timezone": str(zone),
        "source": source,
        "mixed_rule": MIXED_RULE,
        "actor": actor_ref(query["actor"]) if query["actor"] else None,
        "series_gap_minutes": report_settings["series_gap_minutes"],
        "series_padding_minutes": report_settings["series_padding_minutes"],
        "open_entry_minutes": OPEN_ENTRY_MINUTES,
        "kinds": action_kinds,
        "entries_included": with_entries,
        "skipped": [
            serialize_skip(period, zone)
            for period in periods
            if period.ends_at > query["since"] and period.starts_at < query["until"]
        ],
        "totals": sum_rows(day_rows),
        "days": day_rows,
        "people": people_rows,
    }
