# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers.capacity_export import (
    CapacityExportJobCreateSerializer,
    CapacityExportJobListSerializer,
)
from plane.db.models import CapacityExportJob, Workspace, WorkspaceMember
from plane.utils.exception_logger import log_exception

from plane.app.views.base import BaseAPIView


_DEDUPE_WINDOW_SECONDS = 30


class CapacityExportEndpoint(BaseAPIView):
    """
    POST  /api/workspaces/<slug>/capacity/exports/  — enqueue a new export job.
    GET   /api/workspaces/<slug>/capacity/exports/  — list caller's jobs (latest 50).
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        serializer = CapacityExportJobCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Defense-in-depth: cross-workspace detailed export is not supported
        if data.get("cross_workspace"):
            return Response(
                {"error": "detailed_export_cross_workspace_not_supported"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cast UUIDs to strings — DRF UUIDField returns UUID objects, but JSONField
        # storage needs JSON-serializable values.
        raw_member_ids = data.get("member_ids") or []
        member_ids = [str(m) for m in raw_member_ids]

        # Validate that all supplied member_ids belong to this workspace
        if member_ids:
            active_count = WorkspaceMember.objects.filter(
                workspace__slug=slug,
                member_id__in=member_ids,
                is_active=True,
            ).count()
            if active_count != len(member_ids):
                return Response(
                    {"member_ids": "One or more member IDs are not active members of this workspace."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Resolve workspace (guaranteed to exist; permission decorator already checked)
        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        # Dedupe: same user + workspace + date range + same member set, within 30 s
        dedupe_cutoff = timezone.now() - timedelta(seconds=_DEDUPE_WINDOW_SECONDS)
        existing = (
            CapacityExportJob.objects.filter(
                requested_by=request.user,
                workspace=workspace,
                date_from=data["date_from"],
                date_to=data["date_to"],
                status__in=("queued", "processing"),
                created_at__gte=dedupe_cutoff,
            )
            .order_by("-created_at")
            .first()
        )
        if existing:
            # Member-set equality check (sets, order-independent)
            existing_set = set(str(m) for m in (existing.member_ids or []))
            requested_set = set(member_ids)
            if existing_set == requested_set:
                return Response(
                    {
                        "job_id": str(existing.id),
                        "duplicate": True,
                        "message": "Existing job in progress",
                        "status": existing.status,
                    },
                    status=status.HTTP_202_ACCEPTED,
                )

        # Create job
        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=request.user,
            date_from=data["date_from"],
            date_to=data["date_to"],
            member_ids=member_ids,
            cross_workspace=False,
            status="queued",
        )

        # Enqueue Celery task (created in Phase 03; safe import guard)
        try:
            from plane.bgtasks.capacity_export_task import generate_capacity_xlsx_export  # noqa: PLC0415

            generate_capacity_xlsx_export.delay(str(job.id))
        except ImportError:
            # Phase 03 task not yet deployed — job stays in "queued" until task is available
            log_exception(Exception("capacity_export_task not found; job queued without dispatch"))

        return Response(
            {
                "job_id": str(job.id),
                "duplicate": False,
                "message": "Export queued",
                "status": "queued",
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        jobs = (
            CapacityExportJob.objects.filter(
                workspace__slug=slug,
                requested_by=request.user,
            )
            .order_by("-created_at")[:50]
        )
        serializer = CapacityExportJobListSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
