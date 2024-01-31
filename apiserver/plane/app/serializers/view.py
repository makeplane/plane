# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from plane.db.models import View, ViewFavorite
from plane.utils.issue_filters import issue_filters


class ViewSerializer(DynamicBaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)

    class Meta:
        model = View
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "query",
            "access",
        ]

    def create(self, validated_data):
        query_params = validated_data.get("filters", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        return View.objects.create(**validated_data)

    def update(self, instance, validated_data):
        query_params = validated_data.get("filters", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        validated_data["query"] = issue_filters(query_params, "PATCH")
        return super().update(instance, validated_data)


class ViewFavoriteSerializer(BaseSerializer):

    class Meta:
        model = ViewFavorite
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "user",
        ]
