# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import IssueProperty, IssuePropertyValue


class IssuePropertySerializer(BaseSerializer):
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        children = obj.children.all().prefetch_related("children")
        if children:
            serializer = IssuePropertySerializer(children, many=True)
            return serializer.data
        return None

    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = [
            "workspace",
        ]


class IssuePropertyValueSerializer(BaseSerializer):
    property_values = IssuePropertySerializer(read_only=True, many=True)

    class Meta:
        model = IssuePropertyValue
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "issue",
            "issue_property",
        ]


class IssuePropertyValueReadSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyValue
        fields = ["values", "values_uuid"]
        read_only_fields = fields


class IssuePropertyReadSerializer(BaseSerializer):
    children = serializers.SerializerMethodField()
    prop_value = serializers.SerializerMethodField()

    class Meta:
        model = IssueProperty
        fields = [
            "name",
            "type",
            "children",
            "prop_value",
            "id",
        ]
        read_only = fields

    def get_children(self, obj):
        children = obj.children.all().prefetch_related("children")
        if children:
            serializer = IssuePropertyReadSerializer(children, many=True)
            return serializer.data
        return None

    def get_prop_value(self, obj):
        prop_values = obj.property_values.all()
        if prop_values:
            serializer = IssuePropertyValueReadSerializer(prop_values, many=True)
            return serializer.data
        return None
