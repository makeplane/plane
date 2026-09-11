# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Workspace
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.utils.content_validator import has_alphanumeric
from plane.utils.url import contains_url
from .base import BaseSerializer


class WorkspaceLiteSerializer(BaseSerializer):
    """
    Lightweight workspace serializer for minimal data transfer.

    Provides essential workspace identifiers including name, slug, and ID
    optimized for navigation, references, and performance-critical operations.
    """

    class Meta:
        model = Workspace
        fields = ["name", "slug", "id"]
        read_only_fields = fields


class WorkspaceSerializer(BaseSerializer):
    """
    Full workspace serializer for the public (token) API.

    Mirrors the internal app ``WorkSpaceSerializer`` so the token API enforces
    the exact same name limits, content checks, and slug rules. ``total_members``
    and ``role`` are read-only annotations populated by the viewset queryset;
    ``logo_url`` is a model property.
    """

    total_members = serializers.IntegerField(read_only=True)
    logo_url = serializers.CharField(read_only=True)
    role = serializers.IntegerField(read_only=True)

    def validate_name(self, value):
        # Reject names that embed a URL (mirrors the app serializer).
        if contains_url(value):
            raise serializers.ValidationError("Name must not contain URLs")
        # Reject symbol-only names like "-_________-" that carry no letter or
        # digit. Mirrors the frontend HAS_ALPHANUMERIC_REGEX check so the rule
        # cannot be bypassed via a direct API call.
        if not has_alphanumeric(value):
            raise serializers.ValidationError("Name must contain at least one letter or number")
        return value

    def validate_slug(self, value):
        # Reject reserved slugs that collide with first-class routes.
        if value in RESTRICTED_WORKSPACE_SLUGS:
            raise serializers.ValidationError("Slug is not valid")
        # Slug may only contain alphanumeric characters, hyphens, and underscores.
        if not re.match(r"^[a-zA-Z0-9_-]+$", value):
            raise serializers.ValidationError(
                "Slug can only contain letters, numbers, hyphens (-), and underscores (_)"
            )
        return value

    class Meta:
        model = Workspace
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "owner",
            "logo_url",
        ]
