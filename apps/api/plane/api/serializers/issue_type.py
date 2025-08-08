# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import IssueType, ProjectIssueType


class IssueTypeAPISerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class Meta:
        model = IssueType
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "logo_props",
            "is_default",
            "level",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class ProjectIssueTypeAPISerializer(BaseSerializer):
    class Meta:
        model = ProjectIssueType
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "level",
            "is_default",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
