# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

## Module imports
from plane.db.models import User
from plane.license.models import Instance


class EmailCheckEndpoint(APIView):

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

        # Check if a user already exists with the given email
        existing_user = User.objects.filter(email=email).first()

        # If existing user
        if existing_user:
            return Response(
                {
                    "existing": True,
                    "is_password_autoset": existing_user.is_password_autoset,
                },
                status=status.HTTP_200_OK,
            )
        # Else return response
        return Response(
            {"existing": False, "is_password_autoset": False},
            status=status.HTTP_200_OK,
        )
