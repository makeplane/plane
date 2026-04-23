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

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiRequest,
)

# Module imports
from plane.api.views.base import ScopedBaseViewSet
from plane.db.models import Description, Project
from plane.ee.models import Milestone, MilestoneIssue
from plane.api.serializers.milestone import (
    MilestoneSerializer,
    MilestoneWorkItemSerializer,
    MilestoneWorkItemBulkSerializer,
)
from plane.permissions import can, MilestonePermissions
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    PROJECTS_MILESTONES_READ_SCOPE,
    PROJECTS_MILESTONES_WRITE_SCOPE,
    PROJECTS_WORK_ITEMS_READ_SCOPE,
    PROJECTS_WORK_ITEMS_WRITE_SCOPE,
)


class MilestoneViewSet(ScopedBaseViewSet):
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_MILESTONES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_MILESTONES_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_MILESTONES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_MILESTONES_WRITE_SCOPE]],
    }
    use_read_replica = True

    def get_queryset(self):
        return Milestone.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
        )

    def get_object(self):
        return self.get_queryset().get(id=self.kwargs.get("milestone_id"))

    @extend_schema(
        operation_id="list_milestones",
        summary="List milestones",
        description="List all milestones in a project.",
        responses={
            200: OpenApiResponse(description="Milestones retrieved successfully", response=MilestoneSerializer),
        },
    )
    @can(MilestonePermissions.VIEW, resource_param="project_id")
    def list(self, request, slug, project_id, *args, **kwargs):
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda milestones: (
                MilestoneSerializer(milestones, many=True, fields=self.fields, expand=self.expand).data
            ),
        )

    @extend_schema(
        operation_id="retrieve_milestone",
        summary="Retrieve a milestone",
        description="Retrieve a specific milestone by its ID.",
        responses={
            200: OpenApiResponse(description="Milestone retrieved successfully", response=MilestoneSerializer),
        },
    )
    @can(MilestonePermissions.VIEW, resource_param="milestone_id")
    def retrieve(self, request, slug, project_id, milestone_id, *args, **kwargs):
        milestone = self.get_object()
        return Response(
            MilestoneSerializer(milestone, fields=self.fields, expand=self.expand).data, status=status.HTTP_200_OK
        )

    @extend_schema(
        operation_id="create_milestone",
        summary="Create a milestone",
        description="Create a new milestone in a project.",
        responses={
            201: OpenApiResponse(description="Milestone created successfully", response=MilestoneSerializer),
        },
        request=OpenApiRequest(request=MilestoneSerializer),
    )
    @can(MilestonePermissions.CREATE, resource_param="project_id")
    def create(self, request, slug, project_id, *args, **kwargs):
        # Get workspace_id from project
        project = Project.objects.get(id=project_id, workspace__slug=slug)
        workspace_id = project.workspace_id

        # Create empty description for the milestone
        description = Description.objects.create(
            workspace_id=workspace_id,
            description_html="",
        )

        serializer = MilestoneSerializer(data=request.data, context={"project_id": project_id})
        serializer.is_valid(raise_exception=True)
        serializer.save(
            project_id=project_id,
            workspace_id=workspace_id,
            description=description,
        )
        return Response(
            MilestoneSerializer(serializer.instance, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        operation_id="update_milestone",
        summary="Update a milestone",
        description="Update a specific milestone by its ID.",
        request=OpenApiRequest(request=MilestoneSerializer),
        responses={
            200: OpenApiResponse(description="Milestone updated successfully", response=MilestoneSerializer),
        },
    )
    @can(MilestonePermissions.EDIT, resource_param="milestone_id")
    def patch(self, request, slug, project_id, milestone_id, *args, **kwargs):
        milestone = self.get_object()
        serializer = MilestoneSerializer(milestone, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="delete_milestone",
        summary="Delete a milestone",
        description="Delete a specific milestone by its ID.",
        responses={
            204: OpenApiResponse(description="Milestone deleted successfully"),
        },
    )
    @can(MilestonePermissions.DELETE, resource_param="milestone_id")
    def destroy(self, request, slug, project_id, milestone_id, *args, **kwargs):
        milestone = self.get_object()
        milestone.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MilestoneWorkItemsViewSet(ScopedBaseViewSet):
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_MILESTONES_READ_SCOPE, PROJECTS_WORK_ITEMS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_MILESTONES_WRITE_SCOPE, PROJECTS_WORK_ITEMS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_MILESTONES_WRITE_SCOPE, PROJECTS_WORK_ITEMS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_MILESTONES_WRITE_SCOPE, PROJECTS_WORK_ITEMS_WRITE_SCOPE]],
    }
    use_read_replica = True

    def get_queryset(self):
        return MilestoneIssue.objects.filter(
            milestone_id=self.kwargs.get("milestone_id"),
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
        )

    def get_object(self):
        return self.get_queryset().get(id=self.kwargs.get("work_item_id"))

    @extend_schema(
        operation_id="list_milestone_work_items",
        summary="List work items for a milestone",
        description="List all work items for a milestone.",
        responses={
            200: OpenApiResponse(description="Work items retrieved successfully", response=MilestoneWorkItemSerializer),
        },
    )
    @can(MilestonePermissions.VIEW, resource_param="milestone_id")
    def list(self, request, slug, project_id, milestone_id, *args, **kwargs):
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda work_items: (
                MilestoneWorkItemSerializer(work_items, many=True, fields=self.fields, expand=self.expand).data
            ),
        )

    @extend_schema(
        operation_id="add_work_items_to_milestone",
        summary="Add work items to a milestone",
        description="Add work items to a milestone.",
        request=OpenApiRequest(request=MilestoneWorkItemBulkSerializer),
        responses={
            201: OpenApiResponse(description="Work items added successfully"),
        },
    )
    @can(MilestonePermissions.EDIT, resource_param="milestone_id")
    def add_work_items(self, request, slug, project_id, milestone_id, *args, **kwargs):
        serializer = MilestoneWorkItemBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        issue_ids = serializer.validated_data["issues"]
        milestone = Milestone.objects.get(id=milestone_id, project_id=project_id)

        # Bulk create milestone issues
        milestone_issues = [
            MilestoneIssue(
                milestone_id=milestone_id,
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=milestone.workspace_id,
            )
            for issue_id in issue_ids
        ]
        MilestoneIssue.objects.bulk_create(milestone_issues, ignore_conflicts=True)

        return Response({"message": "Work items added successfully"}, status=status.HTTP_201_CREATED)

    @extend_schema(
        operation_id="remove_work_items_from_milestone",
        summary="Remove work items from a milestone",
        description="Remove work items from a milestone.",
        request=OpenApiRequest(request=MilestoneWorkItemBulkSerializer),
        responses={
            204: OpenApiResponse(description="Work items removed successfully"),
        },
    )
    @can(MilestonePermissions.EDIT, resource_param="milestone_id")
    def remove_work_items(self, request, slug, project_id, milestone_id, *args, **kwargs):
        serializer = MilestoneWorkItemBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        issue_ids = serializer.validated_data["issues"]

        # Delete milestone issues
        MilestoneIssue.objects.filter(
            milestone_id=milestone_id,
            issue_id__in=issue_ids,
            project_id=project_id,
        ).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
