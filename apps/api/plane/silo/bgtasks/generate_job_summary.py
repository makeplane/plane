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

import io
from celery import shared_task
from logging import getLogger

from plane.ee.models.job import ImportJob, ImportReport, ImportExecutionLog
from plane.db.models.asset import FileAsset
from plane.settings.storage import S3Storage
from plane.silo.utils.job_summary_generator import generate_execution_summary_table, generate_summary_html

logger = getLogger("plane.silo.bgtasks")

EXCLUDED_ENTITY_TYPES = [
    "WORK_ITEM_RELATIONS",
    "WORK_ITEM_LABEL",
    "ISSUE_PROPERTY_VALUE",
    "WORK_ITEM_FILE_ASSET",
    "WORK_ITEM_LINKS",
    "WORK_ITEM_CYCLES",
]


@shared_task
def generate_job_summary(job_id: str, report_id: str):
    """
    Creates a summary by collected all the execution logs for the job and it's particular report

    Args:
        job_id: The job ID
        report_id: The report ID
        excluded_entity_types: List of entity types to exclude from the summary
                               Examples: ['COMMENT', 'WORKLOG', 'ATTACHMENT', 'LINK']
    """
    try:
        job = ImportJob.objects.get(pk=job_id)
        report = ImportReport.objects.get(pk=report_id)

        # Fetch logs
        logs = ImportExecutionLog.objects.filter(job_id=job_id, report_id=report_id).order_by("created_at")
        logs_list = list(logs)

        # Generate summary data
        summary_table = generate_execution_summary_table(logs_list, excluded_entity_types=EXCLUDED_ENTITY_TYPES)

        # Generate HTML
        html_content = generate_summary_html(logs_list, summary_table)

        # Upload to S3
        file_name = f"{job.workspace_id}/job-summary-{job_id}-{report_id}.html"
        file_buffer = io.BytesIO(html_content.encode("utf-8"))

        storage = S3Storage(request=None)
        is_uploaded = storage.upload_file(
            file_obj=file_buffer,
            object_name=file_name,
            content_type="text/html",
        )

        if not is_uploaded:
            raise Exception("Failed to upload summary to S3")

        # Create FileAsset
        asset = FileAsset.objects.create(
            workspace_id=job.workspace_id,
            project_id=job.project_id,
            user_id=job.initiator_id,
            asset=file_name,
            size=len(html_content.encode("utf-8")),
            is_uploaded=True,
            attributes={
                "job_id": str(job_id),
                "report_id": str(report_id),
                "type": "job_summary",
            },
        )

        # Update report
        report.summary_asset = asset
        report.save(update_fields=["summary_asset"])

        # Delete all the execution logs after the summary generation
        ImportExecutionLog.objects.filter(job=job, report=report).delete()

        logger.info(f"Successfully generated summary for job {job_id} report {report_id}")

    except Exception as e:
        logger.error(f"Failed to generate job summary for job {job_id} report {report_id}: {e}")
        raise e
