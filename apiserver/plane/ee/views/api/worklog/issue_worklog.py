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
from plane.ee.serializers import IssueWorkLogAPISerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions import allow_permission, ROLE


class IssueWorklogAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
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

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, issue_id):
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

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, issue_id, pk):
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

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, issue_id, pk):
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

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
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
