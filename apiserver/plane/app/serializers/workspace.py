# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from .user import UserLiteSerializer, UserAdminLiteSerializer

from plane.db.models import (
    User,
    Workspace,
    WorkspaceMember,
    Team,
    TeamMember,
    WorkspaceMemberInvite,
    WorkspaceTheme,
    WorkspaceUserProperties,
)
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS


class WorkSpaceSerializer(DynamicBaseSerializer):
    owner = UserLiteSerializer(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    total_issues = serializers.IntegerField(read_only=True)

    def validate_slug(self, value):
        # Check if the slug is restricted
        if value in RESTRICTED_WORKSPACE_SLUGS:
            raise serializers.ValidationError("Slug is not valid")
        return value

    class Meta:
        model = Workspace
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "owner",
        ]


class WorkspaceLiteSerializer(BaseSerializer):
    class Meta:
        model = Workspace
        fields = [
            "name",
            "slug",
            "id",
        ]
        read_only_fields = fields


class WorkSpaceMemberSerializer(DynamicBaseSerializer):
    member = UserLiteSerializer(read_only=True)
    workspace = WorkspaceLiteSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = "__all__"


class WorkspaceMemberMeSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceMember
        fields = "__all__"


class WorkspaceMemberAdminSerializer(DynamicBaseSerializer):
    member = UserAdminLiteSerializer(read_only=True)
    workspace = WorkspaceLiteSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = "__all__"


class WorkSpaceMemberInviteSerializer(BaseSerializer):
    workspace = WorkSpaceSerializer(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")

    class Meta:
        model = WorkspaceMemberInvite
        fields = "__all__"
        read_only_fields = [
            "id",
            "email",
            "token",
            "workspace",
            "message",
            "responded_at",
            "created_at",
            "updated_at",
        ]


class TeamSerializer(BaseSerializer):
    members_detail = UserLiteSerializer(
        read_only=True, source="members", many=True
    )
    members = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Team
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data, **kwargs):
        if "members" in validated_data:
            members = validated_data.pop("members")
            workspace = self.context["workspace"]
            team = Team.objects.create(**validated_data, workspace=workspace)
            team_members = [
                TeamMember(member=member, team=team, workspace=workspace)
                for member in members
            ]
            TeamMember.objects.bulk_create(team_members, batch_size=10)
            return team
        team = Team.objects.create(**validated_data)
        return team

    def update(self, instance, validated_data):
        if "members" in validated_data:
            members = validated_data.pop("members")
            TeamMember.objects.filter(team=instance).delete()
            team_members = [
                TeamMember(
                    member=member, team=instance, workspace=instance.workspace
                )
                for member in members
            ]
            TeamMember.objects.bulk_create(team_members, batch_size=10)
            return super().update(instance, validated_data)
        return super().update(instance, validated_data)


class WorkspaceThemeSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceTheme
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "actor",
        ]


class WorkspaceUserPropertiesSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceUserProperties
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "user",
        ]
