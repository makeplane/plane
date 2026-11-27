# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Reading activity events: request parameters, the 15-minute heatmap and the event list. Shared by the
# app endpoints (plane/liviere/app) and the public API (plane/liviere/api).

# Python imports
from datetime import date, datetime, time, timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Django imports
from django.db.models import Count, IntegerField, Q
from django.db.models.functions import Cast, ExtractMinute, Floor, TruncHour
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# Module imports
from plane.db.models import Cycle, Issue, IssueView, Module, Page, Project
from plane.liviere.activity.kinds import DEFAULT_KINDS, parse_kinds
from plane.liviere.models import ActivityEvent, ProjectActivitySettings

BUCKET_MINUTES = 15
SLOTS_PER_DAY = 24 * 60 // BUCKET_MINUTES
DEFAULT_DAYS = 30
MAX_DAYS = 366


class InvalidParams(ValueError):
    pass


def project_settings(project_id):
    """The stored settings, or unsaved defaults when the project has none yet."""
    return ProjectActivitySettings.objects.filter(project_id=project_id).first() or ProjectActivitySettings(
        project_id=project_id, kinds=list(DEFAULT_KINDS)
    )


def parse_params(request, project_id):
    """Common query parameters: tz, from/to (local dates), actor, kinds. Raises InvalidParams."""
    params = request.query_params
    tz_name = params.get("tz") or Project.objects.filter(pk=project_id).values_list("timezone", flat=True).first()
    try:
        zone = ZoneInfo(tz_name or "UTC")
    except (ZoneInfoNotFoundError, ValueError):
        raise InvalidParams(f"Unknown time zone: {tz_name}")

    try:
        today = timezone.now().astimezone(zone).date()
        end = date.fromisoformat(params["to"]) if params.get("to") else today
        start = date.fromisoformat(params["from"]) if params.get("from") else end - timedelta(days=DEFAULT_DAYS - 1)
    except ValueError:
        raise InvalidParams("'from' and 'to' must be dates in the YYYY-MM-DD format")
    if start > end:
        raise InvalidParams("'from' must not be after 'to'")
    if (end - start).days + 1 > MAX_DAYS:
        raise InvalidParams(f"The range must not be longer than {MAX_DAYS} days")

    try:
        kinds = parse_kinds(params.get("kinds"))
    except ValueError as e:
        raise InvalidParams(str(e))
    if kinds is None:
        kinds = project_settings(project_id).kinds

    return {
        "zone": zone,
        "start": start,
        "end": end,
        "actor": params.get("actor") or None,
        "kinds": kinds,
        "since": datetime.combine(start, time.min, zone),
        "until": datetime.combine(end + timedelta(days=1), time.min, zone),
    }


def filtered_events(project_id, query, since=None, until=None):
    """Events in the window; log entries with a time range count when the range overlaps it."""
    since = since or query["since"]
    until = until or query["until"]
    events = ActivityEvent.objects.filter(
        Q(occurred_at__gte=since, occurred_at__lt=until)
        | Q(ended_at__isnull=False, occurred_at__lt=until, ended_at__gt=since),
        project_id=project_id,
        kind__in=query["kinds"],
    )
    if query["actor"]:
        events = events.filter(actor_id=query["actor"])
    return events


def _range_quarters(start, end, query):
    """Starts of the 15-minute quarters covered by [start, end), clipped to the query window."""
    start = max(start, query["since"]).astimezone(dt_timezone.utc)
    end = min(end, query["until"])
    # Time zone offsets are whole quarters, so UTC quarters are local quarters too
    quarter = start.replace(minute=start.minute - start.minute % BUCKET_MINUTES, second=0, microsecond=0)
    while quarter < end:
        yield quarter
        quarter += timedelta(minutes=BUCKET_MINUTES)


def heatmap(project_id, query):
    """
    Events counted per 15 minutes of local time. Buckets are sparse: only quarters with events, each with
    its local date, slot (0-95 from midnight) and counts per kind. On the day clocks go back, both copies
    of the repeated hour fall into the same slots. A log entry with a time range counts once in every
    quarter it covers and once in the summary.
    """
    zone = query["zone"]
    events = filtered_events(project_id, query)
    rows = (
        events.filter(ended_at__isnull=True)
        .annotate(
            local_hour=TruncHour("occurred_at", tzinfo=zone),
            quarter=Cast(Floor(ExtractMinute("occurred_at", tzinfo=zone) / BUCKET_MINUTES), IntegerField()),
        )
        .values("local_hour", "quarter", "kind")
        .annotate(count=Count("id"))
    )

    buckets = {}
    totals = {}

    def add(local_start, kind, count):
        key = (local_start.date(), local_start.hour * 4 + local_start.minute // BUCKET_MINUTES)
        bucket = buckets.get(key)
        if bucket is None:
            bucket = buckets[key] = {
                "date": key[0].isoformat(),
                "slot": key[1],
                "start": local_start.isoformat(),
                "count": 0,
                "by_kind": {},
            }
        bucket["count"] += count
        bucket["by_kind"][kind] = bucket["by_kind"].get(kind, 0) + count

    for row in rows:
        local_hour = row["local_hour"].astimezone(zone)
        add(local_hour.replace(minute=row["quarter"] * BUCKET_MINUTES), row["kind"], row["count"])
        totals[row["kind"]] = totals.get(row["kind"], 0) + row["count"]

    for entry in events.filter(ended_at__isnull=False).values("occurred_at", "ended_at", "kind"):
        # Once per local quarter, also in the repeated hour when clocks go back
        slots = {}
        for quarter in _range_quarters(entry["occurred_at"], entry["ended_at"], query):
            local_start = quarter.astimezone(zone)
            slots.setdefault((local_start.date(), local_start.hour, local_start.minute), local_start)
        for local_start in slots.values():
            add(local_start, entry["kind"], 1)
        totals[entry["kind"]] = totals.get(entry["kind"], 0) + 1

    active = len(buckets)
    return {
        "timezone": str(zone),
        "from": query["start"].isoformat(),
        "to": query["end"].isoformat(),
        "bucket_minutes": BUCKET_MINUTES,
        "kinds": query["kinds"],
        "actor": query["actor"],
        "summary": {
            "events": sum(totals.values()),
            "active_buckets": active,
            "active_hours": active * BUCKET_MINUTES / 60,
            "by_kind": totals,
        },
        "buckets": [buckets[key] for key in sorted(buckets)],
    }


def event_range(request, query):
    """Optional exact range of the event list (`start`/`end`, ISO date-times), e.g. one heatmap bucket."""
    params = request.query_params
    since = until = None
    for name in ("start", "end"):
        if params.get(name):
            value = parse_datetime(params[name].replace(" ", "+"))
            if value is None:
                raise InvalidParams(f"'{name}' must be an ISO 8601 date-time")
            if timezone.is_naive(value):
                value = value.replace(tzinfo=query["zone"])
            if name == "start":
                since = value
            else:
                until = value
    return since, until


def serialize_events(events):
    """Events with the names of people and objects they refer to; objects may have been deleted since."""
    events = list(events)
    issue_ids = {e.issue_id for e in events if e.issue_id}
    page_ids = {e.page_id for e in events if e.page_id}
    object_ids = {e.object_id for e in events if e.object_id}

    issues = {
        row["id"]: row
        for row in Issue.all_objects.filter(id__in=issue_ids).values(
            "id", "name", "sequence_id", "project__identifier", "deleted_at"
        )
    }
    pages = {row["id"]: row for row in Page.all_objects.filter(id__in=page_ids).values("id", "name", "deleted_at")}
    objects = {}
    for model in (Cycle, Module, IssueView):
        for row in model.all_objects.filter(id__in=object_ids).values("id", "name", "deleted_at"):
            objects[row["id"]] = row

    def issue_ref(issue_id):
        row = issues.get(issue_id)
        if row is None:
            return {"id": str(issue_id), "name": None, "identifier": None, "deleted": True}
        return {
            "id": str(issue_id),
            "name": row["name"],
            "identifier": f"{row['project__identifier']}-{row['sequence_id']}",
            "deleted": row["deleted_at"] is not None,
        }

    def named_ref(lookup, object_id):
        row = lookup.get(object_id)
        return {
            "id": str(object_id),
            "name": row["name"] if row else None,
            "deleted": row is None or row["deleted_at"] is not None,
        }

    return [
        {
            "id": e.id,
            "occurred_at": e.occurred_at.isoformat(),
            "kind": e.kind,
            "source": e.source,
            "actor": (
                {"id": str(e.actor_id), "display_name": e.actor.display_name, "avatar_url": e.actor.avatar_url}
                if e.actor_id
                else None
            ),
            "issue": issue_ref(e.issue_id) if e.issue_id else None,
            "page": named_ref(pages, e.page_id) if e.page_id else None,
            "object": named_ref(objects, e.object_id) if e.object_id else None,
            "ended_at": e.ended_at.isoformat() if e.ended_at else None,
            "note": e.note,
            "updated_at": e.updated_at.isoformat() if e.updated_at else None,
        }
        for e in events
    ]
