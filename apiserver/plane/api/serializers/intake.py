# Module improts
from .base import BaseSerializer
from .issue import IssueExpandSerializer
from plane.db.models import IntakeIssue
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
