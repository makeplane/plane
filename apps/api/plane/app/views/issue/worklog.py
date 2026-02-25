# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json

from django.db.models import Sum, F
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

from rest_framework.response import Response
from rest_framework import status

from .. import BaseViewSet
from plane.app.serializers import IssueWorkLogSerializer
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog, Project, ProjectMember
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host


class IssueWorkLogViewSet(BaseViewSet):
    serializer_class = IssueWorkLogSerializer
    model = IssueWorkLog

    def get_queryset(self):
        return self.filter_queryset(
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
            .select_related("logged_by", "project", "workspace", "issue")
            .distinct()
        )

    def _check_time_tracking_enabled(self, project_id):
        """Return project if time tracking enabled, else None."""
        try:
            project = Project.objects.get(pk=project_id)
            if not project.is_time_tracking_enabled:
                return None
            return project
        except Project.DoesNotExist:
            return None

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug, project_id, issue_id):
        queryset = self.get_queryset()
        serializer = IssueWorkLogSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, issue_id):
        project = self._check_time_tracking_enabled(project_id)
        if not project:
            return Response(
                {"error": "Time tracking is not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueWorkLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                issue_id=issue_id,
                logged_by=request.user,
            )
            issue_activity.delay(
                type="worklog.activity.created",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=False,
                origin=base_host(request=request, is_app=True),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueWorkLog)
    def partial_update(self, request, slug, project_id, issue_id, pk):
        worklog = IssueWorkLog.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        current_instance = json.dumps(
            IssueWorkLogSerializer(worklog).data, cls=DjangoJSONEncoder
        )
        serializer = IssueWorkLogSerializer(worklog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="worklog.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=False,
                origin=base_host(request=request, is_app=True),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueWorkLog)
    def destroy(self, request, slug, project_id, issue_id, pk):
        worklog = IssueWorkLog.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        current_instance = json.dumps(
            IssueWorkLogSerializer(worklog).data, cls=DjangoJSONEncoder
        )
        worklog.delete()
        issue_activity.delay(
            type="worklog.activity.deleted",
            requested_data=json.dumps({"worklog_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=False,
            origin=base_host(request=request, is_app=True),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
