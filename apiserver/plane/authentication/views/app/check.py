# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

## Module imports
from plane.db.models import User
from plane.license.models import Instance


class EmailCheckSignUpEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {
                    "error_code": "INSTANCE_NOT_CONFIGURED",
                    "error_message": "Instance is not configured",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", False)
        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            return Response(
                {
                    "error_code": "USER_ALREADY_EXIST",
                    "error_message": "User already exists with the email.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"status": True},
            status=status.HTTP_200_OK,
        )


class EmailCheckSignInEndpoint(APIView):

    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {
                    "error_code": "INSTANCE_NOT_CONFIGURED",
                    "error_message": "Instance is not configured",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", False)
        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            return Response(
                {
                    "status": True,
                    "is_password_autoset": existing_user.is_password_autoset,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "error_code": "USER_DOES_NOT_EXIST",
                "error_message": "User could not be found with the given email.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
