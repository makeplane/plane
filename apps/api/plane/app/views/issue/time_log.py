# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import TimeLogReadSerializer, TimeLogSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import ProjectMember, TimeLog
from plane.utils.host import base_host

from .. import BaseViewSet


class IssueTimeLogViewSet(BaseViewSet):
    serializer_class = TimeLogSerializer
    model = TimeLog

    def get_queryset(self):
        return (
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
            .select_related("project", "workspace", "issue", "logged_by", "created_by")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id, issue_id):
        time_logs = self.get_queryset()
        return Response(TimeLogReadSerializer(time_logs, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def create(self, request, slug, project_id, issue_id):
        # `logged_by` is whose time this counts toward; it defaults to the requester.
        # Logging on behalf of somebody else is an admin-only action.
        target_user_id = request.data.get("logged_by") or str(request.user.id)

        if str(target_user_id) != str(request.user.id):
            is_admin = ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.ADMIN.value,
                is_active=True,
            ).exists()
            if not is_admin:
                return Response(
                    {"error": "Only project admins can log time for other members."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not ProjectMember.objects.filter(
                workspace__slug=slug, project_id=project_id, member_id=target_user_id, is_active=True
            ).exists():
                return Response(
                    {"error": "The selected member is not part of this project."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = TimeLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_id=issue_id, logged_by_id=target_user_id)
            issue_activity.delay(
                type="time_log.activity.created",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            time_log = TimeLog.objects.select_related("logged_by", "created_by", "issue", "project").get(
                pk=serializer.data["id"]
            )
            return Response(TimeLogReadSerializer(time_log).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=TimeLog)
    def partial_update(self, request, slug, project_id, issue_id, pk):
        time_log = TimeLog.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        current_instance = json.dumps(TimeLogSerializer(time_log).data, cls=DjangoJSONEncoder)
        serializer = TimeLogSerializer(time_log, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="time_log.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            time_log.refresh_from_db()
            return Response(TimeLogReadSerializer(time_log).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=TimeLog)
    def destroy(self, request, slug, project_id, issue_id, pk):
        time_log = TimeLog.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        current_instance = json.dumps(TimeLogSerializer(time_log).data, cls=DjangoJSONEncoder)
        time_log.delete()
        issue_activity.delay(
            type="time_log.activity.deleted",
            requested_data=json.dumps({"time_log_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
