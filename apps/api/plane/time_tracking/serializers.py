# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import timezone as dt_timezone

# Third party imports
from rest_framework import serializers

# Module imports
from .constants import TIME_ENTRY_MAX_SECONDS
from .models import ProjectTimeSetting, TimeEntry
from .services import TimeTrackingError

# Read


def issue_detail(issue, project):
    """The compact work item shape shown next to an entry (null for project time)."""
    if issue is None or issue.deleted_at is not None:
        return None
    return {
        "id": str(issue.id),
        "sequence_id": issue.sequence_id,
        "name": issue.name,
        "project_identifier": project.identifier,
        "state_group": issue.state.group if issue.state_id and issue.state else None,
        "is_archived": issue.archived_at is not None,
    }


def project_detail(project):
    return {
        "id": str(project.id),
        "name": project.name,
        "identifier": project.identifier,
        "is_archived": project.archived_at is not None,
    }


class TimeEntrySerializer(serializers.ModelSerializer):
    """The TimeEntry read shape. Querysets should use ``select_related("issue", "issue__state", "project")``.

    ``can_edit`` comes from the ``access`` object in the serializer context.
    """

    project_id = serializers.UUIDField(read_only=True)
    issue_id = serializers.UUIDField(read_only=True, allow_null=True)
    user_id = serializers.UUIDField(read_only=True)
    workspace_id = serializers.UUIDField(read_only=True)
    created_by_id = serializers.UUIDField(read_only=True, allow_null=True)
    is_running = serializers.BooleanField(read_only=True)
    # API datetimes are always UTC, whatever the requester's timezone
    started_at = serializers.DateTimeField(read_only=True, default_timezone=dt_timezone.utc)
    ended_at = serializers.DateTimeField(read_only=True, default_timezone=dt_timezone.utc)
    created_at = serializers.DateTimeField(read_only=True, default_timezone=dt_timezone.utc)
    updated_at = serializers.DateTimeField(read_only=True, default_timezone=dt_timezone.utc)
    issue_detail = serializers.SerializerMethodField()
    project_detail = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = TimeEntry
        fields = [
            "id",
            "workspace_id",
            "project_id",
            "issue_id",
            "user_id",
            "spent_on",
            "started_at",
            "ended_at",
            "duration_seconds",
            "description",
            "is_billable",
            "source",
            "auto_stopped",
            "is_running",
            "created_by_id",
            "created_at",
            "updated_at",
            "issue_detail",
            "project_detail",
            "can_edit",
        ]
        read_only_fields = fields

    def get_issue_detail(self, entry):
        return issue_detail(entry.issue, entry.project)

    def get_project_detail(self, entry):
        return project_detail(entry.project)

    def get_can_edit(self, entry):
        access = self.context.get("access")
        return bool(access and access.can_edit(entry))


class ProjectTimeSettingSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = ProjectTimeSetting
        fields = ["project_id", "default_billable"]


# Input (types only; the rules live in services.py)


class _DescriptionField(serializers.CharField):
    def __init__(self, **kwargs):
        super().__init__(required=False, allow_blank=True, allow_null=True, trim_whitespace=True, **kwargs)


class TimerStartSerializer(serializers.Serializer):
    project_id = serializers.UUIDField(required=False, allow_null=True)
    issue_id = serializers.UUIDField(required=False, allow_null=True)
    description = _DescriptionField()
    is_billable = serializers.BooleanField(required=False, allow_null=True)


class TimerStopSerializer(serializers.Serializer):
    description = _DescriptionField()


class TimerUpdateSerializer(TimerStartSerializer):
    started_at = serializers.DateTimeField(required=False)


class TimeEntryCreateSerializer(serializers.Serializer):
    project_id = serializers.UUIDField(required=False, allow_null=True)
    issue_id = serializers.UUIDField(required=False, allow_null=True)
    user_id = serializers.UUIDField(required=False, allow_null=True)
    spent_on = serializers.DateField(required=False, allow_null=True)
    duration_seconds = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    started_at = serializers.DateTimeField(required=False, allow_null=True)
    ended_at = serializers.DateTimeField(required=False, allow_null=True)
    description = _DescriptionField()
    is_billable = serializers.BooleanField(required=False, allow_null=True)


class TimeEntryUpdateSerializer(TimeEntryCreateSerializer):
    confirm = serializers.BooleanField(required=False)


class BulkSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["delete", "set_billable"])
    # the length limit (BULK_LIMIT) is checked in services so it gets its own error code
    ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    is_billable = serializers.BooleanField(required=False, allow_null=True)


def validated(serializer_class, data):
    """Validate input and return only the keys that were sent; raise the API error format otherwise."""
    serializer = serializer_class(data=data)
    if not serializer.is_valid():
        field, messages = next(iter(serializer.errors.items()))
        message = messages[0] if isinstance(messages, list) and messages else str(messages)
        if isinstance(message, dict):
            message = next(iter(message.values()))[0]
        code = "VALIDATION_ERROR"
        if field == "duration_seconds" and "greater than or equal" in str(message):
            code = "DURATION_OUT_OF_RANGE"
        raise TimeTrackingError(code, str(message), field=None if field == "non_field_errors" else field)
    data = dict(serializer.validated_data)
    if data.get("duration_seconds") is not None and data["duration_seconds"] > TIME_ENTRY_MAX_SECONDS * 10:
        # keep absurd values out of the arithmetic; the real range check happens in services
        raise TimeTrackingError("DURATION_OUT_OF_RANGE", "A time entry can be at most 24 hours.", "duration_seconds")
    return data
