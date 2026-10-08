# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import timedelta

# Django imports
from django.db import transaction
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from ..constants import TIMER_AUTO_STOP_SECONDS
from ..models import TimeEntry
from ..serializers import TimerStartSerializer, TimerStopSerializer, TimerUpdateSerializer, validated
from ..services import (
    TimeTrackingError,
    discard_timer,
    get_running_timer,
    start_timer,
    stop_timer,
    update_running_timer,
)
from .base import ENTRY_RELATIONS, TimeTrackingBaseView, server_now


def timer_not_running():
    return TimeTrackingError("TIMER_NOT_RUNNING", "No timer is running.", status=404)


class TimerEndpoint(TimeTrackingBaseView):
    """The requester's running timer: read, edit, discard."""

    def get(self, request, slug):
        access = self.get_access(request, slug)
        timer = get_running_timer(access.workspace.id, request.user.id)
        if timer is not None and timer.started_at <= timezone.now() - timedelta(seconds=TIMER_AUTO_STOP_SECONDS):
            # the auto-stop job hasn't run yet: apply the 12 h cap now so the widget never shows more
            with transaction.atomic():
                timer = get_running_timer(access.workspace.id, request.user.id, lock=True)
                if timer is not None:
                    stop_timer(timer, auto=True)
            timer = None
        needs_review_count = TimeEntry.objects.filter(
            workspace_id=access.workspace.id, user_id=request.user.id, auto_stopped=True
        ).count()
        return Response(
            {
                "timer": self.serialize(timer, access) if timer else None,
                "server_now": server_now(),
                "needs_review_count": needs_review_count,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, slug):
        access = self.get_access(request, slug)
        data = validated(TimerUpdateSerializer, request.data)
        with transaction.atomic():
            timer = get_running_timer(access.workspace.id, request.user.id, lock=True)
            if timer is None:
                raise timer_not_running()
            update_running_timer(access, request.user, timer, data)
        timer = TimeEntry.objects.select_related(*ENTRY_RELATIONS).get(pk=timer.pk)
        return Response({"timer": self.serialize(timer, access)}, status=status.HTTP_200_OK)

    def delete(self, request, slug):
        access = self.get_access(request, slug)
        with transaction.atomic():
            timer = get_running_timer(access.workspace.id, request.user.id, lock=True)
            if timer is None:
                raise timer_not_running()
            discard_timer(timer, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TimerStartEndpoint(TimeTrackingBaseView):
    def post(self, request, slug):
        access = self.get_access(request, slug)
        data = validated(TimerStartSerializer, request.data)
        timer, stopped, stopped_discarded = start_timer(
            access,
            request.user,
            project_id=data.get("project_id"),
            issue_id=data.get("issue_id"),
            description=data.get("description") or "",
            is_billable=data.get("is_billable"),
        )
        return Response(
            {
                "timer": self.serialize(timer, access),
                "stopped": self.serialize(stopped, access) if stopped else None,
                "stopped_discarded": stopped_discarded,
                "server_now": server_now(),
            },
            status=status.HTTP_201_CREATED,
        )


class TimerStopEndpoint(TimeTrackingBaseView):
    def post(self, request, slug):
        access = self.get_access(request, slug)
        data = validated(TimerStopSerializer, request.data)
        with transaction.atomic():
            timer = get_running_timer(access.workspace.id, request.user.id, lock=True)
            if timer is None:
                raise timer_not_running()
            entry, discarded = stop_timer(timer, actor=request.user, description=data.get("description"))
        return Response(
            {
                "entry": self.serialize(entry, access) if entry else None,
                "discarded": discarded,
                "server_now": server_now(),
            },
            status=status.HTTP_200_OK,
        )
