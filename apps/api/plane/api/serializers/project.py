# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import (
    Project,
    ProjectIdentifier,
    WorkspaceMember,
    State,
    Estimate,
)

from plane.utils.content_validator import (
    validate_html_content,
    validate_json_content,
)
from .base import BaseSerializer


class ProjectCreateSerializer(BaseSerializer):
    """
    Serializer for creating projects with workspace validation.

    Handles project creation including identifier validation, member verification,
    and workspace association for new project initialization.
    """

    class Meta:
        model = Project
        fields = [
            "name",
            "description",
            "project_lead",
            "default_assignee",
            "identifier",
            "icon_prop",
            "emoji",
            "cover_image",
            "module_view",
            "cycle_view",
            "issue_views_view",
            "page_view",
            "intake_view",
            "guest_view_all_features",
            "archive_in",
            "close_in",
            "timezone",
        ]

        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def validate(self, data):
        if data.get("project_lead", None) is not None:
            # Check if the project lead is a member of the workspace
            if not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("project_lead"),
            ).exists():
                raise serializers.ValidationError(
                    "Project lead should be a user in the workspace"
                )

        if data.get("default_assignee", None) is not None:
            # Check if the default assignee is a member of the workspace
            if not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("default_assignee"),
            ).exists():
                raise serializers.ValidationError(
                    "Default assignee should be a user in the workspace"
                )

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
        return project


class ProjectUpdateSerializer(ProjectCreateSerializer):
    """
    Serializer for updating projects with enhanced state and estimation management.

    Extends project creation with update-specific validations including default state
    assignment, estimation configuration, and project setting modifications.
    """

    class Meta(ProjectCreateSerializer.Meta):
        model = Project
        fields = ProjectCreateSerializer.Meta.fields + [
            "default_state",
            "estimate",
        ]

        read_only_fields = ProjectCreateSerializer.Meta.read_only_fields

    def update(self, instance, validated_data):
        """Update a project"""
        if (
            validated_data.get("default_state", None) is not None
            and not State.objects.filter(
                project=instance, id=validated_data.get("default_state")
            ).exists()
        ):
            # Check if the default state is a state in the project
            raise serializers.ValidationError(
                "Default state should be a state in the project"
            )

        if (
            validated_data.get("estimate", None) is not None
            and not Estimate.objects.filter(
                project=instance, id=validated_data.get("estimate")
            ).exists()
        ):
            # Check if the estimate is a estimate in the project
            raise serializers.ValidationError(
                "Estimate should be a estimate in the project"
            )
        return super().update(instance, validated_data)


class ProjectSerializer(BaseSerializer):
    """
    Comprehensive project serializer with metrics and member context.

    Provides complete project data including member counts, cycle/module totals,
    deployment status, and user-specific context for project management.
    """

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
    """
    Lightweight project serializer for minimal data transfer.

    Provides essential project information including identifiers, visual properties,
    and basic metadata optimized for list views and references.
    """

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
