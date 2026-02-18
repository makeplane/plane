# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Sum, F, Value, CharField
from django.db.models.functions import Concat

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog


class ProjectWorkLogSummaryEndpoint(BaseAPIView):
    """Aggregate worklog summary for a project."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        filters = {"workspace__slug": slug, "project_id": project_id}

        # Optional date range filters
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            filters["logged_at__gte"] = date_from
        if date_to:
            filters["logged_at__lte"] = date_to

        worklogs = IssueWorkLog.objects.filter(**filters)

        total = worklogs.aggregate(total=Sum("duration_minutes"))["total"] or 0

        by_member = list(
            worklogs.values("logged_by")
            .annotate(
                member_id=F("logged_by"),
                display_name=F("logged_by__display_name"),
                total_minutes=Sum("duration_minutes"),
            )
            .values("member_id", "display_name", "total_minutes")
            .order_by("-total_minutes")
        )

        by_issue = list(
            worklogs.values("issue")
            .annotate(
                issue_id=F("issue"),
                issue_name=F("issue__name"),
                estimate_time=F("issue__estimate_time"),
                total_minutes=Sum("duration_minutes"),
            )
            .values("issue_id", "issue_name", "estimate_time", "total_minutes")
            .order_by("-total_minutes")
        )

        return Response(
            {
                "total_duration_minutes": total,
                "by_member": by_member,
                "by_issue": by_issue,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceWorkLogSummaryEndpoint(BaseAPIView):
    """Aggregate worklog summary across all projects in workspace."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        filters = {"workspace__slug": slug}

        # Optional filters
        project_id = request.query_params.get("project_id")
        member_id = request.query_params.get("member_id")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if project_id:
            filters["project_id"] = project_id
        if member_id:
            filters["logged_by_id"] = member_id
        if date_from:
            filters["logged_at__gte"] = date_from
        if date_to:
            filters["logged_at__lte"] = date_to

        worklogs = IssueWorkLog.objects.filter(**filters)

        total = worklogs.aggregate(total=Sum("duration_minutes"))["total"] or 0

        by_member = list(
            worklogs.values("logged_by")
            .annotate(
                member_id=F("logged_by"),
                display_name=F("logged_by__display_name"),
                total_minutes=Sum("duration_minutes"),
            )
            .values("member_id", "display_name", "total_minutes")
            .order_by("-total_minutes")
        )

        by_issue = list(
            worklogs.values("issue")
            .annotate(
                issue_id=F("issue"),
                issue_name=F("issue__name"),
                estimate_time=F("issue__estimate_time"),
                total_minutes=Sum("duration_minutes"),
            )
            .values("issue_id", "issue_name", "estimate_time", "total_minutes")
            .order_by("-total_minutes")
        )

        return Response(
            {
                "total_duration_minutes": total,
                "by_member": by_member,
                "by_issue": by_issue,
            },
            status=status.HTTP_200_OK,
        )
