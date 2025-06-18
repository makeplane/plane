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
    DeployBoard,
    ProjectPublicMember,
)


class ProjectSerializer(BaseSerializer):
    workspace_detail = WorkspaceLiteSerializer(source="workspace", read_only=True)
    inbox_view = serializers.BooleanField(read_only=True, source="intake_view")

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ["workspace", "deleted_at"]

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()
        name = validated_data.get("name", "")

        if identifier == "":
            raise serializers.ValidationError(detail="Project Identifier is required")

        if ProjectIdentifier.objects.filter(
            name=identifier, workspace_id=self.context["workspace_id"]
        ).exists():
            raise serializers.ValidationError(
                detail="The project identifier is already taken"
            )

        if Project.objects.filter(
            name=name, workspace_id=self.context["workspace_id"]
        ).exists():
            raise serializers.ValidationError(detail="The project name is alredy taken")

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
        name = validated_data.get("name", "")

        if identifier == "":
            raise serializers.ValidationError(
                detail="The Project Identifier is required. "
            )

        if (
            ProjectIdentifier.objects.filter(
                name=identifier, workspace_id=instance.workspace_id
            )
            .exclude(project_id=instance.id)
            .exists()
        ):
            raise serializers.ValidationError(
                detail="The project identifier is already taken"
            )

        if (
            Project.objects.filter(name=name, workspace_id=instance.workspace_id)
            .exclude(id=instance.id)
            .exists()
        ):
            raise serializers.ValidationError(
                detail="The project name is already taken"
            )

        # if project_identifier is None:
        project = super().update(instance, validated_data)

        return project


class ProjectLiteSerializer(BaseSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "identifier",
            "name",
            "cover_image",
            "cover_image_url",
            "logo_props",
            "description",
        ]
        read_only_fields = fields


class ProjectListSerializer(DynamicBaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    anchor = serializers.CharField(read_only=True)
    members = serializers.SerializerMethodField()
    cover_image_url = serializers.CharField(read_only=True)
    inbox_view = serializers.BooleanField(read_only=True, source="intake_view")

    def get_members(self, obj):
        project_members = getattr(obj, "members_list", None)
        if project_members is not None:
            # Filter members by the project ID
            return [
                member.member_id
                for member in project_members
                if member.is_active and not member.member.is_bot
            ]
        return []

    class Meta:
        model = Project
        fields = "__all__"


class ProjectDetailSerializer(BaseSerializer):
    # workspace = WorkSpaceSerializer(read_only=True)
    default_assignee = UserLiteSerializer(read_only=True)
    project_lead = UserLiteSerializer(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    anchor = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = "__all__"


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


class ProjectMemberRoleSerializer(DynamicBaseSerializer):
    original_role = serializers.IntegerField(source="role", read_only=True)

    class Meta:
        model = ProjectMember
        fields = ("id", "role", "member", "project", "original_role", "created_at")
        read_only_fields = ["original_role", "created_at"]


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


class ProjectMemberLiteSerializer(BaseSerializer):
    member = UserLiteSerializer(read_only=True)
    is_subscribed = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ["member", "id", "is_subscribed"]
        read_only_fields = fields


class DeployBoardSerializer(BaseSerializer):
    project_details = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")

    class Meta:
        model = DeployBoard
        fields = "__all__"
        read_only_fields = ["workspace", "project", "anchor"]


class ProjectPublicMemberSerializer(BaseSerializer):
    class Meta:
        model = ProjectPublicMember
        fields = "__all__"
        read_only_fields = ["workspace", "project", "member"]
