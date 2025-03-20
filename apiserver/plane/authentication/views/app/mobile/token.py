# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

# Module imports
from plane.authentication.utils.mobile.login import ValidateAuthToken
from plane.db.models import User
from plane.authentication.utils.mobile.login import mobile_user_login


class MobileSessionTokenCheckEndpoint(APIView):
    permission_classes = [AllowAny]

    def get_tokens_for_user(self, user):
        # Get the refresh token
        refresh = RefreshToken.for_user(user)
        # Return the tokens
        return {
            "refresh_token": str(refresh),
            "access_token": str(refresh.access_token),
        }

    def post(self, request):
        try:
            token = request.data.get("token", False)

            # Check if token is empty
            if not token or token == "":
                return Response(
                    {"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Validate the token
            session_token = ValidateAuthToken(token)
            token_exists = session_token.token_exists()
            if not token_exists:
                return Response(
                    {"error": "Invalid token"}, status=status.HTTP_403_FORBIDDEN
                )

            # Get the session id
            session_details = session_token.get_value()
            if not session_details:
                return Response(
                    {"error": "Invalid token"}, status=status.HTTP_403_FORBIDDEN
                )

            # Remove the token
            session_token.remove_token()
            # Get the user id
            user_id = session_details.get("session_id")

            # Get the user
            user = User.objects.filter(id=user_id).first()
            # Check if user exists
            if not user:
                return Response(
                    {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Get the tokens
            response = self.get_tokens_for_user(user)
            # Return the tokens
            return Response(response, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"error": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST
            )


class MobileTokenEndpoint(APIView):
    def get_tokens_for_user(self, user):
        # Get the refresh token
        refresh = RefreshToken.for_user(user)
        # Return the tokens
        return {
            "refresh_token": str(refresh),
            "access_token": str(refresh.access_token),
        }

    def get(self, request):
        try:
            # Get the tokens
            response = self.get_tokens_for_user(user=request.user)
            # Return the tokens
            return Response(response, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"error": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST
            )


class MobileSessionTokenEndpoint(APIView):
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            # Get the user
            session = mobile_user_login(request=request, user=request.user)
            # Return the tokens
            return Response(
                {
                    "session_name": settings.SESSION_COOKIE_NAME,
                    "session_id": session.session_key,
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"error": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST
            )


# mobile refresh token endpoint
class MobileRefreshTokenEndpoint(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh_token", False)

        if not refresh_token:
            return Response({"error": "Refresh token is required"}, status=400)

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            return Response(
                {"access_token": access_token, "refresh_token": refresh_token},
                status=200,
            )
        except Exception:
            return Response({"error": "Invalid refresh token"}, status=400)
