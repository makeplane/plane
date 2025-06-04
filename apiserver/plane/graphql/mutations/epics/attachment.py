# Python imports
import json
import uuid

# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django imports
from django.conf import settings
from django.utils import timezone

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.db.models import FileAsset
from plane.graphql.helpers import (
    get_project,
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
)
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.asset import FileAssetEntityType, FileAssetType
from plane.graphql.types.epics.attachment import (
    EpicAttachmentCreateInputType,
    EpicAttachmentPresignedUrlResponseType,
    EpicAttachmentUpdateInputType,
)
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.utils.feature_flag import validate_feature_flag
from plane.graphql.utils.roles import Roles
from plane.settings.storage import S3Storage


def epic_attachment_base_query(
    workspace_id: str, project_id: str, epic_id: str, user_id: str
):
    return (
        FileAsset.objects.filter(workspace_id=workspace_id)
        .filter(project_id=project_id)
        .filter(issue_id=epic_id)
        .filter(entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT)
        .filter(is_uploaded=True)
        .filter(
            project__project_projectmember__member_id=user_id,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )
    )


@sync_to_async
def get_file_size_limit(user_id: str, workspace_slug: str, size: int) -> int:
    try:
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        is_feature_flagged = validate_feature_flag(
            user_id=user_id,
            slug=workspace_slug,
            feature_key=FeatureFlagsTypesEnum.FILE_SIZE_LIMIT_PRO.value,
            default_value=False,
        )

        if is_feature_flagged:
            size_limit = min(size, settings.PRO_FILE_SIZE_LIMIT)

        return size_limit
    except Exception:
        message = "File size limit not found."
        error_extensions = {"code": "FILE_SIZE_LIMIT_NOT_FOUND", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_epic_attachment(
    workspace_id: str, project_id: str, epic_id: str, attachment_id: str
):
    try:
        return FileAsset.objects.get(
            workspace_id=workspace_id,
            project_id=project_id,
            issue_id=epic_id,
            id=attachment_id,
        )
    except FileAsset.DoesNotExist:
        message = "Epic attachment not found."
        error_extensions = {"code": "EPIC_ATTACHMENT_NOT_FOUND", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def create_file_asset(
    workspace_id: str,
    project_id: str,
    epic_id: str,
    attributes: JSON,
    asset_key: str,
    size: int,
    user_id: str,
):
    try:
        file_asset = FileAsset.objects.create(
            workspace_id=workspace_id,
            project_id=project_id,
            issue_id=epic_id,
            attributes=attributes,
            asset=asset_key,
            size=size,
            created_by_id=user_id,
            entity_type=FileAssetEntityType.ISSUE_ATTACHMENT.value,
        )

        return {"id": file_asset.id, "asset_url": file_asset.asset_url}
    except Exception:
        message = "File asset not created."
        error_extensions = {"code": "FILE_ASSET_NOT_CREATED", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class EpicAttachmentMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def create_epic_attachment(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        attachment_input: EpicAttachmentCreateInputType,
    ) -> EpicAttachmentPresignedUrlResponseType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        size = attachment_input.size or None
        name = attachment_input.name or None
        type = attachment_input.type or None

        if not size or not name or not type:
            message = "Invalid attachment input."
            error_extensions = {"code": "INVALID_ATTACHMENT_INPUT", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # Checking if the file size is within the limit
        size_limit = await get_file_size_limit(
            user_id=user_id, workspace_slug=slug, size=size
        )

        if type not in settings.ATTACHMENT_MIME_TYPES:
            message = "Invalid file type."
            error_extensions = {"code": "INVALID_FILE_TYPE", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # asset key
        asset_key = f"{workspace_id}/{uuid.uuid4().hex}-{name}"

        # creating a file asset
        attachment = await create_file_asset(
            workspace_id=workspace_id,
            project_id=project_id,
            epic_id=epic,
            attributes={"name": name, "type": type, "size": size_limit},
            asset_key=asset_key,
            size=size_limit,
            user_id=user_id,
        )

        # Get the presigned URL
        storage = S3Storage(request=info.context["request"])

        # Generate a presigned URL to share an S3 object
        presigned_url_data = await sync_to_async(storage.generate_presigned_post)(
            object_name=asset_key, file_type=type, file_size=size_limit
        )

        # Return the presigned URL
        return EpicAttachmentPresignedUrlResponseType(
            upload_data=presigned_url_data,
            attachment_id=str(attachment["id"]),
            asset_url=attachment["asset_url"],
        )

    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def update_epic_attachment(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        attachment: str,
        attachment_input: EpicAttachmentUpdateInputType,
    ) -> FileAssetType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_id = str(workspace.id)

        epic_attachment = await get_epic_attachment(
            workspace_id=workspace_id,
            project_id=project,
            epic_id=epic,
            attachment_id=attachment,
        )

        if not epic_attachment.is_uploaded:
            issue_activity.delay(
                type="attachment.activity.created",
                requested_data=None,
                actor_id=str(info.context.user.id),
                issue_id=str(epic),
                project_id=str(project),
                current_instance=json.dumps({"id": str(attachment)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

            epic_attachment.is_uploaded = True
            epic_attachment.created_by = user

        # get the storage metadata
        if not epic_attachment.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(attachment))

        # update the file asset attributes
        attributes = attachment_input.attributes or None
        if attributes is not None:
            epic_attachment.attributes = attributes
        else:
            epic_attachment.attributes = epic_attachment.attributes

        # save the file asset
        await sync_to_async(epic_attachment.save)(
            update_fields=["is_uploaded", "created_by", "attributes"]
        )

        return epic_attachment

    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def delete_epic_attachment(
        self, info: Info, slug: str, project: str, epic: str, attachment: str
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_id = str(workspace.id)

        epic_attachment = await get_epic_attachment(
            workspace_id=workspace_id,
            project_id=project,
            epic_id=epic,
            attachment_id=attachment,
        )

        if not epic_attachment:
            message = "Attachment not found."
            error_extensions = {"code": "ATTACHMENT_NOT_FOUND", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        epic_attachment.is_deleted = True
        epic_attachment.deleted_at = timezone.now()

        # save the file asset
        await sync_to_async(epic_attachment.save)(
            update_fields=["is_deleted", "deleted_at"]
        )

        issue_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(info.context.user.id),
            issue_id=str(epic),
            project_id=str(project),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return True
