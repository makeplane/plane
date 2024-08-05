# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import IssueType
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyActivity,
)


class IssueTypeSerializer(BaseSerializer):
    issue_exists = serializers.BooleanField(read_only=True)

    class Meta:
        model = IssueType
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "is_default",
        ]


class IssuePropertySerializer(BaseSerializer):

    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = [
            "name",
            "issue_type",
            "workspace",
            "project",
        ]


class IssuePropertyOptionSerializer(BaseSerializer):

    class Meta:
        model = IssuePropertyOption
        fields = "__all__"
        read_only_fields = [
            "property",
            "workspace",
            "project",
        ]


class IssuePropertyActivitySerializer(BaseSerializer):

    class Meta:
        model = IssuePropertyActivity
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "issue",
        ]
