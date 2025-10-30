# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import FileAsset


class UserAssetUploadSerializer(serializers.Serializer):
    """
    Serializer for user asset upload requests.

    This serializer validates the metadata required to generate a presigned URL
    for uploading user profile assets (avatar or cover image) directly to S3 storage.
    Supports JPEG, PNG, WebP, JPG, and GIF image formats with size validation.
    """

    name = serializers.CharField(help_text="Original filename of the asset")
    type = serializers.ChoiceField(
        choices=[
            ("image/jpeg", "JPEG"),
            ("image/png", "PNG"),
            ("image/webp", "WebP"),
            ("image/jpg", "JPG"),
            ("image/gif", "GIF"),
        ],
        default="image/jpeg",
        help_text="MIME type of the file",
        style={"placeholder": "image/jpeg"},
    )
    size = serializers.IntegerField(help_text="File size in bytes")
    entity_type = serializers.ChoiceField(
        choices=[
            (FileAsset.EntityTypeContext.USER_AVATAR, "User Avatar"),
            (FileAsset.EntityTypeContext.USER_COVER, "User Cover"),
        ],
        help_text="Type of user asset",
    )


class AssetUpdateSerializer(serializers.Serializer):
    """
    Serializer for asset status updates after successful upload completion.

    Handles post-upload asset metadata updates including attribute modifications
    and upload confirmation for S3-based file storage workflows.
    """

    attributes = serializers.JSONField(required=False, help_text="Additional attributes to update for the asset")


class GenericAssetUploadSerializer(serializers.Serializer):
    """
    Serializer for generic asset upload requests with project association.

    Validates metadata for generating presigned URLs for workspace assets including
    project association, external system tracking, and file validation for
    document management and content storage workflows.
    """

    name = serializers.CharField(help_text="Original filename of the asset")
    type = serializers.CharField(required=False, help_text="MIME type of the file")
    size = serializers.IntegerField(help_text="File size in bytes")
    project_id = serializers.UUIDField(
        required=False,
        help_text="UUID of the project to associate with the asset",
        style={"placeholder": "123e4567-e89b-12d3-a456-426614174000"},
    )
    external_id = serializers.CharField(
        required=False,
        help_text="External identifier for the asset (for integration tracking)",
    )
    external_source = serializers.CharField(
        required=False, help_text="External source system (for integration tracking)"
    )


class GenericAssetUpdateSerializer(serializers.Serializer):
    """
    Serializer for generic asset upload confirmation and status management.

    Handles post-upload status updates for workspace assets including
    upload completion marking and metadata finalization.
    """

    is_uploaded = serializers.BooleanField(default=True, help_text="Whether the asset has been successfully uploaded")


class FileAssetSerializer(BaseSerializer):
    """
    Comprehensive file asset serializer with complete metadata and URL generation.

    Provides full file asset information including storage metadata, access URLs,
    relationship data, and upload status for complete asset management workflows.
    """

    asset_url = serializers.CharField(read_only=True)

    class Meta:
        model = FileAsset
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "issue",
            "comment",
            "page",
            "draft_issue",
            "user",
            "is_deleted",
            "deleted_at",
            "storage_metadata",
            "asset_url",
        ]
