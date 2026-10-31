# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace
from plane.team_ops.serializers import (
    CalendarBulkWriteSerializer,
    CalendarEntryWriteSerializer,
    WeeklyPlanWriteSerializer,
    validate_calendar_date,
)
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess, calendar_user_ids
from plane.team_ops.services.day_resolution import resolve_days
from plane.team_ops.services.entry_writes import PLAN_FIELDS, reset_day, set_days
from plane.team_ops.services.weekly_plan import plan_snapshot, save_plan
from plane.team_ops.services.date_params import parse_day, parse_day_range
from plane.team_ops.services.time_entry import parse_uuid


def _forbidden(message="You don't have the required permissions."):
    return Response({"error": message}, status=status.HTTP_403_FORBIDDEN)


def _past_date(access, days=None):
    body = {
        "error": "This date is in the past and can no longer be changed.",
        "earliest_editable_date": access.earliest_editable_date(),
    }
    if days is not None:
        body["skipped_dates"] = days
    return Response(body, status=status.HTTP_403_FORBIDDEN)


def _target(request, access, workspace, requested, edit):
    """Whose calendar a call is about: `(user, None)`, or `(None, error_response)`.

    The caller names the person with `user`; it defaults to themselves. The caller's rights over
    that person are always checked here, and the person must be a calendar user of the workspace.
    """
    target_id = parse_uuid(requested, "user") if requested else request.user.id
    allowed = access.can_edit_user(target_id) if edit else access.can_view_user(target_id)
    if not allowed:
        return None, _forbidden()
    if target_id not in calendar_user_ids(workspace):
        return None, Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    return User.objects.get(pk=target_id), None


def _resolved(workspace, access, user_id, day):
    return resolve_days(workspace, access.settings, [user_id], day, day)[user_id][0]


class CalendarEntryEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """What every day in a range looks like for one person (the caller by default)."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        start, end = parse_day_range(request.query_params, require=True)

        target, error = _target(request, access, workspace, request.query_params.get("user"), edit=False)
        if error:
            return error

        days = resolve_days(workspace, access.settings, [target.id], start, end)[target.id]
        return Response({"user": target.id, "from": start, "to": end, "days": days}, status=status.HTTP_200_OK)


class CalendarEntryDetailEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def put(self, request, slug, day):
        """Set the plan for one day. Replaces the whole day: what is left out is cleared."""
        day = validate_calendar_date(parse_day(day, "date"))
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)

        serializer = CalendarEntryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        target, error = _target(request, access, workspace, data.get("user"), edit=True)
        if error:
            return error
        if not access.can_edit_date(day):
            return _past_date(access)

        result = set_days(
            workspace=workspace,
            user_id=target.id,
            days=[day],
            plan={field: data[field] for field in PLAN_FIELDS},
            changed_by=request.user,
        )
        code = status.HTTP_201_CREATED if result["created"] else status.HTTP_200_OK
        return Response(_resolved(workspace, access, target.id, day), status=code)

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def delete(self, request, slug, day):
        """Remove a day set by hand. A future day goes back to the weekly plan, if there is one."""
        day = validate_calendar_date(parse_day(day, "date"))
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)

        target, error = _target(request, access, workspace, request.query_params.get("user"), edit=True)
        if error:
            return error
        if not access.can_edit_date(day):
            return _past_date(access)

        if not reset_day(workspace=workspace, user=target, day=day, changed_by=request.user):
            return Response({"error": "This day has no entry set by hand."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_resolved(workspace, access, target.id, day), status=status.HTTP_200_OK)


class CalendarEntryBulkEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """Apply one plan to many days. Days the caller may no longer change are skipped and reported."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)

        serializer = CalendarBulkWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        target, error = _target(request, access, workspace, data.get("user"), edit=True)
        if error:
            return error

        editable = [day for day in data["days"] if access.can_edit_date(day)]
        skipped = [day for day in data["days"] if day not in editable]
        if not editable:
            return _past_date(access, skipped)

        result = set_days(
            workspace=workspace,
            user_id=target.id,
            days=editable,
            plan={field: data[field] for field in PLAN_FIELDS},
            changed_by=request.user,
        )
        return Response({**result, "skipped_dates": skipped}, status=status.HTTP_200_OK)


class CalendarTemplateEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)

        target, error = _target(request, access, workspace, request.query_params.get("user"), edit=False)
        if error:
            return error
        return Response({"user": target.id, "days": plan_snapshot(workspace, target)}, status=status.HTTP_200_OK)

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def put(self, request, slug):
        """Replace the weekly plan and write it out for the coming weeks."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)

        serializer = WeeklyPlanWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        target, error = _target(request, access, workspace, data.get("user"), edit=True)
        if error:
            return error

        result = save_plan(
            workspace=workspace,
            user=target,
            days=data["days"],
            settings_row=access.settings,
            changed_by=request.user,
        )
        return Response(
            {"user": target.id, "days": result["plan"], "materialized": result["materialized"]},
            status=status.HTTP_200_OK,
        )
