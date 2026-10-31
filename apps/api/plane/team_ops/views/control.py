# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.exceptions import NotFound, ParseError
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.team_ops.models import HubChannel, HubMessage
from plane.team_ops.services import control
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess
from plane.team_ops.services.csv_export import csv_response, csv_safe, hours
from plane.team_ops.services.date_params import parse_day_range
from plane.team_ops.services.team_view import visible_people
from plane.team_ops.views.hub import _message_payload

MAX_DAYS = 92


def _forbidden():
    return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)


def _team_scope(request, slug):
    """`(workspace, access, user ids)` for a caller who may see the team, else `(None, None, None)`."""
    workspace = Workspace.objects.get(slug=slug)
    access = CalendarAccess(request.user, workspace)
    if not access.can_view_team:
        return None, None, None
    return workspace, access, {user_id for user_id, _ in visible_people(access, workspace, request.query_params)}


class ControlTeamEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Every person's state now and their work, places, pauses and freezes in `from`..`to`.
        Filters: `team`, `project`, `user`. `export=csv` downloads the table."""
        workspace, access, user_ids = _team_scope(request, slug)
        if workspace is None:
            return _forbidden()
        start, end = parse_day_range(request.query_params, require=True, max_days=MAX_DAYS)
        rows, totals = control.team_overview(workspace, user_ids, start, end, request.user)
        if request.query_params.get("export") == "csv":
            header = [
                "Person",
                "Worked (h)",
                "Onsite (h)",
                "Remote (h)",
                "Finished work",
                "Tasks",
                "Rest pauses (h)",
                "Frozen (h)",
                "Freezes",
                "Without document",
                "Needed attention",
                "Unplanned days this week",
            ]
            lines = [
                [
                    csv_safe(row["user"]["display_name"]),
                    hours(row["period"]["seconds"]),
                    hours(row["period"]["onsite_seconds"]),
                    hours(row["period"]["remote_seconds"]),
                    row["period"]["sessions"],
                    row["period"]["tasks"],
                    hours(row["period"]["break_seconds"]),
                    hours(row["period"]["frozen_seconds"]),
                    row["period"]["freezes"],
                    row["period"]["without_document"],
                    row["period"]["attention"],
                    row["unplanned_days"],
                ]
                for row in rows
            ]
            return csv_response(f"team-control-{start}-{end}.csv", header, lines, f"Period {start} to {end}")
        return Response({"from": start, "to": end, "results": rows, "totals": totals})


class ControlInterruptionsEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Rest pauses and freezes in a period. Filters: `kind` (BREAK or FREEZE), plus the team filters."""
        workspace, access, user_ids = _team_scope(request, slug)
        if workspace is None:
            return _forbidden()
        start, end = parse_day_range(request.query_params, require=True, max_days=MAX_DAYS)
        kind = request.query_params.get("kind")
        if kind and kind not in ("BREAK", "FREEZE"):
            raise ParseError(detail="Unknown kind.")
        return Response({"results": control.interruption_list(workspace, user_ids, start, end, request.user, kind)})


def _admin(request, slug):
    workspace = Workspace.objects.get(slug=slug)
    return workspace if CalendarAccess(request.user, workspace).is_admin else None


class ControlHubEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        workspace = _admin(request, slug)
        if workspace is None:
            return _forbidden()
        return Response(control.hub_overview(workspace))


class ControlHubChannelEndpoint(BaseAPIView):
    def _channel(self, workspace, pk):
        channel = HubChannel.objects.filter(workspace=workspace, pk=pk).exclude(kind=HubChannel.Kind.DM).first()
        if channel is None:
            raise NotFound("Channel not found.")  # private conversations are never reachable from here
        return channel

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def patch(self, request, slug, pk):
        """Lock a channel (only admins may write in it) or open it again."""
        workspace = _admin(request, slug)
        if workspace is None:
            return _forbidden()
        channel = self._channel(workspace, pk)
        channel.is_locked = bool(request.data.get("is_locked"))
        channel.save()
        return Response({"id": channel.id, "is_locked": channel.is_locked})

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, pk):
        """The latest messages of a channel, for moderation."""
        workspace = _admin(request, slug)
        if workspace is None:
            return _forbidden()
        channel = self._channel(workspace, pk)
        messages = list(
            HubMessage.objects.filter(channel=channel)
            .select_related("author")
            .prefetch_related("mentions__user", "attachments")
            .order_by("-created_at")[:50]
        )
        return Response({"results": [_message_payload(m, request.user) for m in messages]})


class ControlHubMessageEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def delete(self, request, slug, pk):
        """Remove a message from a team, project, general or news channel. Private messages cannot be reached."""
        workspace = _admin(request, slug)
        if workspace is None:
            return _forbidden()
        message = (
            HubMessage.objects.filter(pk=pk, channel__workspace=workspace)
            .exclude(channel__kind=HubChannel.Kind.DM)
            .first()
        )
        if message is None:
            raise NotFound("Message not found.")
        message.is_deleted = True
        message.body = ""
        message.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ControlFlowsEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        workspace = _admin(request, slug)
        if workspace is None:
            return _forbidden()
        return Response(control.flow_overview(workspace))
