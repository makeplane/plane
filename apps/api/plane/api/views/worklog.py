# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Sum

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiResponse

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.api.serializers import IssueWorkLogSerializer
from plane.db.models import IntakeIssue, IssueWorkLog, Project, ProjectMember
from plane.db.models.intake import IntakeIssueStatus
from plane.db.models.project import ROLE
from .base import BaseAPIView

TIME_TRACKING_DISABLED_ERROR = "Time tracking is disabled for this project."
INTAKE_WORK_ITEM_ERROR = "Time cannot be logged on an intake work item until it is accepted."


def _is_unaccepted_intake_issue(project_id, issue_id):
    """Worklogs are blocked on intake work items that have not been accepted yet."""
    return (
        IntakeIssue.objects.filter(project_id=project_id, issue_id=issue_id)
        .exclude(status=IntakeIssueStatus.ACCEPTED)
        .exists()
    )


def _is_project_admin(user, slug, project_id):
    return ProjectMember.objects.filter(
        workspace__slug=slug,
        project_id=project_id,
        member=user,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


class IssueWorkLogListCreateAPIEndpoint(BaseAPIView):
    """List the worklogs of a work item and log time against it."""

    model = IssueWorkLog
    serializer_class = IssueWorkLogSerializer
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            IssueWorkLog.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                issue_id=self.kwargs.get("issue_id"),
            )
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("workspace", "project", "issue", "logged_by")
            .order_by("-created_at")
            .distinct()
        )

    @extend_schema(
        operation_id="list_work_logs",
        summary="List work item worklogs",
        description="Retrieve the time-tracking entries logged against a work item (durations in minutes).",
        tags=["Work Items"],
        responses={200: OpenApiResponse(description="List of worklogs", response=IssueWorkLogSerializer)},
    )
    def get(self, request, slug, project_id, issue_id):
        """List work item worklogs.

        Returns a plain (non-paginated) JSON array — the shape the public
        Plane SDK / MCP ``list_work_logs`` client expects.
        """
        return Response(
            IssueWorkLogSerializer(self.get_queryset(), many=True).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="create_work_log",
        summary="Log time on a work item",
        description="Create a time-tracking entry (worklog) on a work item. Duration is expressed in minutes.",
        tags=["Work Items"],
        responses={201: OpenApiResponse(description="Worklog created", response=IssueWorkLogSerializer)},
    )
    def post(self, request, slug, project_id, issue_id):
        """Log time on a work item."""
        project = Project.objects.get(pk=project_id)
        if not project.is_time_tracking_enabled:
            return Response({"error": TIME_TRACKING_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        if _is_unaccepted_intake_issue(project_id, issue_id):
            return Response({"error": INTAKE_WORK_ITEM_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        # Deduplicate by external identity when provided
        if request.data.get("external_id") and request.data.get("external_source"):
            existing = IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                external_source=request.data.get("external_source"),
                external_id=request.data.get("external_id"),
            ).first()
            if existing is not None:
                return Response(
                    {
                        "error": "Worklog with the same external id and external source already exists",
                        "id": str(existing.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        serializer = IssueWorkLogSerializer(data=request.data)
        if serializer.is_valid():
            # logged_by is forced to the caller server-side; never client-writable.
            serializer.save(project_id=project_id, issue_id=issue_id, logged_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueWorkLogDetailAPIEndpoint(BaseAPIView):
    """Retrieve, update or delete a single worklog."""

    model = IssueWorkLog
    serializer_class = IssueWorkLogSerializer
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            IssueWorkLog.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                issue_id=self.kwargs.get("issue_id"),
            )
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("workspace", "project", "issue", "logged_by")
            .distinct()
        )

    @extend_schema(
        operation_id="retrieve_work_log",
        summary="Retrieve a worklog",
        description="Retrieve a single time-tracking entry of a work item.",
        tags=["Work Items"],
        responses={200: OpenApiResponse(description="Worklog", response=IssueWorkLogSerializer)},
    )
    def get(self, request, slug, project_id, issue_id, pk):
        """Retrieve a worklog."""
        worklog = self.get_queryset().get(pk=pk)
        return Response(IssueWorkLogSerializer(worklog).data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_work_log",
        summary="Update a worklog",
        description="Update a time-tracking entry. Only the author or a project admin can update it.",
        tags=["Work Items"],
        responses={200: OpenApiResponse(description="Worklog updated", response=IssueWorkLogSerializer)},
    )
    def patch(self, request, slug, project_id, issue_id, pk):
        """Update a worklog."""
        project = Project.objects.get(pk=project_id)
        if not project.is_time_tracking_enabled:
            return Response({"error": TIME_TRACKING_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        worklog = IssueWorkLog.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        if worklog.logged_by_id != request.user.id and not _is_project_admin(request.user, slug, project_id):
            return Response(
                {"error": "Only the author or a project admin can edit this worklog."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = IssueWorkLogSerializer(worklog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        operation_id="delete_work_log",
        summary="Delete a worklog",
        description="Delete a time-tracking entry. Only the author or a project admin can delete it.",
        tags=["Work Items"],
        responses={204: OpenApiResponse(description="Worklog deleted")},
    )
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete a worklog."""
        project = Project.objects.get(pk=project_id)
        if not project.is_time_tracking_enabled:
            return Response({"error": TIME_TRACKING_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        worklog = IssueWorkLog.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        if worklog.logged_by_id != request.user.id and not _is_project_admin(request.user, slug, project_id):
            return Response(
                {"error": "Only the author or a project admin can delete this worklog."},
                status=status.HTTP_403_FORBIDDEN,
            )

        worklog.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueWorkLogProjectSummaryAPIEndpoint(BaseAPIView):
    """Project-level rollup of logged time (per work item)."""

    model = IssueWorkLog
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    @extend_schema(
        operation_id="get_project_worklog_summary",
        summary="Project worklog summary",
        description="Aggregate logged time (in minutes) per work item for a project.",
        tags=["Work Items"],
        responses={200: OpenApiResponse(description="Aggregated worklog totals per work item")},
    )
    def get(self, request, slug, project_id):
        """Project worklog summary — ``[{"issue_id": <uuid>, "duration": <minutes>}]``."""
        rollup = (
            IssueWorkLog.objects.filter(workspace__slug=slug, project_id=project_id)
            .values("issue")
            .annotate(duration=Sum("duration"))
            .order_by("-duration")
        )
        return Response(
            [{"issue_id": str(row["issue"]), "duration": row["duration"]} for row in rollup],
            status=status.HTTP_200_OK,
        )
