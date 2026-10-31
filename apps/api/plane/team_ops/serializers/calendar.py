# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import date

# Third party imports
from rest_framework import serializers

# Module imports
from plane.team_ops.models import CalendarAudit, CalendarHoliday, CalendarSettings

# Dates outside this window are almost certainly typos.
MIN_CALENDAR_DATE = date(2000, 1, 1)
MAX_CALENDAR_DATE = date(2100, 12, 31)


def validate_calendar_date(value):
    if not MIN_CALENDAR_DATE <= value <= MAX_CALENDAR_DATE:
        raise serializers.ValidationError(f"Date must be between {MIN_CALENDAR_DATE} and {MAX_CALENDAR_DATE}.")
    return value


class CalendarSettingsSerializer(serializers.ModelSerializer):
    working_weekdays = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=7), allow_empty=False, max_length=7
    )

    class Meta:
        model = CalendarSettings
        fields = [
            "team_view_access",
            "edit_others_access",
            "member_edit_past_days",
            "working_weekdays",
            "template_horizon_weeks",
        ]

    def validate_working_weekdays(self, value):
        return sorted(set(value))


class HolidaySerializer(serializers.ModelSerializer):
    date = serializers.DateField(validators=[validate_calendar_date])
    name = serializers.CharField(max_length=255)

    class Meta:
        model = CalendarHoliday
        fields = ["id", "date", "name"]
        read_only_fields = ["id"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name cannot be blank.")
        return value


class CalendarAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarAudit
        fields = [
            "id",
            "subject_user",
            "work_date",
            "entity",
            "action",
            "old_value",
            "new_value",
            "changed_by",
            "created_at",
        ]
        read_only_fields = fields
