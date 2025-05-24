# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import IssueType
from plane.ee.models import IssueProperty, IssuePropertyOption, IssuePropertyActivity
from plane.app.serializers import UserLiteSerializer
from plane.utils.constants import (
    RESTRICTED_ISSUE_PROPERTY_DISPLAY_NAMES,
    RESTRICTED_ISSUE_TYPES,
)


class IssueTypeSerializer(BaseSerializer):
    issue_exists = serializers.BooleanField(read_only=True)
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class Meta:
        model = IssueType
        fields = "__all__"
        read_only_fields = ["workspace", "project", "is_default", "deleted_at"]

    def validate_name(self, value):
        if value in RESTRICTED_ISSUE_TYPES:
            raise serializers.ValidationError(f"Issue type cannot be the {value}")
        return value


class IssuePropertySerializer(BaseSerializer):
    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = ["name", "issue_type", "workspace", "deleted_at"]

    def validate_display_name(self, value):
        if value in RESTRICTED_ISSUE_PROPERTY_DISPLAY_NAMES:
            raise serializers.ValidationError(f"Display name cannot be the {value}")
        return value


class IssuePropertyOptionSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyOption
        fields = "__all__"
        read_only_fields = ["property", "workspace", "deleted_at"]


class IssuePropertyActivitySerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = IssuePropertyActivity
        fields = "__all__"
        read_only_fields = ["workspace", "project", "issue", "deleted_at"]
