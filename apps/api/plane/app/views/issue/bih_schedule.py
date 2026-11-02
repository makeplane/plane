# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date
from uuid import UUID

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import IssueRelation, Workspace, WorkspaceHoliday, WorkspaceScheduleSetting
from plane.utils.gantt_schedule import build_calendar


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
            holidays = [
                (date(year, 1, 1), "Tết Dương lịch"),
                (date(year, 4, 30), "Giải phóng miền Nam"),
                (date(year, 5, 1), "Quốc tế Lao động"),
                (date(year, 9, 1), "Quốc khánh (liền kề)"),
                (date(year, 9, 2), "Quốc khánh"),
            ]
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
