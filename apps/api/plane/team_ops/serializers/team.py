# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.team_ops.models import OpsTeam, OpsTeamMember


class TeamMemberInputSerializer(serializers.Serializer):
    user = serializers.UUIDField()
    role = serializers.ChoiceField(choices=OpsTeamMember.Role.choices, default=OpsTeamMember.Role.MEMBER)


class TeamWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    # When given, replaces the whole member list.
    members = TeamMemberInputSerializer(many=True, required=False)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name cannot be blank.")
        return value

    def validate_members(self, value):
        user_ids = [member["user"] for member in value]
        if len(set(user_ids)) != len(user_ids):
            raise serializers.ValidationError("A user can only be listed once.")
        return value


class TeamSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = OpsTeam
        fields = ["id", "name", "description", "members", "created_at", "updated_at"]
        read_only_fields = fields

    def get_members(self, team):
        # Members who left the workspace or became guests stay on file but are not shown.
        eligible = self.context.get("eligible_user_ids")
        members = sorted(
            team.members.all(), key=lambda member: (member.role != OpsTeamMember.Role.LEAD, str(member.user_id))
        )
        return [
            {"user": member.user_id, "role": member.role}
            for member in members
            if eligible is None or member.user_id in eligible
        ]
