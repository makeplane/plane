# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, timedelta

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import IssueWorkLog

# Max 24 hours in a single worklog entry
MAX_DURATION_MINUTES = 1440
# Max days into the future for logged_at
MAX_FUTURE_DAYS = 7


class IssueWorkLogSerializer(BaseSerializer):
    logged_by_detail = serializers.SerializerMethodField()

    class Meta:
        model = IssueWorkLog
        fields = [
            "id",
            "issue",
            "logged_by",
            "duration_minutes",
            "description",
            "logged_at",
            "created_at",
            "updated_at",
            "logged_by_detail",
        ]
        read_only_fields = [
            "id",
            "issue",
            "logged_by",
            "workspace",
            "project",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duration must be greater than 0.")
        if value > MAX_DURATION_MINUTES:
            raise serializers.ValidationError(
                f"Duration cannot exceed {MAX_DURATION_MINUTES} minutes (24 hours)."
            )
        return value

    def validate_logged_at(self, value):
        max_future = date.today() + timedelta(days=MAX_FUTURE_DAYS)
        if value > max_future:
            raise serializers.ValidationError(
                f"Date cannot be more than {MAX_FUTURE_DAYS} days in the future."
            )
        return value

    def get_logged_by_detail(self, obj):
        if obj.logged_by:
            return {
                "id": str(obj.logged_by.id),
                "display_name": obj.logged_by.display_name,
                "avatar_url": obj.logged_by.avatar or "",
            }
        return None


class TimesheetBulkEntrySerializer(serializers.Serializer):
    """Validates a single entry in a bulk timesheet update payload."""

    issue_id = serializers.UUIDField()
    logged_at = serializers.DateField()
    duration_minutes = serializers.IntegerField(min_value=0, max_value=MAX_DURATION_MINUTES)

    def validate_logged_at(self, value):
        max_future = date.today() + timedelta(days=MAX_FUTURE_DAYS)
        if value > max_future:
            raise serializers.ValidationError(
                f"Date cannot be more than {MAX_FUTURE_DAYS} days in the future."
            )
        return value
