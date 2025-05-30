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

from .base import BaseSerializer


class ProjectCreateSerializer(BaseSerializer):

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
    """Serializer for updating a project"""

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
