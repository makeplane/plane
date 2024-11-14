from rest_framework import serializers

from plane.db.models import IssueType, IssueTypeCustomProperty

from .base import BaseSerializer

class IssueTypeSerializer(BaseSerializer):
    def validate(self, data):
        data['workspace_id'] = self.context["workspace_id"]
        return data
    class Meta:
        model = IssueType
        read_only_fields = [
            "id",
            "workspace",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        exclude = [
            "created_by",
            "updated_by",
        ]

class IssueTypeCustomPropertySerializer(BaseSerializer):
    class Meta:
        model = IssueTypeCustomProperty
        fields = "__all__"
        read_only_fields = [
            "id",
            "issue_type",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at"
        ]
       
    def create(self, validated_data):
        return IssueTypeCustomProperty.objects.create(
            **validated_data,
            issue_type_id=self.context["issue_type_id"]
        )