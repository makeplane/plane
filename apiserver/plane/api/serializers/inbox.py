# Module improts
from .base import BaseSerializer
from .issue import IssueExpandSerializer
from plane.db.models import InboxIssue


class InboxIssueSerializer(BaseSerializer):

    issue_detail = IssueExpandSerializer(read_only=True, source="issue")

    class Meta:
        model = InboxIssue
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
