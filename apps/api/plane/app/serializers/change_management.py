# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import (
    ChangeRequest,
    ChangeApproval,
    ChangeTask,
    ChangeActivity,
    AssignmentGroup,
    AssignmentGroupMember,
    CabGroup,
    CabGroupMember,
)


class AssignmentGroupMemberSerializer(BaseSerializer):
    """Serializer for AssignmentGroupMember."""

    member_email = serializers.CharField(source="member.email", read_only=True)
    member_name = serializers.CharField(source="member.display_name", read_only=True)

    class Meta:
        model = AssignmentGroupMember
        fields = ["id", "assignment_group", "member", "member_email", "member_name", "created_at", "updated_at"]
        read_only_fields = ["assignment_group"]


class AssignmentGroupSerializer(BaseSerializer):
    """Serializer for AssignmentGroup."""

    members = AssignmentGroupMemberSerializer(source="group_members", many=True, read_only=True)

    class Meta:
        model = AssignmentGroup
        fields = ["id", "workspace", "name", "description", "is_active", "members", "created_at", "updated_at"]
        read_only_fields = ["workspace"]


class CabGroupMemberSerializer(BaseSerializer):
    """Serializer for CabGroupMember."""

    member_email = serializers.CharField(source="member.email", read_only=True)
    member_name = serializers.CharField(source="member.display_name", read_only=True)

    class Meta:
        model = CabGroupMember
        fields = ["id", "cab_group", "member", "member_email", "member_name", "created_at", "updated_at"]
        read_only_fields = ["cab_group"]


class CabGroupSerializer(BaseSerializer):
    """Serializer for CabGroup."""

    members = CabGroupMemberSerializer(source="group_members", many=True, read_only=True)

    class Meta:
        model = CabGroup
        fields = ["id", "workspace", "name", "description", "is_active", "members", "created_at", "updated_at"]
        read_only_fields = ["workspace"]


class ChangeRequestSerializer(BaseSerializer):
    """Read serializer for ChangeRequest."""

    requested_by_display = serializers.SerializerMethodField()
    assignment_group_display = serializers.SerializerMethodField()

    class Meta:
        model = ChangeRequest
        fields = [
            "id",
            "sequence_number",
            "number",
            "type",
            "state",
            "priority",
            "risk",
            "impact",
            "category",
            "short_description",
            "description_html",
            "service",
            "configuration_item",
            "conflict_status",
            "conflict_last_run",
            "requested_by",
            "requested_by_display",
            "assignment_group",
            "assignment_group_display",
            "justification",
            "implementation_plan",
            "risk_and_impact_analysis",
            "backout_plan",
            "test_plan",
            "planned_start_date",
            "planned_end_date",
            "actual_start_date",
            "actual_end_date",
            "cab_required",
            "cab_date",
            "cab_delegate",
            "cab_recommendation",
            "close_code",
            "close_notes",
            "on_hold",
            "on_hold_reason",
            "project_id",
            "workspace_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "sequence_number",
            "number",
            "workspace_id",
            "project_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def get_requested_by_display(self, obj):
        if obj.requested_by:
            return obj.requested_by.display_name or obj.requested_by.email
        return None

    def get_assignment_group_display(self, obj):
        if obj.assignment_group:
            return obj.assignment_group.name
        return None


class ChangeRequestCreateSerializer(BaseSerializer):
    """Write serializer for creating a ChangeRequest.

    Enforces ServiceNow-style intake: all planning data must be present
    before a change record is created.
    """

    class Meta:
        model = ChangeRequest
        fields = [
            "type",
            "priority",
            "risk",
            "impact",
            "category",
            "short_description",
            "description_html",
            "service",
            "configuration_item",
            "assignment_group",
            "justification",
            "implementation_plan",
            "risk_and_impact_analysis",
            "backout_plan",
            "test_plan",
            "planned_start_date",
            "planned_end_date",
            "cab_required",
            "cab_date",
        ]

    # Fields required for a full change request submission
    REQUIRED_PLANNING_FIELDS = [
        ("short_description", "Short Description"),
        ("description_html", "Description"),
        ("category", "Category"),
        ("justification", "Justification"),
        ("implementation_plan", "Implementation Plan"),
        ("risk_and_impact_analysis", "Risk and Impact Analysis"),
        ("backout_plan", "Rollback Plan"),
        ("planned_start_date", "Planned Start Date"),
        ("planned_end_date", "Planned End Date"),
    ]

    def validate(self, data):
        errors = {}

        # Validate all required planning fields are non-empty
        for field_name, label in self.REQUIRED_PLANNING_FIELDS:
            value = data.get(field_name)
            if value is None or (isinstance(value, str) and not value.strip()):
                errors[field_name] = f"{label} is required."
            # Check for placeholder HTML like "<p></p>"
            if field_name == "description_html" and value:
                import re
                stripped = re.sub(r"<[^>]*>", "", value).strip()
                if not stripped:
                    errors[field_name] = f"{label} is required (cannot be empty)."

        # Validate dates are in correct order
        start = data.get("planned_start_date")
        end = data.get("planned_end_date")
        if start and end and start >= end:
            errors["planned_end_date"] = "Planned End Date must be after Planned Start Date."

        if errors:
            raise serializers.ValidationError(errors)

        return data


class ChangeApprovalSerializer(BaseSerializer):
    """Serializer for ChangeApproval."""

    approver_display = serializers.SerializerMethodField()

    class Meta:
        model = ChangeApproval
        fields = [
            "id",
            "change_request_id",
            "approver",
            "approver_display",
            "approval_level",
            "status",
            "comments",
            "decided_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "change_request_id",
            "approver",
            "approval_level",
            "created_at",
        ]

    def get_approver_display(self, obj):
        if obj.approver:
            return obj.approver.display_name or obj.approver.email
        return None


class ChangeTaskSerializer(BaseSerializer):
    """Serializer for ChangeTask."""

    assignment_group_display = serializers.SerializerMethodField()

    class Meta:
        model = ChangeTask
        fields = [
            "id",
            "change_request_id",
            "short_description",
            "task_type",
            "state",
            "assignment_group",
            "assignment_group_display",
            "description",
            "due_date",
            "order",
            "closed_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "change_request_id",
            "closed_at",
            "created_at",
        ]

    def get_assignment_group_display(self, obj):
        if obj.assignment_group:
            return obj.assignment_group.name
        return None


class ChangeActivitySerializer(BaseSerializer):
    """Read-only serializer for ChangeActivity."""

    actor_display = serializers.SerializerMethodField()

    class Meta:
        model = ChangeActivity
        fields = [
            "id",
            "change_request_id",
            "actor",
            "actor_display",
            "verb",
            "field",
            "old_value",
            "new_value",
            "comment",
            "created_at",
        ]
        read_only_fields = fields

    def get_actor_display(self, obj):
        if obj.actor:
            return obj.actor.display_name or obj.actor.email
        return None
