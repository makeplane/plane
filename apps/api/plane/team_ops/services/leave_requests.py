# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Leave requests: asking, approving, rejecting and what approval writes into the calendar."""

# Django imports
from django.db import transaction
from django.utils import timezone

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.team_ops.models import CalendarHoliday, LeaveRequest, WorkMode
from plane.team_ops.services.day_resolution import iter_days
from plane.team_ops.services.entry_writes import set_days

# A request covers at most this many days, so one approval stays one small write.
MAX_LEAVE_DAYS = 62

OPEN = (LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED)


def leave_days(workspace, settings_row, start, end):
    """The days a request takes: working weekdays that are not holidays."""
    holidays = set(
        CalendarHoliday.objects.filter(workspace=workspace, date__gte=start, date__lte=end).values_list(
            "date", flat=True
        )
    )
    weekdays = set(settings_row.working_weekdays)
    return [day for day in iter_days(start, end) if day.isoweekday() in weekdays and day not in holidays]


def create_request(*, workspace, settings_row, user, start, end, leave_type, note):
    if end < start:
        raise ParseError(detail="The end date must not be before the start date.")
    if (end - start).days + 1 > MAX_LEAVE_DAYS:
        raise ParseError(detail=f"A request covers at most {MAX_LEAVE_DAYS} days.")
    if not leave_days(workspace, settings_row, start, end):
        raise ParseError(detail="There is no working day in this period.")
    overlapping = LeaveRequest.objects.filter(
        workspace=workspace, user=user, status__in=OPEN, start_date__lte=end, end_date__gte=start
    )
    if overlapping.exists():
        raise ParseError(detail="You already have a leave request for part of this period.")
    return LeaveRequest.objects.create(
        workspace=workspace, user=user, start_date=start, end_date=end, leave_type=leave_type, note=note
    )


def can_decide(access, request):
    """Admins decide any request; a team lead decides for their teams. Only an admin decides their own."""
    if request.user_id == access.user.id:
        return access.is_admin
    return access.is_admin or request.user_id in access.led_user_ids


def reviewable_requests(access, workspace):
    """Pending requests the caller may decide."""
    queryset = LeaveRequest.objects.filter(workspace=workspace, status=LeaveRequest.Status.PENDING)
    if access.is_admin:
        return queryset
    return queryset.filter(user_id__in=access.led_user_ids).exclude(user=access.user)


def decide(*, request, access, approve, note):
    """Approve (the leave days are written into the person's calendar) or reject a pending request."""
    with transaction.atomic():
        request = LeaveRequest.objects.select_for_update().get(pk=request.pk)
        if request.status != LeaveRequest.Status.PENDING:
            raise ParseError(detail="This request has already been decided.")
        if approve:
            days = leave_days(request.workspace, access.settings, request.start_date, request.end_date)
            set_days(
                workspace=request.workspace,
                user_id=request.user_id,
                days=days,
                plan={
                    "work_mode": WorkMode.LEAVE.value,
                    "planned_start_time": None,
                    "planned_end_time": None,
                    "description": request.note,
                    "leave_type": request.leave_type,
                },
                changed_by=access.user,
            )
        request.status = LeaveRequest.Status.APPROVED if approve else LeaveRequest.Status.REJECTED
        request.decided_by = access.user
        request.decided_at = timezone.now()
        request.decision_note = note
        request.save()
    return request


def cancel(request):
    """The person withdraws a request that is still pending."""
    if request.status != LeaveRequest.Status.PENDING:
        raise ParseError(detail="Only a pending request can be cancelled.")
    request.status = LeaveRequest.Status.CANCELLED
    request.save()
    return request
