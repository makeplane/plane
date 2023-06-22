# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseViewSet
from plane.db.models import Notification
from plane.api.serializers import NotificationSerializer


class NotificationViewSet(BaseViewSet):
    model = Notification
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
            )
            .select_related("workspace")
        )

