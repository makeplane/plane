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
import json
import uuid

# Django imports
from django.utils import timezone
from django.http import HttpResponseRedirect
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.settings.storage import S3Storage
from plane.payment.flags.flag import FeatureFlag
from plane.db.models import FileAsset, Workspace
from plane.permissions import can, InitiativeAttachmentPermissions, get_permission_conditions, ResourceType
from plane.ee.serializers import InitiativeAttachmentSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.utils.asset import validate_asset_type, get_asset_size_limit


class InitiativeAttachmentEndpoint(BaseAPIView):
    use_read_replica = True

    serializer_class = InitiativeAttachmentSerializer
    model = FileAsset

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(
        InitiativeAttachmentPermissions.CREATE,
        resource_param="initiative_id",
        scope_param_type=ResourceType.INITIATIVE,
    )
    def post(
        self,
        request,
        slug,
        initiative_id,
    ):
        name = request.data.get("name")
        type = request.data.get("type", False)
        size = request.data.get("size")

        # Check if the request is valid
        if not name or not size:
            return Response(
                {
                    "error": "Invalid request.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file type
        is_valid, error_msg = validate_asset_type(type, FileAsset.EntityTypeContext.INITIATIVE_ATTACHMENT)
        if not is_valid:
            return Response(
                {"error": error_msg, "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate file size limit
        size_limit = get_asset_size_limit(
            size, FileAsset.EntityTypeContext.INITIATIVE_ATTACHMENT, slug, request.user.id
        )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={
                "name": name,
                "type": type,
                "size": size_limit,
            },
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.INITIATIVE_ATTACHMENT,
            entity_identifier=initiative_id,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size_limit,
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "attachment": InitiativeAttachmentSerializer(asset).data,
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(
        InitiativeAttachmentPermissions.DELETE,
        resource_param="initiative_id",
        scope_param_type=ResourceType.INITIATIVE,
        defer_conditions=True,
    )
    def delete(self, request, slug, initiative_id, pk):
        initiative_attachment = FileAsset.objects.get(pk=pk, workspace__slug=slug, entity_identifier=initiative_id)
        # Check deferred creator condition (Member has delete+creator grant)
        conditions = get_permission_conditions(request)
        if 'creator' in conditions and initiative_attachment.created_by_id != request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete this attachment")
        initiative_attachment.is_deleted = True
        initiative_attachment.deleted_at = timezone.now()
        initiative_attachment.save()

        initiative_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            initiative_id=str(initiative_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            slug=slug,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativeAttachmentPermissions.VIEW, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)
    def get(self, request, slug, initiative_id, pk=None):
        if pk:
            # Get the asset
            asset = FileAsset.objects.get(id=pk, workspace__slug=slug, entity_identifier=initiative_id)

            # Check if the asset is uploaded
            if not asset.is_uploaded:
                return Response(
                    {
                        "error": "The asset is not uploaded.",
                        "status": False,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            storage = S3Storage(request=request)
            presigned_url = storage.generate_presigned_url(
                object_name=asset.asset.name,
                disposition="attachment",
                filename=asset.attributes.get("name"),
            )
            return HttpResponseRedirect(presigned_url)

        # Get all the attachments
        initiative_attachments = FileAsset.objects.filter(
            entity_identifier=initiative_id,
            entity_type=FileAsset.EntityTypeContext.INITIATIVE_ATTACHMENT,
            workspace__slug=slug,
            is_uploaded=True,
        )
        # Serialize the attachments
        serializer = InitiativeAttachmentSerializer(initiative_attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativeAttachmentPermissions.EDIT, resource_param="initiative_id", scope_param_type=ResourceType.INITIATIVE)
    def patch(self, request, slug, initiative_id, pk):
        initiative_attachment = FileAsset.objects.get(pk=pk, workspace__slug=slug, entity_identifier=initiative_id)
        serializer = InitiativeAttachmentSerializer(initiative_attachment)

        # Send this activity only if the attachment is not uploaded before
        if not initiative_attachment.is_uploaded:
            initiative_activity.delay(
                type="attachment.activity.created",
                slug=slug,
                requested_data=None,
                actor_id=str(self.request.user.id),
                initiative_id=str(self.kwargs.get("initiative_id", None)),
                current_instance=json.dumps(
                    serializer.data,
                    cls=DjangoJSONEncoder,
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )

            # Update the attachment
            initiative_attachment.is_uploaded = True
            initiative_attachment.created_by = request.user

        # Get the storage metadata
        if not initiative_attachment.storage_metadata:
            get_asset_object_metadata.delay(str(initiative_attachment.id))
        initiative_attachment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
