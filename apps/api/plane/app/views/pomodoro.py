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
from rest_framework.decorators import action
from rest_framework.response import Response

# Module imports
from plane.app.serializers import (
    PomodoroTimerReadSerializer,
    PomodoroTimerSerializer,
    TimeLogReadSerializer,
    TimeLogSerializer,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, PomodoroTimer, ProjectMember, TimeLog
from plane.utils.host import base_host

from .base import BaseViewSet


class PomodoroTimerViewSet(BaseViewSet):
    serializer_class = PomodoroTimerSerializer
    model = PomodoroTimer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(started_by=self.request.user)
            .select_related("project", "workspace", "issue", "started_by")
        )

    def list(self, request):
        timers = self.get_queryset()
        return Response(PomodoroTimerReadSerializer(timers, many=True).data, status=status.HTTP_200_OK)

    def create(self, request):
        """Start a new focus session.

        One active (running/paused) timer per user is enforced at the DB level;
        we surface a friendly 409 here when that constraint would be violated.
        """
        issue_id = request.data.get("issue_id")

        issue = (
            Issue.objects.select_related("workspace", "project")
            .filter(pk=issue_id, deleted_at__isnull=True, archived_at__isnull=True)
            .exclude(project__archived_at__isnull=False)
            .first()
        )
        if issue is None:
            return Response(
                {"error": "The work item does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_member = ProjectMember.objects.filter(
            workspace=issue.workspace,
            project=issue.project,
            member=request.user,
            is_active=True,
        ).exists()
        if not is_member:
            return Response(
                {"error": "You are not a member of this project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if PomodoroTimer.objects.filter(
            started_by=request.user, status__in=["running", "paused"], deleted_at__isnull=True
        ).exists():
            return Response(
                {"error": "You already have an active pomodoro timer."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = PomodoroTimerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        timer = PomodoroTimer.objects.create(
            workspace=issue.workspace,
            project=issue.project,
            issue=issue,
            started_by=request.user,
            started_at=timezone.now(),
            duration_minutes=serializer.validated_data.get("duration_minutes") or 25,
            description=serializer.validated_data.get("description", ""),
        )

        return Response(
            PomodoroTimerReadSerializer(timer).data,
            status=status.HTTP_201_CREATED,
        )

    def _get_timer(self, request, pk):
        return PomodoroTimer.objects.get(pk=pk, started_by=request.user, deleted_at__isnull=True)

    def _elapsed_seconds(self, timer):
        """Total elapsed focus time.

        `started_at` is the start of the current running segment and
        `paused_seconds` accumulates the time already spent running.
        """
        if timer.status == PomodoroTimer.Status.RUNNING:
            return int((timezone.now() - timer.started_at).total_seconds()) + timer.paused_seconds
        return timer.paused_seconds

    @action(detail=True, methods=["post"])
    def pause(self, request, pk=None):
        timer = self._get_timer(request, pk)
        if timer.status != PomodoroTimer.Status.RUNNING:
            return Response(
                {"error": "Only a running timer can be paused."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        timer.paused_seconds = self._elapsed_seconds(timer)
        timer.status = PomodoroTimer.Status.PAUSED
        timer.save()
        return Response(PomodoroTimerReadSerializer(timer).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def resume(self, request, pk=None):
        timer = self._get_timer(request, pk)
        if timer.status != PomodoroTimer.Status.PAUSED:
            return Response(
                {"error": "Only a paused timer can be resumed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        timer.started_at = timezone.now()
        timer.status = PomodoroTimer.Status.RUNNING
        timer.save()
        return Response(PomodoroTimerReadSerializer(timer).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Complete the focus session and convert it into a `TimeLog`.

        Pass ``create_time_log: false`` in the body to finish the session without
        recording a worklog entry (mirrors the user's pomodoro settings).
        """
        timer = self._get_timer(request, pk)
        if timer.status not in [PomodoroTimer.Status.RUNNING, PomodoroTimer.Status.PAUSED]:
            return Response(
                {"error": "Only an active timer can be completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        create_time_log = request.data.get("create_time_log", True)
        time_log = None
        if create_time_log:
            elapsed_seconds = self._elapsed_seconds(timer)
            duration_minutes = max(1, round(elapsed_seconds / 60))
            description = f"Pomodoro: {timer.description}" if timer.description else "Pomodoro session"

            time_log = TimeLog.objects.create(
                workspace=timer.workspace,
                project=timer.project,
                issue=timer.issue,
                logged_by=request.user,
                duration_minutes=duration_minutes,
                description=description,
                logged_date=timezone.localdate(),
            )

            issue_activity.delay(
                type="time_log.activity.created",
                requested_data=json.dumps(TimeLogSerializer(time_log).data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(timer.issue_id),
                project_id=str(timer.project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

        timer.status = PomodoroTimer.Status.COMPLETED
        timer.save()

        return Response(
            {
                "time_log": TimeLogReadSerializer(time_log).data if time_log else None,
                "timer": PomodoroTimerReadSerializer(timer).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def discard(self, request, pk=None):
        """Cancel the focus session without creating a time log."""
        timer = self._get_timer(request, pk)
        if timer.status not in [PomodoroTimer.Status.RUNNING, PomodoroTimer.Status.PAUSED]:
            return Response(
                {"error": "Only an active timer can be discarded."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        timer.status = PomodoroTimer.Status.DISCARDED
        timer.save()
        return Response(PomodoroTimerReadSerializer(timer).data, status=status.HTTP_200_OK)
