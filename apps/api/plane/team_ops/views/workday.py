# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace
from plane.team_ops.models import OpsTeam, OpsTeamMember, WorkSession
from plane.team_ops.services import hub_files, teamflow, work_sessions, workday
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess, calendar_user_ids
from plane.team_ops.services.date_params import parse_day_range
from plane.team_ops.services.time_entry import parse_uuid
from plane.team_ops.services.time_logged import logged_issues
from plane.team_ops.views.hub import _ids

MAX_SESSION_DAYS = 92


def _flag(value):
    return str(value).lower() in ("1", "true", "yes", "on")


def _session_payload(session):
    issue = session.issue
    return {
        "id": session.id,
        "user": session.user_id,
        "project": session.project_id,
        "issue": session.issue_id,
        "work_item": f"{issue.project.identifier}-{issue.sequence_id}" if issue else None,
        "work_item_name": issue.name if issue else None,
        "started_at": session.started_at,
        "finished_at": session.finished_at,
        "duration_seconds": session.duration_seconds,
        "summary": session.summary,
        "document_text": session.document_text,
        "no_document": session.no_document,
        "needs_attention": session.needs_attention,
        "attention_message": session.attention_message,
        "location": session.location,
        "break_seconds": session.break_seconds,
        "frozen_seconds": session.frozen_seconds,
        "files": [
            {"id": a.id, "name": a.name, "content_type": a.content_type, "size": a.size}
            for a in session.attachments.all()
        ],
    }


def _forbidden():
    return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)


class WorkSessionFinishEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """Stop the timer and record what was done. A report is required; so is a document, or the
        confirmation that there is none. `attention_message` hands the work over to other teams."""
        workspace = Workspace.objects.get(slug=slug)
        if request.user.id not in calendar_user_ids(workspace):
            return _forbidden()
        data = request.data
        files = request.FILES.getlist("files")
        if len(files) > hub_files.MAX_FILES_PER_MESSAGE:
            raise ParseError(detail=f"At most {hub_files.MAX_FILES_PER_MESSAGE} files.")
        for upload in files:  # a bad file must not cost the person their timer
            hub_files.validate_upload(upload)

        message = (data.get("attention_message") or "").strip()
        attention = None
        if message or _flag(data.get("needs_attention")):
            attention = {
                "message": message,
                "team_ids": _ids(request, "attention_teams"),
                "user_ids": _ids(request, "attention_users"),
            }

        with transaction.atomic():
            session, capped = work_sessions.finish_work(
                workspace=workspace,
                user=request.user,
                summary=data.get("summary"),
                document_text=data.get("document_text"),
                no_document=_flag(data.get("no_document")),
                attention=attention,
                attachments_expected=bool(files),
            )
            for upload in files:
                hub_files.store_attachment(workspace=workspace, user=request.user, upload=upload, session=session)
        session = (
            WorkSession.objects.select_related("issue", "issue__project")
            .prefetch_related("attachments")
            .get(pk=session.pk)
        )
        return Response({"session": _session_payload(session), "capped": capped}, status=status.HTTP_201_CREATED)


class WorkSessionListEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Finished work of one person (the caller by default) in a date range, newest first."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        start, end = parse_day_range(request.query_params, require=True, max_days=MAX_SESSION_DAYS)
        target_id = (
            parse_uuid(request.query_params["user"], "user") if request.query_params.get("user") else request.user.id
        )
        if not access.can_view_user(target_id):
            return _forbidden()
        user = User.objects.get(pk=target_id)
        sessions = (
            WorkSession.objects.filter(
                workspace=workspace, user=user, finished_at__date__gte=start, finished_at__date__lte=end
            )
            .select_related("issue", "issue__project")
            .prefetch_related("attachments")
            .order_by("-finished_at")
        )
        return Response({"results": [_session_payload(s) for s in sessions]})


class WorkHeatmapEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Work per day over the last year for one person (the caller by default): finished work, tasks, seconds."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        target_id = (
            parse_uuid(request.query_params["user"], "user") if request.query_params.get("user") else request.user.id
        )
        if not access.can_view_user(target_id):
            return _forbidden()
        return Response(workday.heatmap(workspace, User.objects.get(pk=target_id)))


class WorkTasksEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """How much time went into each work item in a date range, for one person."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        start, end = parse_day_range(request.query_params, require=True, max_days=MAX_SESSION_DAYS)
        target_id = (
            parse_uuid(request.query_params["user"], "user") if request.query_params.get("user") else request.user.id
        )
        if not access.can_view_user(target_id):
            return _forbidden()
        user = User.objects.get(pk=target_id)
        results = logged_issues(workspace, user.id, user.user_timezone, start, end, limit=50)
        return Response({"results": results, "total_seconds": sum(row["seconds"] for row in results)})


class TeamflowEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Hand-offs between teams. Admins see all of them, everyone else those that touch their teams.
        Filters: `team`, `status` (pending or delivered), `from`, `to`."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        if not access.is_calendar_user:
            return _forbidden()
        params = request.query_params
        if access.is_admin:
            visible = set(OpsTeam.objects.filter(workspace=workspace).values_list("id", flat=True))
        else:
            visible = set(
                OpsTeamMember.objects.filter(user=request.user, team__workspace=workspace).values_list(
                    "team_id", flat=True
                )
            )
        state = params.get("status") or None
        if state and state not in teamflow.STATUSES:
            raise ParseError(detail="Unknown status.")
        start, end = parse_day_range(params, max_days=366)
        team_id = parse_uuid(params["team"], "team") if params.get("team") else None
        rows = teamflow.handoffs(
            workspace, visible_team_ids=visible, start=start, end=end, team_id=team_id, status=state
        )
        return Response({"results": rows, **teamflow.flow_summary(workspace, rows, visible)})
