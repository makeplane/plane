# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from sentry_sdk import capture_exception

# Module imports
from .base import BaseAPIView
from plane.db.models import FileAsset, Workspace
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

    def post(self, request, slug):
        try:
            serializer = FileAssetSerializer(data=request.data)
            if serializer.is_valid():

                if request.user.last_workspace_id is None:
                    return Response(
                        {"error": "Workspace id is required"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                serializer.save(workspace_id=request.user.last_workspace_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
