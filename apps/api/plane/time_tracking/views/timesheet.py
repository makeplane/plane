# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import timedelta

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from ..serializers import issue_detail, project_detail
from .base import ENTRY_RELATIONS, TimeTrackingBaseView, parse_date_param, parse_uuid_param


def _iso(dt):
    return dt.isoformat().replace("+00:00", "Z") if dt else None


class TimesheetEndpoint(TimeTrackingBaseView):
    """One person's week, grouped by (project, work item) with a cell per day (plan 7.3 #14)."""

    def get(self, request, slug):
        access = self.get_access(request, slug)
        week_start_date = parse_date_param(request.GET, "week_start_date", required=True)
        user_id = parse_uuid_param(request.GET, "user_id") or request.user.id
        days = [week_start_date + timedelta(days=i) for i in range(7)]

        entries = (
            access.visible_entries()
            .filter(user_id=user_id, spent_on__gte=days[0], spent_on__lte=days[-1])
            .select_related(*ENTRY_RELATIONS)
            .order_by("spent_on", "started_at", "created_at")
        )

        rows, day_totals, running_entry_id = {}, {day.isoformat(): 0 for day in days}, None
        for entry in entries:
            row = rows.get((entry.project_id, entry.issue_id))
            if row is None:
                row = rows[(entry.project_id, entry.issue_id)] = {
                    "project_id": str(entry.project_id),
                    "issue_id": str(entry.issue_id) if entry.issue_id else None,
                    "project_detail": project_detail(entry.project),
                    "issue_detail": issue_detail(entry.issue, entry.project),
                    "total_seconds": 0,
                    "cells": {},
                    "_sort": (
                        entry.project.name.lower(),
                        entry.issue_id is not None,
                        entry.issue.sequence_id if entry.issue_id else 0,
                    ),
                }
            day = entry.spent_on.isoformat()
            cell = row["cells"].setdefault(day, {"total_seconds": 0, "entries": []})
            seconds = entry.duration_seconds or 0
            if entry.is_running:
                running_entry_id = str(entry.id)
            cell["entries"].append(
                {
                    "id": str(entry.id),
                    "duration_seconds": entry.duration_seconds,
                    "source": entry.source,
                    "has_times": entry.started_at is not None and not entry.is_running,
                    "is_running": entry.is_running,
                    "started_at": _iso(entry.started_at),
                    "ended_at": _iso(entry.ended_at),
                    "description": entry.description,
                    "is_billable": entry.is_billable,
                    "auto_stopped": entry.auto_stopped,
                    "can_edit": access.can_edit(entry),
                }
            )
            cell["total_seconds"] += seconds
            row["total_seconds"] += seconds
            day_totals[day] += seconds

        sorted_rows = sorted(rows.values(), key=lambda r: r["_sort"])
        for row in sorted_rows:
            del row["_sort"]

        return Response(
            {
                "user_id": str(user_id),
                "week_start_date": week_start_date.isoformat(),
                "days": [day.isoformat() for day in days],
                "rows": sorted_rows,
                "day_totals": day_totals,
                "total_seconds": sum(day_totals.values()),
                "running_entry_id": running_entry_id,
            },
            status=status.HTTP_200_OK,
        )
