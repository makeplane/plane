# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from collections import defaultdict

from django.db.models import Sum
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import IssueWorkLogSerializer, TimesheetBulkEntrySerializer
from plane.app.serializers.worklog import get_min_allowed_date
from plane.db.models import IssueWorkLog, Project
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host

# Max aggregate minutes per user per day
MAX_DAILY_MINUTES = 720


class TimesheetBulkUpdateEndpoint(BaseAPIView):
    """Bulk create/update worklogs from the timesheet grid.

    POST /api/workspaces/<slug>/projects/<project_id>/time-tracking/timesheet/bulk/
    Payload: { "entries": [{ "issue_id": "...", "logged_at": "YYYY-MM-DD", "duration_minutes": 60 }, ...] }
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        # Verify time tracking is enabled
        try:
            project = Project.objects.get(pk=project_id, workspace__slug=slug)
            if not project.is_time_tracking_enabled:
                return Response(
                    {"error": "Time tracking is not enabled for this project"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        entries = request.data.get("entries", [])
        if not entries:
            return Response(
                {"error": "No entries provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate entries
        serializer = TimesheetBulkEntrySerializer(
            data=entries, many=True,
            context={"project_timezone": project.timezone},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check aggregate daily limit (720min) — exclude worklogs being replaced
        min_allowed_date = get_min_allowed_date(working_days=60)
        date_totals = defaultdict(int)
        replace_keys = set()
        for entry in serializer.validated_data:
            if entry["duration_minutes"] > 0:
                date_totals[entry["logged_at"]] += entry["duration_minutes"]
            replace_keys.add((str(entry["issue_id"]), entry["logged_at"]))
        for log_date, new_total in date_totals.items():
            # Exclude worklogs that will be replaced by this bulk request
            qs = IssueWorkLog.objects.filter(logged_by=request.user, logged_at=log_date)
            replace_issue_ids = [k[0] for k in replace_keys if k[1] == log_date]
            if replace_issue_ids:
                qs = qs.exclude(
                    project_id=project_id,
                    issue_id__in=replace_issue_ids,
                )
            existing_total = qs.aggregate(total=Sum("duration_minutes"))["total"] or 0
            if existing_total + new_total > MAX_DAILY_MINUTES:
                remaining = max(MAX_DAILY_MINUTES - existing_total, 0)
                return Response(
                    {"error": f"Daily time limit exceeded for {log_date}. You have {remaining} minutes remaining."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        results = []
        for entry in serializer.validated_data:
            result = self._process_entry(
                request, slug, project_id, project, entry, min_allowed_date,
            )
            if isinstance(result, Response):
                return result  # error response
            if result:
                results.append(result)

        return Response({"results": results}, status=status.HTTP_200_OK)

    def _process_entry(self, request, slug, project_id, project, entry, min_allowed_date):
        """Process a single bulk entry. Returns dict on success or Response on error."""
        issue_id = entry["issue_id"]
        logged_at = entry["logged_at"]
        duration_minutes = entry["duration_minutes"]

        # Upsert: find existing worklog for this user+issue+date, or create one
        existing = IssueWorkLog.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            logged_by=request.user,
            logged_at=logged_at,
        ).first()

        if existing:
            # Check edit window for existing worklogs
            if existing.logged_at < min_allowed_date:
                return Response(
                    {"error": f"Worklog for {logged_at} is locked. Worklogs older than 60 working days are read-only."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if duration_minutes == 0:
                return self._delete_entry(request, existing, issue_id, project_id)
            return self._update_entry(request, existing, duration_minutes, issue_id, project_id)

        if duration_minutes > 0:
            return self._create_entry(request, project, issue_id, logged_at, duration_minutes, project_id)
        return None

    def _delete_entry(self, request, existing, issue_id, project_id):
        current_instance = json.dumps(
            IssueWorkLogSerializer(existing).data, cls=DjangoJSONEncoder,
        )
        logged_at = existing.logged_at
        wl_id = str(existing.id)
        existing.delete()
        issue_activity.delay(
            type="worklog.activity.deleted",
            requested_data=json.dumps({"worklog_id": wl_id}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=False,
            origin=base_host(request=request, is_app=True),
        )
        return {"issue_id": str(issue_id), "logged_at": str(logged_at), "action": "deleted"}

    def _update_entry(self, request, existing, duration_minutes, issue_id, project_id):
        current_instance = json.dumps(
            IssueWorkLogSerializer(existing).data, cls=DjangoJSONEncoder,
        )
        existing.duration_minutes = duration_minutes
        existing.save(update_fields=["duration_minutes", "updated_at"])
        issue_activity.delay(
            type="worklog.activity.updated",
            requested_data=json.dumps(
                {"duration_minutes": duration_minutes}, cls=DjangoJSONEncoder,
            ),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=False,
            origin=base_host(request=request, is_app=True),
        )
        return {"issue_id": str(issue_id), "logged_at": str(existing.logged_at), "action": "updated"}

    def _create_entry(self, request, project, issue_id, logged_at, duration_minutes, project_id):
        new_wl = IssueWorkLog.objects.create(
            workspace=project.workspace,
            project_id=project_id,
            issue_id=issue_id,
            logged_by=request.user,
            logged_at=logged_at,
            duration_minutes=duration_minutes,
        )
        issue_activity.delay(
            type="worklog.activity.created",
            requested_data=json.dumps(
                IssueWorkLogSerializer(new_wl).data, cls=DjangoJSONEncoder,
            ),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=False,
            origin=base_host(request=request, is_app=True),
        )
        return {"issue_id": str(issue_id), "logged_at": str(logged_at), "action": "created"}
