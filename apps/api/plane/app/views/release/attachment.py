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
from django.conf import settings
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import FileAsset, Workspace, ReleaseAttachment
from plane.app.serializers.release import ReleaseAttachmentSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.settings.storage import S3Storage


class ReleaseAttachmentEndpoint(BaseAPIView):
    use_read_replica = True

    serializer_class = ReleaseAttachmentSerializer
    model = FileAsset

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, release_id):
        attachments = ReleaseAttachment.objects.filter(release_id=release_id, workspace__slug=slug).select_related(
            "attachment"
        )

        results = []
        for ra in attachments:
            asset = ra.attachment
            results.append(
                {
                    "id": str(ra.id),
                    "asset_id": str(asset.id),
                    "is_artifact": ra.is_artifact,
                    "attributes": asset.attributes,
                    "asset_url": asset.asset_url,
                    "size": asset.size,
                    "created_at": ra.created_at,
                    "created_by": str(ra.created_by_id) if ra.created_by_id else None,
                }
            )

        return Response(results, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, release_id):
        name = request.data.get("name")
        type = request.data.get("type", False)
        size = request.data.get("size")
        is_artifact = request.data.get("is_artifact", False)

        if not name or not size:
            return Response(
                {"error": "Invalid request.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        if not type or type not in settings.ATTACHMENT_MIME_TYPES:
            return Response(
                {"error": "Invalid file type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            entity_identifier=release_id,
        )

        ReleaseAttachment.objects.create(
            release_id=release_id,
            attachment=asset,
            is_artifact=is_artifact,
            workspace_id=workspace.id,
            created_by=request.user,
            updated_by=request.user,
        )

        storage = S3Storage(request=request)
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size_limit,
        )

        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN], creator=True, model=ReleaseAttachment, level="WORKSPACE")
    def delete(self, request, slug, release_id, pk):
        release_attachment = ReleaseAttachment.objects.get(pk=pk, release_id=release_id, workspace__slug=slug)
        asset = release_attachment.attachment
        asset.is_deleted = True
        asset.deleted_at = timezone.now()
        asset.save()
        release_attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
