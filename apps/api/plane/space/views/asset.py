# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import uuid
from enum import Enum

# Django imports
from django.http import HttpResponseRedirect
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


# Module imports
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.db.models import DeployBoard, FileAsset, Project, APIToken, BotTypeEnum
from plane.settings.storage import S3Storage
from .base import BaseAPIView
from plane.ee.models import IntakeForm, IntakeSetting
from plane.utils.asset import validate_asset_type, get_asset_size_limit


class EntityAssetEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    class PublishEntityType(Enum):
        DEPLOY_BOARD = "DEPLOY_BOARD"
        INTAKE_FORM = "INTAKE_FORM"

    def get_publish_entity(self, anchor):
        deploy_board = DeployBoard.objects.filter(anchor=anchor).first()
        if deploy_board:
            return deploy_board, self.PublishEntityType.DEPLOY_BOARD
        # check if the anchor is a type form anchor
        intake_form = IntakeForm.objects.filter(anchor=anchor).first()
        if intake_form:
            return intake_form, self.PublishEntityType.INTAKE_FORM
        return None, None

    def get(self, request, anchor, pk):
        # Get the deploy board
        publish_entity, _ = self.get_publish_entity(anchor)
        is_server = request.query_params.get("is_server", "false").lower() == "true"
        if not publish_entity:
            return Response(
                {"error": "Requested resource could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # get the asset id
        asset = FileAsset.objects.get(
            workspace_id=publish_entity.workspace_id,
            pk=pk,
            entity_type__in=[
                FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
                FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            ],
        )

        # Check if the asset is uploaded
        if not asset.is_uploaded:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get the presigned URL
        storage = S3Storage(request=request, is_server=is_server)
        # Generate a presigned URL to share an S3 object
        signed_url = storage.generate_presigned_url(object_name=asset.asset.name)
        # Redirect to the signed URL
        return HttpResponseRedirect(signed_url)

    def post(self, request, anchor):
        # Get the deploy board
        publish_entity, publish_entity_type = self.get_publish_entity(anchor)

        # Check if the project is published
        if not publish_entity:
            return Response({"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND)

        # if deploy board is not found
        if publish_entity_type == self.PublishEntityType.DEPLOY_BOARD and publish_entity.entity_name == "intake":
            # check if the intake is enabled and intake form is enabled
            if not (
                IntakeSetting.objects.filter(intake=publish_entity.entity_identifier, is_form_enabled=True).exists()
                and Project.objects.filter(pk=publish_entity.project_id, intake_view=True).exists()
            ):
                return Response({"error": "Intake is not enabled"}, status=status.HTTP_404_NOT_FOUND)

        if publish_entity_type == self.PublishEntityType.INTAKE_FORM:
            # check if the intake form is enabled
            if not Project.objects.filter(pk=publish_entity.project_id, intake_view=True).exists():
                return Response({"error": "Intake is not enabled"}, status=status.HTTP_404_NOT_FOUND)

        # Get the asset
        name = request.data.get("name")
        type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size"))
        entity_type = request.data.get("entity_type", "")
        entity_identifier = request.data.get("entity_identifier")

        # Validate file type
        is_valid, error_msg = validate_asset_type(type, entity_type)
        if not is_valid:
            return Response(
                {"error": error_msg, "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate file size limit
        size_limit = get_asset_size_limit(size, entity_type, publish_entity.workspace.slug, request.user.id)

        # asset key
        asset_key = f"{publish_entity.workspace_id}/{uuid.uuid4().hex}-{name}"

        user = None
        if request.user.is_authenticated:
            user = request.user
        else:
            # Check if there is an api token
            api_token = APIToken.objects.filter(
                workspace_id=publish_entity.workspace_id,
                user__is_bot=True,
                user__bot_type=BotTypeEnum.INTAKE_BOT,
            ).first()
            if api_token:
                user = api_token.user

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            created_by=user,
            workspace=publish_entity.workspace,
            entity_type=entity_type,
            project_id=publish_entity.project_id,
            comment_id=entity_identifier
            if entity_type == FileAsset.EntityTypeContext.COMMENT_DESCRIPTION.value
            else None,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(object_name=asset_key, file_type=type, file_size=size)
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
        publish_entity, publish_entity_type = self.get_publish_entity(anchor)
        # Check if the project is published
        if not publish_entity:
            return Response({"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND)

        # get the asset id
        asset = FileAsset.objects.get(id=pk, workspace=publish_entity.workspace)
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
        publish_entity, publish_entity_type = self.get_publish_entity(anchor)
        # Get the asset
        asset = FileAsset.objects.get(id=pk, workspace=publish_entity.workspace)

        # Delete check so some other other asset may not be deleted
        if (
            publish_entity_type == self.PublishEntityType.DEPLOY_BOARD
            and publish_entity.entity_name == "intake"
            and asset.entity_type != FileAsset.EntityTypeContext.ISSUE_DESCRIPTION
        ):
            return Response(
                {"error": "You are not allowed to delete this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # In the project, only the authenticated user can delete the asset if the asset is a comment description
        if (
            publish_entity_type == self.PublishEntityType.DEPLOY_BOARD
            and publish_entity.entity_name == "project"
            and asset.entity_type == FileAsset.EntityTypeContext.COMMENT_DESCRIPTION
            and not request.user.is_authenticated
        ):
            return Response(
                {"error": "You are not allowed to delete this asset."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check deleted assets
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        # Save the asset
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssetRestoreEndpoint(BaseAPIView):
    """Endpoint to restore a deleted assets."""

    def post(self, request, anchor, pk):
        # Get the deploy board
        deploy_board = DeployBoard.objects.filter(anchor=anchor, entity_name="project").first()
        # Check if the project is published
        if not deploy_board:
            return Response({"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND)

        # Get the asset
        asset = FileAsset.all_objects.get(id=pk, workspace=deploy_board.workspace)
        asset.is_deleted = False
        asset.deleted_at = None
        asset.save(update_fields=["is_deleted", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class EntityBulkAssetEndpoint(BaseAPIView):
    """Endpoint to bulk update assets."""

    def post(self, request, anchor, entity_id):
        # Get the deploy board
        deploy_board = DeployBoard.objects.filter(anchor=anchor, entity_name="project").first()
        # Check if the project is published
        if not deploy_board:
            return Response({"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND)

        asset_ids = request.data.get("asset_ids", [])

        # Check if the asset ids are provided
        if not asset_ids:
            return Response({"error": "No asset ids provided."}, status=status.HTTP_400_BAD_REQUEST)

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
