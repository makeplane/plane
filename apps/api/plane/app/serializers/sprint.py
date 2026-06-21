# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers
from django.utils import timezone

# Module imports
from .base import BaseSerializer
from .issue import IssueStateSerializer
from .user import UserLiteSerializer
from plane.db.models import WorkspaceSprint, WorkspaceSprintAutomation, WorkspaceSprintAutomationMember, WorkspaceSprintIssue


class WorkspaceSprintWriteSerializer(BaseSerializer):
    automation_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("end_date", None) is not None
            and data.get("start_date", None) > data.get("end_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed end date")
        return data

    def create(self, validated_data):
        automation_id = validated_data.pop("automation_id", None)
        if automation_id:
            validated_data["automation_id"] = automation_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        automation_id = validated_data.pop("automation_id", None)
        if automation_id:
            validated_data["automation_id"] = automation_id
        return super().update(instance, validated_data)

    class Meta:
        model = WorkspaceSprint
        fields = "__all__"
        read_only_fields = ["workspace", "project", "owned_by", "archived_at", "source", "sequence_id"]


class WorkspaceSprintSerializer(BaseSerializer):
    total_issues = serializers.IntegerField(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceSprint
        fields = [
            "id",
            "workspace_id",
            "automation_id",
            "name",
            "description",
            "start_date",
            "end_date",
            "owned_by_id",
            "sort_order",
            "archived_at",
            "source",
            "sequence_id",
            "logo_props",
            "timezone",
            "version",
            "total_issues",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_status(self, obj):
        if obj.archived_at:
            return "archived"
        if not obj.start_date or not obj.end_date:
            return "draft"
        now = timezone.now()
        if obj.start_date <= now <= obj.end_date:
            return "current"
        if obj.start_date > now:
            return "upcoming"
        return "past"


class WorkspaceSprintAutomationWriteSerializer(BaseSerializer):
    def validate(self, data):
        sprint_duration_days = data.get("sprint_duration_days", getattr(self.instance, "sprint_duration_days", None))
        name_template = data.get("name_template", getattr(self.instance, "name_template", None))

        if sprint_duration_days is not None and sprint_duration_days <= 0:
            raise serializers.ValidationError("Sprint duration must be positive")
        if not name_template:
            raise serializers.ValidationError("Name template is required")
        return data

    class Meta:
        model = WorkspaceSprintAutomation
        fields = "__all__"
        read_only_fields = ["workspace", "project", "next_sequence"]


class WorkspaceSprintAutomationSerializer(BaseSerializer):
    active_sprints_count = serializers.SerializerMethodField()
    member_ids = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceSprintAutomation
        fields = [
            "id",
            "workspace_id",
            "name",
            "description",
            "enabled",
            "access",
            "start_date",
            "sprint_duration_days",
            "timezone",
            "name_template",
            "next_sequence",
            "auto_create_next",
            "logo_props",
            "archived_at",
            "sort_order",
            "member_ids",
            "active_sprints_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_active_sprints_count(self, obj):
        if hasattr(obj, "active_sprints_count"):
            return obj.active_sprints_count
        return obj.sprints.filter(archived_at__isnull=True, deleted_at__isnull=True).count()

    def get_member_ids(self, obj):
        return list(
            obj.automation_members.filter(deleted_at__isnull=True).values_list("member_id", flat=True)
        )


class WorkspaceSprintAutomationMemberSerializer(BaseSerializer):
    member_detail = UserLiteSerializer(source="member", read_only=True)

    class Meta:
        model = WorkspaceSprintAutomationMember
        fields = ["id", "automation_id", "member", "member_detail", "created_at", "updated_at"]
        read_only_fields = fields


# Canonical squad names with backwards-compatible automation aliases above.
WorkspaceSprintSquadWriteSerializer = WorkspaceSprintAutomationWriteSerializer
WorkspaceSprintSquadSerializer = WorkspaceSprintAutomationSerializer
WorkspaceSprintSquadMemberSerializer = WorkspaceSprintAutomationMemberSerializer


class WorkspaceSprintIssueSerializer(BaseSerializer):
    issue_detail = IssueStateSerializer(read_only=True, source="issue")

    class Meta:
        model = WorkspaceSprintIssue
        fields = "__all__"
        read_only_fields = ["workspace", "project", "sprint"]
