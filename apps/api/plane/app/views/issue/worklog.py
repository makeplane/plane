# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Exists, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import IssueWorklogSerializer
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, IssueWorklog, Project, ProjectMember
from plane.utils.host import base_host

from .. import BaseViewSet


def _time_tracking_disabled_response():
    return Response(
        {"error": "Time tracking is disabled for this project."},
        status=status.HTTP_400_BAD_REQUEST,
    )


def _get_scoped_issue(slug, project_id, issue_id):
    return Issue.objects.filter(
        pk=issue_id,
        project_id=project_id,
        workspace__slug=slug,
        project__archived_at__isnull=True,
    ).first()


def _guest_blocked_from_issue(request, slug, project_id, issue):
    return (
        ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            role=ROLE.GUEST.value,
            is_active=True,
        ).exists()
        and not issue.project.guest_view_all_features
        and issue.created_by_id != request.user.id
    )


class IssueWorklogViewSet(BaseViewSet):
    serializer_class = IssueWorklogSerializer
    model = IssueWorklog

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
            .select_related("actor", "issue", "project", "workspace")
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        workspace__slug=self.kwargs.get("slug"),
                        project_id=self.kwargs.get("project_id"),
                        member_id=self.request.user.id,
                        is_active=True,
                    )
                )
            )
            .order_by("-logged_at", "-created_at")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, issue_id, pk):
        issue = _get_scoped_issue(slug, project_id, issue_id)
        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if _guest_blocked_from_issue(request, slug, project_id, issue):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )
        worklog = self.get_queryset().filter(pk=pk).first()
        if not worklog:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(IssueWorklogSerializer(worklog).data, status=status.HTTP_200_OK)

    def _total_logged_time(self, issue_id):
        total = IssueWorklog.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            issue_id=issue_id,
        ).aggregate(total=Sum("duration"))["total"]
        return total or 0

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id, issue_id):
        issue = _get_scoped_issue(slug, project_id, issue_id)
        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if _guest_blocked_from_issue(request, slug, project_id, issue):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            order_by=request.GET.get("order_by", "-logged_at"),
            on_results=lambda worklogs: IssueWorklogSerializer(worklogs, many=True).data,
            extra_stats={"total_logged_time": self._total_logged_time(issue_id)},
            default_per_page=100,
            max_per_page=100,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def create(self, request, slug, project_id, issue_id):
        issue = _get_scoped_issue(slug, project_id, issue_id)
        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        if not project.is_time_tracking_enabled:
            return _time_tracking_disabled_response()
        if _guest_blocked_from_issue(request, slug, project_id, issue):
            return Response(
                {"error": "You are not allowed to log time on this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = IssueWorklogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                issue_id=issue_id,
                actor=request.user,
                created_by=request.user,
            )
            issue_activity.delay(
                type="worklog.activity.created",
                requested_data=json.dumps(
                    {
                        "id": str(serializer.data["id"]),
                        "duration": serializer.data["duration"],
                    },
                    cls=DjangoJSONEncoder,
                ),
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

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueWorklog)
    def partial_update(self, request, slug, project_id, issue_id, pk):
        issue = _get_scoped_issue(slug, project_id, issue_id)
        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        if not project.is_time_tracking_enabled:
            return _time_tracking_disabled_response()

        worklog = IssueWorklog.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        ).first()
        if not worklog:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_instance = json.dumps(IssueWorklogSerializer(worklog).data, cls=DjangoJSONEncoder)
        serializer = IssueWorklogSerializer(worklog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="worklog.activity.updated",
                requested_data=json.dumps(
                    {
                        "id": str(pk),
                        "duration": serializer.data["duration"],
                    },
                    cls=DjangoJSONEncoder,
                ),
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

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueWorklog)
    def destroy(self, request, slug, project_id, issue_id, pk):
        issue = _get_scoped_issue(slug, project_id, issue_id)
        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        worklog = IssueWorklog.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        ).first()
        if not worklog:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        current_instance = json.dumps(
            {"id": str(pk), "duration": worklog.duration},
            cls=DjangoJSONEncoder,
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
