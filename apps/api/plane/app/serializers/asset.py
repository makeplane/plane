# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import FileAsset


def validate_uploaded_file(file):
    """Check a file that a legacy multipart route is about to save to storage.

    The object is stored under the content type the client declares, so that type
    must be present and in the allowlist the presigned (v2) routes enforce.
    """
    if getattr(file, "content_type", None) not in settings.ATTACHMENT_MIME_TYPES:
        raise serializers.ValidationError("Invalid file type.")
    if file.size > settings.FILE_SIZE_LIMIT:
        raise serializers.ValidationError("File too large.")
    return file


class FileAssetSerializer(BaseSerializer):
    class Meta:
        model = FileAsset
        fields = "__all__"
        # Client may only supply `asset` and `attributes`; everything else is server-derived.
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "user",
            "workspace",
            "draft_issue",
            "project",
            "issue",
            "comment",
            "page",
            "entity_type",
            "entity_identifier",
            "is_deleted",
            "is_archived",
            "external_id",
            "external_source",
            "size",
            "is_uploaded",
            "storage_metadata",
        ]

    def validate_asset(self, value):
        return validate_uploaded_file(value)
