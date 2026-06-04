# Python imports
import csv
from datetime import datetime
import pytz

# Django imports
from django.db import transaction
from django.db.models import Q
from django.http import StreamingHttpResponse
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    IssueTimer,
    IssueTimerSegment,
    Issue,
    Project,
    IssueActivity,
    IssueAssignee,
)
from plane.app.serializers.timer import (
    IssueTimerSerializer,
    IssueTimerAdminSerializer,
    ActiveTimerSerializer,
)


class Echo:
    """An object that implements just the write method of the file-like interface."""
    def write(self, value):
        return value


class IssueTimerActionEndpoint(BaseAPIView):
    """
    Endpoints for starting, pausing, resuming, and stopping an issue timer.
    Path: /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/timer/
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, issue_id):
        timer = IssueTimer.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            user=request.user,
            is_manual=False,
        ).first()

        if not timer:
            return Response(None, status=status.HTTP_200_OK)

        serializer = IssueTimerSerializer(timer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        action = request.data.get("action")
        note = request.data.get("note", "")
        is_manual = request.data.get("is_manual", False)
        
        if action not in ["start", "pause", "resume", "stop"]:
            return Response(
                {"error": "Invalid action. Must be start, pause, resume, or stop."},
                status=status.HTTP_400_BAD_REQUEST
            )

        issue = Issue.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=issue_id
        ).first()
        if not issue:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()

        with transaction.atomic():
            if action == "manual":
                # Create a distinct IssueTimer for manual entries
                # Duration is expected to be passed in seconds or calculated from hours/minutes
                duration = int(request.data.get("duration", 0))
                date_str = request.data.get("date")
                
                if duration <= 0:
                    return Response({"error": "Duration must be > 0"}, status=status.HTTP_400_BAD_REQUEST)
                if not date_str:
                    return Response({"error": "Date is required"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Parse date and set started_at/stopped_at to reflect the manual entry time
                try:
                    entry_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except ValueError:
                    return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)
                
                # We do not create segments for manual entries to keep them simple
                # Or we can create one segment covering the duration. Let's create one segment.
                timer = IssueTimer.objects.create(
                    workspace=issue.workspace,
                    project=issue.project,
                    issue=issue,
                    user=request.user,
                    is_running=False,
                    is_paused=False,
                    is_manual=True,
                    note=note,
                    started_at=entry_date,
                    stopped_at=entry_date, # For manual, start/stop can just reflect the logged date
                    total_duration_seconds=duration,
                )
                
                # Create a segment for consistency in compute_duration
                IssueTimerSegment.objects.create(
                    timer=timer,
                    segment_start=entry_date,
                    segment_end=entry_date,
                )
                
                # We already hardcoded total_duration_seconds but compute_duration uses segment diff
                # For manual entries, compute_duration would be 0 if segment_start == segment_end.
                # So let's make segment_end = segment_start + duration
                import datetime as dt
                segment = timer.segments.first()
                segment.segment_end = segment.segment_start + dt.timedelta(seconds=duration)
                segment.save()
                
                # Now the timer's total_duration_seconds will be stable if recomputed
                timer.total_duration_seconds = timer.compute_duration()
                timer.save()
                
                serializer = IssueTimerSerializer(timer)
                return Response(serializer.data, status=status.HTTP_200_OK)



            # Lock the current tracked issue timer (is_manual=False)
            timer, created = IssueTimer.objects.select_for_update().get_or_create(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
                user=request.user,
                is_manual=False,
                defaults={
                    "is_running": False,
                    "is_paused": False,
                }
            )

            if action == "start" or action == "resume":
                if not timer.is_running:
                    IssueTimerSegment.objects.create(
                        timer=timer,
                        segment_start=now,
                    )
                    timer.is_running = True
                    timer.is_paused = False
                    if action == "start" and created:
                        timer.started_at = now

                    IssueActivity.objects.create(
                        issue_id=issue_id,
                        project_id=project_id,
                        workspace_id=issue.workspace_id,
                        comment="started the timer",
                        verb="started",
                        actor_id=request.user.id,
                        field="timer",
                        created_at=now,
                    )

                    # Auto-assign the user if they are not already assigned
                    if action == "start":
                        if not issue.assignees.filter(id=request.user.id).exists():
                            IssueAssignee.objects.create(
                                issue=issue,
                                assignee=request.user,
                                project_id=project_id,
                                workspace_id=issue.workspace_id
                            )
                            IssueActivity.objects.create(
                                issue_id=issue_id,
                                project_id=project_id,
                                workspace_id=issue.workspace_id,
                                comment="was auto-assigned",
                                verb="assigned",
                                actor_id=request.user.id,
                                field="assignees",
                                old_value="",
                                new_value=str(request.user.id),
                                created_at=now,
                            )

            elif action == "pause":
                if timer.is_running:
                    timer.segments.filter(segment_end__isnull=True).update(segment_end=now)
                    timer.is_running = False
                    timer.is_paused = True
                    timer.paused_at = now

            elif action == "stop":
                if timer.is_running:
                    timer.segments.filter(segment_end__isnull=True).update(segment_end=now)
                
                # Apply note only on stop, if provided
                if note:
                    timer.note = note

                timer.is_running = False
                timer.is_paused = False
                timer.stopped_at = now

                timer.total_duration_seconds = timer.compute_duration()
                secs = timer.total_duration_seconds
                hhmmss = f"{secs // 3600:02d}:{(secs % 3600) // 60:02d}:{secs % 60:02d}"
                
                activity_comment = f"stopped the timer · {hhmmss}"
                if note:
                    trunc_note = (note[:57] + '...') if len(note) > 60 else note
                    activity_comment = f"added a note and stopped the timer · {hhmmss}: {trunc_note}"
                
                IssueActivity.objects.create(
                    issue_id=issue_id,
                    project_id=project_id,
                    workspace_id=issue.workspace_id,
                    comment=activity_comment,
                    verb="stopped",
                    actor_id=request.user.id,
                    field="timer",
                    created_at=now,
                )

            # Always recompute total duration on any action
            timer.total_duration_seconds = timer.compute_duration()
            timer.save()

        # Re-fetch for clean serialization
        timer.refresh_from_db()
        serializer = IssueTimerSerializer(timer)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserTimerListView(BaseAPIView):
    """
    Get all timers for the current user in the workspace.
    Path: /api/workspaces/<slug>/timers/me/
    """
    
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        timers = IssueTimer.objects.filter(
            workspace__slug=slug,
            user=request.user,
        ).select_related("issue", "project", "user")

        serializer = IssueTimerAdminSerializer(timers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserTimerExportView(BaseAPIView):
    """
    Export current user's timers as CSV.
    Path: /api/workspaces/<slug>/timers/me/export/
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        tz_str = request.GET.get("tz", "UTC")
        try:
            from zoneinfo import ZoneInfo
            tz = ZoneInfo(tz_str)
        except Exception:
            try:
                import pytz
                tz = pytz.timezone(tz_str)
            except Exception:
                from datetime import timezone
                tz = timezone.utc

        timers = IssueTimer.objects.filter(
            workspace__slug=slug,
            user=request.user,
        ).select_related("issue", "project")

        return _stream_timer_csv(timers, tz, f"my_time_export_{slug}.csv")


class AdminTimerListView(BaseAPIView):
    """
    Admin only endpoint to view all timers in the workspace.
    Path: /api/workspaces/<slug>/timers/admin/
    """

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        timers = IssueTimer.objects.filter(
            workspace__slug=slug,
        ).select_related("issue", "project", "user")

        serializer = IssueTimerAdminSerializer(timers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminTimerExportView(BaseAPIView):
    """
    Admin only endpoint to export all timers in the workspace as CSV.
    Path: /api/workspaces/<slug>/timers/admin/export/
    """

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        tz_str = request.GET.get("tz", "UTC")
        try:
            from zoneinfo import ZoneInfo
            tz = ZoneInfo(tz_str)
        except Exception:
            try:
                import pytz
                tz = pytz.timezone(tz_str)
            except Exception:
                from datetime import timezone
                tz = timezone.utc

        timers = IssueTimer.objects.filter(
            workspace__slug=slug,
        ).select_related("issue", "project", "user")

        return _stream_timer_csv(timers, tz, f"workspace_time_export_{slug}.csv")


class ActiveTimerListView(BaseAPIView):
    """
    Get all currently active timers in the workspace for badge display.
    Path: /api/workspaces/<slug>/timers/active/
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        # Allow guests to see badges if they can view issues
        timers = IssueTimer.objects.filter(
            workspace__slug=slug,
            is_running=True,
        ).select_related("user")

        serializer = ActiveTimerSerializer(timers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


def _stream_timer_csv(queryset, tz, filename):
    """Helper to generate a StreamingHttpResponse for CSV exports."""
    
    def row_generator():
        yield [
            "Project Identifier",
            "Project Name",
            "Issue ID",
            "Issue Name",
            "User Display Name",
            "User Email",
            "Started At",
            "Stopped At",
            "Total Duration (Seconds)",
            "Total Duration (HH:MM:SS)",
            "Status",
            "Note",
            "Timezone"
        ]
        
        for timer in queryset.iterator(chunk_size=1000):
            project = timer.project
            issue = timer.issue
            user = timer.user

            def get_hhmmss(secs):
                return f"{secs // 3600:02d}:{(secs % 3600) // 60:02d}:{secs % 60:02d}"

            if timer.is_manual:
                started = timer.started_at.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S") if timer.started_at else ""
                stopped = timer.stopped_at.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S") if timer.stopped_at else ""
                secs = timer.total_duration_seconds
                yield [
                    project.identifier,
                    project.name,
                    f"{project.identifier}-{issue.sequence_id}",
                    issue.name,
                    user.display_name or user.email,
                    user.email,
                    started,
                    stopped,
                    secs,
                    get_hhmmss(secs),
                    "Manual",
                    timer.note,
                    getattr(tz, "key", getattr(tz, "zone", str(tz)))
                ]
            else:
                from collections import defaultdict
                import datetime
                import pytz

                nowUtc = timezone.now()
                segments = timer.segments.all().order_by("segment_start")
                
                if not segments:
                    # In case of no segments but timer exists
                    continue

                day_seconds = defaultdict(int)
                first_start_dt = None
                last_end_dt = None
                
                for seg in segments:
                    start_dt = seg.segment_start
                    if not start_dt:
                        continue
                    end_dt = seg.segment_end or nowUtc
                    
                    if not first_start_dt:
                        first_start_dt = start_dt
                    last_end_dt = end_dt
                    
                    current_dt = start_dt
                    while current_dt < end_dt:
                        local_current = current_dt.astimezone(tz)
                        next_midnight_local = (local_current + datetime.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                        
                        chunk_end = min(end_dt, next_midnight_local)
                        duration = (chunk_end - current_dt).total_seconds()
                        
                        date_str = local_current.strftime("%Y-%m-%d")
                        day_seconds[date_str] += int(duration)
                        
                        current_dt = chunk_end

                status_str = "Running" if timer.is_running else "Paused" if timer.is_paused else "Stopped"
                
                for date_str, secs in sorted(day_seconds.items()):
                    if secs > 0:
                        yield [
                            project.identifier,
                            project.name,
                            f"{project.identifier}-{issue.sequence_id}",
                            issue.name,
                            user.display_name or user.email,
                            user.email,
                            f"{date_str} (Split)" if len(day_seconds) > 1 else first_start_dt.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S"),
                            f"{date_str} (Split)" if len(day_seconds) > 1 else last_end_dt.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S"),
                            secs,
                            get_hhmmss(secs),
                            status_str,
                            timer.note,
                            getattr(tz, "key", getattr(tz, "zone", str(tz)))
                        ]

    pseudo_buffer = Echo()
    writer = csv.writer(pseudo_buffer)
    
    response = StreamingHttpResponse(
        (writer.writerow(row) for row in row_generator()),
        content_type="text/csv"
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
