# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third Party Imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import Workspace
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.utils.content_validator import has_alphanumeric
from plane.utils.url import contains_url


class WorkspaceSerializer(BaseSerializer):
    owner = UserLiteSerializer(read_only=True)
    logo_url = serializers.CharField(read_only=True)
    total_projects = serializers.IntegerField(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    research_purpose = serializers.CharField(source="research_setting.purpose", read_only=True)
    research_enabled = serializers.BooleanField(source="research_setting.module_enabled", read_only=True)
    main_pi = serializers.UUIDField(source="research_setting.main_pi_id", read_only=True)
    private_access_users = serializers.SerializerMethodField()

    def get_private_access_users(self, obj):
        setting = getattr(obj, "research_setting", None)
        if setting is None:
            return []
        return sorted(str(grant.user_id) for grant in setting.private_access_grants.all())

    def validate_name(self, value):
        # Check if the name contains a URL (kept consistent with the app-level
        # WorkSpaceSerializer so both workspace-create paths validate alike).
        if contains_url(value):
            raise serializers.ValidationError("Name must not contain URLs")
        # Reject symbol-only names like "-_________-" that have no letter or
        # digit. Mirrors the frontend HAS_ALPHANUMERIC_REGEX check so the rule
        # cannot be bypassed via a direct API call.
        if not has_alphanumeric(value):
            raise serializers.ValidationError("Name must contain at least one letter or number")
        return value

    def validate_slug(self, value):
        # Check if the slug is restricted
        if value in RESTRICTED_WORKSPACE_SLUGS:
            raise serializers.ValidationError("Slug is not valid")
        # Check uniqueness case-insensitively
        if Workspace.objects.filter(slug__iexact=value).exists():
            raise serializers.ValidationError("Slug is already in use")
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
