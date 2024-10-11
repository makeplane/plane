# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.authentication.utils.mobile.login import (
    ValidateAuthToken,
)


class MobileSessionTokenCheckEndpoint(APIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        try:
            token = request.data.get("token", False)

            # Check if token is empty
            if not token or token == "":
                return Response(
                    {"error": "Token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate the token
            session_token = ValidateAuthToken(token)
            token_exists = session_token.token_exists()
            if not token_exists:
                return Response(
                    {"error": "Invalid token"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get the session id
            session_details = session_token.get_value()
            if not session_details:
                return Response(
                    {"error": "Invalid token"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Remove the token
            session_token.remove_token()
            response_session = {
                "session_name": settings.SESSION_COOKIE_NAME,
                "session_id": session_details.get("session_id"),
            }

            return Response(response_session, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"error": "Something went wrong"},
                status=status.HTTP_400_BAD_REQUEST,
            )
