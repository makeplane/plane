from .base import BaseSerializer
from plane.db.models import IssueProperty, IssuePropertyValue


class IssuePropertySerializer(BaseSerializer):
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
