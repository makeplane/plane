# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Celery task that generates the detailed capacity XLSX export.

Pipeline: load job → status=processing → build workbook (Summary + per-member
sheets) → upload to S3 → presigned URL (7d) → status=ready → notify + email.
"""

import io
from datetime import timedelta

from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from django.utils import timezone
from openpyxl import Workbook

from plane.bgtasks.capacity_export_helpers import (
    build_member_roster,
    build_worklog_queryset,
    compute_member_totals,
    write_member_sheet,
    write_summary_sheet,
)
from plane.bgtasks.export_utils import upload_bytes_and_presign
from plane.db.models import CapacityExportJob, Notification
from plane.utils.exception_logger import log_exception


XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
PRESIGN_TTL = 7 * 24 * 3600  # 7 days


def _enqueue_email(job_id: str, is_failure: bool) -> None:
    """Best-effort email enqueue; Phase 04 module may not be imported yet."""
    try:
        from plane.bgtasks.capacity_export_email_task import capacity_export_email_task
        capacity_export_email_task.delay(str(job_id), is_failure=is_failure)
    except ImportError:
        pass
    except Exception as e:  # pragma: no cover — defensive
        log_exception(e)


def _mark_failed(job: CapacityExportJob, message: str) -> None:
    job.status = "failed"
    job.error_message = (message or "")[:1000]
    job.completed_at = timezone.now()
    job.save(update_fields=["status", "error_message", "completed_at", "updated_at"])
    _enqueue_email(str(job.id), is_failure=True)


@shared_task(bind=True, soft_time_limit=300, time_limit=600)
def generate_capacity_xlsx_export(self, job_id):
    """Render an XLSX with one sheet per member + a Summary sheet, then upload to S3."""
    try:
        job = CapacityExportJob.objects.select_related("workspace", "requested_by").get(id=job_id)
    except CapacityExportJob.DoesNotExist:
        return

    # Defense-in-depth: detailed export disabled cross-workspace
    if job.cross_workspace:
        _mark_failed(job, "Detailed export not supported in cross-workspace mode")
        return

    job.status = "processing"
    job.save(update_fields=["status", "updated_at"])

    try:
        wb = Workbook(write_only=True)

        qs = build_worklog_queryset(job)
        totals = compute_member_totals(qs)
        roster = build_member_roster(job, totals)

        # Summary first (write_only is forward-only)
        write_summary_sheet(wb, roster)

        used_names: set = set()
        total_rows = 0
        requester_email = getattr(job.requested_by, "email", "") or ""

        for member in roster:
            total_rows += write_member_sheet(
                wb=wb,
                member_dict=member,
                qs=qs,
                used_names=used_names,
                requester_email=requester_email,
            )

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        size_bytes = buffer.getbuffer().nbytes

        key = (
            f"capacity-exports/{job.workspace.slug}/{job.id}/"
            f"{job.workspace.slug}-worklog-detailed-{job.date_from}_{job.date_to}.xlsx"
        )
        presigned_url = upload_bytes_and_presign(
            buffer=buffer,
            key=key,
            content_type=XLSX_CONTENT_TYPE,
            expires_in=PRESIGN_TTL,
        )

        now = timezone.now()
        job.status = "ready"
        job.file_key = key
        job.file_url = presigned_url
        job.file_size = size_bytes
        job.row_count = total_rows
        job.expires_at = now + timedelta(seconds=PRESIGN_TTL)
        job.completed_at = now
        job.error_message = ""
        job.save(update_fields=[
            "status", "file_key", "file_url", "file_size", "row_count",
            "expires_at", "completed_at", "error_message", "updated_at",
        ])

        # In-app notification (bell)
        try:
            Notification.objects.create(
                workspace=job.workspace,
                receiver=job.requested_by,
                triggered_by=job.requested_by,
                entity_name="capacity_export",
                entity_identifier=job.id,
                title=f"Capacity report ready ({job.date_from} – {job.date_to})",
                sender="capacity_export",
                data={
                    "download_url": presigned_url,
                    "expires_at": job.expires_at.isoformat(),
                    "row_count": total_rows,
                    "file_size": size_bytes,
                },
                message_html=(
                    f"<p>Your capacity report is ready. "
                    f"<a href=\"{presigned_url}\">Download</a> "
                    f"(link expires {job.expires_at.date().isoformat()}).</p>"
                ),
            )
        except Exception as e:  # pragma: no cover — defensive
            log_exception(e)

        _enqueue_email(str(job.id), is_failure=False)

    except SoftTimeLimitExceeded:
        _mark_failed(job, "Export timed out")
    except Exception as e:
        log_exception(e)
        _mark_failed(job, str(e))
