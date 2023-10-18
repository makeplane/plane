# Python imports
import requests
import json

# Module imports
from . import BaseAPIView

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# Django imports
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder


class EventTrackingEndpoint(BaseAPIView):
    permission_class = [
        IsAuthenticated,
    ]

    def post(self, request):
        event_name = request.data.get("event_name", None)
        extra = request.data.get("extra", None)

        if not event_name or not extra:
            return Response(
                {"error": "event name and extra are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _ = requests.post(
            settings.ANALYTICS_BASE_API,
            params={"token": settings.ANALYTICS_SECRET_KEY},
            json=json.dumps(
                {
                    "eventName": event_name,
                    "extra": extra,
                    "user": {
                        "id": str(request.user.id),
                        "email": str(request.user.email),
                        "first_name": str(request.user.first_name),
                        "last_name": str(request.user.last_name),
                    },
                },
                cls=DjangoJSONEncoder,
            ),
        )
        return Response({"message": "success"}, status=status.HTTP_200_OK)
