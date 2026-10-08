# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Profile

from ..filters import exclude_running, filter_entries
from ..reports import build_report, build_summary, previous_period
from ..services import TimeTrackingError
from .base import TimeTrackingBaseView, parse_date_param


class TimeEntrySummaryEndpoint(TimeTrackingBaseView):
    def get(self, request, slug):
        access = self.get_access(request, slug)
        all_matching = filter_entries(request.GET, access.visible_entries())
        completed = exclude_running(all_matching)

        previous = None
        date_from = parse_date_param(request.GET, "date_from")
        date_to = parse_date_param(request.GET, "date_to")
        if date_from and date_to and date_from <= date_to:
            prev_from, prev_to = previous_period(date_from, date_to)
            params = request.GET.copy()
            params["date_from"], params["date_to"] = prev_from.isoformat(), prev_to.isoformat()
            previous = (prev_from, prev_to, exclude_running(filter_entries(params, access.visible_entries())))

        return Response(build_summary(completed, all_matching, previous), status=status.HTTP_200_OK)


class TimeEntryReportEndpoint(TimeTrackingBaseView):
    def get(self, request, slug):
        access = self.get_access(request, slug)
        entries = exclude_running(filter_entries(request.GET, access.visible_entries()))

        week_start = request.GET.get("week_start")
        if week_start in (None, ""):
            week_start = Profile.objects.filter(user_id=request.user.id).values_list("start_of_the_week", flat=True)
            week_start = week_start.first() or 0
        else:
            try:
                week_start = int(week_start)
            except ValueError:
                raise TimeTrackingError("INVALID_FILTER", "week_start must be between 0 and 6.", "week_start")

        report = build_report(
            entries,
            group_by=request.GET.get("group_by") or "project",
            sub_group_by=request.GET.get("sub_group_by") or None,
            interval=request.GET.get("interval") or None,
            week_start=week_start,
            date_from=parse_date_param(request.GET, "date_from"),
            date_to=parse_date_param(request.GET, "date_to"),
        )
        return Response(report, status=status.HTTP_200_OK)
