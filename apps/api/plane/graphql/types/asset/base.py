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

# Python imports
from datetime import datetime
from enum import Enum
from typing import Optional

# Third-party library imports
import strawberry
import strawberry_django

# Strawberry imports
from strawberry.scalars import JSON
from strawberry.types import Info

# module imports
from plane.db.models import FileAsset
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry.enum
class FileAssetAssetType(Enum):
    IMAGE_JPEG = "image/jpeg"
    IMAGE_PNG = "image/png"
    IMAGE_WEBP = "image/webp"
    IMAGE_JPG = "image/jpg"
    IMAGE_GIF = "image/gif"

    def __str__(self):
        return self.value


@strawberry.enum
class FileAssetEntityType(Enum):
    USER_COVER = "USER_COVER"
    USER_AVATAR = "USER_AVATAR"

    WORKSPACE_LOGO = "WORKSPACE_LOGO"

    PROJECT_COVER = "PROJECT_COVER"
    PROJECT_DESCRIPTION = "PROJECT_DESCRIPTION"
    PROJECT_ATTACHMENT = "PROJECT_ATTACHMENT"

    PAGE_DESCRIPTION = "PAGE_DESCRIPTION"

    ISSUE_DESCRIPTION = "ISSUE_DESCRIPTION"
    DRAFT_ISSUE_DESCRIPTION = "DRAFT_ISSUE_DESCRIPTION"
    COMMENT_DESCRIPTION = "COMMENT_DESCRIPTION"
    ISSUE_ATTACHMENT = "ISSUE_ATTACHMENT"
    DRAFT_ISSUE_ATTACHMENT = "DRAFT_ISSUE_ATTACHMENT"

    INITIATIVE_DESCRIPTION = "INITIATIVE_DESCRIPTION"
    INITIATIVE_ATTACHMENT = "INITIATIVE_ATTACHMENT"
    INITIATIVE_COMMENT_DESCRIPTION = "INITIATIVE_COMMENT_DESCRIPTION"

    TEAM_SPACE_DESCRIPTION = "TEAM_SPACE_DESCRIPTION"
    TEAM_SPACE_COMMENT_DESCRIPTION = "TEAM_SPACE_COMMENT_DESCRIPTION"

    def __str__(self):
        return self.value


@strawberry_django.type(FileAsset)
class FileAssetType:
    id: strawberry.ID
    attributes: JSON
    asset: str
    size: float
    entity_type: FileAssetEntityType
    entity_identifier: Optional[strawberry.ID]
    storage_metadata: Optional[JSON]
    user: strawberry.ID
    workspace: strawberry.ID
    draft_issue: Optional[strawberry.ID]
    project: Optional[strawberry.ID]
    issue: Optional[strawberry.ID]
    comment: Optional[strawberry.ID]
    page: Optional[strawberry.ID]
    is_uploaded: bool
    is_archived: bool
    is_deleted: bool
    deleted_at: Optional[str]
    external_id: Optional[strawberry.ID]
    external_source: Optional[str]
    created_by: Optional[strawberry.ID]
    updated_by: Optional[strawberry.ID]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    # model properties
    asset_url: Optional[str]

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id

    @strawberry.field
    def created_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info: Info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date


@strawberry.type
class AssetPresignedUrlResponseType:
    upload_data: JSON
    asset_id: str
    asset_url: Optional[str]
