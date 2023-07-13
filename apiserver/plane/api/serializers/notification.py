# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import Notification

class NotificationSerializer(BaseSerializer):

    triggered_by_details = UserLiteSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"

