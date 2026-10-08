# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import ProjectMember, WorkspaceMember
from .base import BaseSerializer
from plane.db.models import User
from plane.utils.permissions import ROLE


class ProjectMemberSerializer(BaseSerializer):
    """
    Serializer for project members.
    """

    member = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=True,
    )

    def validate_member(self, value):
        slug = self.context.get("slug")
        if not slug:
            raise serializers.ValidationError("Slug is required", code="INVALID_SLUG")
        if not value:
            raise serializers.ValidationError("Member is required", code="INVALID_MEMBER")
        if not WorkspaceMember.objects.filter(workspace__slug=slug, member=value).exists():
            raise serializers.ValidationError("Member not found in workspace", code="INVALID_MEMBER")
        return value

    def validate_role(self, value):
        if value not in [ROLE.ADMIN.value, ROLE.MEMBER.value, ROLE.GUEST.value]:
            raise serializers.ValidationError("Invalid role", code="INVALID_ROLE")
        return value

    class Meta:
        model = ProjectMember
        fields = ["id", "member", "role"]
        read_only_fields = ["id"]


class BaseMemberLiteAPISerializer(BaseSerializer):
    """Common flattened member representation for paginated member pickers/directories."""

    id = serializers.UUIDField(source="member.id", read_only=True)
    first_name = serializers.CharField(source="member.first_name", read_only=True)
    last_name = serializers.CharField(source="member.last_name", read_only=True)
    email = serializers.EmailField(source="member.email", read_only=True)
    avatar = serializers.CharField(source="member.avatar", read_only=True, allow_null=True)
    avatar_url = serializers.CharField(source="member.avatar_url", read_only=True, allow_null=True)
    display_name = serializers.CharField(source="member.display_name", read_only=True)
    is_bot = serializers.BooleanField(source="member.is_bot", read_only=True)

    class Meta:
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "avatar_url",
            "display_name",
            "role",
            "is_active",
            "is_bot",
        ]
        read_only_fields = fields


class WorkspaceMemberLiteAPISerializer(BaseMemberLiteAPISerializer):
    """Minimal WorkspaceMember representation for paginated member pickers/directories."""

    class Meta(BaseMemberLiteAPISerializer.Meta):
        model = WorkspaceMember


class ProjectMemberLiteAPISerializer(BaseMemberLiteAPISerializer):
    """Minimal ProjectMember representation for paginated member pickers/directories."""

    class Meta(BaseMemberLiteAPISerializer.Meta):
        model = ProjectMember
