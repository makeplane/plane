# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Celery task that generates the HO Datasheet XLSX export.

Pipeline: load job → status=processing → build queryset → write workbook
→ upload to S3 → presigned URL (7d) → status=ready → email requester.
"""

import io
from datetime import timedelta

from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from django.utils import timezone
from openpyxl import Workbook

from plane.bgtasks.export_utils import upload_bytes_and_presign
from plane.bgtasks.ho_export_helpers import build_ho_export_queryset, write_ho_workbook
from plane.db.models import HoExportJob
from plane.utils.exception_logger import log_exception


XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
PRESIGN_TTL = 7 * 24 * 3600  # 7 days


def _enqueue_email(job_id: str, is_failure: bool) -> None:
    try:
        from plane.bgtasks.ho_export_email_task import ho_export_email_task  # noqa: PLC0415

        ho_export_email_task.delay(str(job_id), is_failure=is_failure)
    except ImportError:
        pass
    except Exception as e:
        log_exception(e)


def _mark_failed(job: HoExportJob, message: str) -> None:
    job.status = "failed"
    job.error_message = (message or "")[:1000]
    job.completed_at = timezone.now()
    job.save(update_fields=["status", "error_message", "completed_at", "updated_at"])
    _enqueue_email(str(job.id), is_failure=True)


@shared_task(bind=True, soft_time_limit=300, time_limit=600)
def generate_ho_xlsx_export(self, job_id):
    """Generate HO Datasheet XLSX with all columns including Total Log Time, then email."""
    try:
        job = HoExportJob.objects.select_related("requested_by").get(id=job_id)
    except HoExportJob.DoesNotExist:
        return

    job.status = "processing"
    job.save(update_fields=["status", "updated_at"])

    try:
        wb = Workbook(write_only=True)

        qs = build_ho_export_queryset(job.requested_by, job.filters)
        row_count = write_ho_workbook(wb, qs, columns=job.filters.get("columns"))

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        size_bytes = buffer.getbuffer().nbytes

        now = timezone.now()
        date_str = timezone.localtime(now).strftime("%Y%m%d-%H%M")
        key = f"ho-exports/{job.id}/ho-datasheet-{date_str}.xlsx"

        presigned_url = upload_bytes_and_presign(
            buffer=buffer,
            key=key,
            content_type=XLSX_CONTENT_TYPE,
            expires_in=PRESIGN_TTL,
        )

        job.status = "ready"
        job.file_key = key
        job.file_url = presigned_url
        job.file_size = size_bytes
        job.row_count = row_count
        job.expires_at = now + timedelta(seconds=PRESIGN_TTL)
        job.completed_at = now
        job.error_message = ""
        job.save(
            update_fields=[
                "status",
                "file_key",
                "file_url",
                "file_size",
                "row_count",
                "expires_at",
                "completed_at",
                "error_message",
                "updated_at",
            ]
        )

        _enqueue_email(str(job.id), is_failure=False)

    except SoftTimeLimitExceeded:
        _mark_failed(job, "Export timed out")
    except Exception as e:
        log_exception(e)
        _mark_failed(job, str(e))
