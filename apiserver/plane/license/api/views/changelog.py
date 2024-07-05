from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# plane imports
from .base import BaseAPIView

# plane license imports
from plane.license.models import ChangeLog
from plane.license.api.serializers import ChangeLogSerializer


class ChangeLogEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        changelogs = ChangeLog.objects.all().order_by("-release_date")
        serializer = ChangeLogSerializer(changelogs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
