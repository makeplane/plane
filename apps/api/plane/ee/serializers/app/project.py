# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.ee.models import ProjectAttribute, ProjectFeature
from plane.db.models import FileAsset
from plane.ee.models import ProjectLink, ProjectReaction, WorkspaceActivity
from rest_framework import serializers
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from plane.app.serializers import (
    UserLiteSerializer,
    ProjectLiteSerializer,
    WorkspaceLiteSerializer,
)


class ProjectAttributeSerializer(BaseSerializer):
    state_id = serializers.UUIDField(required=False)
    project_name = serializers.CharField()
    network = serializers.IntegerField(required=False)
    update_status = serializers.CharField(required=False)

    class Meta:
        model = ProjectAttribute
        fields = [
            "project_id",
            "state_id",
            "priority",
            "start_date",
            "target_date",
            "project_name",
            "network",
            "update_status",
        ]


class ProjectFeatureSerializer(BaseSerializer):
    is_issue_type_enabled = serializers.BooleanField(read_only=True)
    is_time_tracking_enabled = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProjectFeature
        fields = [
            "id",
            "is_project_updates_enabled",
            "is_epic_enabled",
            "is_issue_type_enabled",
            "is_time_tracking_enabled",
            "is_workflow_enabled",
            "project_id",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "created_by",
        ]


class ProjectLinkSerializer(BaseSerializer):
    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")

    class Meta:
        model = ProjectLink
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def to_internal_value(self, data):
        # Modify the URL before validation by appending http:// if missing
        url = data.get("url", "")
        if url and not url.startswith(("http://", "https://")):
            data["url"] = "http://" + url

        return super().to_internal_value(data)

    def validate_url(self, value):
        # Use Django's built-in URLValidator for validation
        url_validator = URLValidator()
        try:
            url_validator(value)
        except ValidationError:
            raise serializers.ValidationError({"error": "Invalid URL format."})

        return value

    # Validation if url already exists
    def create(self, validated_data):
        if ProjectLink.objects.filter(
            url=validated_data.get("url"), project_id=validated_data.get("project_id")
        ).exists():
            raise serializers.ValidationError(
                {"error": "URL already exists for this Project"}
            )
        return ProjectLink.objects.create(**validated_data)

    def update(self, instance, validated_data):
        if (
            ProjectLink.objects.filter(
                url=validated_data.get("url"), project_id=instance.project_id
            )
            .exclude(pk=instance.id)
            .exists()
        ):
            raise serializers.ValidationError(
                {"error": "URL already exists for this Project"}
            )

        return super().update(instance, validated_data)


class ProjectAttachmentSerializer(BaseSerializer):
    asset_url = serializers.CharField(read_only=True)

    class Meta:
        model = FileAsset
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "project",
        ]


class ProjectReactionSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = ProjectReaction
        fields = "__all__"
        read_only_fields = ["workspace", "project", "actor", "deleted_at"]


class ProjectActivitySerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")

    class Meta:
        model = WorkspaceActivity
        fields = "__all__"
        read_only_fields = ["workspace", "project", "actor", "deleted_at"]
