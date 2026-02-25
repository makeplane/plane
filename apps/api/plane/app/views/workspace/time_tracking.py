# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from collections import defaultdict
from datetime import timedelta

from django.db.models import Sum, F
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import IssueWorkLogSerializer, TimesheetBulkEntrySerializer
from plane.db.models import IssueWorkLog, Issue, Project
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host

# Cap grouped results to prevent huge response payloads
SUMMARY_RESULT_LIMIT = 500


class ProjectWorkLogSummaryEndpoint(BaseAPIView):
    """Aggregate worklog summary for a project."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        filters = {"workspace__slug": slug, "project_id": project_id}

        # Optional date range filters
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            filters["logged_at__gte"] = date_from
        if date_to:
            filters["logged_at__lte"] = date_to

        worklogs = IssueWorkLog.objects.filter(**filters)

        total = worklogs.aggregate(total=Sum("duration_minutes"))["total"] or 0

        by_member = list(
            worklogs.values("logged_by")
            .annotate(
                member_id=F("logged_by"),
                display_name=F("logged_by__display_name"),
                total_minutes=Sum("duration_minutes"),
            )
            .values("member_id", "display_name", "total_minutes")
            .order_by("-total_minutes")[:SUMMARY_RESULT_LIMIT]
        )

        by_issue = list(
            worklogs.values("issue")
            .annotate(
                issue_id=F("issue"),
                issue_name=F("issue__name"),
                estimate_time=F("issue__estimate_time"),
                total_minutes=Sum("duration_minutes"),
            )
            .values("issue_id", "issue_name", "estimate_time", "total_minutes")
            .order_by("-total_minutes")[:SUMMARY_RESULT_LIMIT]
        )

        return Response(
            {
                "total_duration_minutes": total,
                "by_member": by_member,
                "by_issue": by_issue,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceWorkLogSummaryEndpoint(BaseAPIView):
    """Aggregate worklog summary across all projects in workspace."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        filters = {"workspace__slug": slug}

        # Optional filters
        project_id = request.query_params.get("project_id")
        member_id = request.query_params.get("member_id")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if project_id:
            filters["project_id"] = project_id
        if member_id:
            filters["logged_by_id"] = member_id
        if date_from:
            filters["logged_at__gte"] = date_from
        if date_to:
            filters["logged_at__lte"] = date_to

        worklogs = IssueWorkLog.objects.filter(**filters)

        total = worklogs.aggregate(total=Sum("duration_minutes"))["total"] or 0

        by_member = list(
            worklogs.values("logged_by")
            .annotate(
                member_id=F("logged_by"),
                display_name=F("logged_by__display_name"),
                total_minutes=Sum("duration_minutes"),
            )
            .values("member_id", "display_name", "total_minutes")
            .order_by("-total_minutes")[:SUMMARY_RESULT_LIMIT]
        )

        by_issue = list(
            worklogs.values("issue")
            .annotate(
                issue_id=F("issue"),
                issue_name=F("issue__name"),
                estimate_time=F("issue__estimate_time"),
                total_minutes=Sum("duration_minutes"),
            )
            .values("issue_id", "issue_name", "estimate_time", "total_minutes")
            .order_by("-total_minutes")[:SUMMARY_RESULT_LIMIT]
        )

        return Response(
            {
                "total_duration_minutes": total,
                "by_member": by_member,
                "by_issue": by_issue,
            },
            status=status.HTTP_200_OK,
        )


def _parse_week_start(request):
    """Parse week_start from query params, default to current Monday."""
    raw = request.query_params.get("week_start")
    if raw:
        from datetime import date as _date

        try:
            d = _date.fromisoformat(raw)
        except ValueError:
            return None, "Invalid date format. Use YYYY-MM-DD."
        # Snap to Monday
        d = d - timedelta(days=d.weekday())
        return d, None
    today = timezone.now().date()
    return today - timedelta(days=today.weekday()), None


class TimesheetGridEndpoint(BaseAPIView):
    """Return the current user's timesheet grid for a given week.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/timesheet/
    ?week_start=YYYY-MM-DD  (optional, defaults to current week Monday)

    Response: { week_start, week_end, rows: [...], daily_totals, grand_total_minutes }
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        week_start, err = _parse_week_start(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        week_end = week_start + timedelta(days=6)

        # Fetch issues assigned to the current user in this project
        # Uses issue_objects to exclude triage/archived/draft
        assigned_issues = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                assignees=request.user,
            )
            .select_related("project")
            .only("id", "name", "sequence_id", "project__identifier")
            .order_by("sequence_id")
        )

        issue_ids = [i.id for i in assigned_issues]
        issue_map = {
            str(i.id): {
                "issue_id": str(i.id),
                "issue_name": i.name,
                "issue_identifier": f"{i.project.identifier}-{i.sequence_id}",
                "project_id": str(i.project_id),
            }
            for i in assigned_issues
        }

        # Fetch worklogs for this user in the date range
        worklogs = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                logged_by=request.user,
                logged_at__range=[week_start, week_end],
                issue_id__in=issue_ids,
            )
            .select_related("issue")
            .values("issue_id", "logged_at")
            .annotate(total=Sum("duration_minutes"))
        )

        # Build per-issue daily map
        issue_days = defaultdict(lambda: defaultdict(int))
        for wl in worklogs:
            iid = str(wl["issue_id"])
            day = wl["logged_at"].isoformat()
            issue_days[iid][day] = wl["total"]

        # Build rows
        rows = []
        for iid, info in issue_map.items():
            days = dict(issue_days.get(iid, {}))
            total = sum(days.values())
            rows.append({**info, "days": days, "total_minutes": total})

        # Daily totals
        daily_totals = defaultdict(int)
        for r in rows:
            for day, mins in r["days"].items():
                daily_totals[day] += mins

        grand_total = sum(r["total_minutes"] for r in rows)

        return Response(
            {
                "week_start": week_start.isoformat(),
                "week_end": week_end.isoformat(),
                "rows": rows,
                "daily_totals": dict(daily_totals),
                "grand_total_minutes": grand_total,
            },
            status=status.HTTP_200_OK,
        )


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
        serializer = TimesheetBulkEntrySerializer(data=entries, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        results = []
        for entry in serializer.validated_data:
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
                # If duration is 0, delete the worklog
                if duration_minutes == 0:
                    current_instance = json.dumps(
                        IssueWorkLogSerializer(existing).data,
                        cls=DjangoJSONEncoder,
                    )
                    existing.delete()
                    issue_activity.delay(
                        type="worklog.activity.deleted",
                        requested_data=json.dumps(
                            {"worklog_id": str(existing.id)}
                        ),
                        actor_id=str(request.user.id),
                        issue_id=str(issue_id),
                        project_id=str(project_id),
                        current_instance=current_instance,
                        epoch=int(timezone.now().timestamp()),
                        notification=False,
                        origin=base_host(request=request, is_app=True),
                    )
                    results.append(
                        {"issue_id": str(issue_id), "logged_at": str(logged_at), "action": "deleted"}
                    )
                else:
                    # Update
                    current_instance = json.dumps(
                        IssueWorkLogSerializer(existing).data,
                        cls=DjangoJSONEncoder,
                    )
                    existing.duration_minutes = duration_minutes
                    existing.save(update_fields=["duration_minutes", "updated_at"])
                    issue_activity.delay(
                        type="worklog.activity.updated",
                        requested_data=json.dumps(
                            {"duration_minutes": duration_minutes},
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
                    results.append(
                        {"issue_id": str(issue_id), "logged_at": str(logged_at), "action": "updated"}
                    )
            else:
                if duration_minutes > 0:
                    # Create
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
                            IssueWorkLogSerializer(new_wl).data,
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
                    results.append(
                        {"issue_id": str(issue_id), "logged_at": str(logged_at), "action": "created"}
                    )

        return Response({"results": results}, status=status.HTTP_200_OK)
