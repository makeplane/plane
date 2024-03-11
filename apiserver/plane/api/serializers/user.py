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
            "avatar",
            "display_name",
        ]
        read_only_fields = fields
