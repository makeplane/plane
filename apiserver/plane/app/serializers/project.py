# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from plane.app.serializers.workspace import WorkspaceLiteSerializer
from plane.app.serializers.user import (
    UserLiteSerializer,
    UserAdminLiteSerializer,
)
from plane.db.models import (
    Project,
    ProjectMember,
    ProjectMemberInvite,
    ProjectIdentifier,
    DeployBoard,
    ProjectPublicMember,
)


class ProjectSerializer(BaseSerializer):
    workspace_detail = WorkspaceLiteSerializer(
        source="workspace", read_only=True
    )

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = [
            "workspace",
        ]

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()
        if identifier == "":
            raise serializers.ValidationError(
                detail="Project Identifier is required"
            )

        if ProjectIdentifier.objects.filter(
            name=identifier, workspace_id=self.context["workspace_id"]
        ).exists():
            raise serializers.ValidationError(
                detail="Project Identifier is taken"
            )
        project = Project.objects.create(
            **validated_data,
            workspace_id=self.context["workspace_id"],
        )
        _ = ProjectIdentifier.objects.create(
            name=project.identifier,
            project=project,
            workspace_id=self.context["workspace_id"],
            created_by_id=project.created_by_id,
            updated_by_id=project.updated_by_id,
            current_active=project.identifier,
        )
        return project

    def update(self, instance, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()

        # If identifier is not passed update the project and return
        if identifier == "":
            project = super().update(instance, validated_data)
            return project

        # When updating check if the project identifier is different
        if instance.identifier == identifier:
            project = super().update(instance, validated_data)
            return project

        # Check if this project identifier is already taken in the current workspace
        if ProjectIdentifier.objects.filter(
            name=identifier,
            workspace_id=instance.workspace_id,
        ).exists():
            raise serializers.ValidationError(
                detail="Project Identifier is already taken"
            )

        # Update the project identifier
        project = super().update(instance, validated_data)
        # If no Project Identifier is found create it and deactivate the old ones
        ProjectIdentifier.objects.filter(
            project_id=instance.id,
            workspace_id=instance.workspace_id,
        ).update(current_active=identifier)
        # Create new project identifier
        ProjectIdentifier.objects.create(
            name=identifier,
            project=instance,
            workspace_id=instance.workspace_id,
            created_by_id=project.created_by_id,
            updated_by_id=project.updated_by_id,
            current_active=identifier,
        )
        # Return the updated project
        return project


class ProjectLiteSerializer(BaseSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "identifier",
            "name",
            "cover_image",
            "logo_props",
            "description",
        ]
        read_only_fields = fields


class ProjectListSerializer(DynamicBaseSerializer):
    total_issues = serializers.IntegerField(read_only=True)
    archived_issues = serializers.IntegerField(read_only=True)
    archived_sub_issues = serializers.IntegerField(read_only=True)
    draft_issues = serializers.IntegerField(read_only=True)
    draft_sub_issues = serializers.IntegerField(read_only=True)
    sub_issues = serializers.IntegerField(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    total_cycles = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    anchor = serializers.CharField(read_only=True)
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


class ProjectDetailSerializer(BaseSerializer):
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
    class Meta:
        model = ProjectMember
        fields = ("id", "role", "member", "project")


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
    workspace_detail = WorkspaceLiteSerializer(
        read_only=True, source="workspace"
    )

    class Meta:
        model = DeployBoard
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
