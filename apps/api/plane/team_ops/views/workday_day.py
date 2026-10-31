# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.team_ops.models import OpsNotification
from plane.team_ops.serializers import resolve_issue
from plane.team_ops.services import timer as timers
from plane.team_ops.services import workday
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess, calendar_user_ids
from plane.team_ops.services.time_entry import parse_uuid


def _forbidden():
    return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)


def _workspace_for(request, slug):
    """The workspace, when the caller is someone who works in it (guests do not)."""
    workspace = Workspace.objects.get(slug=slug)
    return workspace if request.user.id in calendar_user_ids(workspace) else None


class WorkdayStateEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """How the caller works today, the running task and what the day looks like so far."""
        workspace = _workspace_for(request, slug)
        if workspace is None:
            return _forbidden()
        return Response(workday.day_state(workspace, request.user))


class WorkdayDayEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """Answer "how are you working today?": REMOTE, ONSITE or HYBRID."""
        workspace = _workspace_for(request, slug)
        if workspace is None:
            return _forbidden()
        workday.set_day_mode(workspace, request.user, request.data.get("mode"))
        return Response(workday.day_state(workspace, request.user))


class WorkdayStartEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """Start working on a work item. On a hybrid day `location` says where."""
        workspace = _workspace_for(request, slug)
        if workspace is None:
            return _forbidden()
        issue = resolve_issue(workspace, request.user, request.data.get("issue"))
        try:
            workday.start_work(workspace, request.user, issue, request.data.get("location"))
        except workday.TimerAlreadyRunning:
            return Response(
                {"error": "A timer is already running.", **workday.day_state(workspace, request.user)},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(workday.day_state(workspace, request.user), status=status.HTTP_201_CREATED)


class WorkdayBreakEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """`action` is `start` (rest pause) or `end`."""
        workspace = _workspace_for(request, slug)
        if workspace is None:
            return _forbidden()
        action = request.data.get("action")
        if action == "start":
            timers.start_break(workspace, request.user)
        elif action == "end":
            timers.end_break(workspace, request.user)
        else:
            raise ParseError(detail="Unknown action.")
        return Response(workday.day_state(workspace, request.user))


class WorkdayCheckInEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """ "Yes, I am still working." Also ends a freeze: the time counts again from now."""
        workspace = _workspace_for(request, slug)
        if workspace is None:
            return _forbidden()
        timers.check_in(workspace, request.user)
        return Response(workday.day_state(workspace, request.user))


class WorkdayTeamEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Who is working on what right now. Only the people the caller may see."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        if not access.can_view_team:
            return _forbidden()
        visible = access.visible_user_ids()
        people = calendar_user_ids(workspace) if visible is None else calendar_user_ids(workspace) & visible
        return Response({"results": workday.team_status(workspace, people, request.user)})


class NotificationEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        rows = OpsNotification.objects.filter(workspace=workspace, user=request.user).select_related("actor")[:50]
        unread = OpsNotification.objects.filter(workspace=workspace, user=request.user, read_at__isnull=True).count()
        return Response(
            {
                "unread": unread,
                "results": [
                    {
                        "id": n.id,
                        "kind": n.kind,
                        "title": n.title,
                        "body": n.body,
                        "link": n.link,
                        "actor": n.actor.display_name if n.actor else None,
                        "created_at": n.created_at,
                        "read": n.read_at is not None,
                    }
                    for n in rows
                ],
            }
        )

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """Mark one notification (`id`) or all of them read."""
        workspace = Workspace.objects.get(slug=slug)
        queryset = OpsNotification.objects.filter(workspace=workspace, user=request.user, read_at__isnull=True)
        if request.data.get("id"):
            queryset = queryset.filter(pk=parse_uuid(request.data["id"], "id"))
        queryset.update(read_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)
