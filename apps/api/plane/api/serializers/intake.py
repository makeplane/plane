# Module improts
from .base import BaseSerializer
from .issue import IssueExpandSerializer
from plane.db.models import IntakeIssue, Issue
from rest_framework import serializers


class IssueForIntakeSerializer(BaseSerializer):
    """
    Serializer for work item data within intake submissions.

    Handles essential work item fields for intake processing including
    content validation and priority assignment for triage workflows.
    """

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
    """
    Serializer for creating intake work items with embedded issue data.

    Manages intake work item creation including nested issue creation,
    status assignment, and source tracking for issue queue management.
    """

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
    """
    Comprehensive serializer for intake work items with expanded issue details.

    Provides full intake work item data including embedded issue information,
    status tracking, and triage metadata for issue queue management.
    """

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
    """
    Serializer for updating intake work items and their associated issues.

    Handles intake work item modifications including status changes, triage decisions,
    and embedded issue updates for issue queue processing workflows.
    """

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
    """
    Serializer for nested work item data in intake request payloads.

    Validates core work item fields within intake requests including
    content formatting, priority levels, and metadata for issue creation.
    """

    name = serializers.CharField(max_length=255, help_text="Issue name")
    description_html = serializers.CharField(
        required=False, allow_null=True, help_text="Issue description HTML"
    )
    priority = serializers.ChoiceField(
        choices=Issue.PRIORITY_CHOICES, default="none", help_text="Issue priority"
    )
