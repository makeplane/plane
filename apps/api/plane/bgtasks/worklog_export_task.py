# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import UUID

from celery import shared_task

from plane.bgtasks.export_utils import create_zip_file, parse_date, upload_to_s3
from plane.db.models import ExporterHistory, IssueWorkLog
from plane.utils.exception_logger import log_exception
from plane.utils.porters.exporter import DataExporter
from plane.utils.porters.serializers.worklog import WorklogExportSerializer


@shared_task
def worklog_export_task(
    provider: str,
    workspace_id: UUID,
    project_id: str,
    token_id: str,
    slug: str,
    filters: dict = None,
):
    """Export worklogs for a project as CSV or XLSX, upload to S3."""
    try:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "processing"
        exporter_instance.save(update_fields=["status"])

        # Build queryset with filters
        queryset = (
            IssueWorkLog.objects.filter(
                workspace__id=workspace_id,
                project_id=project_id,
                project__project_projectmember__member=exporter_instance.initiated_by_id,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("logged_by", "project", "issue")
            .order_by("-logged_at")
        )

        # Apply optional filters
        if filters:
            member_id = filters.get("member_id")
            if member_id:
                member_ids = [m.strip() for m in member_id.split(",") if m.strip()]
                queryset = queryset.filter(logged_by_id__in=member_ids)

            parsed_from = parse_date(filters.get("date_from"))
            if parsed_from:
                queryset = queryset.filter(logged_at__gte=parsed_from)

            parsed_to = parse_date(filters.get("date_to"))
            if parsed_to:
                queryset = queryset.filter(logged_at__lte=parsed_to)

        # Create exporter
        try:
            exporter = DataExporter(WorklogExportSerializer, format_type=provider)
        except ValueError as e:
            exporter_instance.status = "failed"
            exporter_instance.reason = str(e)
            exporter_instance.save(update_fields=["status", "reason"])
            return

        # Export data (handles empty queryset — creates headers-only file)
        export_filename = f"{slug}-worklogs-{project_id[:8]}"
        filename, content = exporter.export(export_filename, queryset)

        zip_buffer = create_zip_file([(filename, content)])
        upload_to_s3(zip_buffer, workspace_id, token_id, slug)

    except Exception as e:
        try:
            exporter_instance = ExporterHistory.objects.get(token=token_id)
            exporter_instance.status = "failed"
            exporter_instance.reason = str(e)
            exporter_instance.save(update_fields=["status", "reason"])
        except ExporterHistory.DoesNotExist:
            pass
        log_exception(e)
