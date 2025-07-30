# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Project, ProjectIdentifier, WorkspaceMember
from plane.utils.content_validator import (
    validate_html_content,
    validate_json_content,
    validate_binary_data,
)

from .base import BaseSerializer


class ProjectSerializer(BaseSerializer):
    total_members = serializers.IntegerField(read_only=True)
    total_cycles = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    is_deployed = serializers.BooleanField(read_only=True)
    cover_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = [
            "id",
            "emoji",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
            "cover_image_url",
        ]

    def validate(self, data):
        # Check project lead should be a member of the workspace
        if (
            data.get("project_lead", None) is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("project_lead"),
            ).exists()
        ):
            raise serializers.ValidationError(
                "Project lead should be a user in the workspace"
            )

        # Check default assignee should be a member of the workspace
        if (
            data.get("default_assignee", None) is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("default_assignee"),
            ).exists()
        ):
            raise serializers.ValidationError(
                "Default assignee should be a user in the workspace"
            )

        # Validate description content for security
        if "description" in data and data["description"]:
            # For Project, description might be text field, not JSON
            if isinstance(data["description"], dict):
                is_valid, error_msg = validate_json_content(data["description"])
                if not is_valid:
                    raise serializers.ValidationError({"description": error_msg})

        if "description_text" in data and data["description_text"]:
            is_valid, error_msg = validate_json_content(data["description_text"])
            if not is_valid:
                raise serializers.ValidationError({"description_text": error_msg})

        if "description_html" in data and data["description_html"]:
            if isinstance(data["description_html"], dict):
                is_valid, error_msg = validate_json_content(data["description_html"])
            else:
                is_valid, error_msg = validate_html_content(
                    str(data["description_html"])
                )
            if not is_valid:
                raise serializers.ValidationError({"description_html": error_msg})

        return data

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()
        if identifier == "":
            raise serializers.ValidationError(detail="Project Identifier is required")

        if ProjectIdentifier.objects.filter(
            name=identifier, workspace_id=self.context["workspace_id"]
        ).exists():
            raise serializers.ValidationError(detail="Project Identifier is taken")

        project = Project.objects.create(
            **validated_data, workspace_id=self.context["workspace_id"]
        )
        _ = ProjectIdentifier.objects.create(
            name=project.identifier,
            project=project,
            workspace_id=self.context["workspace_id"],
        )
        return project


class ProjectLiteSerializer(BaseSerializer):
    cover_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "identifier",
            "name",
            "cover_image",
            "icon_prop",
            "emoji",
            "description",
            "cover_image_url",
        ]
        read_only_fields = fields
