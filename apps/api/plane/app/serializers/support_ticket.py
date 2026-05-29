# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import SupportTicket


class SupportTicketSerializer(BaseSerializer):
    # Read-only fields from the linked Issue
    ticket_display = serializers.CharField(read_only=True)
    issue_name = serializers.CharField(source="issue.name", read_only=True)
    issue_description_html = serializers.CharField(
        source="issue.description_html", read_only=True
    )
    issue_description_stripped = serializers.CharField(
        source="issue.description_stripped", read_only=True
    )
    issue_priority = serializers.CharField(source="issue.priority", read_only=True)
    issue_state_id = serializers.UUIDField(source="issue.state_id", read_only=True)
    issue_state_name = serializers.CharField(
        source="issue.state.name", read_only=True
    )
    issue_state_group = serializers.CharField(
        source="issue.state.group", read_only=True
    )
    issue_state_color = serializers.CharField(
        source="issue.state.color", read_only=True
    )
    issue_start_date = serializers.DateField(
        source="issue.start_date", read_only=True
    )
    issue_target_date = serializers.DateField(
        source="issue.target_date", read_only=True
    )
    # Assignee IDs will be annotated on the queryset
    assignee_ids = serializers.ListField(
        child=serializers.UUIDField(), read_only=True
    )

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "ticket_number",
            "ticket_display",
            "issue_id",
            "issue_name",
            "issue_description_html",
            "issue_description_stripped",
            "issue_priority",
            "issue_state_id",
            "issue_state_name",
            "issue_state_group",
            "issue_state_color",
            "issue_start_date",
            "issue_target_date",
            "assignee_ids",
            "source",
            "source_email",
            "email_subject",
            "project_id",
            "workspace_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "ticket_number",
            "workspace_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class SupportTicketCreateSerializer(BaseSerializer):
    """Serializer for creating support tickets - accepts issue fields inline."""

    # Issue fields for creation
    title = serializers.CharField(max_length=255, write_only=True)
    description_html = serializers.CharField(
        required=False, default="<p></p>", write_only=True
    )
    priority = serializers.ChoiceField(
        choices=["urgent", "high", "medium", "low", "none"],
        default="none",
        write_only=True,
    )
    state_id = serializers.UUIDField(required=False, write_only=True)
    assignee_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
        write_only=True,
    )

    class Meta:
        model = SupportTicket
        fields = [
            "title",
            "description_html",
            "priority",
            "state_id",
            "assignee_ids",
            "source",
            "source_email",
            "email_subject",
            "email_body_html",
        ]
