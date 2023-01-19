# Python import
from uuid import uuid4
from datetime import timedelta

# Third party
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception
from rest_framework_simplejwt.tokens import RefreshToken

# Module import
from .base import BaseAPIView
from plane.db.models import User, APIToken
from plane.api.serializers import APITokenSerializer


class ApiTokenEndpoint(BaseAPIView):
    def post(self, request):
        try:

            label = request.data.get("label", str(uuid4().hex))

            api_token = APIToken.objects.create(
                label=label,
                user=request.user,
            )

            serializer = APITokenSerializer(api_token)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(e)
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
