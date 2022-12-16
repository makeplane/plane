# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

# Module imports
from .base import BaseAPIView
from plane.db.models import FileAsset
from plane.api.serializers import FileAssetSerializer


class FileAssetEndpoint(BaseAPIView):

    parser_classes = (MultiPartParser, FormParser)

    """
    A viewset for viewing and editing task instances.
    """

    def get(self, request):
        files = FileAsset.objects.all()
        serializer = FileAssetSerializer(files, context={"request": request}, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = FileAssetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
