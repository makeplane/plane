# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

# Module imports
from ..base import BaseAPIView, BaseViewSet
from plane.db.models import FileAsset, Workspace, WorkspaceMember
from plane.app.serializers import FileAssetSerializer


class FileAssetEndpoint(BaseAPIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    """
    A viewset for viewing and editing task instances.
    """

    def get(self, request, workspace_id, asset_key):
        # Verify the requesting user is a member of this workspace
        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, member=request.user, is_active=True).exists():
            return Response(
                {"error": "Requested resource could not be found.", "status": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        asset_key = str(workspace_id) + "/" + asset_key
        files = FileAsset.objects.filter(asset=asset_key)
        if files.exists():
            serializer = FileAssetSerializer(files, context={"request": request}, many=True)
            return Response({"data": serializer.data, "status": True}, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Asset key does not exist", "status": False},
                status=status.HTTP_200_OK,
            )

    def post(self, request, slug):
        # Verify the requesting user is a member of this workspace
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found.", "status": False}, status=status.HTTP_404_NOT_FOUND)
        if not WorkspaceMember.objects.filter(workspace=workspace, member=request.user, is_active=True).exists():
            return Response(
                {"error": "Requested resource could not be found.", "status": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = FileAssetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, workspace_id, asset_key):
        # Verify the requesting user is a member of this workspace
        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, member=request.user, is_active=True).exists():
            return Response({"error": "Requested resource could not be found."}, status=status.HTTP_404_NOT_FOUND)
        asset_key = str(workspace_id) + "/" + asset_key
        file_asset = FileAsset.objects.get(asset=asset_key)
        file_asset.is_deleted = True
        file_asset.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class FileAssetViewSet(BaseViewSet):
    def restore(self, request, workspace_id, asset_key):
        # Verify the requesting user is a member of this workspace
        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, member=request.user, is_active=True).exists():
            return Response({"error": "Requested resource could not be found."}, status=status.HTTP_404_NOT_FOUND)
        asset_key = str(workspace_id) + "/" + asset_key
        file_asset = FileAsset.objects.get(asset=asset_key)
        file_asset.is_deleted = False
        file_asset.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserAssetsEndpoint(BaseAPIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, asset_key):
        files = FileAsset.objects.filter(asset=asset_key, created_by=request.user)
        if files.exists():
            serializer = FileAssetSerializer(files, context={"request": request})
            return Response({"data": serializer.data, "status": True}, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Asset key does not exist", "status": False},
                status=status.HTTP_200_OK,
            )

    def post(self, request):
        serializer = FileAssetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, asset_key):
        file_asset = FileAsset.objects.get(asset=asset_key, created_by=request.user)
        file_asset.is_deleted = True
        file_asset.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)
