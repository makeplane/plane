# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from django.db.models import Case, Q, QuerySet, Sum, Value, When, CharField
from django.db.models.functions import Concat
from django.http import HttpRequest
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import IssueTimeLog, ProjectMember, User, WorkspaceMember

MAX_REPORT_RANGE_DAYS = 92


def _parse_date(value: Optional[str]):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


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

    qs: QuerySet = IssueTimeLog.objects.filter(
        workspace__slug=slug,
        date__gte=start_date,
        date__lte=end_date,
        stopped_at__isnull=False,
        project_id__in=scoped_project_ids,
    ).filter(visibility_q)

    if user_ids:
        qs = qs.filter(user_id__in=user_ids)

    entries_qs = (
        qs.values(
            "user_id",
            "issue_id",
            "project_id",
            "date",
            "issue__name",
            "issue__sequence_id",
            "issue__project__identifier",
        )
        .annotate(duration_seconds=Sum("duration_seconds"))
        .order_by("user_id", "issue_id", "date")
    )

    entries = []
    issues: Dict[str, Dict[str, Any]] = {}
    user_ids_seen = set()

    for row in entries_qs:
        entries.append(
            {
                "user_id": str(row["user_id"]) if row["user_id"] else None,
                "issue_id": str(row["issue_id"]),
                "project_id": str(row["project_id"]),
                "date": row["date"].isoformat(),
                "duration_seconds": row["duration_seconds"] or 0,
            }
        )
        if row["user_id"]:
            user_ids_seen.add(row["user_id"])
        issues[str(row["issue_id"])] = {
            "name": row["issue__name"],
            "sequence_id": row["issue__sequence_id"],
            "project_id": str(row["project_id"]),
            "project_identifier": row["issue__project__identifier"],
        }

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
