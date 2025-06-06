# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import UserLiteSerializer
from plane.api.views.base import BaseAPIView
from plane.db.models import User
from plane.utils.openapi.decorators import user_docs


class UserEndpoint(BaseAPIView):
    serializer_class = UserLiteSerializer
    model = User

    @user_docs(
        operation_id="get_current_user",
        summary="Get current user",
        responses={200: UserLiteSerializer},
    )
    def get(self, request):
        """Get current user

        Retrieve the authenticated user's profile information including basic details.
        Returns user data based on the current authentication context.
        """
        serializer = UserLiteSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
