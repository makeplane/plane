# Module imports
from rest_framework import serializers
from plane.ee.serializers import BaseSerializer
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    IssuePropertyActivity,
    RelationTypeEnum,
)


class IssuePropertyAPISerializer(BaseSerializer):
    relation_type = serializers.ChoiceField(
        choices=RelationTypeEnum.choices, required=False, allow_null=True
    )

    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "name",
            "logo_props",
            "sort_order",
            "issue_type",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class IssuePropertyOptionAPISerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyOption
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "sort_order",
            "property",
            "logo_props",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class IssuePropertyValueAPISerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyValue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "name",
            "logo_props",
            "sort_order",
            "settings",
            "issue_type",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class IssuePropertyValueAPIDetailSerializer(serializers.Serializer):
    """
    Serializer for aggregated issue property values response.
    This serializer handles the response format from the query_annotator method
    which returns property_id and values (ArrayAgg of property values).
    """
    property_id = serializers.UUIDField(help_text="The ID of the issue property")
    values = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of aggregated property values for the given property"
    )


class IssuePropertyActivityAPISerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyActivity
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
