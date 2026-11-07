# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .base import BaseSerializer
from plane.db.models import FileAsset


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
