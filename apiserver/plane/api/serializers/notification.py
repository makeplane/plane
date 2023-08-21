# Module imports
from .base import BaseSerializer
from .user import UserSerializer
from plane.db.models import Notification


class NotificationSerializer(BaseSerializer):
    triggered_by_details = UserSerializer(
        source="triggered_by",
        # fields=("id", "first_name", "last_name", "avatar", "is_bot", "display_name"),
        read_only=True,
    )

    class Meta:
        model = Notification
        fields = "__all__"
