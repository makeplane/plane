# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import MainTaskCategory, SubTaskCategory
from .base import BaseSerializer


class MainTaskCategorySerializer(BaseSerializer):
    class Meta:
        model = MainTaskCategory
        fields = ["id", "name", "description", "sort_order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubTaskCategorySerializer(BaseSerializer):
    class Meta:
        model = SubTaskCategory
        fields = [
            "id",
            "main_category",
            "name",
            "description",
            "sort_order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        main_category = attrs.get("main_category", getattr(self.instance, "main_category", None))
        if main_category and not main_category.is_active:
            raise serializers.ValidationError({"main_category": "Main category is not active."})
        return attrs
