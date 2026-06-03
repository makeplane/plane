# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Instance-admin usage-monitor endpoints.

Two GET endpoints expose the worklog-derived metrics:
  * ``users/``       — active + standard user series (distinct users per period)
                       plus deduped range totals
  * ``departments/`` — per-workspace comparison and per-project drilldown

Active and standard share a single ``user_day_totals`` pass, so the users
endpoint aggregates the table only once. The client owns filter state and
always sends explicit dates, so no filter values are echoed back.
"""

import uuid
from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import IssueWorkLog, Workspace
from plane.license.api.views.base import BaseAPIView
from plane.license.utils.usage_metrics import (
    active_users_series,
    department_aggregates,
    project_totals,
    standard_users_series,
    total_active_users,
    total_standard_users,
    user_day_totals,
    user_workspace_day_totals,
)

# Largest span allowed per granularity — bounds both the query and chart points.
MAX_RANGE_DAYS = {"day": 92, "month": 36 * 31, "year": 10 * 366}
DEFAULT_RANGE_DAYS = 30


class _FilterError(Exception):
    """Raised on invalid query params; mapped to a 400 by the endpoints."""


def _parse_common_params(request):
    """Validate shared query params, returning (granularity, d_from, d_to, workspace_id).

    Raises _FilterError (→ 400) on any bad input rather than letting it 500.
    """
    granularity = request.query_params.get("granularity", "day")
    if granularity not in ("day", "month", "year"):
        raise _FilterError("granularity must be one of: day, month, year")

    date_to_raw = request.query_params.get("date_to")
    date_from_raw = request.query_params.get("date_from")
    try:
        d_to = (
            datetime.strptime(date_to_raw, "%Y-%m-%d").date()
            if date_to_raw
            else timezone.now().date()
        )
        d_from = (
            datetime.strptime(date_from_raw, "%Y-%m-%d").date()
            if date_from_raw
            else d_to - timedelta(days=DEFAULT_RANGE_DAYS)
        )
    except ValueError:
        raise _FilterError("date_from/date_to must be YYYY-MM-DD")

    if d_from > d_to:
        raise _FilterError("date_from must not be after date_to")
    if (d_to - d_from).days > MAX_RANGE_DAYS[granularity]:
        raise _FilterError(
            f"range exceeds the {MAX_RANGE_DAYS[granularity]}-day cap for granularity '{granularity}'"
        )

    workspace_id = request.query_params.get("workspace_id")
    if workspace_id:
        try:
            uuid.UUID(workspace_id)
        except ValueError:
            raise _FilterError("workspace_id must be a valid UUID")

    return granularity, d_from, d_to, workspace_id


def _base_queryset(d_from, d_to, workspace_id):
    """Worklogs in range from real users with live workspace/project parents."""
    qs = IssueWorkLog.objects.filter(
        logged_at__range=(d_from, d_to),
        logged_by__is_bot=False,
        logged_by__is_active=True,
        workspace__deleted_at__isnull=True,
        project__deleted_at__isnull=True,
    )
    if workspace_id:
        qs = qs.filter(workspace_id=workspace_id)
    return qs


class UsageMonitorUsersEndpoint(BaseAPIView):
    """Active + standard user metrics from one aggregation pass."""

    def get(self, request):
        try:
            granularity, d_from, d_to, workspace_id = _parse_common_params(request)
        except _FilterError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        rows = user_day_totals(_base_queryset(d_from, d_to, workspace_id))
        return Response(
            {
                "series_active": active_users_series(rows, granularity),
                "series_standard": standard_users_series(rows, granularity),
                "total_active_users": total_active_users(rows),
                "total_standard_users": total_standard_users(rows),
            },
            status=status.HTTP_200_OK,
        )


class UsageMonitorDepartmentsEndpoint(BaseAPIView):
    """Per-workspace comparison; per-project drilldown when workspace_id is set."""

    def get(self, request):
        try:
            _granularity, d_from, d_to, workspace_id = _parse_common_params(request)
        except _FilterError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        qs = _base_queryset(d_from, d_to, workspace_id)
        ws_day_rows = user_workspace_day_totals(qs)
        proj_rows = project_totals(qs)

        workspace_ids = {r["workspace_id"] for r in ws_day_rows} | {
            r["workspace_id"] for r in proj_rows
        }
        workspaces = {
            str(w["id"]): {"name": w["name"], "slug": w["slug"]}
            for w in Workspace.objects.filter(id__in=workspace_ids).values(
                "id", "name", "slug"
            )
        }

        payload = {
            "workspaces": department_aggregates(ws_day_rows, proj_rows, workspaces)
        }
        if workspace_id:
            payload["projects"] = [
                {
                    "project_id": r["project_id"],
                    "project_name": r["project_name"],
                    "total_logged_minutes": r["total_minutes"],
                }
                for r in sorted(
                    proj_rows, key=lambda r: r["total_minutes"], reverse=True
                )
            ]
        return Response(payload, status=status.HTTP_200_OK)
