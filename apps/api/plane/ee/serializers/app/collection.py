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

# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import BaseSerializer
from plane.db.models import User
from plane.ee.models import Collection, CollectionMember, PageCollection


class CollectionSerializer(BaseSerializer):
    owned_by_id = serializers.PrimaryKeyRelatedField(
        source="owned_by", queryset=User.objects.all(), required=False
    )

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
