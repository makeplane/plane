# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.api.serializers.workspace import WorkSpaceSerializer
from plane.api.serializers.user import UserLiteSerializer
from plane.db.models import (
    Project,
    ProjectMember,
    ProjectMemberInvite,
    ProjectIdentifier,
)


class ProjectSerializer(BaseSerializer):
    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = [
            "workspace",
        ]

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()
        if identifier == "":
            raise serializers.ValidationError(detail="Project Identifier is required")

        if ProjectIdentifier.objects.filter(name=identifier).exists():
            raise serializers.ValidationError(detail="Project Identifier is taken")
        project = Project.objects.create(
            **validated_data, workspace_id=self.context["workspace_id"]
        )
        _ = ProjectIdentifier.objects.create(name=project.identifier, project=project)
        return project

    def update(self, instance, validated_data):

        identifier = validated_data.get("identifier", "").strip().upper()

        # If identifier is not passed update the project and return
        if identifier == "":
            project = super().update(instance, validated_data)
            return project

        # If no Project Identifier is found create it
        project_identifier = ProjectIdentifier.objects.filter(name=identifier).first()

        if project_identifier is None:
            project = super().update(instance, validated_data)
            _ = ProjectIdentifier.objects.update(name=identifier, project=project)
            return project

        # If found check if the project_id to be updated and identifier project id is same
        if project_identifier.project_id == instance.id:
            # If same pass update
            project = super().update(instance, validated_data)
            return project

        # If not same fail update
        raise serializers.ValidationError(
            detail="Project Identifier is already taken"
        )


class ProjectDetailSerializer(BaseSerializer):

    workspace = WorkSpaceSerializer(read_only=True)
    default_assignee = UserLiteSerializer(read_only=True)
    project_lead = UserLiteSerializer(read_only=True)

    class Meta:
        model = Project
        fields = "__all__"


class ProjectMemberSerializer(BaseSerializer):

    workspace = WorkSpaceSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    member = UserLiteSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"


class ProjectMemberInviteSerializer(BaseSerializer):

    project = ProjectSerializer(read_only=True)
    workspace = WorkSpaceSerializer(read_only=True)

    class Meta:
        model = ProjectMemberInvite
        fields = "__all__"


class ProjectIdentifierSerializer(BaseSerializer):
    class Meta:
        model = ProjectIdentifier
        fields = "__all__"
