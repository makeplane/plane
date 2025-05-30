# Module improts
from .base import BaseSerializer
from .issue import IssueExpandSerializer
from plane.db.models import IntakeIssue, Issue
from rest_framework import serializers


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


class IssueDataSerializer(serializers.Serializer):
    """Serializer for nested issue data in intake requests"""
    name = serializers.CharField(
        max_length=255,
        help_text="Issue name"
    )
    description_html = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="Issue description HTML"
    )
    priority = serializers.ChoiceField(
        choices=Issue.PRIORITY_CHOICES,
        default="none",
        help_text="Issue priority"
    )


class CreateIntakeIssueRequestSerializer(serializers.Serializer):
    """Serializer for creating intake issues"""
    issue = IssueDataSerializer(help_text="Issue data for the intake issue")


class UpdateIntakeIssueRequestSerializer(serializers.Serializer):
    """Serializer for updating intake issues"""
    issue = IssueDataSerializer(
        required=False,
        help_text="Issue data to update in the intake issue"
    )
