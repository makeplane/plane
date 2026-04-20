# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import serializers

# Module imports
from plane.db.models import WorkspaceMemberInvite
from .base import BaseSerializer
from plane.app.permissions.base import ROLE
from plane.payment.utils.member_payment_count import workspace_member_check
from plane.permissions.system_roles import role_from_member_role


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
        return value

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

        allowed, _, _ = workspace_member_check(
            slug=slug,
            requested_invite_list=[{
                "email": data.get("email"),
                "role_slug": role_from_member_role(data.get("role", 5)),
            }],
        )

        if not allowed:
            raise serializers.ValidationError(
                "Reached seat limit - Upgrade to add more members", code="REACHED_SEAT_LIMIT"
            )

        return data
