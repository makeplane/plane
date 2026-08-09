# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import csv
import io

# Django imports
from django.db.models import Sum
from django.http import HttpResponse

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import TimeLogReadSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import TimeLog


def _filtered_time_logs(request, slug):
    """Time logs across the workspace, scoped to projects the requester
    is an active member of, with the shared query-param filters applied."""
    queryset = TimeLog.objects.filter(
        workspace__slug=slug,
        project__project_projectmember__member=request.user,
        project__project_projectmember__is_active=True,
        project__archived_at__isnull=True,
    ).select_related("issue", "project", "logged_by", "created_by")

    user_id = request.GET.get("user_id")
    project_id = request.GET.get("project_id")
    project_ids = request.GET.get("project_ids")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if user_id:
        queryset = queryset.filter(logged_by_id=user_id)
    if project_id:
        queryset = queryset.filter(project_id=project_id)
    if project_ids:
        queryset = queryset.filter(project_id__in=project_ids.split(","))
    if start_date:
        queryset = queryset.filter(logged_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(logged_date__lte=end_date)

    return queryset.distinct()


class WorkspaceTimeLogEndpoint(BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        time_logs = _filtered_time_logs(request, slug)
        return Response(TimeLogReadSerializer(time_logs, many=True).data, status=status.HTTP_200_OK)


class WorkspaceTimeLogExportEndpoint(BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        time_logs = _filtered_time_logs(request, slug).order_by("-logged_date")

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["Date", "Member", "Project", "Work Item", "Hours", "Minutes", "Description"])
        for log in time_logs:
            writer.writerow(
                [
                    log.logged_date.isoformat() if log.logged_date else "",
                    log.logged_by.display_name if log.logged_by else "",
                    log.project.name if log.project else "",
                    log.issue.name if log.issue else "",
                    log.duration_minutes // 60,
                    log.duration_minutes % 60,
                    log.description or "",
                ]
            )

        return HttpResponse(
            buffer.getvalue(),
            content_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="worklogs.csv"'},
        )


class WorkspaceTimeLogAnalyticsEndpoint(BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        time_logs = _filtered_time_logs(request, slug)

        by_date = list(
            time_logs.values("logged_date").annotate(total_minutes=Sum("duration_minutes")).order_by("logged_date")
        )
        by_project = list(
            time_logs.values("project_id", "project__name")
            .annotate(total_minutes=Sum("duration_minutes"))
            .order_by("-total_minutes")
        )
        by_member = list(
            time_logs.values("logged_by_id", "logged_by__display_name")
            .annotate(total_minutes=Sum("duration_minutes"))
            .order_by("-total_minutes")
        )
        total_minutes = time_logs.aggregate(total=Sum("duration_minutes"))["total"] or 0

        return Response(
            {
                "total_minutes": total_minutes,
                "by_date": by_date,
                "by_project": by_project,
                "by_member": by_member,
            },
            status=status.HTTP_200_OK,
        )
