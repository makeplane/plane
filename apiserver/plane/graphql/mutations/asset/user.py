# Python imports
import uuid
from typing import Optional

# Django imports
from django.conf import settings
from django.utils import timezone

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension
from strawberry.exceptions import GraphQLError

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.graphql.permissions.workspace import IsAuthenticated
from plane.db.models import FileAsset, User
from plane.settings.storage import S3Storage
from plane.graphql.types.asset import (
    FileAssetType,
    AssetPresignedUrlResponseType,
    FileAssetAssetType,
    UserAssetEnumType,
)
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata


# asset delete
@sync_to_async
def delete_asset(asset_id: int) -> dict:
    asset = FileAsset.objects.get(id=asset_id)

    if asset is None:
        return

    asset.is_deleted = True
    asset.deleted_at = timezone.now()
    asset.save(update_fields=["is_deleted", "deleted_at"])
    return


@sync_to_async
def create_asset(attributes, asset, size, entity_type, user) -> FileAssetType:
    return FileAsset.objects.create(
        attributes=attributes,
        asset=asset,
        size=size,
        entity_type=entity_type,
        user=user,
        created_by=user,
    )


# update user asset entity
@sync_to_async
def update_asset_entity(asset_id: str, asset, entity_type: UserAssetEnumType) -> dict:
    user = User.objects.get(id=asset.user_id)

    if entity_type == UserAssetEnumType.USER_AVATAR.value:
        user.avatar = ""

        if user.avatar_asset_id:
            delete_asset(user.avatar_asset_id)

        user.avatar_asset_id = asset_id
        user.save()
        return

    if entity_type == UserAssetEnumType.USER_COVER.value:
        user.cover_image = None

        if user.cover_image_asset_id:
            delete_asset(user.cover_image_asset_id)

        user.cover_image_asset_id = asset_id
        user.save()
        return


# delete user asset entity
@sync_to_async
def delete_asset_entity(asset, entity_type: UserAssetEnumType) -> dict:
    user = User.objects.get(id=asset.user_id)

    if entity_type == UserAssetEnumType.USER_AVATAR.value:
        user.avatar_asset_id = None
        user.save()
        return

    if entity_type == UserAssetEnumType.USER_COVER.value:
        user.cover_image_asset_id = None
        user.save()
        return


@strawberry.type
class UserAssetMutation:
    # asset entity create
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def create_user_asset(
        self,
        info: Info,
        name: str,
        type: str,
        size: int,
        entity_type: UserAssetEnumType,
    ) -> AssetPresignedUrlResponseType:
        user = info.context.user

        # Checking if the file size is within the limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        # Checking if the entity type is valid
        if not entity_type or entity_type not in [
            UserAssetEnumType.USER_AVATAR,
            UserAssetEnumType.USER_COVER,
        ]:
            message = "Invalid entity type."
            error_extensions = {"code": "INVALID_ENTITY_TYPE", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # Checking if the file type is valid
        allowed_types = [
            FileAssetAssetType.IMAGE_JPEG.value,
            FileAssetAssetType.IMAGE_PNG.value,
            FileAssetAssetType.IMAGE_WEBP.value,
            FileAssetAssetType.IMAGE_JPG.value,
            FileAssetAssetType.IMAGE_GIF.value,
        ]
        if type not in allowed_types:
            message = "Invalid file type. Only JPEG and PNG files are allowed."
            error_extensions = {"code": "INVALID_FILE_TYPE", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        asset_key = f"{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = await create_asset(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            entity_type=entity_type,
            user=user,
        )

        # Get the presigned URL
        storage = S3Storage(request=info.context["request"])

        # Generate a presigned URL to share an S3 object
        presigned_url = await sync_to_async(storage.generate_presigned_post)(
            object_name=asset_key, file_type=type, file_size=size_limit
        )

        # Return the presigned URL
        return AssetPresignedUrlResponseType(
            upload_data=presigned_url, asset_id=str(asset.id), asset_url=asset.asset_url
        )

    # asset entity update
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def update_user_asset(
        self, info: Info, asset_id: strawberry.ID, attributes: Optional[JSON] = None
    ) -> bool:
        user = info.context.user

        asset = await sync_to_async(FileAsset.objects.get)(id=asset_id, user_id=user.id)
        asset.is_uploaded = True

        # update the attributes
        if attributes is not None:
            asset.attributes = attributes
        else:
            asset.attributes = asset.attributes

        # get the storage metadata
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(asset_id))

        # get the entity and save the asset id for the request field
        await update_asset_entity(
            asset_id=asset_id, asset=asset, entity_type=asset.entity_type
        )

        # save the asset
        await sync_to_async(asset.save)(update_fields=["is_uploaded", "attributes"])
        return True

    # asset entity delete
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def delete_user_asset(self, info: Info, asset_id: strawberry.ID) -> bool:
        user = info.context.user

        asset = await sync_to_async(FileAsset.objects.get)(id=asset_id, user_id=user.id)
        asset.is_deleted = True
        asset.deleted_at = timezone.now()

        # get the entity and save the asset id for the request field
        await delete_asset_entity(asset=asset, entity_type=asset.entity_type)

        asset.save(update_fields=["is_deleted", "deleted_at"])
        return True
