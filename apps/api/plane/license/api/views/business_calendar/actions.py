# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import calendar
from datetime import date

from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from plane.db.models import DayOverride, Holiday, WorkSchedule
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.views.base import BaseAPIView
from plane.utils.business_calendar.service import BusinessCalendarService
from plane.utils.exception_logger import log_exception

# Lunar-calendar holidays that naive year-shift will get wrong
_LUNAR_HOLIDAY_WARNINGS = [
    "Tết Nguyên Đán and Giỗ Tổ Hùng Vương follow the lunar calendar — "
    "please verify their dates after copy-year."
]


def _safe_replace_year(d: date, to_year: int) -> date | None:
    """Shift a date to to_year, handling Feb-29 leap edge case.

    Returns None if the date is invalid in the target year (Feb 29 in non-leap year).
    """
    if d.month == 2 and d.day == 29 and not calendar.isleap(to_year):
        return None
    return d.replace(year=to_year)


class InstanceCalendarCopyYearEndpoint(BaseAPIView):
    """Copy all holidays and overrides from one year to another (atomic).

    POST body: {"from_year": 2025, "to_year": 2026}
    Response:  {"copied_holidays": N, "copied_overrides": M, "skipped": K, "warnings": [...]}
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request, pk):
        try:
            schedule = WorkSchedule.objects.get(pk=pk, deleted_at__isnull=True)
        except WorkSchedule.DoesNotExist:
            return Response({"error": "Work schedule not found."}, status=status.HTTP_404_NOT_FOUND)

        from_year = request.data.get("from_year")
        to_year = request.data.get("to_year")

        if not isinstance(from_year, int) or not isinstance(to_year, int):
            return Response(
                {"error": "from_year and to_year must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if from_year == to_year:
            return Response(
                {"error": "from_year and to_year must differ."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            copied_holidays, copied_overrides, skipped = _copy_year_atomic(schedule, from_year, to_year)
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Copy-year operation failed. No changes were committed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "copied_holidays": copied_holidays,
                "copied_overrides": copied_overrides,
                "skipped": skipped,
                "warnings": _LUNAR_HOLIDAY_WARNINGS,
            },
            status=status.HTTP_200_OK,
        )


@transaction.atomic
def _copy_year_atomic(schedule, from_year: int, to_year: int) -> tuple[int, int, int]:
    """Inner atomic operation — returns (copied_holidays, copied_overrides, skipped)."""
    skipped = 0

    # --- Holidays ---
    holidays_qs = Holiday.objects.filter(schedule=schedule, date__year=from_year)
    copied_holidays = 0
    for h in holidays_qs:
        new_date = _safe_replace_year(h.date, to_year)
        if new_date is None:
            skipped += 1
            continue
        Holiday.objects.update_or_create(
            schedule=schedule,
            date=new_date,
            defaults={"name": h.name},
        )
        copied_holidays += 1

    # --- DayOverrides ---
    overrides_qs = DayOverride.objects.filter(schedule=schedule, date__year=from_year)
    copied_overrides = 0
    for ov in overrides_qs:
        new_date = _safe_replace_year(ov.date, to_year)
        if new_date is None:
            skipped += 1
            continue
        new_swap = None
        if ov.swap_with_date is not None:
            new_swap = _safe_replace_year(ov.swap_with_date, to_year)
        DayOverride.objects.update_or_create(
            schedule=schedule,
            date=new_date,
            defaults={"type": ov.type, "reason": ov.reason, "swap_with_date": new_swap},
        )
        copied_overrides += 1

    return copied_holidays, copied_overrides, skipped


class InstanceCalendarCheckEndpoint(BaseAPIView):
    """Check whether a date is a working day for a given schedule.

    GET ?date=YYYY-MM-DD&schedule_id=<uuid>
    Permission: IsAuthenticated (non-sensitive read-only helper for workspace UI).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get("date")
        schedule_id = request.query_params.get("schedule_id") or None

        if not date_str:
            return Response({"error": "date query param is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            query_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({"error": "date must be in YYYY-MM-DD format."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from plane.db.models import WorkSchedule as WS
            if schedule_id:
                schedule = WS.objects.get(pk=schedule_id, deleted_at__isnull=True)
            else:
                schedule = WS.objects.get(is_default=True, workspace=None, deleted_at__isnull=True)
        except WS.DoesNotExist:
            return Response({"error": "Schedule not found."}, status=status.HTTP_404_NOT_FOUND)

        is_working = BusinessCalendarService.is_working_day(query_date, schedule.id)
        reason = _resolve_reason(schedule, query_date, is_working)

        return Response(
            {
                "is_working_day": is_working,
                "schedule": str(schedule.id),
                "reason": reason,
            },
            status=status.HTTP_200_OK,
        )


def _resolve_reason(schedule, query_date: date, is_working: bool) -> str:
    """Return a human-readable reason string for the working-day decision."""
    override = DayOverride.objects.filter(schedule=schedule, date=query_date).first()
    if override is not None:
        return f"override:{override.type.lower()} — {override.reason or 'manual override'}"

    holiday = Holiday.objects.filter(schedule=schedule, date=query_date).first()
    if holiday is not None:
        return f"holiday:{holiday.name}"

    day_name = query_date.strftime("%A")
    if is_working:
        return f"workday:{day_name}"
    return f"weekend:{day_name}"
