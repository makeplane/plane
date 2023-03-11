# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer

from plane.db.models import View
from plane.utils.issue_filters import issue_filters


class IssueViewSerializer(BaseSerializer):
    class Meta:
        model = View
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
        ]

    def create(self, validated_data):
        query_params = validated_data.pop("query", {})

        if not bool(query_params):
            raise serializers.ValidationError(
                {"query": ["Query field cannot be empty"]}
            )

        validated_data["query"] = issue_filters(query_params, "POST")
        return View.objects.create(**validated_data)

    def update(self, instance, validated_data):
        query_params = validated_data.pop("query", {})
        if not bool(query_params):
            raise serializers.ValidationError(
                {"query": ["Query field cannot be empty"]}
            )

        validated_data["query"] = issue_filters(query_params, "POST")
        return super().update(instance, validated_data)
