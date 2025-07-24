# Django imports
from django.utils import timezone
from django.db.models import Sum

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.permissions import ProjectEntityPermission
from plane.db.models import Issue, Project
from plane.ee.models import IssueWorkLog
from plane.api.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import (
    IssueWorkLogAPISerializer,
    ProjectWorklogSummarySerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions import allow_permission, ROLE

# OpenAPI imports
from plane.utils.openapi import issue_worklog_docs
from drf_spectacular.utils import OpenApiResponse


class IssueWorklogAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

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
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        """Create worklog entry

        Log time spent on a work item with description and duration.
        Requires time tracking to be enabled on the project.
        """
        project_feature = Project.objects.filter(
            workspace__slug=slug, pk=project_id
        ).first()
        if not project_feature.is_time_tracking_enabled:
            return Response(
                {"message": "Worklog is not enabled for the project"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = IssueWorkLogAPISerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id, issue_id=issue_id, logged_by=request.user
            )
            # Get the issue to update
            issue = Issue.objects.get(pk=issue_id)
            issue.updated_at = timezone.now()
            issue.save(update_fields=["updated_at"])

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
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, issue_id):
        """List issue worklogs

        Retrieve all worklog entries for a specific work item.
        Returns time tracking history with descriptions and durations.
        """
        project_feature = Project.objects.filter(
            workspace__slug=slug, pk=project_id
        ).first()
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
            404: OpenApiResponse(
                description="Worklog not found or time tracking disabled"
            ),
        },
    )
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, issue_id, pk):
        """Update worklog entry

        Modify an existing worklog entry's description or duration.
        Only updates specified fields (partial update).
        """
        project_feature = Project.objects.filter(
            workspace__slug=slug, pk=project_id
        ).first()
        if not project_feature.is_time_tracking_enabled:
            return Response(
                {"message": "Worklog is not enabled for the project"},
                status=status.HTTP_404_NOT_FOUND,
            )
        worklog = IssueWorkLog.objects.get(
            pk=pk, issue_id=issue_id, project_id=project_id, workspace__slug=slug
        )
        serializer = IssueWorkLogAPISerializer(worklog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Get the issue to update
            issue = Issue.objects.get(pk=issue_id)
            issue.updated_at = timezone.now()
            issue.save(update_fields=["updated_at"])

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @issue_worklog_docs(
        operation_id="delete_issue_worklog",
        summary="Delete a worklog entry",
        description="Delete a worklog entry",
        responses={
            204: OpenApiResponse(description="Worklog deleted successfully"),
            404: OpenApiResponse(
                description="Worklog not found or time tracking disabled"
            ),
        },
    )
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete worklog entry

        Permanently remove a worklog entry from a work item.
        This action cannot be undone.
        """
        project_feature = Project.objects.filter(
            workspace__slug=slug, pk=project_id
        ).first()
        if not project_feature.is_time_tracking_enabled:
            return Response(
                {"message": "Worklog is not enabled for the project"},
                status=status.HTTP_404_NOT_FOUND,
            )
        worklog = IssueWorkLog.objects.get(
            pk=pk, issue_id=issue_id, project_id=project_id, workspace__slug=slug
        )
        worklog.delete()

        # Get the issue to update
        issue = Issue.objects.get(pk=issue_id)
        issue.updated_at = timezone.now()
        issue.save(update_fields=["updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectWorklogAPIEndpoint(BaseAPIView):
    """
    ViewSet to fetch total worklog duration for each unique issue.
    """

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
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        """Get project worklog summary

        Retrieve aggregated worklog duration for each work item in the project.
        Returns total time logged per issue for project time tracking analytics.
        """
        project_feature = Project.objects.filter(
            workspace__slug=slug, pk=project_id
        ).first()
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
