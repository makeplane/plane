# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import FileAsset, FileCategory, FileFolder, FileTag

from .base import BaseSerializer


class FileFolderSerializer(BaseSerializer):
    file_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = FileFolder
        fields = [
            "id",
            "name",
            "parent",
            "workspace_id",
            "file_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace_id", "created_at", "updated_at"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Folder name cannot be empty")
        # Slashes would break the path-based browser
        if "/" in value or "\\" in value:
            raise serializers.ValidationError("Folder name cannot contain slashes")
        return value


class FileTagSerializer(BaseSerializer):
    file_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = FileTag
        fields = [
            "id",
            "name",
            "color",
            "workspace_id",
            "file_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace_id", "created_at", "updated_at"]

    def validate_name(self, value):
        workspace_id = self.context.get("workspace_id")
        tag = FileTag.objects.filter(workspace_id=workspace_id, name__iexact=value)
        if self.instance:
            tag = tag.exclude(id=self.instance.pk)
        if tag.exists():
            raise serializers.ValidationError("A tag with this name already exists in the workspace")
        return value


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
    tag_ids = serializers.SerializerMethodField()
    contract_id = serializers.SerializerMethodField()
    contract_processing_status = serializers.SerializerMethodField()

    class Meta:
        model = FileAsset
        fields = [
            "id",
            "attributes",
            "size",
            "is_uploaded",
            "workspace_id",
            "folder_id",
            "category_ids",
            "tag_ids",
            "contract_id",
            "contract_processing_status",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_category_ids(self, obj):
        # category_links uses the soft-delete-aware default manager
        return [str(link.category_id) for link in obj.category_links.all()]

    def get_tag_ids(self, obj):
        return [str(link.tag_id) for link in obj.tag_links.all()]

    def _contract(self, obj):
        # OneToOne reverse; relies on the view's select/prefetch of `contract`
        try:
            return obj.contract
        except Exception:
            return None

    def get_contract_id(self, obj):
        contract = self._contract(obj)
        return str(contract.id) if contract else None

    def get_contract_processing_status(self, obj):
        contract = self._contract(obj)
        return contract.processing_status if contract else None
