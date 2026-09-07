# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Daily work logs.

One row per person per day, holding the part of the day that issue transitions
never show: the meeting, the production incident, the afternoon lost to a
migration that produced no card. The uniqueness is enforced in the model; this
layer's job is to make a draft appear without anybody having to create one, and
to answer "who hasn't filed?" cheaply enough to put on a dashboard.
"""

# Python imports
from datetime import timedelta

# Django imports
from django.db import IntegrityError
from django.db.models import Prefetch
from django.utils import timezone
from django.utils.dateparse import parse_date

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from workspaces.app.permissions import ROLE, allow_permission
from workspaces.app.serializers import WorkLogSerializer
from workspaces.app.views.base import BaseAPIView, BaseViewSet
from workspaces.db.models import Issue, Workspace, WorkspaceMember, WorkLog, WorkLogIssue
from workspaces.utils.engineering_ops import avatar_url, get_operations_config


def sync_work_log_issues(work_log, issue_ids):
    """
    Make the log's issue links exactly ``issue_ids``.

    Issues are re-validated against the workspace on every write: an id that
    names an issue in somebody else's workspace is dropped rather than
    rejected, because the alternative is a save that fails on a stale tab.
    """
    if issue_ids is None:
        return

    valid_ids = set(
        Issue.objects.filter(id__in=issue_ids, workspace_id=work_log.workspace_id).values_list("id", flat=True)
    )
    existing = {link.issue_id: link for link in WorkLogIssue.objects.filter(work_log=work_log)}

    for issue_id in valid_ids - set(existing):
        WorkLogIssue.objects.create(workspace_id=work_log.workspace_id, work_log=work_log, issue_id=issue_id)

    stale = [link.id for issue_id, link in existing.items() if issue_id not in valid_ids]
    if stale:
        WorkLogIssue.objects.filter(id__in=stale).delete()


class WorkLogViewSet(BaseViewSet):
    """
    Work logs for one workspace.

    Reading somebody else's log is a workspace-member privilege -- the whole
    point of the artefact is that the team can see what the team did. Writing
    one is the author's alone, which is why every mutating route re-checks
    ``owner``.
    """

    serializer_class = WorkLogSerializer
    model = WorkLog

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project", "owner")
            .prefetch_related(
                Prefetch(
                    "work_log_issues",
                    queryset=WorkLogIssue.objects.select_related("issue"),
                )
            )
        )

    def apply_filters(self, request, queryset):
        """Filter by owner, project, date window and submitted-ness."""
        owner_id = request.query_params.get("owner_id")
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

        project_id = request.query_params.get("project_id")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        start_date = parse_date(request.query_params.get("start_date") or "")
        if start_date:
            queryset = queryset.filter(date__gte=start_date)

        end_date = parse_date(request.query_params.get("end_date") or "")
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        submitted = request.query_params.get("submitted")
        if submitted in ("true", "false"):
            queryset = queryset.filter(submitted_at__isnull=(submitted == "false"))

        return queryset

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        queryset = self.apply_filters(request, self.get_queryset())
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda logs: WorkLogSerializer(logs, many=True).data,
            default_per_page=30,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkLogSerializer(data=request.data, context={"workspace_id": workspace.id})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        issue_ids = serializer.validated_data.pop("issue_ids", None)
        try:
            work_log = serializer.save(workspace_id=workspace.id, owner_id=request.user.id)
        except IntegrityError:
            # The one-per-day constraint. Two tabs, or a retried request.
            return Response(
                {"error": "A work log already exists for that date.", "code": "duplicate_work_log"},
                status=status.HTTP_409_CONFLICT,
            )

        sync_work_log_issues(work_log, issue_ids)
        return Response(WorkLogSerializer(self.get_queryset().get(pk=work_log.pk)).data, status=status.HTTP_201_CREATED)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        return Response(WorkLogSerializer(self.get_queryset().get(pk=pk)).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        work_log = self.get_queryset().get(pk=pk)
        if work_log.owner_id != request.user.id:
            return Response({"error": "You can only edit your own work log."}, status=status.HTTP_403_FORBIDDEN)

        serializer = WorkLogSerializer(
            work_log, data=request.data, partial=True, context={"workspace_id": work_log.workspace_id}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        issue_ids = serializer.validated_data.pop("issue_ids", None)
        serializer.save()
        sync_work_log_issues(work_log, issue_ids)
        return Response(WorkLogSerializer(self.get_queryset().get(pk=pk)).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        work_log = self.get_queryset().get(pk=pk)
        if work_log.owner_id != request.user.id:
            return Response({"error": "You can only delete your own work log."}, status=status.HTTP_403_FORBIDDEN)
        work_log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkLogSubmitEndpoint(BaseAPIView):
    """Mark a log as filed, or reopen it."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, pk):
        work_log = WorkLog.objects.filter(workspace__slug=slug, pk=pk).first()
        if not work_log:
            return Response({"error": "Work log not found."}, status=status.HTTP_404_NOT_FOUND)
        if work_log.owner_id != request.user.id:
            return Response({"error": "You can only submit your own work log."}, status=status.HTTP_403_FORBIDDEN)

        # A log with nothing in it is not a filed day. Without this the
        # "missing work logs" counter can be zeroed by clicking submit.
        if not (work_log.summary.strip() or work_log.worked_on.strip()):
            return Response(
                {"error": "Add a summary or what you worked on before submitting.", "code": "empty_work_log"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        work_log.submitted_at = None if request.data.get("reopen") else timezone.now()
        work_log.save()
        return Response(WorkLogSerializer(work_log).data, status=status.HTTP_200_OK)


class MyWorkLogEndpoint(BaseAPIView):
    """
    The signed-in user's log for one date, creating the draft if it is missing.

    A GET that writes, deliberately: the alternative is every client having to
    handle "404 means POST an empty one", and three of them getting it wrong.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        date = parse_date(request.query_params.get("date") or "") or timezone.localdate()

        work_log, _created = WorkLog.objects.get_or_create(
            workspace=workspace, owner=request.user, date=date, defaults={"time_spent": 0}
        )
        work_log = (
            WorkLog.objects.filter(pk=work_log.pk)
            .select_related("workspace", "project", "owner")
            .prefetch_related(Prefetch("work_log_issues", queryset=WorkLogIssue.objects.select_related("issue")))
            .first()
        )
        return Response(WorkLogSerializer(work_log).data, status=status.HTTP_200_OK)


class MissingWorkLogEndpoint(BaseAPIView):
    """
    Who has not filed a log, per day, over a window.

    Feeds both the PM dashboard's "Missing Work Logs" tile and the nightly
    reminder task, so the definition of "missing" lives here and only here.
    """

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        config = get_operations_config(workspace.id)
        required_weekdays = set(config["work_log"]["required_weekdays"])

        end = parse_date(request.query_params.get("end_date") or "") or timezone.localdate()
        start = parse_date(request.query_params.get("start_date") or "") or end
        if start > end:
            start, end = end, start
        # A month of days times a team is already a big response; anything
        # longer belongs in a report, not a dashboard tile.
        if (end - start).days > 31:
            start = end - timedelta(days=31)

        members = list(
            WorkspaceMember.objects.filter(workspace=workspace, is_active=True)
            .exclude(member__is_bot=True)
            .annotate(member_avatar_url=avatar_url("member"))
            .values("member_id", "member__display_name", "member_avatar_url")
        )
        member_ids = [m["member_id"] for m in members]

        filed = set(
            WorkLog.objects.filter(
                workspace=workspace,
                owner_id__in=member_ids,
                date__gte=start,
                date__lte=end,
                submitted_at__isnull=False,
            ).values_list("owner_id", "date")
        )

        days = []
        cursor = start
        while cursor <= end:
            if cursor.isoweekday() in required_weekdays:
                days.append(
                    {
                        "date": cursor.isoformat(),
                        "missing": [
                            {
                                "member_id": str(m["member_id"]),
                                "display_name": m["member__display_name"],
                                "avatar_url": m["member_avatar_url"],
                            }
                            for m in members
                            if (m["member_id"], cursor) not in filed
                        ],
                    }
                )
            cursor += timedelta(days=1)

        return Response(
            {
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "member_count": len(members),
                "days": days,
            },
            status=status.HTTP_200_OK,
        )
