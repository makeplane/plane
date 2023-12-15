# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Project, ProjectIdentifier, WorkspaceMember, State, Estimate
from .base import BaseSerializer
from plane.utils.s3 import S3


class BaseProjectSerializerMixin:
    def refresh_cover_image(self, instance):
        cover_image = instance.cover_image

        if S3.verify_s3_url(cover_image) and S3.url_file_has_expired(cover_image):
            s3 = S3()
            instance.cover_image = s3.refresh_url(cover_image)
            instance.save()


class ProjectSerializer(BaseSerializer, BaseProjectSerializerMixin):
    total_members = serializers.IntegerField(read_only=True)
    total_cycles = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    is_deployed = serializers.BooleanField(read_only=True)

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

    def to_representation(self, instance):
        self.refresh_cover_image(instance)
        return super().to_representation(instance)


class ProjectLiteSerializer(BaseSerializer, BaseProjectSerializerMixin):
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
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        self.refresh_cover_image(instance)
        return super().to_representation(instance)
