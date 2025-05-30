# Module improts
from .base import BaseSerializer
from .issue import IssueExpandSerializer
from plane.db.models import IntakeIssue, Issue
from rest_framework import serializers


class IssueForIntakeSerializer(BaseSerializer):
    """Serializer for intake issues"""

    class Meta:
        model = Issue
        fields = [
            "name",
            "description",
            "description_html",
            "priority",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IntakeIssueCreateSerializer(BaseSerializer):
    """Serializer for creating intake issues"""

    issue = IssueForIntakeSerializer(help_text="Issue data for the intake issue")

    class Meta:
        model = IntakeIssue
        fields = [
            "issue",
            "intake",
            "status",
            "snoozed_till",
            "duplicate_to",
            "source",
            "source_email",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IntakeIssueSerializer(BaseSerializer):
    issue_detail = IssueExpandSerializer(read_only=True, source="issue")
    inbox = serializers.UUIDField(source="intake.id", read_only=True)

    class Meta:
        model = IntakeIssue
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IntakeIssueUpdateSerializer(BaseSerializer):
    """Serializer for updating intake issues"""

    issue = IssueForIntakeSerializer(
        required=False, help_text="Issue data to update in the intake issue"
    )

    class Meta:
        model = IntakeIssue
        fields = [
            "status",
            "snoozed_till",
            "duplicate_to",
            "source",
            "source_email",
            "issue",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueDataSerializer(serializers.Serializer):
    """Serializer for nested issue data in intake requests"""

    name = serializers.CharField(max_length=255, help_text="Issue name")
    description_html = serializers.CharField(
        required=False, allow_null=True, help_text="Issue description HTML"
    )
    priority = serializers.ChoiceField(
        choices=Issue.PRIORITY_CHOICES, default="none", help_text="Issue priority"
    )
