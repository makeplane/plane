# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from .user import UserLiteSerializer, UserAdminLiteSerializer

from plane.db.models import (
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
    WorkspaceTheme,
    WorkspaceUserProperties,
    WorkspaceUserLink,
    WorkspaceHomePreference
)
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS

# Django imports
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

class WorkSpaceSerializer(DynamicBaseSerializer):
    owner = UserLiteSerializer(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    total_issues = serializers.IntegerField(read_only=True)
    logo_url = serializers.CharField(read_only=True)

    def validate_slug(self, value):
        # Check if the slug is restricted
        if value in RESTRICTED_WORKSPACE_SLUGS:
            raise serializers.ValidationError("Slug is not valid")
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


class WorkspaceLiteSerializer(BaseSerializer):
    class Meta:
        model = Workspace
        fields = ["name", "slug", "id"]
        read_only_fields = fields


class WorkSpaceMemberSerializer(DynamicBaseSerializer):
    member = UserLiteSerializer(read_only=True)
    workspace = WorkspaceLiteSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = "__all__"


class WorkspaceMemberMeSerializer(BaseSerializer):
    draft_issue_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = "__all__"


class WorkspaceMemberAdminSerializer(DynamicBaseSerializer):
    member = UserAdminLiteSerializer(read_only=True)
    workspace = WorkspaceLiteSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = "__all__"


class WorkSpaceMemberInviteSerializer(BaseSerializer):
    workspace = WorkSpaceSerializer(read_only=True)
    total_members = serializers.IntegerField(read_only=True)
    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")

    class Meta:
        model = WorkspaceMemberInvite
        fields = "__all__"
        read_only_fields = [
            "id",
            "email",
            "token",
            "workspace",
            "message",
            "responded_at",
            "created_at",
            "updated_at",
        ]


class WorkspaceThemeSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceTheme
        fields = "__all__"
        read_only_fields = ["workspace", "actor"]


class WorkspaceUserPropertiesSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceUserProperties
        fields = "__all__"
        read_only_fields = ["workspace", "user"]

class WorkspaceUserLinkSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceUserLink
        fields = "__all__"
        read_only_fields = ["workspace", "owner"]

    def to_internal_value(self, data):
        url = data.get("url", "")
        if url and not url.startswith(("http://", "https://")):
            data["url"] = "http://" + url
        
        return super().to_internal_value(data)

    def validate_url(self, value):
        url_validator = URLValidator()
        try:
            url_validator(value)
        except ValidationError:
            raise serializers.ValidationError({"error": "Invalid URL format."})

        return value


class WorkspaceHomePreferenceSerializer(BaseSerializer):
    class Meta: 
        model = WorkspaceHomePreference
        fields = "__all__"
        read_only_fields = ["workspace", "owner"]