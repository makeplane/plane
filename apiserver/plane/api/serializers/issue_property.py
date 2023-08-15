from .base import BaseSerializer
from plane.db.models import IssueProperty, IssuePropertyAttribute, IssuePropertyValue


class IssuePropertySerializer(BaseSerializer):
    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = [
            "workspace",
        ]


class IssuePropertyAttributeSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyAttribute
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "issue_property"
        ]


class IssuePropertyValueSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyValue
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "issue",
        ]
