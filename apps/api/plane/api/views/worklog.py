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

# Django imports
from django.db.models import Sum

# Third Party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse

# Module imports
from plane.db.models import Project
from plane.ee.models import IssueWorkLog
from plane.api.views.base import ScopedBaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.api.serializers import (
    IssueWorkLogAPISerializer,
    ProjectWorklogSummarySerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, WorkitemPermissions

# OpenAPI imports
from plane.utils.openapi import issue_worklog_docs

from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    PROJECTS_WORK_ITEMS_WORKLOG_READ_SCOPE,
    PROJECTS_WORK_ITEMS_WORKLOG_WRITE_SCOPE,
)


class WorkItemWorklogEndpoint(ScopedBaseAPIView):
    use_read_replica = True


    required_alternate_scopes = {
        "POST": [[WRITE_SCOPE], [PROJECTS_WORK_ITEMS_WORKLOG_WRITE_SCOPE]],
        "GET": [[READ_SCOPE], [PROJECTS_WORK_ITEMS_WORKLOG_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_WORK_ITEMS_WORKLOG_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_WORK_ITEMS_WORKLOG_WRITE_SCOPE]],
    }

    @issue_worklog_docs(
        operation_id="create_issue_worklog",
        summary="Create a new worklog entry",
        description="Create a new worklog entry",
        request=IssueWorkLogAPISerializer,
        responses={
            201: OpenApiResponse(
                description="Worklog created successfully",
                response=IssueWorkLogAPISerializer,
            ),
            400: OpenApiResponse(description="Invalid request data"),
            404: OpenApiResponse(description="Worklog is not enabled for the project"),
        },
    )
    @can(WorkitemPermissions.EDIT, resource_param="issue_id")
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def post(self, request, slug, project_id, issue_id):
        """Create worklog entry

        Log time spent on a work item with description and duration.
        Requires time tracking to be enabled on the project.
        """
        project_feature = Project.objects.filter(workspace__slug=slug, pk=project_id).first()
        if not project_feature.is_time_tracking_enabled:
            return Response(
                {"message": "Worklog is not enabled for the project"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = IssueWorkLogAPISerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_id=issue_id, logged_by=request.user)
            # last_activity_at is updated automatically via IssueActivityMixin on IssueWorkLog

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @issue_worklog_docs(
        operation_id="list_issue_worklogs",
        summary="List worklog entries",
        description="List worklog entries",
        responses={
            200: OpenApiResponse(
                description="List of worklog entries",
                response=IssueWorkLogAPISerializer(many=True),
            ),
            404: OpenApiResponse(description="Worklog is not enabled for the project"),
        },
    )
    @can(WorkitemPermissions.VIEW, resource_param="issue_id")
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def get(self, request, slug, project_id, issue_id):
        """List issue worklogs

        Retrieve all worklog entries for a specific work item.
        Returns time tracking history with descriptions and durations.
        """
        project_feature = Project.objects.filter(workspace__slug=slug, pk=project_id).first()
        if not project_feature.is_time_tracking_enabled:
            return Response(
                {"message": "Worklog is not enabled for the project"},
                status=status.HTTP_404_NOT_FOUND,
            )

        worklogs = IssueWorkLog.objects.filter(
            issue_id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
        )
        serializer = IssueWorkLogAPISerializer(worklogs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @issue_worklog_docs(
        operation_id="update_issue_worklog",
        summary="Update a worklog entry",
        description="Update a worklog entry",
        request=IssueWorkLogAPISerializer,
        responses={
            200: OpenApiResponse(
                description="Worklog updated successfully",
                response=IssueWorkLogAPISerializer,
            ),
            400: OpenApiResponse(description="Invalid request data"),
            404: OpenApiResponse(description="Worklog not found or time tracking disabled"),
        },
    )
    @can(WorkitemPermissions.EDIT, resource_param="issue_id")
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def patch(self, request, slug, project_id, issue_id, pk):
        """Update worklog entry

        Modify an existing worklog entry's description or duration.
        Only updates specified fields (partial update).
        """
        project_feature = Project.objects.filter(workspace__slug=slug, pk=project_id).first()
        if not project_feature.is_time_tracking_enabled:
            return Response(
                {"message": "Worklog is not enabled for the project"},
                status=status.HTTP_404_NOT_FOUND,
            )
        worklog = IssueWorkLog.objects.get(pk=pk, issue_id=issue_id, project_id=project_id, workspace__slug=slug)
        serializer = IssueWorkLogAPISerializer(worklog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # last_activity_at is updated automatically via IssueActivityMixin on IssueWorkLog

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @issue_worklog_docs(
        operation_id="delete_issue_worklog",
        summary="Delete a worklog entry",
        description="Delete a worklog entry",
        responses={
            204: OpenApiResponse(description="Worklog deleted successfully"),
            404: OpenApiResponse(description="Worklog not found or time tracking disabled"),
        },
    )
    @can(WorkitemPermissions.EDIT, resource_param="issue_id")
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete worklog entry

        Permanently remove a worklog entry from a work item.
        This action cannot be undone.
        """
        project_feature = Project.objects.filter(workspace__slug=slug, pk=project_id).first()
        if not project_feature.is_time_tracking_enabled:
            return Response(
                {"message": "Worklog is not enabled for the project"},
                status=status.HTTP_404_NOT_FOUND,
            )
        worklog = IssueWorkLog.objects.get(pk=pk, issue_id=issue_id, project_id=project_id, workspace__slug=slug)
        worklog.delete()

        # last_activity_at is updated automatically via IssueActivityMixin on IssueWorkLog

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectWorklogAPIEndpoint(ScopedBaseAPIView):
    """
    ViewSet to fetch total worklog duration for each unique issue.
    """

    use_read_replica = True


    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_WORK_ITEMS_WORKLOG_READ_SCOPE]],
    }

    @issue_worklog_docs(
        operation_id="get_project_worklog_summary",
        summary="Get project worklog summary",
        description="Get project worklog summary",
        responses={
            200: OpenApiResponse(
                description="Project worklog summary by issue",
                response=ProjectWorklogSummarySerializer(many=True),
            ),
            404: OpenApiResponse(description="Worklog is not enabled for the project"),
        },
    )
    @can(WorkitemPermissions.VIEW, resource_param="project_id")
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def get(self, request, slug, project_id):
        """Get project worklog summary

        Retrieve aggregated worklog duration for each work item in the project.
        Returns total time logged per issue for project time tracking analytics.
        """
        project_feature = Project.objects.filter(workspace__slug=slug, pk=project_id).first()
        if not project_feature.is_time_tracking_enabled:
            return Response(
                {"message": "Worklog is not enabled for the project"},
                status=status.HTTP_404_NOT_FOUND,
            )

        worklog_data = (
            IssueWorkLog.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .values("issue_id")
            .annotate(duration=Sum("duration"))
        )

        return Response(worklog_data, status=status.HTTP_200_OK)
