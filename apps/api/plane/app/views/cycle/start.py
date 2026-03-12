# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Cycle
from .. import BaseAPIView


class CycleStartEndpoint(BaseAPIView):
    """
    Endpoint to manually start a cycle (sprint).
    This sets manual_status to "started" which takes priority over date-based status.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, cycle_id):
        try:
            cycle = Cycle.objects.get(
                pk=cycle_id,
                project_id=project_id,
                workspace__slug=slug,
            )
        except Cycle.DoesNotExist:
            return Response(
                {"error": "Cycle not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validation 1: Check if cycle is already completed
        if cycle.manual_status == "completed":
            return Response(
                {"error": "Cannot start a completed cycle"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validation 2: Check if cycle is already started
        if cycle.manual_status == "started":
            return Response(
                {"error": "Cycle is already started"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validation 3: Check if cycle is archived
        if cycle.archived_at:
            return Response(
                {"error": "Cannot start an archived cycle"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validation 4: Check if there's another active cycle in the project
        active_cycle = Cycle.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            manual_status="started",
            archived_at__isnull=True,
        ).exclude(pk=cycle_id).first()

        if active_cycle:
            return Response(
                {
                    "error": f"Another cycle '{active_cycle.name}' is already active in this project. "
                             "Please complete it before starting a new one."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Also check for date-based active cycles (no manual_status but dates indicate current)
        now = timezone.now()
        date_active_cycle = Cycle.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            manual_status__isnull=True,
            start_date__lte=now,
            end_date__gte=now,
            archived_at__isnull=True,
        ).exclude(pk=cycle_id).first()

        if date_active_cycle:
            return Response(
                {
                    "error": f"Another cycle '{date_active_cycle.name}' is currently active (based on dates). "
                             "Please complete it before starting a new one."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Start the cycle
        cycle.manual_status = "started"
        cycle.started_at = timezone.now()
        cycle.save(update_fields=["manual_status", "started_at", "updated_at"])

        return Response(
            {
                "id": str(cycle.id),
                "manual_status": cycle.manual_status,
                "started_at": str(cycle.started_at),
                "message": "Cycle started successfully",
            },
            status=status.HTTP_200_OK,
        )
