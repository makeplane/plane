# Python imports

# Django imports
from django.db.models import Sum
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.permissions import ProjectEntityPermission
from plane.db.models import Issue
from plane.ee.models import IssueWorkLog
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import IssueWorkLogSerializer
from plane.payment.flags.flag_decorator import check_feature_flag


class IssueWorkLogsEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def post(self, request, slug, project_id, issue_id):
        serializer = IssueWorkLogSerializer(data=request.data)
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
    def get(self, request, slug, project_id, issue_id):
        worklogs = IssueWorkLog.objects.filter(
            issue_id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
        ).accessible_to(request.user.id, slug)
        serializer = IssueWorkLogSerializer(worklogs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def patch(self, request, slug, project_id, issue_id, pk):
        worklog = IssueWorkLog.objects.get(
            pk=pk, issue_id=issue_id, project_id=project_id, workspace__slug=slug
        )
        serializer = IssueWorkLogSerializer(worklog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Get the issue to update
            issue = Issue.objects.get(pk=issue_id)
            issue.updated_at = timezone.now()
            issue.save(update_fields=["updated_at"])

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def delete(self, request, slug, project_id, issue_id, pk):
        worklog = IssueWorkLog.objects.get(
            pk=pk, issue_id=issue_id, project_id=project_id, workspace__slug=slug
        )
        worklog.delete()

        # Get the issue to update
        issue = Issue.objects.get(pk=issue_id)
        issue.updated_at = timezone.now()
        issue.save(update_fields=["updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueTotalWorkLogEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.ISSUE_WORKLOG)
    def get(self, request, slug, project_id, issue_id):
        total_worklog = IssueWorkLog.objects.filter(
            issue_id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
        ).accessible_to(request.user.id, slug)

        total_worklog = (
            total_worklog.aggregate(total_worklog=Sum("duration"))["total_worklog"] or 0
        )

        return Response({"total_worklog": total_worklog}, status=status.HTTP_200_OK)
