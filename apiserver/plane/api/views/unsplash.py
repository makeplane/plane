# Python imports
import requests

# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from sentry_sdk import capture_exception

# Module  imports
from .base import BaseAPIView


class UnsplashEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        try:
            query = request.GET.get("query", False)
            page = request.GET.get("page", 1)
            per_page = request.GET.get("per_page", 20)
            url = (
                f"https://api.unsplash.com/search/photos/?client_id=${settings.UNSPLASH_ACCESS_KEY}&query=${query}&page=${page}&per_page=${per_page}"
                if query
                else f"https://api.unsplash.com/photos/?client_id=${unsplashKey}&page=${page}&per_page=${per_page}"
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
