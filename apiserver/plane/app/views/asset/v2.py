# Python imports
import uuid

# Django imports
from django.conf import settings
from django.http import HttpResponseRedirect

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from ..base import BaseAPIView
from plane.db.models import FileAsset, Workspace
from plane.settings.storage import S3Storage


class UserAssetsV2Endpoint(BaseAPIView):
    """This endpoint is used to upload user profile images."""

    def post(self, request):
        # get the asset key
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))

        # Check if the file type is allowed
        allowed_types = ["image/jpeg", "image/png"]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # asset key
        asset_key = f"{uuid.uuid4().hex}-{name[:50]}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={
                "name": name,
                "type": type,
                "size": size,
            },
            asset=asset_key,
            size=size,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.COVER_IMAGE,
        )

        # Get the presigned URL
        storage = S3Storage()
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size,
        )
        # Return the presigned URL
        return Response(
            {"url": presigned_url, "asset_id": str(asset.id)},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id)
        asset.is_uploaded = request.data.get("is_uploaded", asset.is_uploaded)
        # get the storage metadata
        storage = S3Storage()
        storage_metadata = storage.get_object_metadata(asset.asset.name)
        asset.storage_metadata = storage_metadata
        # save the asset
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, asset_id):
        asset = FileAsset.objects.get(id=asset_id)
        asset.is_deleted = True
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceFileAssetEndpoint(BaseAPIView):
    """This endpoint is used to upload cover images/logos etc for workspace, projects etc."""

    def post(self, request, slug):
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))

        allowed_types = ["image/jpeg", "image/png"]

        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name[:50]}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={
                "name": name,
                "type": type,
                "size": size,
            },
            asset=asset_key,
            size=size,
            workspace=workspace,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.COVER_IMAGE,
        )

        # Get the presigned URL
        storage = S3Storage()
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size,
        )
        # Return the presigned URL
        return Response(
            {"url": presigned_url, "asset_id": str(asset.id)},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, slug, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(id=asset_id, workspace__slug=slug)
        asset.is_uploaded = request.data.get("is_uploaded", asset.is_uploaded)
        # get the storage metadata
        storage = S3Storage()
        storage_metadata = storage.get_object_metadata(asset.asset.name)
        asset.storage_metadata = storage_metadata
        # save the asset
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, slug, asset_id):
        asset = FileAsset.objects.get(id=asset_id, workspace__slug=slug)
        asset.is_deleted = True
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaticFileAssetEndpoint(BaseAPIView):
    """This endpoint is used to get the signed URL for a static asset."""

    def get(self, request, asset_id):
        # get the asset id
        asset = FileAsset.objects.get(
            id=asset_id, entity_type=FileAsset.EntityTypeContext.COVER_IMAGE
        )
        # get the signed URL
        signed_url = asset.signed_url
        # If the signed URL is not found, return a 404
        if not signed_url:
            return Response(
                {"error": "Asset not found", "status": False},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)


class AssetRestoreEndpoint(BaseAPIView):
    """Endpoint to restore a deleted assets."""

    def post(self, request, asset_id):
        asset = FileAsset.objects.get(id=asset_id)
        asset.is_deleted = False
        asset.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
