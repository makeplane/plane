# Python imports
import uuid

# Django imports
from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.db.models import DeployBoard, FileAsset
from plane.settings.storage import S3Storage
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata


class EntityAssetEndpoint(BaseAPIView):
    def get_permissions(self):
        if self.request.method == "GET":
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get(self, request, anchor, pk):
        # Get the deploy board
        deploy_board = DeployBoard.objects.filter(anchor=anchor).first()
        # Check if the project is published
        if not deploy_board:
            return Response(
                {"error": "Requested resource could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # get the asset id
        asset = FileAsset.objects.get(
            workspace_id=deploy_board.workspace_id,
            pk=pk,
            entity_type__in=[
                FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
            ],
        )

        # Check if the asset is uploaded
        if not asset.is_uploaded:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(object_name=asset.asset.name)
        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)

    def post(self, request, anchor):
        # Get the deploy board
        deploy_board = DeployBoard.objects.filter(
            anchor=anchor, entity_name="project"
        ).first()
        # Check if the project is published
        if not deploy_board:
            return Response(
                {"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get the asset
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        entity_type = request.data.get("entity_type", "")
        entity_identifier = request.data.get("entity_identifier")

        # Check if the entity type is allowed
        if entity_type not in FileAsset.EntityTypeContext.values:
            return Response(
                {"error": "Invalid entity type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file type is allowed
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        if type not in allowed_types:
            return Response(
                {
                    "error": "Invalid file type. Only JPEG and PNG files are allowed.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # asset key
        asset_key = f"{deploy_board.workspace_id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size},
            asset=asset_key,
            size=size,
            workspace=deploy_board.workspace,
            created_by=request.user,
            entity_type=entity_type,
            project_id=deploy_board.project_id,
            comment_id=entity_identifier,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key, file_type=type, file_size=size
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, anchor, pk):
        # Get the deploy board
        deploy_board = DeployBoard.objects.filter(
            anchor=anchor, entity_name="project"
        ).first()
        # Check if the project is published
        if not deploy_board:
            return Response(
                {"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        # get the asset id
        asset = FileAsset.objects.get(id=pk, workspace=deploy_board.workspace)
        # get the storage metadata
        asset.is_uploaded = True
        # get the storage metadata
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(str(asset.id))

        # update the attributes
        asset.attributes = request.data.get("attributes", asset.attributes)
        # save the asset
        asset.save(update_fields=["attributes", "is_uploaded"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, anchor, pk):
        # Get the deploy board
        deploy_board = DeployBoard.objects.filter(
            anchor=anchor, entity_name="project"
        ).first()
        # Check if the project is published
        if not deploy_board:
            return Response(
                {"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND
            )
        # Get the asset
        asset = FileAsset.objects.get(
            id=pk, workspace=deploy_board.workspace, project_id=deploy_board.project_id
        )
        # Check deleted assets
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # Save the asset
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssetRestoreEndpoint(BaseAPIView):
    """Endpoint to restore a deleted assets."""

    def post(self, request, anchor, asset_id):
        # Get the deploy board
        deploy_board = DeployBoard.objects.filter(
            anchor=anchor, entity_name="project"
        ).first()
        # Check if the project is published
        if not deploy_board:
            return Response(
                {"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get the asset
        asset = FileAsset.all_objects.get(id=asset_id, workspace=deploy_board.workspace)
        asset.is_deleted = False
        asset.deleted_at = None
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class EntityBulkAssetEndpoint(BaseAPIView):
    """Endpoint to bulk update assets."""

    def post(self, request, anchor, entity_id):
        # Get the deploy board
        deploy_board = DeployBoard.objects.filter(
            anchor=anchor, entity_name="project"
        ).first()
        # Check if the project is published
        if not deploy_board:
            return Response(
                {"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        asset_ids = request.data.get("asset_ids", [])

        # Check if the asset ids are provided
        if not asset_ids:
            return Response(
                {"error": "No asset ids provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        # get the asset id
        assets = FileAsset.objects.filter(
            id__in=asset_ids,
            workspace=deploy_board.workspace,
            project_id=deploy_board.project_id,
        )

        asset = assets.first()

        # Check if the asset is uploaded
        if not asset:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if the entity type is allowed
        if asset.entity_type == FileAsset.EntityTypeContext.COMMENT_DESCRIPTION:
            # update the attributes
            assets.update(comment_id=entity_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
