# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from plane.db.models import MainTaskCategory, SubTaskCategory


class MainTaskCategorySerializer(BaseSerializer):
    class Meta:
        model = MainTaskCategory
        fields = ["id", "name", "description", "sort_order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubTaskCategorySerializer(BaseSerializer):
    class Meta:
        model = SubTaskCategory
        fields = ["id", "name", "main_category", "sort_order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
