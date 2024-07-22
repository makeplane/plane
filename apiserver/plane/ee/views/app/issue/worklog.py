# Python imports
import json

# Django imports
from django.db.models import Sum
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import (
    ProjectEntityPermission,
)
from plane.ee.serializers import IssueWorkLogSerializer
from plane.ee.models import IssueWorkLog
from plane.bgtasks.issue_activities_task import issue_activity


class IssueWorkLogsEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id, issue_id):
        serializer = IssueWorkLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                issue_id=issue_id,
                logged_by=request.user,
            )
            issue_activity.delay(
                type="work_log.activity.created",
                requested_data=json.dumps(
                    serializer.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id")),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, slug, project_id, issue_id):
        worklogs = IssueWorkLog.objects.filter(
            issue_id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
        )
        serializer = IssueWorkLogSerializer(worklogs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, issue_id, pk):
        work_log = IssueWorkLog.objects.get(
            pk=pk,
            issue_id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        serializer = IssueWorkLogSerializer(
            work_log, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, issue_id, pk):
        work_log = IssueWorkLog.objects.get(
            pk=pk,
            issue_id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        work_log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueTotalWorkLogEndpoint(BaseAPIView):
    def get(self, request, slug, project_id, issue_id):
        total_work_log = IssueWorkLog.objects.filter(
            issue_id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
        ).aggregate(total_work_log=Sum("duration"))["total_work_log"]
        return Response(
            {"total_work_log": total_work_log}, status=status.HTTP_200_OK
        )
