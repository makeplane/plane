# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.team_ops.models import ActiveTimer, TimeEntry
from plane.team_ops.serializers import (
    ActiveTimerSerializer,
    TimeEntrySerializer,
    TimeEntryWriteSerializer,
    TimerStartSerializer,
    resolve_issue,
)
from plane.team_ops.services.time_entry import is_workspace_admin, parse_range, parse_uuid
from plane.team_ops.services.timer import stop_active_timer

# Guests never see time tracking; everyone else sees their own data, admins see all.
TIME_ROLES = [ROLE.ADMIN, ROLE.MEMBER]


def _entries(slug):
    return TimeEntry.objects.filter(workspace__slug=slug).select_related("user", "issue", "issue__project")


def _scoped_entries(request, slug):
    """Entries the caller may read: all for admins, otherwise only their own.

    An optional `user` query param narrows to one user; a non-admin asking for
    anyone but themselves is refused rather than silently given their own data.
    """
    queryset = _entries(slug)
    requested = request.query_params.get("user")
    requested_id = parse_uuid(requested, "user") if requested else None

    if is_workspace_admin(request.user, slug):
        return queryset.filter(user_id=requested_id) if requested_id else queryset

    if requested_id and requested_id != request.user.id:
        return None
    return queryset.filter(user=request.user)


def _apply_filters(request, queryset):
    params = request.query_params
    if params.get("issue"):
        queryset = queryset.filter(issue_id=parse_uuid(params["issue"], "issue"))
    if params.get("project"):
        queryset = queryset.filter(project_id=parse_uuid(params["project"], "project"))

    start, end = parse_range(params)
    if start:
        queryset = queryset.filter(started_at__gte=start)
    if end:
        queryset = queryset.filter(started_at__lt=end)
    return queryset


def _forbidden():
    return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)


class TimeEntryEndpoint(BaseAPIView):
    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        queryset = _scoped_entries(request, slug)
        if queryset is None:
            return _forbidden()
        queryset = _apply_filters(request, queryset)

        return self.paginate(
            request=request,
            queryset=queryset,
            order_by="-started_at",
            default_per_page=50,
            max_per_page=200,
            on_results=lambda entries: TimeEntrySerializer(entries, many=True).data,
        )

    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = TimeEntryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        issue = resolve_issue(workspace, request.user, data["issue"]) if data.get("issue") else None
        entry = TimeEntry.objects.create(
            workspace=workspace,
            project=issue.project if issue else None,
            issue=issue,
            user=request.user,
            started_at=data["started_at"],
            ended_at=data["ended_at"],
            duration_seconds=data["duration_seconds"],
            note=data.get("note", ""),
            is_billable=data.get("is_billable", False),
            source=TimeEntry.Source.MANUAL,
        )
        entry = _entries(slug).get(pk=entry.pk)
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class TimeEntryDetailEndpoint(BaseAPIView):
    def _get_entry(self, request, slug, pk):
        queryset = _entries(slug).filter(pk=pk)
        if not is_workspace_admin(request.user, slug):
            queryset = queryset.filter(user=request.user)
        return queryset.first()

    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def get(self, request, slug, pk):
        entry = self._get_entry(request, slug, pk)
        if entry is None:
            return Response({"error": "Time entry not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_200_OK)

    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def patch(self, request, slug, pk):
        entry = self._get_entry(request, slug, pk)
        if entry is None:
            return Response({"error": "Time entry not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TimeEntryWriteSerializer(entry, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if "issue" in data:
            issue = resolve_issue(entry.workspace, entry.user, data["issue"]) if data["issue"] else None
            entry.issue = issue
            entry.project = issue.project if issue else None
        entry.started_at = data["started_at"]
        entry.ended_at = data["ended_at"]
        entry.duration_seconds = data["duration_seconds"]
        if "note" in data:
            entry.note = data["note"]
        if "is_billable" in data:
            entry.is_billable = data["is_billable"]
        entry.save()

        entry = _entries(slug).get(pk=entry.pk)
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_200_OK)

    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def delete(self, request, slug, pk):
        entry = self._get_entry(request, slug, pk)
        if entry is None:
            return Response({"error": "Time entry not found."}, status=status.HTTP_404_NOT_FOUND)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TimeEntrySummaryEndpoint(BaseAPIView):
    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        queryset = _scoped_entries(request, slug)
        if queryset is None:
            return _forbidden()

        start, end = parse_range(request.query_params, require=True)
        queryset = _apply_filters(request, queryset)

        totals = queryset.aggregate(total=Sum("duration_seconds"))
        billable = queryset.filter(is_billable=True).aggregate(total=Sum("duration_seconds"))

        by_day = (
            queryset.annotate(day=TruncDate("started_at"))
            .values("day")
            .annotate(seconds=Sum("duration_seconds"))
            .order_by("day")
        )
        by_issue = (
            queryset.filter(issue__isnull=False)
            .values("issue_id", "issue__name", "issue__sequence_id", "issue__project__identifier")
            .annotate(seconds=Sum("duration_seconds"))
            .order_by("-seconds")[:10]
        )

        return Response(
            {
                "from": start,
                "to": end,
                "total_seconds": totals["total"] or 0,
                "billable_seconds": billable["total"] or 0,
                "by_day": [{"date": row["day"], "seconds": row["seconds"]} for row in by_day],
                "by_issue": [
                    {
                        "issue": row["issue_id"],
                        "name": row["issue__name"],
                        "sequence_id": row["issue__sequence_id"],
                        "project_identifier": row["issue__project__identifier"],
                        "seconds": row["seconds"],
                    }
                    for row in by_issue
                ],
            },
            status=status.HTTP_200_OK,
        )


class TimerEndpoint(BaseAPIView):
    def _timers(self, request, slug):
        return ActiveTimer.objects.filter(workspace__slug=slug, user=request.user).select_related(
            "issue", "issue__project"
        )

    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        timer = self._timers(request, slug).first()
        return Response({"timer": ActiveTimerSerializer(timer).data if timer else None}, status=status.HTTP_200_OK)

    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = TimerStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        issue = resolve_issue(workspace, request.user, data["issue"]) if data.get("issue") else None

        def already_running():
            current = self._timers(request, slug).first()
            return Response(
                {"error": "A timer is already running.", "timer": ActiveTimerSerializer(current).data},
                status=status.HTTP_409_CONFLICT,
            )

        if self._timers(request, slug).exists():
            return already_running()

        try:
            with transaction.atomic():
                timer = ActiveTimer.objects.create(
                    workspace=workspace,
                    user=request.user,
                    issue=issue,
                    started_at=timezone.now(),
                    note=data.get("note", ""),
                )
        except IntegrityError:
            # Lost a race with a second start request from the same user.
            return already_running()

        timer = self._timers(request, slug).get(pk=timer.pk)
        return Response({"timer": ActiveTimerSerializer(timer).data}, status=status.HTTP_201_CREATED)

    @allow_permission(TIME_ROLES, level="WORKSPACE")
    def delete(self, request, slug):
        """Stop the running timer and turn it into a time entry."""
        stopped = stop_active_timer(Workspace.objects.get(slug=slug), request.user)
        if stopped is None:
            return Response({"error": "No timer is running."}, status=status.HTTP_404_NOT_FOUND)
        entry, capped = stopped

        entry = _entries(slug).get(pk=entry.pk)
        return Response({"entry": TimeEntrySerializer(entry).data, "capped": capped}, status=status.HTTP_201_CREATED)
