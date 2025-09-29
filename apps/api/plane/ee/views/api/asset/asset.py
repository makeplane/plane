# Python Imports
import uuid

# Third party imports
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.db.models import Workspace, FileAsset
from plane.settings.storage import S3Storage
from plane.ee.views.api.base import BaseServiceAPIView
from plane.utils.exception_logger import log_exception

class ImportAssetEndpoint(BaseServiceAPIView):
    """This endpoint is used to upload generic assets that can be later bound to entities."""

    def get(self, request, slug, asset_id):
        """Get presigned URL for asset download.

        Generate a presigned URL for downloading a generic asset.
        The asset must be uploaded and associated with the specified workspace.
        """
        try:
            # Get the workspace
            workspace = Workspace.objects.get(slug=slug)

            # Get the asset
            asset = FileAsset.objects.get(
                id=asset_id, workspace_id=workspace.id, is_deleted=False
            )

            # Check if the asset exists and is uploaded
            if not asset.is_uploaded:
                return Response(
                    {"error": "Asset not yet uploaded"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            size_limit = settings.FILE_SIZE_LIMIT

            # Generate presigned URL for GET
            storage = S3Storage(request=request, is_server=True)
            presigned_url = storage.generate_presigned_url(
                object_name=asset.asset.name, filename=asset.attributes.get("name")
            )

            return Response(
                {
                    "asset_id": str(asset.id),
                    "asset_url": presigned_url,
                    "asset_name": asset.attributes.get("name", ""),
                    "asset_type": asset.attributes.get("type", ""),
                },
                status=status.HTTP_200_OK,
            )

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request, slug):
        """Generate presigned URL for generic asset upload.

        Create a presigned URL for uploading generic assets that can be bound to entities like work items.
        Supports various file types and includes external source tracking for integrations.
        """
        name = request.data.get("name")
        type = request.data.get("type")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        project_id = request.data.get("project_id")
        created_by = request.data.get("created_by")
        external_id = request.data.get("external_id")
        external_source = request.data.get("external_source")

        # Check if the request is valid
        if not name or not size:
            return Response(
                {"error": "Name and size are required fields.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file size is within the limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        # Check if the file type is allowed
        if not type or type not in settings.ATTACHMENT_MIME_TYPES:
            return Response(
                {"error": "Invalid file type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Check for existing asset with same external details if provided
        if external_id and external_source:
            existing_asset = FileAsset.objects.filter(
                workspace__slug=slug,
                external_source=external_source,
                external_id=external_id,
                is_deleted=False,
            ).first()

            if existing_asset:
                return Response(
                    {
                        "message": "Asset with same external id and source already exists",
                        "asset_id": str(existing_asset.id),
                        "asset_url": existing_asset.asset_url,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            project_id=project_id,
            created_by_id=created_by,
            external_id=external_id,
            external_source=external_source,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,  # Using ISSUE_ATTACHMENT since we'll bind it to issues
        )

        # Get the presigned URL
        storage = S3Storage(request=request, is_server=True)
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key, file_type=type, file_size=size_limit
        )

        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, slug, asset_id):
        """Update generic asset after upload completion.

        Update the asset status after the file has been uploaded to S3.
        This endpoint should be called after completing the S3 upload to mark the asset as uploaded
        and trigger metadata extraction.
        """
        try:
            asset = FileAsset.objects.get(
                id=asset_id, workspace__slug=slug, is_deleted=False
            )

            # Update is_uploaded status
            asset.is_uploaded = request.data.get("is_uploaded", asset.is_uploaded)

            # Update storage metadata if not present
            if not asset.storage_metadata:
                get_asset_object_metadata.delay(asset_id=str(asset_id))

            asset.save(update_fields=["is_uploaded"])

            return Response(status=status.HTTP_204_NO_CONTENT)
        except FileAsset.DoesNotExist:
            return Response(
                {"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND
            )
