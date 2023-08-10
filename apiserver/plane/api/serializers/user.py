# Third party imports
from rest_framework import serializers

# Module import
from .base import BaseSerializer
from plane.db.models import User


class UserSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "is_superuser",
            "is_staff",
            "last_active",
            "last_login_time",
            "last_logout_time",
            "last_login_ip",
            "last_logout_ip",
            "last_login_uagent",
            "token_updated_at",
            "is_onboarded",
            "is_bot",
        ]
        extra_kwargs = {"password": {"write_only": True}}

        # If the user has already filled first name or last name then he is onboarded
        def get_is_onboarded(self, obj):
            return bool(obj.first_name) or bool(obj.last_name)


class UserLiteSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "avatar",
            "is_bot",
            "display_name",
        ]
        read_only_fields = [
            "id",
            "is_bot",
        ]


class UserAdminLiteSerializer(BaseSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "avatar",
            "is_bot",
            "display_name",
            "email",
        ]
        read_only_fields = [
            "id",
            "is_bot",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    model = User

    """
    Serializer for password change endpoint.
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    model = User

    """
    Serializer for password change endpoint.
    """
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
