# Python imports
import uuid

# Django imports
from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

# Module imports
from ..base import BaseAPIView
from plane.db.models import FileAsset, Workspace
from plane.settings.storage import S3Storage
from plane.app.permissions import allow_permission, ROLE
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.payment.flags.flag_decorator import (
    check_feature_flag,
)
from plane.payment.flags.flag import FeatureFlag

class SiloAssetsEndpoint(BaseAPIView):
    """
    This endpoint is used for unlimited file uploads without size restrictions.
    It creates asset entries and returns presigned URLs for direct S3 upload.
    """

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.NOTION_IMPORTER)
    def post(self, request, slug):
        """Create a new unlimited asset upload"""

        unlimited_size_limit = 5 * 1024 * 1024 * 1024 # 5GB

        name = request.data.get("name")
        type = request.data.get("type", "application/octet-stream")
        size = int(request.data.get("size", 0))

        # Validate required fields
        if not name:
            return Response(
                {"error": "File name is required.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found.", "status": False},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Generate asset key
        asset_key = f"{workspace.id}/silo/{uuid.uuid4().hex}-{name}"

        # Create a File Asset (no size limit, no entity restrictions)
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size},
            asset=asset_key,
            size=size,  # Store actual size but don't enforce limits
            workspace=workspace,
            created_by=request.user,
            entity_type="SILO",
        )

        # Get the presigned URL for unlimited upload
        storage = S3Storage(request=request)

        # Generate a presigned URL with very large size limit (effectively unlimited)
        # Setting to 10GB limit as "unlimited"
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=unlimited_size_limit
        )

        # Return the presigned URL and asset info
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
                "asset_key": asset_key,
                "message": "Silo upload URL generated successfully",
            },
            status=status.HTTP_200_OK,
        )
