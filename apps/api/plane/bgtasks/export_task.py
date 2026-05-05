# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from typing import List
from uuid import UUID

# Third party imports
from celery import shared_task

# Django imports
from django.db.models import Prefetch

# Module imports
from plane.bgtasks.export_utils import create_zip_file, upload_to_s3
from plane.db.models import ExporterHistory, Issue, IssueComment, IssueRelation, IssueSubscriber
from plane.utils.exception_logger import log_exception
from plane.utils.porters.exporter import DataExporter
from plane.utils.porters.serializers.issue import IssueExportSerializer


@shared_task
def issue_export_task(
    provider: str,
    workspace_id: UUID,
    project_ids: List[str],
    token_id: str,
    multiple: bool,
    slug: str,
):
    """
    Export issues from the workspace.
    provider (str): The provider to export the issues to csv | json | xlsx.
    token_id (str): The export object token id.
    multiple (bool): Whether to export the issues to multiple files per project.
    """
    try:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "processing"
        exporter_instance.save(update_fields=["status"])

        # Build base queryset for issues
        workspace_issues = (
            Issue.objects.filter(
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
                "created_by",
                "estimate_point",
            )
            .prefetch_related(
                "labels",
                "issue_cycle__cycle",
                "issue_module__module",
                "assignees",
                "issue_link",
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
                    "issue_related",
                    queryset=IssueRelation.objects.select_related("issue", "issue__project"),
                ),
                Prefetch(
                    "parent",
                    queryset=Issue.objects.select_related("type", "project"),
                ),
            )
        )

        # Create exporter for the specified format
        try:
            exporter = DataExporter(IssueExportSerializer, format_type=provider)
        except ValueError as e:
            # Invalid format type
            exporter_instance = ExporterHistory.objects.get(token=token_id)
            exporter_instance.status = "failed"
            exporter_instance.reason = str(e)
            exporter_instance.save(update_fields=["status", "reason"])
            return

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
