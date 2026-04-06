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

# Django imports
from django.conf import settings

# Module imports
from plane.db.models import FileAsset
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


# Entity types that only allow image MIME types
IMAGE_ONLY_ENTITY_TYPES = {
    FileAsset.EntityTypeContext.USER_AVATAR,
    FileAsset.EntityTypeContext.USER_COVER,
    FileAsset.EntityTypeContext.WORKSPACE_LOGO,
    FileAsset.EntityTypeContext.PROJECT_COVER,
    FileAsset.EntityTypeContext.CUSTOMER_LOGO,
    FileAsset.EntityTypeContext.OAUTH_APP_LOGO,
}

# Entity types that always use the base file size limit (no pro upgrade)
BASE_SIZE_LIMIT_ENTITY_TYPES = {
    FileAsset.EntityTypeContext.USER_AVATAR,
    FileAsset.EntityTypeContext.USER_COVER,
    FileAsset.EntityTypeContext.WORKSPACE_LOGO,
    FileAsset.EntityTypeContext.PROJECT_COVER,
    FileAsset.EntityTypeContext.CUSTOMER_LOGO,
    FileAsset.EntityTypeContext.OAUTH_APP_LOGO,
}

IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
]


def get_allowed_mime_types(entity_type, attachment_entity_types=None):
    """Return the allowed MIME types for a given entity type."""
    if entity_type in IMAGE_ONLY_ENTITY_TYPES:
        return IMAGE_MIME_TYPES

    # Optional endpoint-specific policy:
    # when provided, only listed entity types allow attachment MIME types;
    # all other entity types fall back to image-only MIME types.
    if attachment_entity_types is not None:
        if entity_type in attachment_entity_types:
            return settings.ATTACHMENT_MIME_TYPES
        return IMAGE_MIME_TYPES

    return settings.ATTACHMENT_MIME_TYPES


def validate_asset_type(asset_type, entity_type, attachment_entity_types=None):
    """
    Validate whether the given MIME type is allowed for the entity type.

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    allowed_types = get_allowed_mime_types(entity_type, attachment_entity_types=attachment_entity_types)

    if not asset_type:
        return False, "File type is required."

    if asset_type in allowed_types:
        return True, None

    # Allow all types if the setting is enabled (e.g. for self-hosted users who want to allow all types)
    if getattr(settings, "ALLOW_ALL_ATTACHMENT_TYPES", False):
        return True, None

    if entity_type in IMAGE_ONLY_ENTITY_TYPES:
        return False, "Invalid file type. Only JPEG, PNG, WebP, JPG and GIF files are allowed."

    return False, "Invalid file type."


def get_asset_size_limit(asset_size, entity_type, slug, user_id):
    """
    Calculate the effective file size limit based on entity type and workspace feature flags.

    Args:
        asset_size: The requested file size in bytes.
        entity_type: The entity type context string.
        slug: The workspace slug.
        user_id: The user ID (will be converted to str) if not None.

    Returns:
        int: The effective size limit (min of requested size and applicable limit).
    """
    # Logos and covers always use the base limit
    if entity_type in BASE_SIZE_LIMIT_ENTITY_TYPES:
        return min(asset_size, settings.FILE_SIZE_LIMIT)

    # Check if workspace has pro file size limit
    if not getattr(settings, "IS_SELF_MANAGED", False) and check_workspace_feature_flag(
        feature_key=FeatureFlag.FILE_SIZE_LIMIT_PRO,
        slug=slug,
        user_id=str(user_id) if user_id else None,
    ):
        return min(asset_size, settings.PRO_FILE_SIZE_LIMIT)

    return min(asset_size, settings.FILE_SIZE_LIMIT)
