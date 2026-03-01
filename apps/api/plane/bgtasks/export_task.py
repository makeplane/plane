# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import io
import logging
import zipfile
from typing import List
from uuid import UUID

# Third party imports
from celery import shared_task

# Django imports
from django.db.models import Prefetch
from django.utils import timezone

# Module imports
from plane.db.models import ExporterHistory, Issue, IssueComment, IssueRelation, IssueSubscriber, StateGroup
from plane.utils.exception_logger import log_exception
from plane.utils.porters import IssueExportSerializer, DataExporter
from plane.ee.models import CustomerRequestIssue, InitiativeEpic
from plane.settings.storage import S3Storage
from plane.utils.filters import ComplexFilterBackend, IssueFilterSet
from plane.utils.host import base_host
from plane.utils.issue_filters import issue_filters

# Logger
logger = logging.getLogger("plane.worker")


class _FakeDjangoRequest:
    def __init__(self):
        from urllib.parse import urlparse

        from django.http import QueryDict

        self.GET = QueryDict(mutable=True)

        # Get the public URL from environment variables
        web_url = base_host(is_app=True, request=None)
        parsed_url = urlparse(web_url)

        # Add scheme and host attributes needed by S3Storage
        self.scheme = parsed_url.scheme or "http"
        self._host = parsed_url.netloc or "localhost"

    def get_host(self):
        return self._host


class _FakeDRFRequest:
    def __init__(self):
        self._request = _FakeDjangoRequest()

    @property
    def query_params(self):
        return self._request.GET


class _ExportFilterView:
    filterset_class = IssueFilterSet

    def __init__(self, request):
        self.request = request


def create_zip_file(files: List[tuple[str, str | bytes]]) -> io.BytesIO:
    """
    Create a ZIP file from the provided files.
    """
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
        for filename, file_content in files:
            zipf.writestr(filename, file_content)

    zip_buffer.seek(0)
    return zip_buffer


# TODO: Change the upload_to_s3 function to use the new storage method with entry in file asset table
def upload_to_s3(zip_file: io.BytesIO, workspace_id: UUID, token_id: str, slug: str) -> None:
    """
    Upload a ZIP file to S3 and generate a presigned URL.
    """
    file_name = f"{workspace_id}/export-{slug}-{token_id[:6]}-{str(timezone.now().date())}.zip"

    logger.info(
        "Uploading export file to S3",
        {
            "file_name": file_name,
        },
    )

    expires_in = 7 * 24 * 60 * 60

    storage = S3Storage(request=None)

    # Upload the file to S3
    is_uploaded = storage.upload_file(
        file_obj=zip_file,
        object_name=file_name,
        content_type="application/zip",
    )
    if not is_uploaded:
        logger.error("Failed to upload export file to S3")
        return

    # Generate a presigned URL for the uploaded file
    fake_request = _FakeDjangoRequest()
    storage = S3Storage(request=fake_request)

    presigned_url = storage.generate_presigned_url(
        file_name,
        expiration=expires_in,
        http_method="GET",
        disposition="inline",
        filename=file_name,
    )

    exporter_instance = ExporterHistory.objects.get(token=token_id)

    # Update the exporter instance with the presigned url
    if presigned_url:
        logger.info(
            "Uploaded export file to S3",
            {
                "file_name": file_name,
            },
        )
        exporter_instance.url = presigned_url
        exporter_instance.status = "completed"
        exporter_instance.key = file_name
    else:
        exporter_instance.status = "failed"
        logger.error("Failed to upload export file to S3")

    logger.info(
        "Saving exporter instance",
        {
            "exporter_instance": exporter_instance,
        },
    )
    exporter_instance.save(update_fields=["status", "url", "key"])


@shared_task
def issue_export_task(
    provider: str,
    workspace_id: UUID,
    project_ids: List[str],
    token_id: str,
    multiple: bool,
    slug: str,
    export_type: str | None = None,
):
    """
    Export issues from the workspace.
    provider (str): The provider to export the issues to csv | json | xlsx.
    token_id (str): The export object token id.
    multiple (bool): Whether to export the issues to multiple files per project.
    export_type (str | None): The type of export (epic, intake, issue, etc.).
    """

    logger.info(f"Export started for work-items for project {project_ids} in workspace {workspace_id}")

    try:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "processing"
        exporter_instance.save(update_fields=["status"])

        logger.info(
            "Building base queryset for issues",
            {
                "workspace_id": workspace_id,
                "type": exporter_instance.type,
                "export_type": export_type,
            },
        )

        # Build base queryset with export_type-specific manager and filters
        if export_type == "epic":
            # Use issue_and_epics_objects manager for epics with epic filter
            base_queryset = Issue.issue_and_epics_objects.filter(type__is_epic=True)
        elif export_type == "intake":
            # Use objects manager for intake with triage state filter
            base_queryset = Issue.objects.filter(state__group=StateGroup.TRIAGE.value)
        elif export_type == "issue":
            # Use issue_objects manager for regular issues (workitem, cycle, module, view)
            base_queryset = Issue.issue_objects.all()
        else:
            # Default: Use objects manager to export all types of issues (workspace export)
            base_queryset = Issue.objects.all()

        # Apply common filters
        workspace_issues = (
            base_queryset.filter(
                workspace__id=workspace_id,
                project_id__in=project_ids,
                project__project_projectmember__member=exporter_instance.initiated_by_id,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related(
                "project",
                "workspace",
                "state",
                "type",
                "created_by",
                "estimate_point",
            )
            .prefetch_related(
                "label_issue__label",
                "issue_cycle__cycle",
                "issue_module__module",
                "assignees",
                "issue_link",
                "worklogs",
                "worklogs__logged_by",
                "properties",
                "properties__property",
                "properties__value_option",
                Prefetch(
                    "issue_subscribers",
                    queryset=IssueSubscriber.objects.select_related("subscriber"),
                ),
                Prefetch(
                    "issue_comments",
                    queryset=IssueComment.objects.select_related("actor").order_by("created_at"),
                ),
                Prefetch(
                    "issue_relation",
                    queryset=IssueRelation.objects.select_related("related_issue", "related_issue__project"),
                ),
                Prefetch(
                    "parent",
                    queryset=Issue.objects.select_related("type", "project"),
                ),
                Prefetch(
                    "customer_request_issues",
                    queryset=CustomerRequestIssue.objects.filter(customer_request__isnull=True).select_related(
                        "customer"
                    ),
                ),
                Prefetch(
                    "initiative_epics",
                    queryset=InitiativeEpic.objects.select_related("initiative"),
                ),
            )
        )

        # Apply filters if present
        rich_filters = exporter_instance.rich_filters
        logger.info(
            "Applying rich filters",
            {
                "rich_filters": rich_filters,
            },
        )
        if rich_filters:
            backend = ComplexFilterBackend()
            fake_request = _FakeDRFRequest()
            view = _ExportFilterView(fake_request)
            workspace_issues = backend.filter_queryset(
                fake_request,
                workspace_issues,
                view,
                filter_data=rich_filters,
            )

        # Apply legacy filters if present
        filters = exporter_instance.filters
        logger.info(
            "Applying legacy filters",
            {
                "filters": filters,
            },
        )
        if filters:
            filters = issue_filters(filters, "GET")
            workspace_issues = workspace_issues.filter(**filters)

        # Create exporter for the specified format
        try:
            exporter = DataExporter(IssueExportSerializer, format_type=provider)
        except ValueError as e:
            # Invalid format type
            logger.error(
                "Invalid format type",
                {
                    "error": str(e),
                },
            )
            exporter_instance = ExporterHistory.objects.get(token=token_id)
            exporter_instance.status = "failed"
            exporter_instance.reason = str(e)
            exporter_instance.save(update_fields=["status", "reason"])
            return

        logger.info(
            "Creating files",
            {
                "multiple": multiple,
                "project_ids": project_ids,
            },
        )
        files = []
        if multiple:
            # Export each project separately with its own queryset
            for project_id in project_ids:
                project_issues = workspace_issues.filter(project_id=project_id)
                export_filename = f"{slug}-{project_id}"
                filename, content = exporter.export(export_filename, project_issues)
                files.append((filename, content))
        else:
            # Export all issues in a single file
            export_filename = f"{slug}-{workspace_id}"
            filename, content = exporter.export(export_filename, workspace_issues)
            files.append((filename, content))

        zip_buffer = create_zip_file(files)
        upload_to_s3(zip_buffer, workspace_id, token_id, slug)

    except Exception as e:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "failed"
        exporter_instance.reason = str(e)
        exporter_instance.save(update_fields=["status", "reason"])
        log_exception(e)
        return
