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
from plane.app.serializers.worklog import get_min_allowed_date
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog, Project
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host

# Max aggregate minutes per user per day
MAX_DAILY_MINUTES = 720


class IssueWorkLogViewSet(BaseViewSet):
    serializer_class = IssueWorkLogSerializer
    model = IssueWorkLog

    def _validate_reason(self, request):
        """Extract and validate mandatory reason from request body."""
        reason = request.data.get("reason", "").strip()
        if not reason:
            return None, Response(
                {"error": "A reason for this change is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return reason, None

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

    def _check_daily_limit(self, user, logged_at, new_duration, exclude_pk=None):
        """Check sum of user's worklogs on date + new_duration <= MAX_DAILY_MINUTES."""
        qs = IssueWorkLog.objects.filter(logged_by=user, logged_at=logged_at)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        existing_total = qs.aggregate(total=Sum("duration_minutes"))["total"] or 0
        if existing_total + new_duration > MAX_DAILY_MINUTES:
            remaining = MAX_DAILY_MINUTES - existing_total
            return False, max(remaining, 0)
        return True, None

    def _check_edit_window(self, worklog, tz_str="UTC"):
        """Return True if worklog is within editable window (60 working days)."""
        min_date = get_min_allowed_date(working_days=60, tz_str=tz_str)
        return worklog.logged_at >= min_date

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

        serializer = IssueWorkLogSerializer(
            data=request.data,
            context={"project_timezone": project.timezone},
        )
        if serializer.is_valid():
            # Check daily aggregate limit
            ok, remaining = self._check_daily_limit(
                request.user,
                serializer.validated_data["logged_at"],
                serializer.validated_data["duration_minutes"],
            )
            if not ok:
                return Response(
                    {"error": f"Daily time limit exceeded. You have {remaining} minutes remaining for this date."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
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

    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, issue_id, pk):
        project = self._check_time_tracking_enabled(project_id)
        if not project:
            return Response(
                {"error": "Time tracking is not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            worklog = IssueWorkLog.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
                pk=pk,
            )
        except IssueWorkLog.DoesNotExist:
            return Response({"error": "Worklog not found."}, status=status.HTTP_404_NOT_FOUND)
        # Check 60-working-day edit window using project timezone
        if not self._check_edit_window(worklog, tz_str=project.timezone):
            return Response(
                {"error": "This worklog is locked and cannot be edited. Worklogs older than 60 working days are read-only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Reason is mandatory for edits
        reason, error_response = self._validate_reason(request)
        if error_response:
            return error_response

        current_instance = json.dumps(
            IssueWorkLogSerializer(worklog).data, cls=DjangoJSONEncoder
        )
        serializer = IssueWorkLogSerializer(
            worklog, data=request.data, partial=True,
            context={"project_timezone": project.timezone},
        )
        if serializer.is_valid():
            # Check daily aggregate limit (use updated values or existing)
            effective_date = serializer.validated_data.get("logged_at", worklog.logged_at)
            effective_duration = serializer.validated_data.get("duration_minutes", worklog.duration_minutes)
            ok, remaining = self._check_daily_limit(
                request.user, effective_date, effective_duration, exclude_pk=pk,
            )
            if not ok:
                return Response(
                    {"error": f"Daily time limit exceeded. You have {remaining} minutes remaining for this date."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer.save()
            activity_data = dict(request.data)
            activity_data["reason"] = reason
            issue_activity.delay(
                type="worklog.activity.updated",
                requested_data=json.dumps(activity_data, cls=DjangoJSONEncoder),
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

    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def destroy(self, request, slug, project_id, issue_id, pk):
        project = self._check_time_tracking_enabled(project_id)
        if not project:
            return Response(
                {"error": "Time tracking is not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            worklog = IssueWorkLog.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
                pk=pk,
            )
        except IssueWorkLog.DoesNotExist:
            return Response({"error": "Worklog not found."}, status=status.HTTP_404_NOT_FOUND)
        # Check 60-working-day edit window using project timezone
        if not self._check_edit_window(worklog, tz_str=project.timezone):
            return Response(
                {"error": "This worklog is locked and cannot be deleted. Worklogs older than 60 working days are read-only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Reason is mandatory for deletions
        reason, error_response = self._validate_reason(request)
        if error_response:
            return error_response

        current_instance = json.dumps(
            IssueWorkLogSerializer(worklog).data, cls=DjangoJSONEncoder
        )
        worklog.delete()
        issue_activity.delay(
            type="worklog.activity.deleted",
            requested_data=json.dumps({"worklog_id": str(pk), "reason": reason}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=False,
            origin=base_host(request=request, is_app=True),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
