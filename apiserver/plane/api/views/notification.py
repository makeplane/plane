# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

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
                receiver_id=self.request.user.id,
            )
            .select_related("workspace")
        )

    def partial_update(self, request, slug, pk):
        try:
            notification = Notification.objects.get(
                workspace__slug=slug, pk=pk, receiver=request.user
            )
            # Only read_at and snoozed_till can be updated
            notification_data = {
                "read_at": request.data.get("read_at", None),
                "snoozed_till": request.data.get("snoozed_till", None),
            }
            serializer = NotificationSerializer(notification, data=notification_data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
