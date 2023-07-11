# Module imports
from .base import BaseSerializer
from plane.db.models import Notification

class NotificationSerializer(BaseSerializer):

    class Meta:
        model = Notification
        fields = "__all__"

