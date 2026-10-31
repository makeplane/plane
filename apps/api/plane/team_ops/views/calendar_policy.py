# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError, transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.team_ops.models import CalendarAudit, CalendarHoliday
from plane.team_ops.serializers import CalendarAuditSerializer, CalendarSettingsSerializer, HolidaySerializer
from plane.team_ops.services.audit import record_audit
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess
from plane.team_ops.services.policy import get_policy, snapshot_policy
from plane.team_ops.services.weekly_plan import extend_weekly_plans
from plane.team_ops.services.date_params import parse_day_range
from plane.team_ops.services.time_entry import parse_uuid

ADMIN_ONLY = [ROLE.ADMIN]


def _settings_payload(access):
    return {"settings": CalendarSettingsSerializer(access.settings).data, "permissions": access.describe()}


class CalendarSettingsEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        return Response(_settings_payload(CalendarAccess(request.user, workspace)), status=status.HTTP_200_OK)

    @allow_permission(ADMIN_ONLY, level="WORKSPACE")
    def put(self, request, slug):
        """Change the policy. Fields that are not sent keep their value."""
        workspace = Workspace.objects.get(slug=slug)
        settings_row = get_policy(workspace)

        serializer = CalendarSettingsSerializer(settings_row, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            before = snapshot_policy(settings_row)
            serializer.save()
            after = snapshot_policy(settings_row)
            changed = [field for field in after if after[field] != before[field]]
            if changed:
                record_audit(
                    workspace=workspace,
                    entity=CalendarAudit.Entity.SETTINGS,
                    action=CalendarAudit.Action.UPDATE,
                    changed_by=request.user,
                    old={field: before[field] for field in changed},
                    new={field: after[field] for field in changed},
                )

        if "template_horizon_weeks" in changed:
            # A longer horizon takes effect now instead of at the next daily run.
            extend_weekly_plans([workspace.id])

        return Response(_settings_payload(CalendarAccess(request.user, workspace)), status=status.HTTP_200_OK)


class CalendarHolidayEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        start, end = parse_day_range(request.query_params)
        holidays = CalendarHoliday.objects.filter(workspace__slug=slug)
        if start:
            holidays = holidays.filter(date__gte=start)
        if end:
            holidays = holidays.filter(date__lte=end)
        return Response(HolidaySerializer(holidays, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(ADMIN_ONLY, level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = HolidaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if CalendarHoliday.objects.filter(workspace=workspace, date=data["date"]).exists():
            return Response({"error": "A holiday already exists on this date."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                holiday = CalendarHoliday.objects.create(workspace=workspace, date=data["date"], name=data["name"])
                record_audit(
                    workspace=workspace,
                    entity=CalendarAudit.Entity.HOLIDAY,
                    action=CalendarAudit.Action.CREATE,
                    changed_by=request.user,
                    work_date=holiday.date,
                    new={"date": holiday.date, "name": holiday.name},
                )
        except IntegrityError:
            return Response({"error": "A holiday already exists on this date."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(HolidaySerializer(holiday).data, status=status.HTTP_201_CREATED)


class CalendarHolidayDetailEndpoint(BaseAPIView):
    @allow_permission(ADMIN_ONLY, level="WORKSPACE")
    def delete(self, request, slug, pk):
        holiday = CalendarHoliday.objects.filter(workspace__slug=slug, pk=pk).select_related("workspace").first()
        if holiday is None:
            return Response({"error": "Holiday not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # Hard delete: the audit row keeps the history and a deleted date can be added again.
            holiday.delete(soft=False)
            record_audit(
                workspace=holiday.workspace,
                entity=CalendarAudit.Entity.HOLIDAY,
                action=CalendarAudit.Action.DELETE,
                changed_by=request.user,
                work_date=holiday.date,
                old={"date": holiday.date, "name": holiday.name},
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class CalendarAuditEndpoint(BaseAPIView):
    """Change history. `from` / `to` select the work dates the changes applied to."""

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        params = request.query_params

        audits = CalendarAudit.objects.filter(workspace=workspace)

        requested = params.get("user")
        if requested:
            user_id = parse_uuid(requested, "user")
            if not access.can_view_user(user_id):
                return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)
            audits = audits.filter(subject_user_id=user_id)
        elif not access.is_admin:
            # Workspace-wide changes (policy, holidays, teams) are for admins; everybody else
            # sees the history of the plans they are allowed to read.
            visible = access.visible_user_ids()
            audits = audits.filter(subject_user__isnull=False)
            if visible is not None:
                audits = audits.filter(subject_user_id__in=visible)

        if params.get("entity"):
            audits = audits.filter(entity=params["entity"])

        start, end = parse_day_range(params)
        if start:
            audits = audits.filter(work_date__gte=start)
        if end:
            audits = audits.filter(work_date__lte=end)

        return self.paginate(
            request=request,
            queryset=audits,
            order_by="-created_at",
            default_per_page=50,
            max_per_page=200,
            on_results=lambda rows: CalendarAuditSerializer(rows, many=True).data,
        )
