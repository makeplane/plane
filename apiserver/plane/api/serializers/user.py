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


class UserLiteSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "is_bot",
        ]
        read_only_fields = [
            "id",
            "is_bot",
        ]
