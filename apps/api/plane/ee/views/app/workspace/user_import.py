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

"""User CSV Import Endpoint."""

from typing import Optional
import logging

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import allow_permission, ROLE
from plane.app.views.base import BaseAPIView
from plane.settings.storage import S3Storage
from plane.db.models import Workspace, FileAsset
from plane.utils.porters import DataImporter, CSVFormatter, UserImportSerializer

logger = logging.getLogger("plane.api")


def fetch_file_from_storage(file_key: str) -> Optional[str]:
    """Fetch file content from S3 storage."""
    try:
        storage = S3Storage(request=None)
        response = storage.s3_client.get_object(
            Bucket=storage.aws_storage_bucket_name,
            Key=file_key,
        )
        file_content = response["Body"].read()
        if isinstance(file_content, bytes):
            return file_content.decode("utf-8")
        return file_content
    except Exception as e:
        logger.error(f"Failed to fetch file from S3: {e}")
        return None


class WorkspaceMembersImportEndpoint(BaseAPIView):
    """Import users from CSV synchronously."""

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        asset_id = request.data.get("asset_id")
        if not asset_id:
            return Response({"error": "asset_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.get(slug=slug)
        asset = FileAsset.objects.filter(id=asset_id, workspace=workspace, is_uploaded=True).first()
        if not asset:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)

        content = fetch_file_from_storage(asset.asset.name)
        if not content:
            return Response({"error": "Failed to fetch CSV file"}, status=status.HTTP_400_BAD_REQUEST)

        context = {
            "workspace_id": str(workspace.id),
            "created_by_id": str(request.user.id),
        }

        importer = DataImporter(UserImportSerializer, context=context)
        result = importer.from_string(content, CSVFormatter())

        # Build response from result
        users_created = 0
        wm_created = 0
        for item in result.created.values():
            if isinstance(item, dict):
                if item.get("user_created"):
                    users_created += 1
                if item.get("workspace_member_created"):
                    wm_created += 1

        return Response(
            {
                "total_rows": result.total,
                "successful": result.success_count,
                "failed": result.error_count,
                "users_created": users_created,
                "workspace_members_created": wm_created,
                "errors": result.errors if result.has_errors else [],
            }
        )
