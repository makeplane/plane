# Third party imports
import html
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

    # Reporter
    reporter_display = serializers.SerializerMethodField(read_only=True)

    def get_reporter_display(self, obj):
        """Return reporter info, preferring reporter_user over reporter_email."""
        if obj.reporter_user:
            return {
                "type": "user",
                "id": str(obj.reporter_user.id),
                "display_name": obj.reporter_user.display_name,
                "avatar_url": getattr(obj.reporter_user, "avatar_url", None) or "",
                "fallback_email_local": obj.reporter_email or "",
            }
        elif obj.reporter_email:
            # Escape for XSS safety — always render as plain text
            return {
                "type": "email",
                "value": html.escape(str(obj.reporter_email)),
            }
        return None

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
            "start_date",
            "due_date",
            "assignee_ids",
            "reporter_user",
            "reporter_email",
            "reporter_display",
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
    start_date = serializers.DateField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)

    # Reporter fields for creation
    reporter_user_id = serializers.UUIDField(required=False, allow_null=True)
    reporter_email = serializers.CharField(required=False, allow_null=True, max_length=512)

    def validate(self, data):
        start_date = data.get("start_date")
        due_date = data.get("due_date")
        if start_date and due_date and due_date < start_date:
            raise serializers.ValidationError({"non_field_errors": ["Due Date cannot be before Start Date."]})
        return data

    class Meta:
        model = SupportTicket
        fields = [
            "title",
            "description_html",
            "priority",
            "state_id",
            "assignee_ids",
            "start_date",
            "due_date",
            "source",
            "source_email",
            "email_subject",
            "email_body_html",
            "reporter_user_id",
            "reporter_email",
        ]
