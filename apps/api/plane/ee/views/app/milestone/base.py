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

# Python imports
import json

# Django imports
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions.project import ProjectMemberPermission
from django.db.models import Prefetch, Q, Count
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views import BaseViewSet
from plane.ee.serializers.app import (
    MilestoneSerializer,
    MilestoneWriteSerializer,
)
from plane.ee.models import Milestone, MilestoneIssue
from plane.db.models import Issue, Workspace
from plane.utils.host import base_host
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.issue_search import search_issues


class MilestoneViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = MilestoneSerializer
    model = Milestone
    permission_classes = [ProjectMemberPermission]

    webhook_event = "milestone"

    def get_serializer_class(self):
        return (
            MilestoneWriteSerializer if self.action in ["create", "update", "partial_update"] else MilestoneSerializer
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__archived_at__isnull=True)
            .select_related("description")
            .prefetch_related(
                Prefetch(
                    "milestone_issues",
                    queryset=(
                        MilestoneIssue.objects.filter(deleted_at__isnull=True)
                        .select_related("issue__state", "issue__type")
                        .prefetch_related("issue__assignees")
                    ),
                )
            )
            .annotate(
                total_issues_count=Count(
                    "milestone_issues",
                    filter=Q(milestone_issues__deleted_at__isnull=True),
                    distinct=True,
                ),
                completed_issues_count=Count(
                    "milestone_issues",
                    filter=Q(
                        milestone_issues__deleted_at__isnull=True,
                        milestone_issues__issue__state__group="completed",
                    ),
                    distinct=True,
                ),
                cancelled_issues_count=Count(
                    "milestone_issues",
                    filter=Q(
                        milestone_issues__deleted_at__isnull=True,
                        milestone_issues__issue__state__group="cancelled",
                    ),
                    distinct=True,
                ),
            )
            .accessible_to(self.request.user.id, self.kwargs["slug"])
            .distinct()
        )

    @method_decorator(gzip_page)
    @check_feature_flag(FeatureFlag.MILESTONES)
    def list(self, request, slug, project_id):
        queryset = self.get_queryset().order_by("target_date", "-created_at")
        serializer = MilestoneSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.MILESTONES)
    def create(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request,
                "project_id": project_id,
                "workspace_id": workspace.id,
            },
        )
        serializer.is_valid(raise_exception=True)
        milestone = serializer.save(
            project_id=project_id,
            workspace_id=workspace.id,
            created_by=request.user,
        )

        # Re-fetch milestone with annotations for proper response
        milestone = self.get_queryset().get(id=milestone.id)
        return Response(MilestoneSerializer(milestone).data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.MILESTONES)
    def partial_update(self, request, slug, project_id, pk):
        milestone = self.get_object()
        serializer = self.get_serializer(
            milestone,
            data=request.data,
            partial=True,
            context={
                "request": request,
                "project_id": project_id,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Re-fetch milestone with annotations for proper response
        milestone = self.get_queryset().get(id=milestone.id)
        return Response(MilestoneSerializer(milestone).data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.MILESTONES)
    def destroy(self, request, slug, project_id, pk):
        milestone = self.get_object()

        # Get all milestone issues to delete them explicitly
        milestone_issues = MilestoneIssue.objects.filter(milestone_id=pk, workspace__slug=slug, project_id=project_id)

        # Collect work item IDs before deletion for activity logging
        work_item_ids = list(milestone_issues.values_list("issue_id", flat=True))

        # Bulk soft delete all milestone issues using Django's delete method
        milestone_issues.delete()

        # Create activity logs for each work item
        for work_item_id in work_item_ids:
            issue_activity.delay(
                type="milestone_issue.activity.deleted",
                requested_data=json.dumps({"milestone_id": str(pk)}),
                actor_id=str(request.user.id),
                issue_id=str(work_item_id),
                project_id=str(project_id),
                current_instance=json.dumps({"milestone_name": str(milestone.title)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

        # Soft delete the milestone
        milestone.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.MILESTONES)
    def get(self, request, slug, project_id):
        """Return issues in the project that are not linked to any active milestone.

        Optional query params:
        - search: string to filter issues by name/sequence/project identifier
        """
        query = request.query_params.get("search", None)

        issues = (
            Issue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                deleted_at__isnull=True,
                archived_at__isnull=True,
                is_draft=False,
            )
            .filter(Q(state__is_triage=False) | Q(state__isnull=True))
            .annotate(
                active_milestones=Count(
                    "issue_milestone",
                    filter=Q(
                        issue_milestone__deleted_at__isnull=True,
                        issue_milestone__project_id=project_id,
                    ),
                    distinct=True,
                )
            )
            .filter(active_milestones=0)
            .select_related("state")
            .accessible_to(self.request.user.id, slug)
            .distinct()
        )

        if query:
            issues = search_issues(query, issues)

        results = issues.values(
            "name",
            "id",
            "start_date",
            "sequence_id",
            "project__name",
            "project__identifier",
            "project_id",
            "workspace__slug",
            "state__name",
            "state__group",
            "state__color",
            "type_id",
        )
        return Response(list(results), status=status.HTTP_200_OK)
