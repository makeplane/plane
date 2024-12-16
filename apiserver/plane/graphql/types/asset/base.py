# Python imports
from typing import Optional
from enum import Enum

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# module imports
from plane.db.models import FileAsset


@strawberry_django.type(FileAsset)
class FileAssetType:
    id: strawberry.ID
    attributes: JSON
    asset: str
    entity_type: str
    size: float
    is_uploaded: bool
    storage_metadata: Optional[JSON]
    user: strawberry.ID
    workspace: strawberry.ID
    project: Optional[strawberry.ID]
    issue: Optional[strawberry.ID]
    comment: Optional[strawberry.ID]
    page: Optional[strawberry.ID]
    draft_issue: Optional[strawberry.ID]
    is_archived: bool
    is_deleted: bool
    deleted_at: Optional[str]
    created_by: Optional[strawberry.ID]
    updated_by: Optional[strawberry.ID]
    created_at: str
    updated_at: str
    # model properties
    asset_url: Optional[str]


@strawberry.enum
class UserAssetFileEnumType(Enum):
    IMAGE_JPEG = "image/jpeg"
    IMAGE_PNG = "image/png"
    IMAGE_WEBP = "image/webp"
    IMAGE_JPG = "image/jpg"
    IMAGE_GIF = "image/gif"

    def __str__(self):
        return self.value


@strawberry.type
class AssetPresignedUrlResponseType:
    upload_data: JSON
    asset_id: str
    asset_url: Optional[str]
