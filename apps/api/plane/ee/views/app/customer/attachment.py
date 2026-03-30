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

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from django.http import HttpResponseRedirect

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import CustomerRequestAttachmentV2Serializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.db.models import Workspace, FileAsset
from plane.utils.asset import validate_asset_type, get_asset_size_limit
from plane.settings.storage import S3Storage
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.app.permissions import WorkSpaceAdminPermission


class CustomerRequestAttachmentV2Endpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [WorkSpaceAdminPermission]

    serializer_class = CustomerRequestAttachmentV2Serializer

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def get(self, request, slug, customer_request_id, pk=None):
        if pk:
            # Get the asset
            asset = FileAsset.objects.get(id=pk, workspace__slug=slug, entity_identifier=customer_request_id)

            if not asset.is_uploaded:
                return Response(
                    {"error": "The asset is not uploaded.", "status": False},
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
        customer_request_attachments = FileAsset.objects.filter(
            entity_identifier=customer_request_id,
            entity_type=FileAsset.EntityTypeContext.CUSTOMER_REQUEST_ATTACHMENT,
            workspace__slug=slug,
            is_uploaded=True,
        )

        # Serializer the attachments
        serializer = self.serializer_class(customer_request_attachments, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def post(self, request, slug):
        name = request.data.get("name")
        type = request.data.get("type", False)
        size = request.data.get("size")
        customer_request_id = request.query_params.get("customer_request_id")

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
        is_valid, error_msg = validate_asset_type(type, FileAsset.EntityTypeContext.CUSTOMER_REQUEST_ATTACHMENT)
        if not is_valid:
            return Response(
                {"error": error_msg, "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate file size limit
        size_limit = get_asset_size_limit(
            size, FileAsset.EntityTypeContext.CUSTOMER_REQUEST_ATTACHMENT, slug, request.user.id
        )

        workspace = Workspace.objects.get(slug=slug)

        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.CUSTOMER_REQUEST_ATTACHMENT,
            entity_identifier=customer_request_id,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)

        # Generate a presigned URl to share an S3 object
        presigned_url = storage.generate_presigned_post(object_name=asset_key, file_type=type, file_size=size_limit)

        # Return presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "attachment": self.serializer_class(asset).data,
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.CUSTOMERS)
    def patch(self, request, slug, customer_request_id):
        attachment_ids = request.data.get("attachment_ids")

        attachments = FileAsset.objects.filter(pk__in=attachment_ids, workspace__slug=slug)

        for attachment in attachments:
            attachment.entity_identifier = customer_request_id
            attachment.is_uploaded = True
            attachment.created_by = request.user

            if not attachment.storage_metadata:
                get_asset_object_metadata.delay(str(attachment.id))

        FileAsset.objects.bulk_update(attachments, ["entity_identifier", "is_uploaded"], batch_size=100)

        serializer = self.serializer_class(attachments, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    def delete(self, request, slug, pk):
        customer_request_attachment = FileAsset.objects.get(pk=pk, workspace__slug=slug)

        customer_request_attachment.is_deleted = True
        customer_request_attachment.deleted_at = timezone.now()
        customer_request_attachment.save()

        return Response(status=status.HTTP_204_NO_CONTENT)
