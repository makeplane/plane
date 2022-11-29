# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from .issue import IssueStateSerializer
from plane.db.models import Cycle, CycleIssue


class CycleSerializer(BaseSerializer):

    owned_by = UserLiteSerializer(read_only=True)

    class Meta:
        model = Cycle
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "owned_by",
        ]


class CycleIssueSerializer(BaseSerializer):

    issue_details = IssueStateSerializer(read_only=True, source="issue")

    class Meta:
        model = CycleIssue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "cycle",
        ]
