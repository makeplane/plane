from rest_framework import serializers

# Module imports
from plane.db.models import User

from .base import BaseSerializer


class UserLiteSerializer(BaseSerializer):
    """
    Lightweight user serializer for minimal data transfer.

    Provides essential user information including names, avatar, and contact details
    optimized for member lists, assignee displays, and user references.
    """

    avatar_url = serializers.CharField(
        help_text="Avatar URL",
        read_only=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "avatar_url",
            "display_name",
            "email",
        ]
        read_only_fields = fields
