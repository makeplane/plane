# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Page


class PageCreateSerializer(BaseSerializer):
    """Serializer for creating pages via the v1 API."""

    class Meta:
        model = Page
        fields = [
            "name",
            "description_html",
            "color",
            "access",
            "parent",
            "external_source",
            "external_id",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "owned_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class PageUpdateSerializer(PageCreateSerializer):
    """
    Serializer for updating pages via the v1 API.

    Extends PageCreateSerializer for partial update support.
    """

    class Meta(PageCreateSerializer.Meta):
        pass


class PageSerializer(BaseSerializer):
    """
    Full read serializer for pages in the v1 API.

    Returns all page fields including description_html, lock status,
    archive state, and associated label/project IDs.
    """

    label_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True)
    project_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True)

    class Meta:
        model = Page
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "owned_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]
