# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Page


class PageAPISerializer(BaseSerializer):
    """
    Serializer for Page model exposed via the public v1 API.
    Provides read/write access to core page fields.
    """

    # name is required when creating a page via the API
    name = serializers.CharField(required=True, allow_blank=False)

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_html",
            "description_stripped",
            "owned_by",
            "access",
            "color",
            "parent",
            "is_locked",
            "is_global",
            "archived_at",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "view_props",
            "logo_props",
        ]
        read_only_fields = [
            "workspace",
            "owned_by",
            "created_by",
            "updated_by",
            "archived_at",
        ]
