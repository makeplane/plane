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
        choices=RelationTypeEnum.choices, required=False
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
