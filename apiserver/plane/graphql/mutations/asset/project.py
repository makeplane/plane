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
from plane.graphql.permissions.project import ProjectBasePermission
from plane.db.models import Workspace, Project, FileAsset
from plane.settings.storage import S3Storage
from plane.graphql.types.asset import (
    FileAssetType,
    AssetPresignedUrlResponseType,
    FileAssetAssetType,
    ProjectAssetEnumType,
)
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata


@sync_to_async
def get_project(project_id):
    return Project.objects.get(id=project_id)


@sync_to_async
def save_project_cover(project, asset_id):
    project.cover_image_asset_id = asset_id
    project.save()


@sync_to_async
def get_assets_by_ids(slug, asset_ids):
    return list(FileAsset.objects.filter(workspace__slug=slug, id__in=asset_ids))


def get_entity_id_field(entity_type, entity_identifier):
    if entity_type == ProjectAssetEnumType.PROJECT_COVER.value:
        return {"project_id": entity_identifier}

    if entity_type == ProjectAssetEnumType.PAGE_DESCRIPTION.value:
        return {"page_id": entity_identifier}

    if entity_type == ProjectAssetEnumType.ISSUE_DESCRIPTION.value:
        return {"issue_id": entity_identifier}

    if entity_type == ProjectAssetEnumType.DRAFT_ISSUE_DESCRIPTION.value:
        return {"draft_issue_id": entity_identifier}

    if entity_type == ProjectAssetEnumType.COMMENT_DESCRIPTION.value:
        return {"comment_id": entity_identifier}

    return {}


@sync_to_async
def create_asset(
    attributes,
    asset,
    size,
    workspace_id,
    user,
    project_id,
    entity_type,
    entity_identifier,
) -> FileAssetType:
    asset_fields = {
        "attributes": attributes,
        "asset": asset,
        "size": size,
        "entity_type": entity_type,
        "workspace_id": workspace_id,
        "created_by": user,
    }

    if entity_type != ProjectAssetEnumType.PROJECT_COVER.value:
        asset_fields["project_id"] = project_id

    return FileAsset.objects.create(
        **asset_fields, **get_entity_id_field(entity_type, entity_identifier)
    )


@strawberry.type
class ProjectAssetMutation:
    # asset entity create
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def create_project_asset(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        name: str,
        type: str,
        size: int,
        entity_type: ProjectAssetEnumType,
        entity_identifier: Optional[str] = None,
    ) -> AssetPresignedUrlResponseType:
        user = info.context.user

        # Checking if the entity type is valid
        if not entity_type or entity_type not in [
            ProjectAssetEnumType.PROJECT_COVER,
            ProjectAssetEnumType.PAGE_DESCRIPTION,
            ProjectAssetEnumType.ISSUE_DESCRIPTION,
            ProjectAssetEnumType.DRAFT_ISSUE_DESCRIPTION,
            ProjectAssetEnumType.ISSUE_ATTACHMENT,
            ProjectAssetEnumType.DRAFT_ISSUE_ATTACHMENT,
            ProjectAssetEnumType.COMMENT_DESCRIPTION,
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

        if entity_type in [ProjectAssetEnumType.PROJECT_COVER.value]:
            size_limit = min(size, settings.FILE_SIZE_LIMIT)
        else:
            is_feature_flagged = await validate_feature_flag(
                slug=slug,
                user_id=str(user.id),
                feature_key=FeatureFlagsTypesEnum.FILE_SIZE_LIMIT_PRO.value,
            )
            if is_feature_flagged:
                size_limit = min(size, settings.PRO_FILE_SIZE_LIMIT)

        # Get the workspace
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)

        # Get the project details
        project_details = await sync_to_async(Project.objects.get)(id=project)

        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = await create_asset(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            user=user,
            project_id=project_details.id,
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
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def update_project_asset(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        asset_id: strawberry.ID,
        attributes: Optional[JSON] = None,
    ) -> bool:
        asset = await sync_to_async(FileAsset.objects.get)(id=asset_id)
        asset.is_uploaded = True

        # update the attributes
        if attributes is not None:
            asset.attributes = attributes
        else:
            asset.attributes = asset.attributes

        # get the storage metadata
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(asset_id))

        # save the asset
        await sync_to_async(asset.save)(update_fields=["is_uploaded", "attributes"])

        return True

    # asset entity delete
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def delete_project_asset(
        self, info: Info, slug: str, project: strawberry.ID, asset_id: strawberry.ID
    ) -> bool:
        asset = await sync_to_async(FileAsset.objects.get)(
            workspace__slug=slug, project_id=project, id=asset_id
        )

        asset.is_deleted = True
        asset.deleted_at = timezone.now()

        # save the asset
        await sync_to_async(asset.save)(update_fields=["is_deleted", "deleted_at"])

        return True

    # asset entity update
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def update_project_asset_entity(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        entity_id: strawberry.ID,
        asset_ids: list[strawberry.ID],
    ) -> bool:
        if not asset_ids:
            message = "Asset not found."
            error_extensions = {"code": "ASSET_NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        assets = await get_assets_by_ids(slug, asset_ids)

        if not assets:
            message = "No assets found matching the given IDs."
            error_extensions = {"code": "NO_ASSETS_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        # Get the first asset
        asset = assets[0]

        if asset.entity_type == ProjectAssetEnumType.PROJECT_COVER.value:
            for asset in assets:
                # updating the asset with the project id
                asset.project_id = project
                await sync_to_async(asset.save)(update_fields=["project_id"])
                # updating the project cover image
                project_details = await get_project(project)
                await save_project_cover(project_details, asset.id)

        if asset.entity_type == ProjectAssetEnumType.PAGE_DESCRIPTION.value:
            for asset in assets:
                asset.page_id = entity_id
                await sync_to_async(asset.save)(update_fields=["page_id"])

        if asset.entity_type == ProjectAssetEnumType.ISSUE_DESCRIPTION.value:
            for asset in assets:
                asset.issue_id = entity_id
                await sync_to_async(asset.save)(update_fields=["issue_id"])

        if asset.entity_type == ProjectAssetEnumType.DRAFT_ISSUE_DESCRIPTION.value:
            for asset in assets:
                asset.draft_issue_id = entity_id
                await sync_to_async(asset.save)(update_fields=["draft_issue_id"])

        if asset.entity_type == ProjectAssetEnumType.COMMENT_DESCRIPTION.value:
            for asset in assets:
                asset.comment_id = entity_id
                await sync_to_async(asset.save)(update_fields=["comment_id"])

        return True
