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
from plane.graphql.utils.feature_flag import validate_feature_flag
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.db.models import Workspace, Project, FileAsset
from plane.settings.storage import S3Storage
from plane.graphql.types.asset import (
    FileAssetType,
    AssetPresignedUrlResponseType,
    FileAssetAssetType,
    WorkspaceAssetEnumType,
)
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata


def get_entity_id_field(entity_type, entity_identifier):
    if entity_identifier is None:
        return {}

    if entity_type == WorkspaceAssetEnumType.WORKSPACE_LOGO.value:
        return {"workspace_id": entity_identifier}

    if entity_type == WorkspaceAssetEnumType.PROJECT_COVER.value:
        return {"project_id": entity_identifier}

    if entity_type == WorkspaceAssetEnumType.PAGE_DESCRIPTION.value:
        return {"page_id": entity_identifier}

    return {}


@sync_to_async
def get_workspace(slug):
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        return None


@sync_to_async
def create_asset(
    attributes, asset, size, workspace_id, user, entity_type, entity_identifier
) -> FileAssetType:
    asset_fields = {
        "attributes": attributes,
        "asset": asset,
        "size": size,
        "entity_type": entity_type,
        "workspace_id": workspace_id,
        "created_by": user,
    }

    return FileAsset.objects.create(
        **asset_fields, **get_entity_id_field(entity_type, entity_identifier)
    )


@sync_to_async
def delete_asset(asset_id):
    asset = FileAsset.objects.get(id=asset_id)
    if asset is None:
        return

    asset.is_deleted = True
    asset.deleted_at = timezone.now()
    asset.save(update_fields=["is_deleted", "deleted_at"])
    return


@sync_to_async
def create_asset_entity(entity_type, asset):
    if not asset:
        return

    if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
        workspace = Workspace.objects.filter(id=asset.workspace_id).first()
        if workspace is None:
            return

        if workspace.logo_asset_id:
            delete_asset(workspace.logo_asset_id)

        workspace.logo = ""
        workspace.logo_asset_id = asset.id
        workspace.save()
        return
    elif entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
        project = Project.objects.filter(id=asset.project_id).first()
        if project is None:
            return

        if project.cover_image_asset_id:
            delete_asset(project.cover_image_asset_id)

        project.cover_image = ""
        project.cover_image_asset_id = asset.id
        project.save()
        return
    else:
        return


@sync_to_async
def delete_asset_entity(entity_type, asset):
    if entity_type == FileAsset.EntityTypeContext.WORKSPACE_LOGO:
        workspace = Workspace.objects.get(id=asset.workspace_id)

        if workspace is None:
            return

        workspace.logo_asset_id = None
        workspace.save()
        return
    elif entity_type == FileAsset.EntityTypeContext.PROJECT_COVER:
        project = Project.objects.filter(id=asset.project_id).first()

        if project is None:
            return

        project.cover_image_asset_id = None
        project.save()
        return
    else:
        return


@strawberry.type
class WorkspaceAssetMutation:
    # asset entity create
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def create_workspace_asset(
        self,
        info: Info,
        slug: str,
        name: str,
        type: str,
        size: int,
        entity_type: WorkspaceAssetEnumType,
        entity_identifier: Optional[str] = None,
    ) -> AssetPresignedUrlResponseType:
        user = info.context.user

        # Checking if the entity type is valid
        if not entity_type or entity_type not in [
            WorkspaceAssetEnumType.WORKSPACE_LOGO,
            WorkspaceAssetEnumType.PROJECT_COVER,
            WorkspaceAssetEnumType.PAGE_DESCRIPTION,
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

        # Checking if the file size is within the limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        if entity_type in [
            WorkspaceAssetEnumType.WORKSPACE_LOGO.value,
            WorkspaceAssetEnumType.PROJECT_COVER.value,
        ]:
            size_limit = min(size, settings.FILE_SIZE_LIMIT)
        else:
            is_feature_flagged = await validate_feature_flag(
                slug=slug,
                user_id=str(user.id),
                feature_key=FeatureFlagsTypesEnum.FILE_SIZE_LIMIT_PRO.value,
            )
            if settings.IS_MULTI_TENANT and is_feature_flagged:
                size_limit = min(size, settings.PRO_FILE_SIZE_LIMIT)

        # Get the workspace
        workspace = await get_workspace(slug=slug)
        if workspace is None:
            message = "Workspace not found."
            error_extensions = {"code": "WORKSPACE_NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = await create_asset(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            user=user,
            entity_type=entity_type,
            entity_identifier=entity_identifier,
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
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def update_workspace_asset(
        self,
        info: Info,
        slug: str,
        asset_id: strawberry.ID,
        attributes: Optional[JSON] = None,
    ) -> bool:
        asset = await sync_to_async(FileAsset.objects.get)(
            workspace__slug=slug, id=asset_id
        )
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
        create_asset_entity(entity_type=asset.entity_type, asset=asset)

        # save the asset
        await sync_to_async(asset.save)(update_fields=["is_uploaded", "attributes"])

        return True

    # asset entity delete
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def delete_workspace_asset(
        self, info: Info, slug: str, asset_id: strawberry.ID
    ) -> bool:
        asset = await sync_to_async(FileAsset.objects.get)(
            workspace__slug=slug, id=asset_id
        )

        asset.is_deleted = True
        asset.deleted_at = timezone.now()

        # get the entity and save the asset id for the request field
        delete_asset_entity(entity_type=asset.entity_type, asset=asset)

        # save the asset
        await sync_to_async(asset.save)(update_fields=["is_deleted", "deleted_at"])

        return True
