# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import IssueWorkLogSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import IssueWorkLog


def _parse_date(value):
    """Parse a YYYY-MM-DD string to date, returns None on invalid input."""
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


class ProjectWorkLogViewSet(BaseViewSet):
    """
    Project WorkLog ViewSet to list all worklogs across a project.
    """

    serializer_class = IssueWorkLogSerializer
    model = IssueWorkLog

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("logged_by", "project", "workspace", "issue")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug, project_id):
        # Optional filters
        member_id = request.query_params.get("member_id")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        issue_id = request.query_params.get("issue_id")

        queryset = self.get_queryset()

        if member_id:
            member_ids = [m.strip() for m in member_id.split(",") if m.strip()]
            queryset = queryset.filter(logged_by_id__in=member_ids)
        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)
        parsed_from = _parse_date(date_from) if date_from else None
        parsed_to = _parse_date(date_to) if date_to else None
        if parsed_from:
            queryset = queryset.filter(logged_at__gte=parsed_from)
        if parsed_to:
            queryset = queryset.filter(logged_at__lte=parsed_to)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda worklogs: IssueWorkLogSerializer(
                worklogs, many=True
            ).data,
        )
