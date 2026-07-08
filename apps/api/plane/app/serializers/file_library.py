# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import FileAsset, FileCategory

from .base import BaseSerializer


class FileCategorySerializer(BaseSerializer):
    file_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = FileCategory
        fields = [
            "id",
            "name",
            "description",
            "color",
            "is_default",
            "pdf_only",
            "workspace_id",
            "file_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace_id", "is_default", "pdf_only", "created_at", "updated_at"]

    def validate_name(self, value):
        workspace_id = self.context.get("workspace_id")
        category = FileCategory.objects.filter(workspace_id=workspace_id, name__iexact=value)
        if self.instance:
            category = category.exclude(id=self.instance.pk)
        if category.exists():
            raise serializers.ValidationError("A category with this name already exists in the workspace")
        return value


class FileLibraryAssetSerializer(BaseSerializer):
    category_ids = serializers.SerializerMethodField()

    class Meta:
        model = FileAsset
        fields = [
            "id",
            "attributes",
            "size",
            "is_uploaded",
            "workspace_id",
            "category_ids",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_category_ids(self, obj):
        # category_links uses the soft-delete-aware default manager
        return [str(link.category_id) for link in obj.category_links.all()]
