# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from collections import defaultdict
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import IssueWorkLog


class ProjectAnalyticsTimesheetEndpoint(BaseAPIView):
    """
    Week-grid view for ALL project issues, with logtime aggregated from ALL users.
    Per-issue, per-day breakdown also includes per-user split.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/analytics/timesheet/
    ?week_start=YYYY-MM-DD  (optional, defaults to current week Monday)
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        # Parse week_start, snap to Monday
        raw = request.query_params.get("week_start")
        if raw:
            from datetime import date as _date
            try:
                d = _date.fromisoformat(raw)
                week_start = d - timedelta(days=d.weekday())
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        else:
            today = timezone.now().date()
            week_start = today - timedelta(days=today.weekday())

        week_end = week_start + timedelta(days=6)

        # Fetch worklogs in this week — project-scoped, all users
        worklogs = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                logged_at__range=[week_start, week_end],
            )
            .select_related("issue__project", "logged_by")
            .values(
                "issue_id",
                "issue__name",
                "issue__sequence_id",
                "issue__project__identifier",
                "issue__project_id",
                "logged_by_id",
                "logged_by__display_name",
                "logged_by__avatar",
                "logged_at",
            )
            .annotate(total=Sum("duration_minutes"))
        )

        # Build: issue_id → {info, days, by_user}
        issue_map = {}
        for wl in worklogs:
            iid = str(wl["issue_id"])
            date_str = wl["logged_at"].isoformat()
            uid = str(wl["logged_by_id"])
            mins = wl["total"]

            if iid not in issue_map:
                issue_map[iid] = {
                    "issue_id": iid,
                    "issue_name": wl["issue__name"],
                    "issue_identifier": f"{wl['issue__project__identifier']}-{wl['issue__sequence_id']}",
                    "project_id": str(wl["issue__project_id"]),
                    "days": defaultdict(int),
                    "by_user": {},
                    "total_minutes": 0,
                }

            issue_map[iid]["days"][date_str] += mins
            issue_map[iid]["total_minutes"] += mins

            if uid not in issue_map[iid]["by_user"]:
                issue_map[iid]["by_user"][uid] = {
                    "user_id": uid,
                    "display_name": wl["logged_by__display_name"],
                    "avatar_url": wl["logged_by__avatar"] or "",
                    "days": defaultdict(int),
                    "total_minutes": 0,
                }
            issue_map[iid]["by_user"][uid]["days"][date_str] += mins
            issue_map[iid]["by_user"][uid]["total_minutes"] += mins

        # Serialize — convert defaultdicts, sort by total desc
        rows = []
        for info in issue_map.values():
            rows.append({
                **info,
                "days": dict(info["days"]),
                "by_user": [
                    {**u, "days": dict(u["days"])}
                    for u in info["by_user"].values()
                ],
            })
        rows.sort(key=lambda r: -r["total_minutes"])

        # Daily totals across all issues
        daily_totals = defaultdict(int)
        for r in rows:
            for day, mins in r["days"].items():
                daily_totals[day] += mins

        grand_total = sum(r["total_minutes"] for r in rows)

        return Response(
            {
                "week_start": week_start.isoformat(),
                "week_end": week_end.isoformat(),
                "rows": rows,
                "daily_totals": dict(daily_totals),
                "grand_total_minutes": grand_total,
            },
            status=status.HTTP_200_OK,
        )
