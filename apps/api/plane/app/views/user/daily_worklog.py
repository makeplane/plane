# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db.models import Sum
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import IssueWorkLog


class UserDailyWorklogTotalEndpoint(BaseAPIView):
    """Returns the current user's total logged minutes for today across all workspaces."""

    def get(self, request):
        tz_str = request.GET.get("tz", "UTC")
        try:
            tz = ZoneInfo(tz_str)
        except (ZoneInfoNotFoundError, KeyError):
            tz = ZoneInfo("UTC")
        today = datetime.now(tz).date()
        total = (
            IssueWorkLog.objects.filter(
                logged_by=request.user,
                logged_at=today,
            ).aggregate(total=Sum("duration_minutes"))["total"]
            or 0
        )
        return Response(
            {"total_minutes": total, "date": str(today)},
            status=status.HTTP_200_OK,
        )
