# Python imports
import requests

# Django imports
from django.conf import settings

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# plane imports
from .base import BaseAPIView


class ChangeLogEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def fetch_change_logs(self):
        response = requests.get(settings.INSTANCE_CHANGELOG_URL)
        response.raise_for_status()
        return response.json()

    def get(self, request):
        # Fetch the changelog
        if settings.INSTANCE_CHANGELOG_URL:
            data = self.fetch_change_logs()
            return Response(data, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "could not fetch changelog please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
