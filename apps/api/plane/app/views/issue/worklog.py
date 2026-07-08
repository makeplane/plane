# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Sum

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .. import BaseViewSet
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import IssueWorkLogSerializer
from plane.db.models import IntakeIssue, Issue, IssueWorkLog, Project, ProjectMember
from plane.db.models.intake import IntakeIssueStatus

TIME_TRACKING_DISABLED_ERROR = "Time tracking is disabled for this project."
INTAKE_WORK_ITEM_ERROR = "Time cannot be logged on an intake work item until it is accepted."
ISSUE_NOT_IN_PROJECT_ERROR = "Work item not found in this project."


def _issue_belongs_to_project(slug, project_id, issue_id):
    """The target work item must belong to this project/workspace (isolation).

    Guards against a member logging time against a work item of another project
    (dangling worklog) or against a non-existent id (FK IntegrityError -> 500).
    """
    return Issue.objects.filter(pk=issue_id, project_id=project_id, workspace__slug=slug).exists()


def _is_unaccepted_intake_issue(project_id, issue_id):
    """Worklogs are blocked on intake work items that have not been accepted yet."""
    return (
        IntakeIssue.objects.filter(project_id=project_id, issue_id=issue_id)
        .exclude(status=IntakeIssueStatus.ACCEPTED)
        .exists()
    )


class IssueWorkLogViewSet(BaseViewSet):
    serializer_class = IssueWorkLogSerializer
    model = IssueWorkLog

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .select_related("logged_by")
            .order_by("-created_at")
            .distinct()
        )

    def _is_project_admin(self, slug, project_id):
        return ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            member=self.request.user,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, issue_id):
        project = Project.objects.get(pk=project_id)
        if not project.is_time_tracking_enabled:
            return Response({"error": TIME_TRACKING_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        if not _issue_belongs_to_project(slug, project_id, issue_id):
            return Response({"error": ISSUE_NOT_IN_PROJECT_ERROR}, status=status.HTTP_404_NOT_FOUND)

        if _is_unaccepted_intake_issue(project_id, issue_id):
            return Response({"error": INTAKE_WORK_ITEM_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        # Deduplicate by external identity when provided (parity with the v1 surface)
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

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, issue_id, pk):
        project = Project.objects.get(pk=project_id)
        if not project.is_time_tracking_enabled:
            return Response({"error": TIME_TRACKING_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        worklog = IssueWorkLog.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        # Only the author (logged_by) or a project admin may edit a worklog
        if worklog.logged_by_id != request.user.id and not self._is_project_admin(slug, project_id):
            return Response(
                {"error": "Only the author or a project admin can edit this worklog."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = IssueWorkLogSerializer(worklog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, issue_id, pk):
        project = Project.objects.get(pk=project_id)
        if not project.is_time_tracking_enabled:
            return Response({"error": TIME_TRACKING_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        worklog = IssueWorkLog.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        # Only the author (logged_by) or a project admin may delete a worklog
        if worklog.logged_by_id != request.user.id and not self._is_project_admin(slug, project_id):
            return Response(
                {"error": "Only the author or a project admin can delete this worklog."},
                status=status.HTTP_403_FORBIDDEN,
            )

        worklog.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def total_worklogs(self, request, slug, project_id):
        """Project-level rollup of logged time in minutes, aggregated per work item.

        Returns ``[{"issue_id": <uuid>, "duration": <minutes>}]`` — the shape the
        MCP/SDK client expects (``total-worklogs/``). Soft-deleted worklogs are
        excluded (default ``objects`` manager).
        """
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
