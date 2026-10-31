# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Issue, ProjectMember
from plane.team_ops.models import ActiveTimer, TimeEntry, MAX_ENTRY_SECONDS

# Clock drift between a client and the server that we tolerate for "now".
FUTURE_SKEW = timedelta(minutes=5)


def resolve_issue(workspace, user, issue_id):
    """Return the work item a user may log time against, or raise a validation error.

    Time can only be logged on a work item of this workspace, in a project the
    user is an active member of.
    """
    issue = (
        Issue.issue_objects.filter(pk=issue_id, workspace=workspace).select_related("project").first()
        if issue_id
        else None
    )
    if (
        issue is None
        or not ProjectMember.objects.filter(project_id=issue.project_id, member=user, is_active=True).exists()
    ):
        # The same answer for "does not exist" and "not yours" so ids cannot be probed.
        raise serializers.ValidationError({"issue": "Work item not found."})
    return issue


class UserLiteSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    display_name = serializers.CharField()
    avatar_url = serializers.CharField(allow_null=True)


class IssueLiteSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    sequence_id = serializers.IntegerField()
    project_id = serializers.UUIDField()
    project_identifier = serializers.CharField(source="project.identifier")


class TimeEntrySerializer(serializers.ModelSerializer):
    """Read shape of a time entry."""

    user_detail = UserLiteSerializer(source="user", read_only=True)
    issue_detail = IssueLiteSerializer(source="issue", read_only=True)

    class Meta:
        model = TimeEntry
        fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "issue_detail",
            "user",
            "user_detail",
            "started_at",
            "ended_at",
            "duration_seconds",
            "note",
            "source",
            "is_billable",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class TimeEntryWriteSerializer(serializers.Serializer):
    """Create/update payload.

    A client sends `started_at` plus either `ended_at` or `duration_seconds`; the
    other value is derived. `workspace`, `project` and `user` always come from the
    URL, the work item and the session, never from the payload.
    """

    issue = serializers.UUIDField(required=False, allow_null=True)
    started_at = serializers.DateTimeField(required=False)
    ended_at = serializers.DateTimeField(required=False)
    duration_seconds = serializers.IntegerField(required=False, min_value=0, max_value=MAX_ENTRY_SECONDS)
    note = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    is_billable = serializers.BooleanField(required=False)

    def validate(self, attrs):
        instance = self.instance
        started_at = attrs.get("started_at", instance.started_at if instance else None)
        if started_at is None:
            raise serializers.ValidationError({"started_at": "This field is required."})

        ended_at = attrs.get("ended_at")
        duration = attrs.get("duration_seconds")

        if ended_at is not None and duration is not None:
            raise serializers.ValidationError("Provide either ended_at or duration_seconds, not both.")

        if ended_at is None and duration is None:
            if instance is None:
                raise serializers.ValidationError("Provide ended_at or duration_seconds.")
            # Update that moved only started_at (or neither): keep the duration.
            duration = instance.duration_seconds

        if ended_at is None:
            ended_at = started_at + timedelta(seconds=duration)
        else:
            if ended_at < started_at:
                raise serializers.ValidationError({"ended_at": "ended_at must not be before started_at."})
            duration = int((ended_at - started_at).total_seconds())

        if duration > MAX_ENTRY_SECONDS:
            raise serializers.ValidationError("A single entry cannot be longer than 24 hours.")
        if ended_at > timezone.now() + FUTURE_SKEW:
            raise serializers.ValidationError("Time cannot be logged in the future.")

        attrs["started_at"] = started_at
        attrs["ended_at"] = ended_at
        attrs["duration_seconds"] = duration
        return attrs


class ActiveTimerSerializer(serializers.ModelSerializer):
    issue_detail = IssueLiteSerializer(source="issue", read_only=True)
    elapsed_seconds = serializers.SerializerMethodField()

    class Meta:
        model = ActiveTimer
        fields = ["id", "workspace", "issue", "issue_detail", "started_at", "note", "elapsed_seconds"]
        read_only_fields = fields

    def get_elapsed_seconds(self, obj):
        return max(0, int((timezone.now() - obj.started_at).total_seconds()))


class TimerStartSerializer(serializers.Serializer):
    issue = serializers.UUIDField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True, max_length=5000)
