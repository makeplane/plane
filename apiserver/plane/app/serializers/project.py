# Django imports
from django.conf import settings

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from plane.app.serializers.workspace import WorkspaceLiteSerializer
from plane.app.serializers.user import UserLiteSerializer, UserAdminLiteSerializer
from plane.db.models import (
    Project,
    ProjectMember,
    ProjectMemberInvite,
    ProjectIdentifier,
    ProjectFavorite,
    ProjectDeployBoard,
    ProjectPublicMember,
)
from plane.utils.s3 import S3


class BaseProjectSerializerMixin:
    """abstract class for refresh cover image s3 link"""

    def refresh_cover_image(self, instance):
        if settings.AWS_S3_BUCKET_AUTH:
            cover_image = instance.cover_image

            if S3.verify_s3_url(cover_image) and S3.url_file_has_expired(cover_image):
                s3 = S3()
                instance.cover_image = s3.refresh_url(cover_image)
                instance.save()


class ProjectSerializer(BaseSerializer, BaseProjectSerializerMixin):
    workspace_detail = WorkspaceLiteSerializer(source="workspace", read_only=True)

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

    def update(self, instance, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()

        # If identifier is not passed update the project and return
        if identifier == "":
            project = super().update(instance, validated_data)
            return project

        # If no Project Identifier is found create it
        project_identifier = ProjectIdentifier.objects.filter(
            name=identifier, workspace_id=instance.workspace_id
        ).first()
        if project_identifier is None:
            project = super().update(instance, validated_data)
            project_identifier = ProjectIdentifier.objects.filter(
                project=project
            ).first()
            if project_identifier is not None:
                project_identifier.name = identifier
                project_identifier.save()
            return project
        # If found check if the project_id to be updated and identifier project id is same
        if project_identifier.project_id == instance.id:
            # If same pass update
            project = super().update(instance, validated_data)
            return project

        # If not same fail update
        raise serializers.ValidationError(detail="Project Identifier is already taken")

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


class ProjectListSerializer(DynamicBaseSerializer, BaseProjectSerializerMixin):
    is_favorite = serializers.BooleanField(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    total_cycles = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    is_deployed = serializers.BooleanField(read_only=True)
    members = serializers.SerializerMethodField()

    def get_members(self, obj):
        project_members = getattr(obj, "members_list", None)
        if project_members is not None:
            # Filter members by the project ID
            return [
                {
                    "id": member.id,
                    "member_id": member.member_id,
                    "member__display_name": member.member.display_name,
                    "member__avatar": member.member.avatar,
                }
                for member in project_members
            ]
        return []

    class Meta:
        model = Project
        fields = "__all__"

    def to_representation(self, instance):
        self.refresh_cover_image(instance)
        return super().to_representation(instance)


class ProjectDetailSerializer(BaseSerializer, BaseProjectSerializerMixin):
    # workspace = WorkSpaceSerializer(read_only=True)
    default_assignee = UserLiteSerializer(read_only=True)
    project_lead = UserLiteSerializer(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True)
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

    def to_representation(self, instance):
        self.refresh_cover_image(instance)
        return super().to_representation(instance)


class ProjectMemberSerializer(BaseSerializer):
    workspace = WorkspaceLiteSerializer(read_only=True)
    project = ProjectLiteSerializer(read_only=True)
    member = UserLiteSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"


class ProjectMemberAdminSerializer(BaseSerializer):
    workspace = WorkspaceLiteSerializer(read_only=True)
    project = ProjectLiteSerializer(read_only=True)
    member = UserAdminLiteSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"


class ProjectMemberInviteSerializer(BaseSerializer):
    project = ProjectLiteSerializer(read_only=True)
    workspace = WorkspaceLiteSerializer(read_only=True)

    class Meta:
        model = ProjectMemberInvite
        fields = "__all__"


class ProjectIdentifierSerializer(BaseSerializer):
    class Meta:
        model = ProjectIdentifier
        fields = "__all__"


class ProjectFavoriteSerializer(BaseSerializer):
    class Meta:
        model = ProjectFavorite
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "user",
        ]


class ProjectMemberLiteSerializer(BaseSerializer):
    member = UserLiteSerializer(read_only=True)
    is_subscribed = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ["member", "id", "is_subscribed"]
        read_only_fields = fields


class ProjectDeployBoardSerializer(BaseSerializer):
    project_details = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")

    class Meta:
        model = ProjectDeployBoard
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "anchor",
        ]


class ProjectPublicMemberSerializer(BaseSerializer):
    class Meta:
        model = ProjectPublicMember
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "member",
        ]
