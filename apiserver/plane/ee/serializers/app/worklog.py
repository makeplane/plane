# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.ee.models import IssueWorkLog
from plane.ee.serializers import IssueLiteSerializer


class IssueWorkLogSerializer(BaseSerializer):
    issue_detail = IssueLiteSerializer(read_only=True, source="issue")

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
            "issue_detail",
        ]
        read_only_fields = ["logged_by", "issue", "workspace", "project"]
