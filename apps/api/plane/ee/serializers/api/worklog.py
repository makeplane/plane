# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.ee.models import IssueWorkLog

# Third party imports
from rest_framework import serializers


class IssueWorkLogAPISerializer(BaseSerializer):
    class Meta:
        model = IssueWorkLog
        fields = [
            "id",
            "created_at",
            "updated_at",
            "description",
            "duration",
            "created_by",
            "updated_by",
            "project_id",
            "workspace_id",
            "logged_by",
        ]
        read_only_fields = ["logged_by", "workspace", "project"]

    def validate(self, data):
        if data.get("duration", None) is not None and data.get("duration") < 0:
            raise serializers.ValidationError("Duration cannot be negative")
        return data


class ProjectWorklogSummarySerializer(serializers.Serializer):
    """Serializer for project worklog summary with aggregated duration per issue"""

    issue_id = serializers.UUIDField(help_text="ID of the work item")
    duration = serializers.IntegerField(
        help_text="Total duration logged for this work item in seconds"
    )
