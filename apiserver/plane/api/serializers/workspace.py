# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer

from plane.db.models import User, Workspace, WorkspaceMember, Team, TeamMember
from plane.db.models import Workspace, WorkspaceMember, Team, WorkspaceMemberInvite


class WorkSpaceSerializer(BaseSerializer):

    owner = UserLiteSerializer(read_only=True)

    class Meta:
        model = Workspace
        fields = "__all__"
        read_only_fields = [
            "id",
            "slug",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "owner",
        ]
        extra_kwargs = {
            "slug": {
                "required": False,
            },
        }


class WorkSpaceMemberSerializer(BaseSerializer):

    member = UserLiteSerializer(read_only=True)
    workspace = WorkSpaceSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = "__all__"


class WorkSpaceMemberInviteSerializer(BaseSerializer):

    workspace = WorkSpaceSerializer(read_only=True)

    class Meta:
        model = WorkspaceMemberInvite
        fields = "__all__"


class TeamSerializer(BaseSerializer):

    members_detail = UserLiteSerializer(read_only=True, source="members", many=True)
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
        else:
            team = Team.objects.create(**validated_data)
            return team

    def update(self, instance, validated_data):
        if "members" in validated_data:
            members = validated_data.pop("members")
            TeamMember.objects.filter(team=instance).delete()
            team_members = [
                TeamMember(member=member, team=instance, workspace=instance.workspace)
                for member in members
            ]
            TeamMember.objects.bulk_create(team_members, batch_size=10)
            return super().update(instance, validated_data)
        else:
            return super().update(instance, validated_data)
