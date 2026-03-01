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
import logging
from typing import Optional

# Third party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.ee.models import ImportJob, ImportReport
from plane.settings.storage import S3Storage
from plane.utils.exception_logger import log_exception
from plane.utils.porters import DataImporter, CSVFormatter, IssueImportSerializer

# Logger
logger = logging.getLogger("plane.worker")


# Serializer registry - maps schema type to serializer class
SERIALIZER_REGISTRY = {
    "issue": IssueImportSerializer,
}


def fetch_file_from_storage(file_key: str) -> Optional[str]:
    """Fetch file content from S3 storage."""
    try:
        storage = S3Storage(request=None)
        response = storage.s3_client.get_object(
            Bucket=storage.aws_storage_bucket_name,
            Key=file_key,
        )
        file_content = response["Body"].read()
        if isinstance(file_content, bytes):
            return file_content.decode("utf-8")
        return file_content
    except Exception as e:
        logger.error(f"Failed to fetch file from S3: {e}")
        return None


def _build_context(schema_type: str, workspace_id: str, project_id: Optional[str], initiator_id: Optional[str]) -> dict:
    """
    Build serializer context based on schema type.

    Args:
        schema_type: The type of import (user, issue)
        workspace_id: Workspace UUID
        project_id: Project UUID (required for issue imports)
        initiator_id: User UUID who initiated the import

    Returns:
        Context dict for the serializer
    """
    context = {
        "workspace_id": workspace_id,
    }

    if initiator_id:
        context["created_by_id"] = initiator_id

    if schema_type == "issue":
        if not project_id:
            raise ValueError("project_id is required for issue imports")
        context["project_id"] = project_id

        # Pre-fetch all required data for bulk optimization
        from plane.utils.porters import IssueImportSerializer

        import_context = IssueImportSerializer.build_context(project_id)
        context.update(import_context)

    return context


@shared_task
def csv_import_task(
    job_id: str,
    schema_type: str,
    file_key: str,
    workspace_id: str,
    project_id: Optional[str] = None,
    initiator_id: Optional[str] = None,
):
    """
    Import data from CSV file using the specified serializer.

    Args:
        job_id: ImportJob UUID
        schema_type: Schema type key (user, issue)
        file_key: S3 object key for the CSV file
        workspace_id: Workspace UUID
        project_id: Project UUID (required for issue imports)
        initiator_id: User UUID who initiated the import
    """
    logger.info(
        "Import started",
        {
            "job_id": job_id,
            "schema_type": schema_type,
            "workspace_id": workspace_id,
            "project_id": project_id,
        },
    )

    try:
        # Get the import job
        job = ImportJob.objects.get(id=job_id)

        # Get or create import report
        if not job.report:
            report = ImportReport.objects.create()
            job.report = report
            job.save(update_fields=["report"])
        else:
            report = job.report

        report.start_time = timezone.now()
        report.save(update_fields=["start_time"])

        # Validate schema type
        if schema_type not in SERIALIZER_REGISTRY:
            raise ValueError(f"Unknown schema type: {schema_type}. Available: {list(SERIALIZER_REGISTRY.keys())}")

        serializer_class = SERIALIZER_REGISTRY[schema_type]

        # Fetch CSV file from storage
        logger.info(f"Fetching file from S3: {file_key}")
        job.status = ImportJob.JobStatus.PULLING
        job.save(update_fields=["status"])

        file_content = fetch_file_from_storage(file_key)
        if not file_content:
            raise ValueError(f"Failed to fetch file from storage: {file_key}")

        job.status = ImportJob.JobStatus.PULLED
        job.save(update_fields=["status"])

        # Build context for serializer
        context = _build_context(schema_type, workspace_id, project_id, initiator_id)

        # Create importer and run import
        logger.info(f"Starting import with serializer: {serializer_class.__name__}")
        job.status = ImportJob.JobStatus.TRANSFORMING
        job.save(update_fields=["status"])

        importer = DataImporter(serializer_class, context=context)
        # Partial import is handled by the serializer's ListSerializer
        result = importer.from_string(file_content, CSVFormatter())

        # Update job status
        job.status = ImportJob.JobStatus.PUSHING
        job.save(update_fields=["status"])

        # Update report with counts
        report.total_issue_count = result.total_rows
        report.imported_issue_count = result.success_count
        report.errored_issue_count = result.error_count
        report.end_time = timezone.now()
        report.save(
            update_fields=[
                "total_issue_count",
                "imported_issue_count",
                "errored_issue_count",
                "end_time",
            ]
        )

        # Update job with success/error metadata
        job.success_metadata = {
            "created": result.created,  # Dict[row_index, identifier]
            "total_rows": result.total_rows,
            "successful_count": result.success_count,
        }

        if result.has_errors:
            job.error_metadata = {"errors": result.errors}

        # Set final status
        if result.error_count == result.total_rows:
            job.status = ImportJob.JobStatus.ERROR
        else:
            job.status = ImportJob.JobStatus.FINISHED

        job.save(update_fields=["status", "success_metadata", "error_metadata"])

        logger.info(
            "Import completed",
            {
                "job_id": job_id,
                "total_rows": result.total_rows,
                "successful": result.success_count,
                "failed": result.error_count,
            },
        )

    except Exception as e:
        logger.error(f"Import failed: {e}")
        log_exception(e)

        try:
            job = ImportJob.objects.get(id=job_id)
            job.status = ImportJob.JobStatus.ERROR
            job.error_metadata = {"error": str(e)}
            job.save(update_fields=["status", "error_metadata"])

            if job.report:
                job.report.end_time = timezone.now()
                job.report.save(update_fields=["end_time"])
        except Exception:
            pass

        return
