# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .. import BaseViewSet
from .base import MILESTONES_DISABLED_ERROR, milestones_enabled
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import MilestoneIssueSerializer
from plane.db.models import Issue, Milestone, MilestoneIssue


class MilestoneIssueViewSet(BaseViewSet):
    serializer_class = MilestoneIssueSerializer
    model = MilestoneIssue

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .filter(milestone_id=self.kwargs.get("milestone_id"))
            .select_related("project", "workspace", "milestone", "issue")
            .order_by("-created_at")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id, milestone_id):
        milestone_issues = self.get_queryset()
        serializer = MilestoneIssueSerializer(milestone_issues, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, milestone_id):
        if not milestones_enabled(project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        issues = request.data.get("issues", [])
        if not issues or not isinstance(issues, list):
            return Response({"error": "Issues are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            requested_ids = list({uuid.UUID(str(issue)) for issue in issues})
        except (TypeError, ValueError, AttributeError):
            return Response({"error": "Issues are required"}, status=status.HTTP_400_BAD_REQUEST)

        milestone = Milestone.objects.get(workspace__slug=slug, project_id=project_id, pk=milestone_id)

        # Scope to workspace+project to prevent cross-tenant IDOR
        issue_ids = list(
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                pk__in=requested_ids,
            ).values_list("id", flat=True)
        )
        # reject unknown/foreign ids instead of silently dropping them (v1 parity)
        if len(issue_ids) != len(requested_ids):
            return Response(
                {"error": "Some work items were not found in this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ignore the work items already attached to the milestone
        existing_issue_ids = set(
            MilestoneIssue.objects.filter(milestone_id=milestone_id, issue_id__in=issue_ids).values_list(
                "issue_id", flat=True
            )
        )
        new_issue_ids = [issue_id for issue_id in issue_ids if issue_id not in existing_issue_ids]

        created_records = MilestoneIssue.objects.bulk_create(
            [
                MilestoneIssue(
                    project_id=project_id,
                    workspace_id=milestone.workspace_id,
                    milestone_id=milestone_id,
                    issue_id=issue_id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )
                for issue_id in new_issue_ids
            ],
            ignore_conflicts=True,
            batch_size=10,
        )

        return Response(
            MilestoneIssueSerializer(created_records, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, milestone_id, issue_id):
        if not milestones_enabled(project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        milestone_issue = MilestoneIssue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            milestone_id=milestone_id,
            issue_id=issue_id,
        )
        milestone_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
