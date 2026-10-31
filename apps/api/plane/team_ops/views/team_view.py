# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.team_ops.serializers import validate_calendar_date
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess
from plane.team_ops.services.day_resolution import resolve_days
from plane.team_ops.services.team_view import (
    MAX_TEAM_RANGE_DAYS,
    summarize_team,
    day_kind,
    parse_kind,
    visible_people,
)
from plane.team_ops.services.date_params import parse_day, parse_day_range
from plane.team_ops.services.time_logged import logged_seconds_by_day, top_projects_on_day


def _forbidden():
    return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)


class CalendarTeamEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Per-day counts and people for everyone the caller may see.

        Filters: `team`, `project` (members of the project), `user` and `mode`
        (a work mode, `HOLIDAY` or `UNPLANNED`).
        """
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        if not access.can_view_team:
            return _forbidden()

        params = request.query_params
        start, end = parse_day_range(params, require=True, max_days=MAX_TEAM_RANGE_DAYS)
        kind = parse_kind(params.get("mode"))
        people = visible_people(access, workspace, params)

        summary = summarize_team(workspace, access.settings, people, start, end, only_kind=kind)
        return Response({"from": start, "to": end, **summary}, status=status.HTTP_200_OK)


class CalendarTeamDayEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, day):
        """One row per person for one day: the plan next to the time logged that day.

        The hours logged are Time Tracking's, cut at each person's own midnight. They sit beside
        the plan for comparison; neither is a measure of presence.
        """
        day = validate_calendar_date(parse_day(day, "date"))
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        if not access.can_view_team:
            return _forbidden()

        params = request.query_params
        kind = parse_kind(params.get("mode"))
        people = visible_people(access, workspace, params)
        user_ids = [user_id for user_id, _ in people]

        resolved = resolve_days(workspace, access.settings, user_ids, day, day)
        logged = logged_seconds_by_day(workspace, people, day, day)
        projects = top_projects_on_day(workspace, people, day)

        rows = []
        holiday = None
        for user_id in user_ids:
            plan = resolved[user_id][0]
            holiday = plan["holiday"] or holiday
            plan_kind = day_kind(plan)
            if kind and plan_kind != kind:
                continue
            rows.append(
                {
                    "user": user_id,
                    "kind": plan_kind,
                    "mode": plan["mode"],
                    "source": plan["source"],
                    "planned_start_time": plan["planned_start_time"],
                    "planned_end_time": plan["planned_end_time"],
                    "planned_seconds": plan["planned_seconds"],
                    "description": plan["description"],
                    "leave_type": plan["leave_type"],
                    "is_unplanned": plan["is_unplanned"],
                    "logged_seconds": logged.get((user_id, day), 0),
                    "top_project": projects.get(user_id),
                }
            )
        return Response({"date": day, "holiday": holiday, "rows": rows}, status=status.HTTP_200_OK)
