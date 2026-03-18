# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, timedelta

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import IssueWorkLog

# Max 12 hours in a single worklog entry (also daily aggregate max)
MAX_DURATION_MINUTES = 720


def get_min_allowed_date(working_days=60):
    """Calculate date that is N working days ago (Mon-Fri only)."""
    current = date.today()
    days_counted = 0
    while days_counted < working_days:
        current -= timedelta(days=1)
        if current.weekday() < 5:  # Mon=0..Fri=4
            days_counted += 1
    return current


class IssueWorkLogSerializer(BaseSerializer):
    logged_by_detail = serializers.SerializerMethodField()
    issue_detail = serializers.SerializerMethodField()
    project_detail = serializers.SerializerMethodField()

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
            "issue_detail",
            "project_detail",
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
                f"Duration cannot exceed {MAX_DURATION_MINUTES} minutes (12 hours)."
            )
        return value

    def validate_logged_at(self, value):
        if value > date.today():
            raise serializers.ValidationError(
                "Cannot log time for future dates."
            )
        min_date = get_min_allowed_date()
        if value < min_date:
            raise serializers.ValidationError(
                "Cannot log time more than 60 working days ago."
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

    def get_issue_detail(self, obj):
        if obj.issue:
            return {
                "id": str(obj.issue.id),
                "name": obj.issue.name,
                "sequence_id": obj.issue.sequence_id,
                "identifier": f"{obj.project.identifier}-{obj.issue.sequence_id}" if obj.project else "",
            }
        return None

    def get_project_detail(self, obj):
        if obj.project:
            return {
                "id": str(obj.project.id),
                "name": obj.project.name,
                "identifier": obj.project.identifier,
            }
        return None


class TimesheetBulkEntrySerializer(serializers.Serializer):
    """Validates a single entry in a bulk timesheet update payload."""

    issue_id = serializers.UUIDField()
    logged_at = serializers.DateField()
    # min_value=0 intentional: zero duration triggers delete in bulk upsert
    duration_minutes = serializers.IntegerField(min_value=0, max_value=MAX_DURATION_MINUTES)

    def validate_logged_at(self, value):
        if value > date.today():
            raise serializers.ValidationError(
                "Cannot log time for future dates."
            )
        min_date = get_min_allowed_date()
        if value < min_date:
            raise serializers.ValidationError(
                "Cannot log time more than 60 working days ago."
            )
        return value
