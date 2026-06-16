# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third Party Imports
from rest_framework import serializers
from django.utils.text import slugify

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import Workspace
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS


class WorkspaceSerializer(BaseSerializer):
    owner = UserLiteSerializer(read_only=True)
    logo_url = serializers.CharField(read_only=True)
    total_projects = serializers.IntegerField(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    slug = serializers.CharField(max_length=48)

    def validate_slug(self, value):
        normalized_slug = slugify(value)
        if not normalized_slug:
            raise serializers.ValidationError("Slug is not valid")
        # Check if the slug is restricted
        if normalized_slug in RESTRICTED_WORKSPACE_SLUGS:
            raise serializers.ValidationError("Slug is not valid")
        # Check uniqueness case-insensitively
        if Workspace.objects.filter(slug__iexact=normalized_slug).exists():
            raise serializers.ValidationError("Slug is already in use")
        return normalized_slug

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
