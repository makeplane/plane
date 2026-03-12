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
from plane.db.models import Cycle, CycleIssue, Issue
from plane.utils.cycle_transfer_issues import transfer_cycle_issues
from plane.utils.host import base_host
from .. import BaseAPIView


class CycleCompleteEndpoint(BaseAPIView):
    """
    Endpoint to manually complete a cycle (sprint).
    This sets manual_status to "completed" which takes priority over date-based status.
    Optionally transfers incomplete issues to another cycle.
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
                {"error": "Cycle is already completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validation 2: Check if cycle is archived
        if cycle.archived_at:
            return Response(
                {"error": "Cannot complete an archived cycle"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validation 3: Check if cycle is current (either manually started or date-based)
        now = timezone.now()
        is_manually_started = cycle.manual_status == "started"
        is_date_current = (
            cycle.start_date is not None
            and cycle.end_date is not None
            and cycle.start_date <= now <= cycle.end_date
        )

        if not is_manually_started and not is_date_current:
            return Response(
                {"error": "Only current/active cycles can be completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get incomplete issues count
        incomplete_issues_count = Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            issue_cycle__deleted_at__isnull=True,
            workspace__slug=slug,
            project_id=project_id,
        ).exclude(
            state__group__in=["completed", "cancelled"]
        ).count()

        # Handle optional issue transfer
        new_cycle_id = request.data.get("new_cycle_id")
        transfer_result = None

        if new_cycle_id and incomplete_issues_count > 0:
            # Validate new cycle exists and is not completed
            try:
                new_cycle = Cycle.objects.get(
                    pk=new_cycle_id,
                    project_id=project_id,
                    workspace__slug=slug,
                )
                if new_cycle.manual_status == "completed":
                    return Response(
                        {"error": "Cannot transfer issues to a completed cycle"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if new_cycle.archived_at:
                    return Response(
                        {"error": "Cannot transfer issues to an archived cycle"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Cycle.DoesNotExist:
                return Response(
                    {"error": "Target cycle for transfer not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Transfer issues using existing utility
            transfer_result = transfer_cycle_issues(
                slug=slug,
                project_id=project_id,
                cycle_id=cycle_id,
                new_cycle_id=new_cycle_id,
                request=request,
                user_id=request.user.id,
            )

            if transfer_result.get("error"):
                return Response(
                    {"error": transfer_result["error"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Complete the cycle
        cycle.manual_status = "completed"
        cycle.completed_at = timezone.now()
        cycle.save(update_fields=["manual_status", "completed_at", "updated_at"])

        response_data = {
            "id": str(cycle.id),
            "manual_status": cycle.manual_status,
            "completed_at": str(cycle.completed_at),
            "message": "Cycle completed successfully",
            "incomplete_issues_count": incomplete_issues_count,
        }

        if transfer_result:
            response_data["issues_transferred"] = True
            response_data["new_cycle_id"] = new_cycle_id

        return Response(response_data, status=status.HTTP_200_OK)


class CycleIncompleteIssuesEndpoint(BaseAPIView):
    """
    Endpoint to get count of incomplete issues in a cycle.
    Used by frontend to show warning before completing a cycle.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, cycle_id):
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

        # Count incomplete issues
        incomplete_issues_count = Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            issue_cycle__deleted_at__isnull=True,
            workspace__slug=slug,
            project_id=project_id,
        ).exclude(
            state__group__in=["completed", "cancelled"]
        ).count()

        # Get list of available cycles to transfer to (not completed, not archived, not current)
        available_cycles = Cycle.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            archived_at__isnull=True,
        ).exclude(
            pk=cycle_id
        ).exclude(
            manual_status="completed"
        ).values("id", "name", "start_date", "end_date", "manual_status")

        return Response(
            {
                "incomplete_issues_count": incomplete_issues_count,
                "available_cycles": list(available_cycles),
            },
            status=status.HTTP_200_OK,
        )
