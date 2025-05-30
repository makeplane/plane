# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
)

# Module imports
from plane.api.serializers import UserLiteSerializer
from plane.api.views.base import BaseAPIView
from plane.db.models import User
from plane.utils.openapi import UNAUTHORIZED_RESPONSE


class UserEndpoint(BaseAPIView):
    serializer_class = UserLiteSerializer
    model = User

    @extend_schema(
        operation_id="get_current_user",
        tags=["Users"],
        responses={
            200: OpenApiResponse(
                description="User retrieved",
                response=UserLiteSerializer,
            ),
            401: UNAUTHORIZED_RESPONSE,
        },
    )
    def get(self, request):
        """Get current user
        
        Retrieve the authenticated user's profile information including basic details.
        Returns user data based on the current authentication context.
        """
        serializer = UserLiteSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
