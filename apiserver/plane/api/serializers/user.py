# Module imports
from plane.db.models import User

from .base import BaseSerializer


class UserLiteSerializer(BaseSerializer):
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
            "username",
            "hub_codes",
            "hub_names",
            "is_super_admin",
            "employee_permissions",
            "is_active",
        ]
        read_only_fields = fields
