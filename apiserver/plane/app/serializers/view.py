# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from .workspace import WorkspaceLiteSerializer
from .project import ProjectLiteSerializer
from plane.db.models import GlobalView, IssueView, IssueViewFavorite
from plane.utils.issue_filters import issue_filters


class GlobalViewSerializer(BaseSerializer):
    workspace_detail = WorkspaceLiteSerializer(
        source="workspace", read_only=True
    )

    class Meta:
        model = GlobalView
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "query",
        ]

    def create(self, validated_data):
        query_params = validated_data.get("query_data", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = dict()
        return GlobalView.objects.create(**validated_data)

    def update(self, instance, validated_data):
        query_params = validated_data.get("query_data", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = dict()
        validated_data["query"] = issue_filters(query_params, "PATCH")
        return super().update(instance, validated_data)


class IssueViewSerializer(DynamicBaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    project_detail = ProjectLiteSerializer(source="project", read_only=True)
    workspace_detail = WorkspaceLiteSerializer(
        source="workspace", read_only=True
    )

    class Meta:
        model = IssueView
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "query",
        ]

    def create(self, validated_data):
        query_params = validated_data.get("query_data", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        return IssueView.objects.create(**validated_data)

    def update(self, instance, validated_data):
        query_params = validated_data.get("query_data", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        validated_data["query"] = issue_filters(query_params, "PATCH")
        return super().update(instance, validated_data)


class IssueViewFavoriteSerializer(BaseSerializer):
    view_detail = IssueViewSerializer(source="issue_view", read_only=True)

    class Meta:
        model = IssueViewFavorite
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "user",
        ]
