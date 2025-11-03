# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import ProjectMember, WorkspaceMember
from .base import BaseSerializer
from plane.db.models import User


class ProjectMemberSerializer(BaseSerializer):
    """
    Serializer for project members.
    """

    member = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=True,
    )

    def validate_member(self, value):
        slug = self.context["slug"]

        if not value:
            raise serializers.ValidationError("Member is required", code="INVALID_MEMBER")

        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Member not found", code="INVALID_MEMBER")
        if not WorkspaceMember.objects.filter(workspace__slug=slug, member=value).exists():
            raise serializers.ValidationError("Member not found in workspace", code="INVALID_MEMBER")
        return value

    class Meta:
        model = ProjectMember
        fields = ["id", "member", "role"]
        read_only_fields = ["id"]
