# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
# See the LICENSE file for details.

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import serializers

# Module imports
from plane.db.models import WorkspaceMember, WorkspaceMemberInvite
from .base import BaseSerializer
from plane.app.permissions.base import ROLE


class WorkspaceInviteSerializer(BaseSerializer):
    """
    Serializer for workspace invites.
    """

    class Meta:
        model = WorkspaceMemberInvite
        fields = [
            "id",
            "email",
            "role",
            "created_at",
            "updated_at",
            "responded_at",
            "accepted",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
            "responded_at",
            "accepted",
        ]

    def validate_email(self, value):
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("Invalid email address", code="INVALID_EMAIL_ADDRESS")
        # User emails are stored lowercased and stripped, so invites must match
        return value.strip().lower()

    def validate_role(self, value):
        if value not in [ROLE.ADMIN.value, ROLE.MEMBER.value, ROLE.GUEST.value]:
            raise serializers.ValidationError("Invalid role", code="INVALID_WORKSPACE_MEMBER_ROLE")
        return value

    def validate(self, data):
        slug = self.context["slug"]
        if (
            data.get("email")
            and WorkspaceMemberInvite.objects.filter(email=data["email"], workspace__slug=slug).exists()
        ):
            raise serializers.ValidationError("Email already invited", code="EMAIL_ALREADY_INVITED")
        if (
            data.get("email")
            and WorkspaceMember.objects.filter(
                workspace__slug=slug, member__email=data["email"], is_active=True
            ).exists()
        ):
            raise serializers.ValidationError("User is already a member of the workspace", code="USER_ALREADY_MEMBER")
        return data
