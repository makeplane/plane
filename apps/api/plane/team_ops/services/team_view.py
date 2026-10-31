# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The team view: who is in scope for the caller, and how their days add up."""

# Python imports
from collections import defaultdict

# Django imports
from django.db.models.functions import Lower

# Third party imports
from rest_framework.exceptions import NotFound, ParseError

# Module imports
from plane.db.models import Project, ProjectMember, User
from plane.team_ops.models import OpsTeam, OpsTeamMember, WorkMode
from plane.team_ops.services.access import calendar_user_ids
from plane.team_ops.services.day_resolution import SOURCE_HOLIDAY, iter_days, resolve_days
from plane.team_ops.services.time_entry import parse_uuid

# A month grid is at most 42 days; two months is the longest range the team view answers.
MAX_TEAM_RANGE_DAYS = 62

# What a person's day counts as in the team view.
KIND_HOLIDAY = "HOLIDAY"
KIND_UNPLANNED = "UNPLANNED"
KINDS = [*(mode.value for mode in WorkMode), KIND_HOLIDAY, KIND_UNPLANNED]


def day_kind(day):
    """The category of a resolved day, or `None` for a day off the calendar (a weekend with nothing planned)."""
    if day["mode"]:
        return day["mode"]
    if day["source"] == SOURCE_HOLIDAY:
        return KIND_HOLIDAY
    if day["is_unplanned"]:
        return KIND_UNPLANNED
    return None


def visible_people(access, workspace, params):
    """The people the caller may see, narrowed by the `team`, `project` and `user` filters.

    Returns `[(user_id, timezone_name), ...]` ordered by name. The caller's rights come first:
    a filter can only shrink the set, never reach outside it.
    """
    people = calendar_user_ids(workspace)
    visible = access.visible_user_ids()
    if visible is not None:
        people &= visible

    if params.get("team"):
        team_id = parse_uuid(params["team"], "team")
        if not OpsTeam.objects.filter(workspace=workspace, pk=team_id).exists():
            raise NotFound("Team not found.")
        people &= set(OpsTeamMember.objects.filter(team_id=team_id).values_list("user_id", flat=True))

    if params.get("project"):
        project_id = parse_uuid(params["project"], "project")
        if not Project.objects.filter(workspace=workspace, pk=project_id).exists():
            raise NotFound("Project not found.")
        people &= set(
            ProjectMember.objects.filter(project_id=project_id, is_active=True).values_list("member_id", flat=True)
        )

    if params.get("user"):
        people &= {parse_uuid(params["user"], "user")}

    return list(
        User.objects.filter(id__in=people).order_by(Lower("display_name"), "id").values_list("id", "user_timezone")
    )


def parse_kind(value):
    """The `mode` filter: one of the work modes, `HOLIDAY` or `UNPLANNED`, or `None`."""
    if not value:
        return None
    kind = value.upper()
    if kind not in KINDS:
        raise ParseError(detail=f"Invalid mode. Use one of {', '.join(KINDS)}.")
    return kind


def summarize_team(workspace, settings_row, people, start, end, only_kind=None):
    """Per-day counts and people by category over `[start, end]`.

    With `only_kind`, only people who have at least one day of that kind in the range are kept,
    and only that kind is counted.
    """
    user_ids = [user_id for user_id, _ in people]
    resolved = resolve_days(workspace, settings_row, user_ids, start, end)

    by_day = {day.isoformat(): defaultdict(list) for day in iter_days(start, end)}
    totals = dict.fromkeys(KINDS, 0)
    holidays = {}
    kept = []

    for user_id in user_ids:
        has_kind = False
        for day in resolved[user_id]:
            date = day["date"]
            if day["holiday"]:
                holidays[date] = day["holiday"]
            kind = day_kind(day)
            if kind is None or (only_kind and kind != only_kind):
                continue
            has_kind = True
            by_day[date][kind].append(user_id)
            totals[kind] += 1
        if has_kind or not only_kind:
            kept.append(user_id)

    days = []
    for date, buckets in by_day.items():
        days.append(
            {
                "date": date,
                "holiday": holidays.get(date),
                "counts": {kind: len(buckets.get(kind, [])) for kind in KINDS},
                "users": {kind: buckets.get(kind, []) for kind in KINDS},
            }
        )
    return {"users": kept, "days": days, "totals": totals}
