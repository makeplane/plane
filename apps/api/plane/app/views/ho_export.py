# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.app.views.ho import get_accessible_workspace_ids
from plane.db.models import HoExportJob
from plane.utils.exception_logger import log_exception


class HoExportView(BaseAPIView):
    """GET /api/ho/exports/ — list the requesting user's export jobs (newest first, max 50).
    POST /api/ho/exports/ — enqueue an async HO Datasheet XLSX export job."""

    def get(self, request):
        jobs = HoExportJob.objects.filter(requested_by=request.user).order_by("-created_at")[:50]
        data = [
            {
                "id": str(job.id),
                "status": job.status,
                "filters": job.filters or {},
                "file_url": job.file_url,
                "file_size": job.file_size or 0,
                "row_count": job.row_count or 0,
                "error_message": job.error_message or "",
                "expires_at": job.expires_at.isoformat() if job.expires_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "created_at": job.created_at.isoformat(),
            }
            for job in jobs
        ]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        # Verify user has HO access (instance admin / dept manager / workspace member)
        workspace_ids = get_accessible_workspace_ids(request.user)
        if not workspace_ids:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Store the active filter snapshot from the request body
        filters = request.data if isinstance(request.data, dict) else {}

        job = HoExportJob.objects.create(
            requested_by=request.user,
            filters=filters,
            status="queued",
        )

        try:
            from plane.bgtasks.ho_export_task import generate_ho_xlsx_export  # noqa: PLC0415

            generate_ho_xlsx_export.delay(str(job.id))
        except ImportError:
            log_exception(Exception("ho_export_task not found; job queued without dispatch"))

        return Response(
            {"job_id": str(job.id), "message": "Export queued"},
            status=status.HTTP_202_ACCEPTED,
        )
