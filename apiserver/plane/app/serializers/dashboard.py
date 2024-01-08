# Module imports
from .base import BaseSerializer

from plane.db.models import Issue, Dashboard, Widget
from plane.app.serializers import (
    IssueRelationSerializer,
)

# Third party frameworks
from rest_framework import serializers


class DashboardSerializer(BaseSerializer):
    class Meta:
        model = Dashboard
        fields = "__all__"

class DashBoardIssueSerializer(BaseSerializer):
    
    related_issues = IssueRelationSerializer(read_only=True, source="issue_relation", many=True)

    class Meta:
        model = Issue
        fields = [
            "id",
            "name",
            "priority",
            "project",
            "workspace",
            "target_date",
            "sequence_id",
            "state",
            "assignees",
            "related_issues",
        ]


class WidgetSerializer(BaseSerializer):
    is_visible = serializers.BooleanField(read_only=True)

    class Meta:
        model = Widget
        fields = [
            "id",
            "key",
            "is_visible",
        ]