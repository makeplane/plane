# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from collections import defaultdict
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog, Issue, IssueAssignee


def _parse_week_start(request):
    """Parse week_start from query params, default to current Monday."""
    raw = request.query_params.get("week_start")
    if raw:
        from datetime import date as _date

        try:
            d = _date.fromisoformat(raw)
        except ValueError:
            return None, "Invalid date format. Use YYYY-MM-DD."
        # Snap to Monday
        d = d - timedelta(days=d.weekday())
        return d, None
    today = timezone.now().date()
    return today - timedelta(days=today.weekday()), None


class TimesheetGridEndpoint(BaseAPIView):
    """Return the current user's timesheet grid for a given week.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/timesheet/
    ?week_start=YYYY-MM-DD  (optional, defaults to current week Monday)

    Response: { week_start, week_end, rows: [...], daily_totals, grand_total_minutes }
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        week_start, err = _parse_week_start(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        week_end = week_start + timedelta(days=6)

        # Use through-table subquery to correctly filter soft-deleted issue_assignee rows
        # (direct M2M filter bypasses SoftDeletionManager, causing duplicates)
        assigned_issue_ids = IssueAssignee.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            assignee=request.user,
        ).values_list("issue_id", flat=True)

        assigned_issues = (
            Issue.issue_objects.filter(id__in=assigned_issue_ids)
            .select_related("project")
            .only("id", "name", "sequence_id", "project__identifier")
            .order_by("sequence_id")
        )

        issue_ids = [i.id for i in assigned_issues]
        issue_map = {
            str(i.id): {
                "issue_id": str(i.id),
                "issue_name": i.name,
                "issue_identifier": f"{i.project.identifier}-{i.sequence_id}",
                "project_id": str(i.project_id),
            }
            for i in assigned_issues
        }

        # Fetch worklogs for this user in the date range
        worklogs = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                logged_by=request.user,
                logged_at__range=[week_start, week_end],
                issue_id__in=issue_ids,
            )
            .select_related("issue")
            .values("issue_id", "logged_at")
            .annotate(total=Sum("duration_minutes"))
        )

        # Build per-issue daily map
        issue_days = defaultdict(lambda: defaultdict(int))
        for wl in worklogs:
            iid = str(wl["issue_id"])
            day = wl["logged_at"].isoformat()
            issue_days[iid][day] = wl["total"]

        # Build rows
        rows = []
        for iid, info in issue_map.items():
            days = dict(issue_days.get(iid, {}))
            total = sum(days.values())
            rows.append({**info, "days": days, "total_minutes": total})

        # Daily totals
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
