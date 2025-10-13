# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import IssueType, ProjectIssueType, IssueTypeProperty, IssuePropertyValue


class IssueTypeSerializer(BaseSerializer):
    class Meta:
        model = IssueType
        fields = [
            "id",
            "name",
            "description",
            "logo_props",
            "is_epic",
            "is_default",
            "is_active",
            "level",
            "external_source",
            "external_id",
            "workspace",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace", "created_at", "updated_at"]


class ProjectIssueTypeSerializer(BaseSerializer):
    issue_type = IssueTypeSerializer(read_only=True)
    issue_type_id = serializers.PrimaryKeyRelatedField(
        source="issue_type",
        queryset=IssueType.objects.all(),
        write_only=True
    )

    class Meta:
        model = ProjectIssueType
        fields = [
            "id",
            "issue_type",
            "issue_type_id",
            "level",
            "is_default",
            "project",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["project", "created_at", "updated_at"]


class IssueTypePropertySerializer(BaseSerializer):
    class Meta:
        model = IssueTypeProperty
        fields = [
            "id",
            "issue_type",
            "display_name",
            "property_type",
            "relation_type",
            "is_multi",
            "is_active",
            "is_required",
            "logo_props",
            "default_value",
            "settings",
            "options",
            "sort_order",
            "project",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["project", "created_at", "updated_at"]


class IssueTypeWithPropertySerializer(BaseSerializer):
    properties = IssueTypePropertySerializer(many=True, read_only=True)

    class Meta:
        model = IssueType
        fields = [
            "id",
            "name",
            "description",
            "logo_props",
            "is_epic",
            "is_default",
            "is_active",
            "level",
            "external_source",
            "external_id",
            "workspace",
            "created_at",
            "updated_at",
            "properties"
        ]
        read_only_fields = ["workspace", "created_at", "updated_at"]


class IssuePropertyValueSerializer(BaseSerializer):
    property = IssueTypePropertySerializer(read_only=True)
    property_id = serializers.PrimaryKeyRelatedField(
        source="property",
        queryset=IssueTypeProperty.objects.all(),
        write_only=True
    )

    class Meta:
        model = IssuePropertyValue
        fields = [
            "id",
            "issue",
            "property",
            "property_id",
            "value",
            "project",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["project", "created_at", "updated_at"]


class IssuePropertyValueBulkSerializer(serializers.Serializer):
    """批量更新Issue属性值的序列化器"""
    property_values = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField()),
        help_text="格式: {property_id: [value1, value2, ...]}"
    )



