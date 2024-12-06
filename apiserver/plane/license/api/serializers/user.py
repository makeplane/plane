from .base import BaseSerializer
from plane.db.models import User


class UserLiteSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name"]
