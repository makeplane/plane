# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from datetime import date, timedelta
from functools import partial
from uuid import UUID

from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.bih_relation_visibility import current_visibility, readable_issues_q
from plane.app.views.base import BaseAPIView
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Issue,
    IssueRelation,
    ProjectMember,
    Workspace,
    WorkspaceHoliday,
    WorkspaceScheduleSetting,
)
from plane.utils.gantt_schedule import build_calendar, schedule_successors


# Solar dates of Tết (mùng 1) and Giỗ Tổ (10/3 âm), computed from the lunar calendar and checked against 2026
# (17/2 and 26/4). The government fixes the real days off each year, so the admin can still edit holidays.
LUNAR_HOLIDAYS = {
    2026: (date(2026, 2, 17), date(2026, 4, 26)),
    2027: (date(2027, 2, 6), date(2027, 4, 16)),
    2028: (date(2028, 1, 26), date(2028, 4, 4)),
    2029: (date(2029, 2, 13), date(2029, 4, 23)),
    2030: (date(2030, 2, 3), date(2030, 4, 12)),
}


def vietnamese_holidays(year):
    holidays = [
        (date(year, 1, 1), "Tết Dương lịch"),
        (date(year, 4, 30), "Giải phóng miền Nam"),
        (date(year, 5, 1), "Quốc tế Lao động"),
        (date(year, 9, 1), "Quốc khánh (liền kề)"),
        (date(year, 9, 2), "Quốc khánh"),
    ]
    if year in LUNAR_HOLIDAYS:
        tet, gio_to = LUNAR_HOLIDAYS[year]
        holidays += [(tet - timedelta(days=1), "Giao thừa")]
        holidays += [(tet + timedelta(days=i), f"Tết Nguyên đán (mùng {i + 1})") for i in range(4)]
        holidays += [(gio_to, "Giỗ Tổ Hùng Vương")]
    return holidays


def workspace_calendar(workspace):
    setting = WorkspaceScheduleSetting.objects.filter(workspace=workspace).first()
    return build_calendar(
        setting.working_weekdays if setting else [1, 2, 3, 4, 5],
        WorkspaceHoliday.objects.filter(workspace=workspace).values_list("date", flat=True),
    )


def settings_payload(workspace):
    setting = WorkspaceScheduleSetting.objects.filter(workspace=workspace).first()
    return {
        "working_weekdays": setting.working_weekdays if setting else [1, 2, 3, 4, 5],
        "holidays": [
            {"id": str(item.id), "date": item.date.isoformat(), "name": item.name}
            for item in WorkspaceHoliday.objects.filter(workspace=workspace).order_by("date", "id")
        ],
    }


class WorkspaceScheduleSettingsEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        return Response(settings_payload(get_object_or_404(Workspace, slug=slug)))

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug):
        weekdays = request.data.get("working_weekdays") if isinstance(request.data, dict) else None
        if (
            not isinstance(weekdays, list) or not weekdays
            or any(type(value) is not int or not 1 <= value <= 7 for value in weekdays)
            or len(set(weekdays)) != len(weekdays)
        ):
            raise ValidationError({"message": "Invalid working_weekdays"})
        with transaction.atomic():
            workspace = get_object_or_404(Workspace.objects.select_for_update(), slug=slug)
            WorkspaceScheduleSetting.objects.update_or_create(
                workspace=workspace, defaults={"working_weekdays": weekdays}
            )
            return Response(settings_payload(workspace))


class WorkspaceScheduleHolidaysEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        body = request.data
        if not isinstance(body, dict):
            raise ValidationError({"message": "Invalid holiday"})
        if "preset" in body:
            year = body.get("year")
            if body["preset"] != "vn_fixed" or type(year) is not int or not 2000 <= year <= 2100:
                raise ValidationError({"message": "Invalid preset or year"})
            holidays = vietnamese_holidays(year)
        else:
            try:
                raw = body.get("date")
                if not isinstance(raw, str) or date.fromisoformat(raw).isoformat() != raw:
                    raise ValueError("Invalid date")
                holiday_date = date.fromisoformat(raw)
            except ValueError:
                raise ValidationError({"message": "Invalid holiday date"})
            name = body.get("name", "")
            if not isinstance(name, str) or len(name) > 255:
                raise ValidationError({"message": "Invalid holiday name"})
        with transaction.atomic():
            workspace = get_object_or_404(Workspace.objects.select_for_update(), slug=slug)
            if "preset" in body:
                for holiday_date, name in holidays:
                    WorkspaceHoliday.objects.get_or_create(
                        workspace=workspace, date=holiday_date, defaults={"name": name}
                    )
                return Response(settings_payload(workspace))
            holiday, _ = WorkspaceHoliday.objects.update_or_create(
                workspace=workspace, date=holiday_date, defaults={"name": name}
            )
            return Response(
                {"id": str(holiday.id), "date": holiday.date.isoformat(), "name": holiday.name},
                status=status.HTTP_201_CREATED,
            )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, holiday_id):
        with transaction.atomic():
            workspace = get_object_or_404(Workspace.objects.select_for_update(), slug=slug)
            holiday = get_object_or_404(WorkspaceHoliday, workspace=workspace, id=holiday_id)
            WorkspaceHoliday.objects.filter(id=holiday.id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectIssueLagsEndpoint(BaseAPIView):
    @staticmethod
    def relations(slug, project_id):
        return IssueRelation.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            relation_type="blocked_by",
            issue__project_id=project_id,
            related_issue__project_id=project_id,
            issue__deleted_at__isnull=True,
            related_issue__deleted_at__isnull=True,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        return Response([
            {"predecessor": str(pred), "successor": str(succ), "lag_days": lag}
            for pred, succ, lag in self.relations(slug, project_id).exclude(lag_days=0)
            .order_by("related_issue_id", "issue_id").values_list("related_issue_id", "issue_id", "lag_days")
        ])

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        try:
            body = request.data
            if not isinstance(body, dict):
                raise ValueError("Invalid lag")
            lag = body.get("lag_days")
            if type(lag) is not int or not -365 <= lag <= 365:
                raise ValueError("Invalid lag_days")
            predecessor = str(UUID(body.get("predecessor", "")))
            successor = str(UUID(body.get("successor", "")))
        except (AttributeError, TypeError, ValueError):
            raise ValidationError({"message": "Invalid lag or issue IDs"})
        with transaction.atomic():
            get_object_or_404(Workspace.objects.select_for_update(), slug=slug)
            relation = get_object_or_404(
                self.relations(slug, project_id), issue_id=successor, related_issue_id=predecessor
            )
            relation.lag_days = lag
            relation.save(update_fields=["lag_days", "updated_at"])
        return Response({"predecessor": predecessor, "successor": successor, "lag_days": lag})


class WorkspaceIssueLagsEndpoint(BaseAPIView):
    """Cross-project twin of ProjectIssueLagsEndpoint: lags of dependencies whose two issues the user may read."""

    @staticmethod
    def relations(slug):
        access, user_id = current_visibility()
        readable = Issue.objects.filter(workspace__slug=slug).filter(readable_issues_q(access, user_id))
        return IssueRelation.objects.filter(
            workspace__slug=slug,
            relation_type="blocked_by",
            issue__in=readable,
            related_issue__in=readable,
        ), access

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        relations, _ = self.relations(slug)
        return Response([
            {"predecessor": str(pred), "successor": str(succ), "lag_days": lag}
            for pred, succ, lag in relations.exclude(lag_days=0)
            .order_by("related_issue_id", "issue_id").values_list("related_issue_id", "issue_id", "lag_days")
        ])

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug):
        try:
            body = request.data
            if not isinstance(body, dict):
                raise ValueError("Invalid lag")
            lag = body.get("lag_days")
            if type(lag) is not int or not -365 <= lag <= 365:
                raise ValueError("Invalid lag_days")
            predecessor = str(UUID(body.get("predecessor", "")))
            successor = str(UUID(body.get("successor", "")))
        except (AttributeError, TypeError, ValueError):
            raise ValidationError({"message": "Invalid lag or issue IDs"})
        with transaction.atomic():
            get_object_or_404(Workspace.objects.select_for_update(), slug=slug)
            relations, access = self.relations(slug)
            relation = get_object_or_404(
                relations.select_related("issue"), issue_id=successor, related_issue_id=predecessor
            )
            # Same rule as moving the successor: only a Member or Admin of the successor's project may change it.
            # relation.project is not reliable: creating from the "blocking" side stores the predecessor's project.
            role = access.get(str(relation.issue.project_id), (0, False))[0]
            if role < ROLE.MEMBER.value:
                return Response({"message": "No permission"}, status=status.HTTP_403_FORBIDDEN)
            relation.lag_days = lag
            relation.save(update_fields=["lag_days", "updated_at"])
        return Response({"predecessor": predecessor, "successor": successor, "lag_days": lag})


class WorkspaceIssueScheduleEndpoint(BaseAPIView):
    """Cross-project twin of IssueScheduleEndpoint.

    Only projects where the user is an active member take part. Issues in projects where the user
    is a guest are read-only: they are never moved and get a "no_permission" warning when a
    predecessor moves. Issues in other projects are invisible and ignored.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug):
        from plane.app.views.issue.base import IssueScheduleEndpoint

        try:
            change, include_successors, dry_run, mode, pull_earlier, expected = IssueScheduleEndpoint.parse_body(
                request.data
            )
        except (TypeError, ValueError) as exc:
            return Response({"message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Same workspace lock as relation creation keeps the graph stable across projects.
            workspace = Workspace.objects.select_for_update().get(slug=slug)
            roles = {
                str(project_id): role
                for project_id, role in ProjectMember.objects.filter(
                    workspace__slug=slug, member=request.user, is_active=True, project__deleted_at__isnull=True
                ).values_list("project_id", "role")
            }
            writable = {project_id for project_id, role in roles.items() if role >= ROLE.MEMBER.value}
            visible_issues = Issue.objects.filter(workspace__slug=slug, project_id__in=roles)
            change_project = visible_issues.filter(id=change["id"]).values_list("project_id", flat=True).first()
            if change_project is None:
                return Response({"message": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)
            if str(change_project) not in writable:
                return Response({"message": "No permission"}, status=status.HTTP_403_FORBIDDEN)

            relations = [
                (str(predecessor), str(successor), lag, str(successor_project))
                for predecessor, successor, lag, successor_project in IssueRelation.objects.filter(
                    workspace__slug=slug,
                    relation_type="blocked_by",
                    deleted_at__isnull=True,
                    issue__project_id__in=roles,
                    related_issue__project_id__in=roles,
                    issue__deleted_at__isnull=True,
                    related_issue__deleted_at__isnull=True,
                ).order_by("id").values_list("related_issue_id", "issue_id", "lag_days", "issue__project_id")
            ]
            # Edges into read-only issues are dropped so the engine never moves them.
            dependencies = [(pred, succ, lag) for pred, succ, lag, project in relations if project in writable]
            outgoing = {}
            for predecessor, successor, _ in dependencies:
                outgoing.setdefault(predecessor, set()).add(successor)
            downstream = {change["id"]}
            pending = [change["id"]]
            while pending:
                for successor in outgoing.get(pending.pop(), ()):
                    if successor not in downstream:
                        downstream.add(successor)
                        pending.append(successor)
                        if len(downstream) > 2001:
                            return Response({"message": "Too many downstream issues"}, status=status.HTTP_400_BAD_REQUEST)
            locked = {
                str(issue.id): issue
                for issue in visible_issues.filter(id__in=downstream, project_id__in=writable)
                .order_by("id")
                .select_for_update(of=("self",))
            }
            edited = locked.get(change["id"])
            if edited is None:
                return Response({"message": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)
            start = change.get("start_date", edited.start_date)
            end = change.get("target_date", edited.target_date)
            if start and end and start > end:
                return Response({"message": "Start date cannot exceed target date"}, status=status.HTTP_400_BAD_REQUEST)
            tasks = [
                {"id": issue_id, "start": issue.start_date, "end": issue.target_date}
                for issue_id, issue in locked.items()
            ]
            predecessors = {pred for pred, successor, _ in dependencies if successor in downstream} - downstream
            tasks.extend(
                {"id": str(issue_id), "start": task_start, "end": task_end}
                for issue_id, task_start, task_end in visible_issues.filter(id__in=predecessors).values_list(
                    "id", "start_date", "target_date"
                )
            )
            try:
                result = schedule_successors(
                    tasks, dependencies, {"id": change["id"], "start": start, "end": end},
                    calendar=workspace_calendar(workspace) if mode == "working" else None,
                    pull_earlier=pull_earlier,
                )
            except (OverflowError, ValueError):
                return Response({"message": "Schedule exceeds date range"}, status=status.HTTP_400_BAD_REQUEST)
            if result["cycle"]:
                return Response(
                    {"message": "Circular dependency", "cycle": result["cycle"]}, status=status.HTTP_409_CONFLICT
                )
            updates = result["updates"]
            moved = {update["id"] for update in updates} if include_successors else set()
            if (start, end) != (edited.start_date, edited.target_date):
                moved.add(change["id"])
            warnings = list(result["warnings"])
            warned = set()
            for pred, succ, _, project in relations:
                if project not in writable and pred in moved and succ not in warned:
                    warned.add(succ)
                    warnings.append({"id": succ, "reason": "no_permission"})
            # Names and codes let the web app label issues that are not in the open Gantt.
            labelled = {item["id"] for item in [*updates, *warnings]}
            issues_info = {
                str(row["id"]): {
                    "name": row["name"],
                    "sequence_id": row["sequence_id"],
                    "project_id": str(row["project_id"]),
                    "project_identifier": row["project__identifier"],
                }
                for row in visible_issues.filter(id__in=labelled).values(
                    "id", "name", "sequence_id", "project_id", "project__identifier"
                )
            }
            response_data = json.loads(json.dumps(
                {"updates": updates, "warnings": warnings, "issues": issues_info}, cls=DjangoJSONEncoder
            ))
            if dry_run:
                return Response(response_data, status=status.HTTP_200_OK)
            if include_successors and expected is not None and expected != {
                update["id"]: (update["new_start"], update["new_end"]) for update in updates
            }:
                return Response({"message": "Schedule changed", **response_data}, status=status.HTTP_409_CONFLICT)

            planned = {change["id"]: {field: change[field] for field in ("start_date", "target_date") if field in change}}
            if include_successors:
                planned.update({
                    update["id"]: {"start_date": update["new_start"], "target_date": update["new_end"]}
                    for update in updates
                })
            changed = []
            activities = []
            epoch = int(timezone.now().timestamp())
            for issue_id, values in planned.items():
                issue = locked[issue_id]
                new_start = values.get("start_date", issue.start_date)
                new_end = values.get("target_date", issue.target_date)
                if new_start and new_end and new_start > new_end:
                    return Response({"message": "Start date cannot exceed target date"}, status=status.HTTP_400_BAD_REQUEST)
                issue_changed = False
                for field, value in values.items():
                    previous = getattr(issue, field)
                    if value != previous:
                        activities.append({
                            "type": "issue.activity.updated",
                            "requested_data": json.dumps({field: value}, cls=DjangoJSONEncoder),
                            "current_instance": json.dumps({field: str(previous)}),
                            "issue_id": issue_id,
                            "actor_id": str(request.user.id),
                            "project_id": str(issue.project_id),
                            "epoch": epoch,
                        })
                        setattr(issue, field, value)
                        issue_changed = True
                if issue_changed:
                    changed.append(issue)
            if changed:
                Issue.objects.bulk_update(changed, ["start_date", "target_date"])
            for activity in activities:
                transaction.on_commit(partial(issue_activity.delay, **activity))
            return Response(response_data, status=status.HTTP_200_OK)
