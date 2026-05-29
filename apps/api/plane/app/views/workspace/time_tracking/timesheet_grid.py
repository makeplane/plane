# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from collections import defaultdict

from django.db.models import Count, Sum

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog, Issue

from ._week import parse_week_start


class TimesheetGridEndpoint(BaseAPIView):
    """Return the current user's timesheet grid for a given week.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/timesheet/
    ?week_start=YYYY-MM-DD  (optional, defaults to current week Monday)

    Response: { week_start, week_end, rows: [...], daily_totals, grand_total_minutes }
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        week_start, week_end, err = parse_week_start(request.query_params.get("week_start"))
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch worklogs for this user in the date range (no assignee restriction:
        # any logged time counts, even on issues the user isn't assigned to)
        worklogs = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                logged_by=request.user,
                logged_at__range=[week_start, week_end],
            )
            .values("issue_id", "logged_at")
            .annotate(total=Sum("duration_minutes"))
        )

        logged_issue_ids = {wl["issue_id"] for wl in worklogs}
        # Count of the current user's logged children, grouped by parent. A parent's
        # logged-children count is just how many of the user's logged issues point at
        # it — one grouped query over the PK set, no correlated subquery. This is the
        # exact set the sub-issues endpoint returns, so chevron presence ⇔ expandable
        # children exist.
        child_counts = dict(
            Issue.issue_objects.filter(id__in=logged_issue_ids)
            .exclude(parent_id__isnull=True)
            .values("parent_id")
            .annotate(c=Count("id"))
            .values_list("parent_id", "c")
        )
        issues = (
            Issue.issue_objects.filter(id__in=logged_issue_ids)
            .select_related("project")
            .only("id", "name", "sequence_id", "project_id", "project__identifier")
            .order_by("sequence_id")
        )
        issue_map = {
            str(i.id): {
                "issue_id": str(i.id),
                "issue_name": i.name,
                "issue_identifier": f"{i.project.identifier}-{i.sequence_id}",
                "project_id": str(i.project_id),
                "sub_issues_count": child_counts.get(i.id, 0),
            }
            for i in issues
        }

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
