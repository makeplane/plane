# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ExporterHistorySerializer, IssueWorkLogSerializer
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.bgtasks.export_utils import parse_date
from plane.bgtasks.worklog_export_task import worklog_export_task
from plane.db.models import ExporterHistory, IssueWorkLog, Workspace


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
        parsed_from = parse_date(date_from) if date_from else None
        parsed_to = parse_date(date_to) if date_to else None
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


class ProjectWorklogExportView(BaseAPIView):
    """Trigger async worklog export and list export history for a project."""

    ALLOWED_FILTER_KEYS = {"member_id", "date_from", "date_to"}

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        provider = request.data.get("provider", "csv")
        filters = request.data.get("filters", {})

        if provider not in ("csv", "xlsx"):
            return Response(
                {"error": "Invalid provider. Use 'csv' or 'xlsx'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(filters, dict) or not set(filters.keys()).issubset(self.ALLOWED_FILTER_KEYS):
            return Response(
                {"error": "Invalid filters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exporter = ExporterHistory.objects.create(
            workspace=workspace,
            project=[str(project_id)],
            initiated_by=request.user,
            provider=provider,
            type="issue_worklogs",
            filters=filters,
        )

        worklog_export_task.delay(
            provider=provider,
            workspace_id=str(workspace.id),
            project_id=str(project_id),
            token_id=exporter.token,
            slug=slug,
            filters=filters,
        )

        return Response(
            {"message": "Export started", "export_id": str(exporter.id)},
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        history = (
            ExporterHistory.objects.filter(
                workspace__slug=slug,
                type="issue_worklogs",
                project__contains=[str(project_id)],
            )
            .select_related("workspace", "initiated_by")
        )

        return self.paginate(
            order_by="-created_at",
            request=request,
            queryset=history,
            on_results=lambda h: ExporterHistorySerializer(h, many=True).data,
        )
