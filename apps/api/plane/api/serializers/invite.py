# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import serializers

# Module imports
from plane.db.models import WorkspaceMemberInvite
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
        return data
