# Copyright (c) 2023-present Plane Software, Inc. and contributors
# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
# See the LICENSE file for details.

# Python imports
import io
import zipfile
from datetime import date
from typing import List
import boto3
from botocore.client import Config
from uuid import UUID

# Third party imports
from celery import shared_task

# Django imports
from django.conf import settings
from django.utils import timezone
from django.db.models import Prefetch

# Module imports
from plane.db.models import (
    ExporterHistory,
    Issue,
    IssueAssignee,
    IssueComment,
    IssuePropertyValue,
    IssueRelation,
    IssueSubscriber,
    Project,
    WorkspaceMember,
)
from plane.utils.exception_logger import log_exception
from plane.utils.porters.exporter import DataExporter
from plane.utils.porters.serializers.issue import IssueExportSerializer


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


def _export_basename(
    *,
    slug: str,
    token_id: str,
    export_date: date,
    project_identifier: str | None = None,
) -> str:
    """
    Build the base filename shared by an export and its archive.

    The export token keeps the name unique, so a new export never overwrites a previous one in S3.
    """
    parts = ["export", slug]
    if project_identifier:
        parts.append(project_identifier)
    parts.extend([token_id[:6], str(export_date)])
    return "-".join(parts)


def _get_s3_client(*, presign: bool = False):
    if settings.USE_MINIO:
        endpoint_url = (
            f"{settings.AWS_S3_URL_PROTOCOL}//{str(settings.AWS_S3_CUSTOM_DOMAIN).replace('/uploads', '')}/"
            if presign
            else settings.AWS_S3_ENDPOINT_URL
        )
    elif settings.AWS_S3_ENDPOINT_URL:
        endpoint_url = settings.AWS_S3_ENDPOINT_URL
    else:
        endpoint_url = None

    client_kwargs = {
        "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        "config": Config(signature_version="s3v4"),
    }
    if endpoint_url:
        client_kwargs["endpoint_url"] = endpoint_url
    elif not presign:
        client_kwargs["region_name"] = settings.AWS_REGION

    return boto3.client("s3", **client_kwargs)


def _finalize_exporter_upload(*, token_id: str, file_name: str, presigned_url: str | None) -> None:
    exporter_instance = ExporterHistory.objects.get(token=token_id)
    if presigned_url:
        exporter_instance.url = presigned_url
        exporter_instance.status = "completed"
        exporter_instance.key = file_name
    else:
        exporter_instance.status = "failed"
    exporter_instance.save(update_fields=["status", "url", "key"])


def upload_to_s3(zip_file: io.BytesIO, workspace_id: UUID, token_id: str, export_filename: str) -> None:
    """
    Upload a ZIP file to S3 and generate a presigned URL.
    """
    file_name = f"{workspace_id}/{export_filename}"
    expires_in = 7 * 24 * 60 * 60

    upload_s3 = _get_s3_client()
    extra_args = {"ContentType": "application/zip"}
    if settings.USE_MINIO:
        extra_args["ACL"] = "public-read"

    upload_s3.upload_fileobj(zip_file, settings.AWS_STORAGE_BUCKET_NAME, file_name, ExtraArgs=extra_args)

    presign_s3 = _get_s3_client(presign=settings.USE_MINIO)
    presigned_url = presign_s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": file_name},
        ExpiresIn=expires_in,
    )
    _finalize_exporter_upload(token_id=token_id, file_name=file_name, presigned_url=presigned_url)


def upload_export_file_to_s3(
    file_buffer: io.BytesIO,
    *,
    workspace_id: UUID,
    token_id: str,
    slug: str,
    export_filename: str,
    content_type: str,
) -> None:
    file_name = f"{workspace_id}/{export_filename}"
    expires_in = 7 * 24 * 60 * 60

    upload_s3 = _get_s3_client()
    extra_args = {"ContentType": content_type}
    if settings.USE_MINIO:
        extra_args["ACL"] = "public-read"

    upload_s3.upload_fileobj(file_buffer, settings.AWS_STORAGE_BUCKET_NAME, file_name, ExtraArgs=extra_args)

    presign_s3 = _get_s3_client(presign=settings.USE_MINIO)
    presigned_url = presign_s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": file_name},
        ExpiresIn=expires_in,
    )
    _finalize_exporter_upload(token_id=token_id, file_name=file_name, presigned_url=presigned_url)


@shared_task
def issue_export_task(
    provider: str,
    workspace_id: UUID,
    project_ids: List[str],
    token_id: str,
    multiple: bool,
    slug: str,
    csv_delimiter: str = ",",
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
                "type",
            )
            .prefetch_related(
                # The serializer reads labels through the join model, so prefetching the
                # plain m2m would not be used and every row would hit the database again.
                "label_issue__label",
                "issue_cycle__cycle",
                "issue_module__module",
                # Assignments are read through the join model so that soft deleted ones stay out
                Prefetch(
                    "issue_assignee",
                    queryset=IssueAssignee.objects.select_related("assignee"),
                ),
                "issue_link",
                Prefetch(
                    "type_property_values",
                    queryset=IssuePropertyValue.objects.select_related("property"),
                ),
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

        # Member picker properties store user ids, resolved to e-mails while serializing
        member_emails = {
            str(member_id): email
            for member_id, email in WorkspaceMember.objects.filter(
                workspace_id=workspace_id,
                is_active=True,
            ).values_list("member_id", "member__email")
            if email
        }

        # Create exporter for the specified format
        try:
            exporter = DataExporter(
                IssueExportSerializer,
                format_type=provider,
                csv_delimiter=csv_delimiter,
                context={"member_emails": member_emails},
            )
        except ValueError as e:
            # Invalid format type
            exporter_instance = ExporterHistory.objects.get(token=token_id)
            exporter_instance.status = "failed"
            exporter_instance.reason = str(e)
            exporter_instance.save(update_fields=["status", "reason"])
            return

        # Resolved once so every file of this export carries the same date
        export_date = timezone.now().date()
        base_filename = _export_basename(slug=slug, token_id=token_id, export_date=export_date)

        files = []
        if multiple:
            project_identifiers = {
                str(project_id): identifier
                for project_id, identifier in Project.objects.filter(id__in=project_ids).values_list(
                    "id", "identifier"
                )
            }
            # Export each project separately with its own queryset
            for project_id in project_ids:
                project_issues = workspace_issues.filter(project_id=project_id)
                export_filename = _export_basename(
                    slug=slug,
                    token_id=token_id,
                    export_date=export_date,
                    project_identifier=project_identifiers.get(str(project_id), str(project_id)),
                )
                filename, content = exporter.export(export_filename, project_issues)
                files.append((filename, content))
        else:
            # Export all issues in a single file
            filename, content = exporter.export(base_filename, workspace_issues)
            files.append((filename, content))

        if len(files) == 1 and provider == "csv":
            filename, content = files[0]
            csv_buffer = io.BytesIO()
            if isinstance(content, bytes):
                csv_buffer.write(content)
            else:
                csv_buffer.write(str(content).encode("utf-8"))
            csv_buffer.seek(0)
            upload_export_file_to_s3(
                csv_buffer,
                workspace_id=workspace_id,
                token_id=token_id,
                slug=slug,
                export_filename=filename,
                content_type="text/csv; charset=utf-8",
            )
        else:
            zip_buffer = create_zip_file(files)
            upload_to_s3(zip_buffer, workspace_id, token_id, f"{base_filename}.zip")

    except Exception as e:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "failed"
        exporter_instance.reason = str(e)
        exporter_instance.save(update_fields=["status", "reason"])
        log_exception(e)
        return
