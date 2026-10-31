# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.team_ops.models import WORKING_MODES, LeaveType, WorkMode
from plane.team_ops.serializers.calendar import validate_calendar_date
from plane.team_ops.services.day_resolution import iter_days

# Longest list of days one request may change.
MAX_BULK_DAYS = 366


def _minute(value):
    return value.replace(second=0, microsecond=0) if value is not None else None


def validate_times(attrs):
    """Working modes carry both times or neither, in order; day-off modes carry none."""
    start = _minute(attrs.get("planned_start_time"))
    end = _minute(attrs.get("planned_end_time"))
    mode = attrs["work_mode"]

    if mode not in WORKING_MODES:
        if start is not None or end is not None:
            raise serializers.ValidationError("A day off or a leave day cannot have working hours.")
    elif (start is None) != (end is None):
        raise serializers.ValidationError("Set both the start and the end time, or neither.")
    elif start is not None and end <= start:
        raise serializers.ValidationError("The end time must be after the start time.")

    attrs["planned_start_time"], attrs["planned_end_time"] = start, end
    return attrs


class CalendarPlanSerializer(serializers.Serializer):
    """The plan for a day. Whatever is left out is cleared: a write replaces the whole day."""

    work_mode = serializers.ChoiceField(choices=WorkMode.choices)
    planned_start_time = serializers.TimeField(required=False, allow_null=True)
    planned_end_time = serializers.TimeField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, max_length=2000, default="")
    leave_type = serializers.ChoiceField(choices=LeaveType.choices, required=False, allow_null=True)

    def validate(self, attrs):
        attrs = validate_times(attrs)
        attrs["description"] = attrs.get("description", "").strip()

        leave_type = attrs.get("leave_type")
        if attrs["work_mode"] == WorkMode.LEAVE:
            attrs["leave_type"] = leave_type or LeaveType.OTHER
        elif leave_type:
            raise serializers.ValidationError("A leave type can only be set on a leave day.")
        else:
            attrs["leave_type"] = None
        return attrs


class CalendarEntryWriteSerializer(CalendarPlanSerializer):
    # Whose plan to change; defaults to the caller. Checked against the caller's rights.
    user = serializers.UUIDField(required=False)


class CalendarBulkWriteSerializer(CalendarEntryWriteSerializer):
    """One plan for several days: a list of dates, or a range, optionally limited to weekdays."""

    dates = serializers.ListField(
        child=serializers.DateField(validators=[validate_calendar_date]), required=False, max_length=MAX_BULK_DAYS
    )
    start_date = serializers.DateField(required=False, validators=[validate_calendar_date])
    end_date = serializers.DateField(required=False, validators=[validate_calendar_date])
    weekdays = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=7), required=False, allow_empty=False, max_length=7
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        dates = attrs.pop("dates", None)
        start, end = attrs.pop("start_date", None), attrs.pop("end_date", None)
        weekdays = set(attrs.pop("weekdays", range(1, 8)))

        if dates is not None and (start or end):
            raise serializers.ValidationError("Send either dates or a start and end date, not both.")
        if dates is None:
            if not (start and end):
                raise serializers.ValidationError("Send dates, or both a start date and an end date.")
            if end < start:
                raise serializers.ValidationError("The end date must not be before the start date.")
            if (end - start).days + 1 > MAX_BULK_DAYS:
                raise serializers.ValidationError(f"A range cannot be longer than {MAX_BULK_DAYS} days.")
            dates = list(iter_days(start, end))

        days = sorted({day for day in dates if day.isoweekday() in weekdays})
        if not days:
            raise serializers.ValidationError("No dates are left to change.")
        attrs["days"] = days
        return attrs


class WeeklyPlanDaySerializer(serializers.Serializer):
    weekday = serializers.IntegerField(min_value=1, max_value=7)
    work_mode = serializers.ChoiceField(choices=[mode for mode in WorkMode.choices if mode[0] != WorkMode.LEAVE])
    planned_start_time = serializers.TimeField(required=False, allow_null=True)
    planned_end_time = serializers.TimeField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)

    def validate(self, attrs):
        return validate_times(attrs)


class WeeklyPlanWriteSerializer(serializers.Serializer):
    """The whole weekly plan. Weekdays that are not listed are removed from it."""

    days = WeeklyPlanDaySerializer(many=True, max_length=7)
    user = serializers.UUIDField(required=False)

    def validate_days(self, value):
        weekdays = [day["weekday"] for day in value]
        if len(set(weekdays)) != len(weekdays):
            raise serializers.ValidationError("Each weekday can only be listed once.")
        return value
