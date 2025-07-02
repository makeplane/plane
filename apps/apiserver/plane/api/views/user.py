# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import UserLiteSerializer
from plane.api.views.base import BaseAPIView
from plane.db.models import User


class UserEndpoint(BaseAPIView):
    serializer_class = UserLiteSerializer
    model = User

    def get(self, request):
        serializer = UserLiteSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
