# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from sentry_sdk import capture_exception
from django.conf import settings
# Module imports
from .base import BaseAPIView
from plane.db.models import FileAsset
from plane.api.serializers import FileAssetSerializer


class FileAssetEndpoint(BaseAPIView):
    parser_classes = (MultiPartParser, FormParser)

    """
    A viewset for viewing and editing task instances.
    """

    def get(self, request, workspace_id, asset_key):
        asset_key = str(workspace_id) + "/" + asset_key
        files = FileAsset.objects.filter(asset=asset_key)
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
                response_data = serializer.data
                if settings.DOCKERIZED and settings.AWS_S3_ENDPOINT_URL in response_data["asset"]:
                    response_data["asset"] = response_data["asset"].replace(settings.AWS_S3_ENDPOINT_URL, settings.WEB_URL)
                return Response(response_data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, workspace_id, asset_key):
        try:
            asset_key = str(workspace_id) + "/" + asset_key
            file_asset = FileAsset.objects.get(asset=asset_key)
            # Delete the file from storage
            file_asset.asset.delete(save=False)
            # Delete the file object
            file_asset.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "File Asset doesn't exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserAssetsEndpoint(BaseAPIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, asset_key):
        try:
            files = FileAsset.objects.filter(asset=asset_key, created_by=request.user)
            serializer = FileAssetSerializer(files, context={"request": request})
            return Response(serializer.data)
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "File Asset does not exist"}, status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        try:
            serializer = FileAssetSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                response_data = serializer.data
                if settings.DOCKERIZED and settings.AWS_S3_ENDPOINT_URL in response_data["asset"]:
                    response_data["asset"] = response_data["asset"].replace(settings.AWS_S3_ENDPOINT_URL, settings.WEB_URL)
                return Response(response_data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, asset_key):
        try:
            file_asset = FileAsset.objects.get(asset=asset_key, created_by=request.user)
            # Delete the file from storage
            file_asset.asset.delete(save=False)
            # Delete the file object
            file_asset.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "File Asset doesn't exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
