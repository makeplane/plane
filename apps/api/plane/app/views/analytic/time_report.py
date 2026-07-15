# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime, time, timedelta
from typing import Any, Dict, List, Optional, Tuple

import pytz
from django.db.models import Case, Q, QuerySet, Value, When, CharField
from django.db.models.functions import Concat
from django.http import HttpRequest
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import IssueTimeLog, ProjectMember, User, Workspace, WorkspaceMember

MAX_REPORT_RANGE_DAYS = 92


def _parse_date(value: Optional[str]):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _local_midnight_utc(tz, local_date):
    """Return the UTC datetime for 00:00 of `local_date` in timezone `tz`."""
    naive = datetime.combine(local_date, time.min)
    try:
        aware = tz.localize(naive, is_dst=None)
    except (pytz.exceptions.AmbiguousTimeError, pytz.exceptions.NonExistentTimeError):
        aware = tz.localize(naive, is_dst=False)
    return aware.astimezone(pytz.utc)


def _split_seconds_by_local_date(started_at, stopped_at, tz, window_start, window_end):
    """Split a [started_at, stopped_at) interval across workspace-local dates.

    Returns {local_date_iso: seconds}, clamped to [window_start, window_end).
    The full duration (including nights, weekends and holidays) is preserved and
    apportioned to the local calendar date each slice falls on.
    """
    result: Dict[str, int] = {}
    segment_start = max(started_at, window_start)
    segment_end = min(stopped_at, window_end)
    if segment_start >= segment_end:
        return result

    cursor = segment_start
    while cursor < segment_end:
        local_date = cursor.astimezone(tz).date()
        next_midnight = _local_midnight_utc(tz, local_date + timedelta(days=1))
        piece_end = min(segment_end, next_midnight)
        seconds = int((piece_end - cursor).total_seconds())
        if seconds > 0:
            key = local_date.isoformat()
            result[key] = result.get(key, 0) + seconds
        cursor = piece_end
    return result


def _split_ids(value: Optional[str]) -> Optional[List[str]]:
    if not value:
        return None
    return [item for item in value.split(",") if item]


def build_time_log_report(
    slug: str,
    user: User,
    start_date_str: Optional[str],
    end_date_str: Optional[str],
    project_ids: Optional[List[str]],
    user_ids: Optional[List[str]],
) -> Dict[str, Any]:
    """Build an aggregated time-log report for the given scope, or raise ValueError on bad input."""

    start_date = _parse_date(start_date_str)
    end_date = _parse_date(end_date_str)

    if not start_date or not end_date:
        raise ValueError("start_date and end_date are required and must be in YYYY-MM-DD format.")

    if start_date > end_date:
        raise ValueError("start_date must not be after end_date.")

    if (end_date - start_date).days + 1 > MAX_REPORT_RANGE_DAYS:
        raise ValueError(f"Date range must not exceed {MAX_REPORT_RANGE_DAYS} days.")

    # Projects the requesting user is an active member of, scoped to the requested project_ids
    member_project_qs = ProjectMember.objects.filter(
        member=user,
        workspace__slug=slug,
        is_active=True,
        project__deleted_at__isnull=True,
        project__archived_at__isnull=True,
    )
    if project_ids:
        member_project_qs = member_project_qs.filter(project_id__in=project_ids)

    member_roles = dict(member_project_qs.values_list("project_id", "role"))
    scoped_project_ids = list(member_roles.keys())

    is_workspace_admin = WorkspaceMember.objects.filter(
        member=user, workspace__slug=slug, role=ROLE.ADMIN.value, is_active=True
    ).exists()

    admin_project_ids = (
        list(scoped_project_ids)
        if is_workspace_admin
        else [pid for pid, role in member_roles.items() if role == ROLE.ADMIN.value]
    )
    member_only_project_ids = [pid for pid in scoped_project_ids if pid not in admin_project_ids]

    can_view_others = bool(admin_project_ids)

    if not scoped_project_ids:
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "can_view_others": False,
            "entries": [],
            "issues": {},
            "users": {},
        }

    visibility_q = Q(project_id__in=admin_project_ids) | (
        Q(project_id__in=member_only_project_ids) & Q(user_id=user.id)
    )

    # Convert the requested local date range to a UTC window in the workspace
    # timezone, then select every closed log whose [started_at, stopped_at)
    # interval overlaps it — not just logs whose stored `date` falls inside.
    ws_timezone = (
        Workspace.objects.filter(slug=slug).values_list("timezone", flat=True).first()
        or "UTC"
    )
    tz = pytz.timezone(ws_timezone)
    window_start = _local_midnight_utc(tz, start_date)
    window_end = _local_midnight_utc(tz, end_date + timedelta(days=1))

    qs: QuerySet = (
        IssueTimeLog.objects.filter(
            workspace__slug=slug,
            stopped_at__isnull=False,
            started_at__lt=window_end,
            stopped_at__gt=window_start,
            project_id__in=scoped_project_ids,
        )
        .filter(visibility_q)
        .select_related("issue", "issue__project")
    )

    if user_ids:
        qs = qs.filter(user_id__in=user_ids)

    # Aggregate per (user, issue, project, workspace-local date), splitting each
    # log across the local calendar dates its interval spans.
    aggregated: Dict[Tuple[Optional[str], str, str, str], int] = {}
    issues: Dict[str, Dict[str, Any]] = {}
    user_ids_seen = set()

    for log in qs:
        pieces = _split_seconds_by_local_date(
            log.started_at, log.stopped_at, tz, window_start, window_end
        )
        if not pieces:
            continue
        user_key = str(log.user_id) if log.user_id else None
        issue_key = str(log.issue_id)
        project_key = str(log.project_id)
        for local_date_iso, seconds in pieces.items():
            key = (user_key, issue_key, project_key, local_date_iso)
            aggregated[key] = aggregated.get(key, 0) + seconds
        if log.user_id:
            user_ids_seen.add(log.user_id)
        issues[issue_key] = {
            "name": log.issue.name,
            "sequence_id": log.issue.sequence_id,
            "project_id": project_key,
            "project_identifier": log.issue.project.identifier,
        }

    entries = [
        {
            "user_id": user_key,
            "issue_id": issue_key,
            "project_id": project_key,
            "date": local_date_iso,
            "duration_seconds": seconds,
        }
        for (user_key, issue_key, project_key, local_date_iso), seconds in sorted(
            aggregated.items(),
            key=lambda item: (item[0][0] or "", item[0][1], item[0][3]),
        )
    ]

    users_qs = (
        User.objects.filter(pk__in=user_ids_seen)
        .annotate(
            avatar_url=Case(
                When(
                    avatar_asset__isnull=False,
                    then=Concat(Value("/api/assets/v2/static/"), "avatar_asset", Value("/")),
                ),
                When(avatar_asset__isnull=True, then="avatar"),
                default=Value(None),
                output_field=CharField(),
            )
        )
        .values("id", "display_name", "first_name", "last_name", "avatar_url")
    )

    users = {
        str(row["id"]): {
            "display_name": row["display_name"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "avatar_url": row["avatar_url"],
        }
        for row in users_qs
    }

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "can_view_others": can_view_others,
        "entries": entries,
        "issues": issues,
        "users": users,
    }


class WorkspaceTimeLogReportEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request: HttpRequest, slug: str) -> Response:
        try:
            report = build_time_log_report(
                slug=slug,
                user=request.user,
                start_date_str=request.GET.get("start_date"),
                end_date_str=request.GET.get("end_date"),
                project_ids=_split_ids(request.GET.get("project_ids")),
                user_ids=_split_ids(request.GET.get("user_ids")),
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(report, status=status.HTTP_200_OK)


class ProjectTimeLogReportEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request: HttpRequest, slug: str, project_id: str) -> Response:
        try:
            report = build_time_log_report(
                slug=slug,
                user=request.user,
                start_date_str=request.GET.get("start_date"),
                end_date_str=request.GET.get("end_date"),
                project_ids=[str(project_id)],
                user_ids=_split_ids(request.GET.get("user_ids")),
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(report, status=status.HTTP_200_OK)
