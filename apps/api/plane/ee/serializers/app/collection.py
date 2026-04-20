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

# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import BaseSerializer
from plane.ee.serializers.app.page import WorkspacePageLiteSerializer
from plane.db.models import User
from plane.db.models import Page
from plane.ee.models import Collection, CollectionMember, PageCollection


class CollectionSerializer(BaseSerializer):
    owned_by_id = serializers.PrimaryKeyRelatedField(source="owned_by", queryset=User.objects.all(), required=False)

    class Meta:
        model = Collection
        fields = [
            "id",
            "name",
            "owned_by_id",
            "access",
            "is_default",
            "is_global",
            "logo_props",
            "sort_order",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "workspace", "is_default", "created_at", "updated_at", "created_by", "updated_by"]


class CollectionMemberSerializer(BaseSerializer):
    class Meta:
        model = CollectionMember
        fields = [
            "id",
            "collection",
            "member",
            "access",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at", "created_by", "updated_by"]


class PageCollectionSerializer(BaseSerializer):
    class Meta:
        model = PageCollection
        fields = [
            "id",
            "collection",
            "page",
            "workspace",
            "sort_order",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at", "created_by", "updated_by"]


class PageCollectionCreateSerializer(serializers.Serializer):
    page_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    sort_orders = serializers.DictField(child=serializers.FloatField(), required=False, default=dict)

    def validate_sort_orders(self, value):
        normalized_sort_orders = {}

        for page_id, sort_order in value.items():
            try:
                normalized_sort_orders[str(uuid.UUID(str(page_id)))] = sort_order
            except (AttributeError, TypeError, ValueError) as exc:
                raise serializers.ValidationError("sort_orders keys must be valid page UUIDs.") from exc

        return normalized_sort_orders

    def validate(self, attrs):
        page_ids = {str(page_id) for page_id in attrs.get("page_ids", [])}
        sort_order_page_ids = set(attrs.get("sort_orders", {}).keys())

        if not sort_order_page_ids.issubset(page_ids):
            raise serializers.ValidationError(
                {"sort_orders": "sort_orders keys must reference page_ids in the payload."}
            )

        return attrs


class CollectionPageSearchSerializer(BaseSerializer):
    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "logo_props",
        ]


class CollectionBranchPageSerializer(WorkspacePageLiteSerializer):
    collection_id = serializers.UUIDField(read_only=True, allow_null=True)
    shared_access = serializers.IntegerField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    created_by = serializers.UUIDField(source="created_by_id", read_only=True, allow_null=True)
    updated_by = serializers.UUIDField(source="updated_by_id", read_only=True, allow_null=True)
    is_favorite = serializers.BooleanField(read_only=True)

    class Meta(WorkspacePageLiteSerializer.Meta):
        fields = WorkspacePageLiteSerializer.Meta.fields + [
            "collection_id",
            "shared_access",
            "created_at",
            "created_by",
            "updated_by",
            "is_favorite",
        ]


class CollectionPageLiteSerializer(BaseSerializer):
    page_collection_id = serializers.UUIDField(read_only=True, allow_null=True)
    collection_id = serializers.UUIDField(read_only=True, source="branch_collection_id")
    sort_order = serializers.FloatField(read_only=True, allow_null=True, source="branch_sort_order")
    page = CollectionBranchPageSerializer(source="*", read_only=True)

    class Meta:
        model = Page
        fields = [
            "page_collection_id",
            "collection_id",
            "parent_id",
            "sort_order",
            "page",
        ]
