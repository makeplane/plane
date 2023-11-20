# Module improts
from .base import BaseSerializer
from plane.db.models import InboxIssue

class InboxIssueSerializer(BaseSerializer):

    class Meta:
        model = InboxIssue
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
        ]