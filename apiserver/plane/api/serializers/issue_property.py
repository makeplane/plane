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
    class Meta:
        model = IssuePropertyValue
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "issue",
            "issue_property",
        ]
