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
from plane.permissions import can, MilestonePermissions
from plane.db.models import Workspace
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views import BaseAPIView


from plane.ee.serializers.app.milestone import (
    MilestoneWorkItemSerializer,
    MilestoneWorkItemResponseSerializer,
)
from plane.ee.models import Milestone, MilestoneIssue
from plane.db.models import Issue
from plane.utils.host import base_host
from plane.bgtasks.issue_activities_task import issue_activity


class MilestoneWorkItemsEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.MILESTONES)
    @can(MilestonePermissions.VIEW, resource_param="milestone_id")
    def get(self, request, slug, project_id, milestone_id):
        # Return updated work items list using serializer
        workitem_ids = MilestoneIssue.objects.filter(milestone_id=milestone_id, deleted_at__isnull=True).values_list(
            "issue_id", flat=True
        )

        # Base queryset with basic filters
        issue_queryset = (
            Issue.issue_and_epics_objects.filter(workspace__slug=slug, project_id=project_id, pk__in=workitem_ids)
            .select_related("type")
            .prefetch_related("labels", "assignees")
        )
        serializer = MilestoneWorkItemResponseSerializer(issue_queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.MILESTONES)
    @can(MilestonePermissions.EDIT, resource_param="milestone_id")
    def post(self, request, slug, project_id, milestone_id):
        """Update work items in a milestone"""
        # Validate milestone exists and belongs to project
        milestone = Milestone.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            id=milestone_id,
            deleted_at__isnull=True,
        ).first()

        if not milestone:
            return Response({"error": "Milestone not found"}, status=status.HTTP_404_NOT_FOUND)

        # Use dedicated work item serializer to handle work items update
        serializer = MilestoneWorkItemSerializer(
            milestone,
            data=request.data,
            context={
                "request": request,
                "project_id": project_id,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Activity logging for work items
        for work_item_id in getattr(serializer, "work_items_to_add", []):
            issue_activity.delay(
                type="milestone_issue.activity.created",
                requested_data=json.dumps({"milestone_id": str(milestone_id)}),
                actor_id=str(request.user.id),
                issue_id=str(work_item_id),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

        for work_item_id in getattr(serializer, "work_items_to_remove", []):
            issue_activity.delay(
                type="milestone_issue.activity.deleted",
                requested_data=json.dumps({"milestone_id": str(milestone_id)}),
                actor_id=str(request.user.id),
                issue_id=str(work_item_id),
                project_id=str(project_id),
                current_instance=json.dumps({"milestone_name": milestone.title}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

        # Return updated work items list using serializer
        workitem_ids = MilestoneIssue.objects.filter(milestone_id=milestone_id, deleted_at__isnull=True).values_list(
            "issue_id", flat=True
        )

        # Base queryset with basic filters
        issue_queryset = (
            Issue.issue_and_epics_objects.filter(workspace__slug=slug, project_id=project_id, pk__in=workitem_ids)
            .select_related("type")
            .prefetch_related("labels", "assignees")
        )
        serializer = MilestoneWorkItemResponseSerializer(issue_queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkItemMilestoneEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.MILESTONES)
    @can(MilestonePermissions.EDIT, resource_param="project_id")
    def post(self, request, slug, project_id, work_item_id):
        milestone_id = request.data.get("milestone_id")

        if not milestone_id:
            return Response(
                {"error": "Milestone ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.filter(
            slug=slug,
            deleted_at__isnull=True,
        ).first()

        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        # Validate the work item exists
        work_item = Issue.objects.filter(
            id=work_item_id,
            project_id=project_id,
            workspace_id=workspace.id,
            deleted_at__isnull=True,
        ).first()

        if not work_item:
            return Response({"error": "Work item not found"}, status=status.HTTP_404_NOT_FOUND)

        # Validate the new milestone exists
        new_milestone = Milestone.objects.filter(
            id=milestone_id,
            project_id=project_id,
            workspace_id=workspace.id,
            deleted_at__isnull=True,
        ).first()

        if not new_milestone:
            return Response({"error": "Milestone not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check for existing milestone association
        milestone_work_item = (
            MilestoneIssue.objects.filter(
                issue_id=work_item_id,
                project_id=project_id,
                workspace_id=workspace.id,
                deleted_at__isnull=True,
            )
            .select_related("milestone")
            .first()
        )

        # If already assigned to this milestone, no-op
        if milestone_work_item and milestone_work_item.milestone_id == new_milestone.id:
            return Response(status=status.HTTP_204_NO_CONTENT)

        old_milestone_id = milestone_work_item.milestone_id if milestone_work_item else None

        # Delete old milestone association and log it
        if milestone_work_item:
            milestone_work_item.delete()

        # Create new milestone work item
        MilestoneIssue.objects.create(
            issue_id=work_item_id,
            project_id=project_id,
            milestone_id=new_milestone.id,
            workspace_id=workspace.id,
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )

        # Log creation with NEW milestone info
        issue_activity.delay(
            type=(
                "milestone_issue.activity.created" if old_milestone_id is None else "milestone_issue.activity.updated"
            ),
            requested_data=json.dumps({"milestone_id": str(new_milestone.id)}),
            actor_id=str(request.user.id),
            issue_id=str(work_item_id),
            project_id=str(project_id),
            current_instance=(json.dumps({"milestone_id": str(old_milestone_id)}) if old_milestone_id else None),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.MILESTONES)
    @can(MilestonePermissions.EDIT, resource_param="project_id")
    def delete(self, request, slug, project_id, work_item_id):
        workspace = Workspace.objects.filter(
            slug=slug,
            deleted_at__isnull=True,
        ).first()

        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        work_item = Issue.objects.filter(
            id=work_item_id,
            project_id=project_id,
            workspace_id=workspace.id,
            deleted_at__isnull=True,
        ).first()

        if not work_item:
            return Response({"error": "Work item not found"}, status=status.HTTP_404_NOT_FOUND)

        milestone_work_item = MilestoneIssue.objects.filter(
            issue_id=work_item_id,
            project_id=project_id,
            workspace_id=workspace.id,
            deleted_at__isnull=True,
        ).first()

        if milestone_work_item:
            milestone_work_item.delete()

            milestone = Milestone.objects.filter(
                id=milestone_work_item.milestone_id,
                project_id=project_id,
                workspace_id=workspace.id,
                deleted_at__isnull=True,
            ).first()

            # Only log activity if milestone still exists
            if milestone:
                issue_activity.delay(
                    type="milestone_issue.activity.deleted",
                    requested_data=json.dumps({"milestone_id": str(milestone.id)}),
                    actor_id=str(request.user.id),
                    issue_id=str(work_item_id),
                    project_id=str(project_id),
                    current_instance=json.dumps({"milestone_name": milestone.title}),
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=base_host(request=request, is_app=True),
                )

        return Response(status=status.HTTP_204_NO_CONTENT)
