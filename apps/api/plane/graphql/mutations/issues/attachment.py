# Python imports
import json
import uuid
from typing import Optional

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
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.db.models import FileAsset, Workspace
from plane.graphql.permissions.project import ProjectBasePermission, ProjectPermission
from plane.graphql.types.asset import FileAssetEntityType, FileAssetType
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.types.issues.attachment import (
    IssueAttachmentPresignedUrlResponseType,
)
from plane.graphql.utils.feature_flag import validate_feature_flag
from plane.graphql.utils.roles import Roles
from plane.settings.storage import S3Storage


@sync_to_async
def get_workspace(slug):
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        return None


@sync_to_async
def create_file_asset(
    workspace, project_id, issue_id, attributes, asset_key, size, user_id
) -> FileAssetType:
    return FileAsset.objects.create(
        workspace=workspace,
        project_id=project_id,
        issue_id=issue_id,
        attributes=attributes,
        asset=asset_key,
        size=size,
        created_by_id=user_id,
        entity_type=FileAssetEntityType.ISSUE_ATTACHMENT.value,
    )


@strawberry.type
class IssueAttachmentMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def create_issue_attachment(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        name: str,
        type: str,
        size: int,
    ) -> IssueAttachmentPresignedUrlResponseType:
        user = info.context.user

        # Checking if the file size is within the limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)
        is_feature_flagged = await validate_feature_flag(
            slug=slug,
            user_id=str(user.id),
            feature_key=FeatureFlagsTypesEnum.FILE_SIZE_LIMIT_PRO.value,
        )
        if is_feature_flagged:
            size_limit = min(size, settings.PRO_FILE_SIZE_LIMIT)

        if type not in settings.ATTACHMENT_MIME_TYPES:
            message = "Invalid file type."
            error_extensions = {"code": "INVALID_FILE_TYPE", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # getting the workspace
        workspace = await get_workspace(slug=slug)
        if workspace is None:
            message = "Workspace not found."
            error_extensions = {"code": "WORKSPACE_NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # creating a file asset
        attachment = await create_file_asset(
            workspace=workspace,
            project_id=project,
            issue_id=issue,
            attributes={"name": name, "type": type, "size": size_limit},
            asset_key=asset_key,
            size=size_limit,
            user_id=user.id,
        )

        # Get the presigned URL
        storage = S3Storage(request=info.context["request"])

        # Generate a presigned URL to share an S3 object
        presigned_url_data = await sync_to_async(storage.generate_presigned_post)(
            object_name=asset_key, file_type=type, file_size=size_limit
        )

        # Return the presigned URL
        return IssueAttachmentPresignedUrlResponseType(
            upload_data=presigned_url_data,
            attachment_id=str(attachment.id),
            asset_url=attachment.asset_url,
        )

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def update_issue_attachment(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        attachment: strawberry.ID,
        attributes: Optional[JSON] = None,
    ) -> FileAssetType:
        user = info.context.user
        issue_attachment = await sync_to_async(FileAsset.objects.get)(
            workspace__slug=slug,
            project_id=project,
            entity_type=FileAssetEntityType.ISSUE_ATTACHMENT.value,
            issue=issue,
            id=attachment,
        )

        if not issue_attachment.is_uploaded:
            issue_activity.delay(
                type="attachment.activity.created",
                requested_data=None,
                actor_id=str(info.context.user.id),
                issue_id=str(issue),
                project_id=str(project),
                current_instance=json.dumps({"id": str(attachment)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

            issue_attachment.is_uploaded = True
            issue_attachment.created_by = user

        # get the storage metadata
        if not issue_attachment.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(attachment))

        # update the file asset attributes
        if attributes is not None:
            issue_attachment.attributes = attributes
        else:
            issue_attachment.attributes = issue_attachment.attributes

        # save the file asset
        await sync_to_async(issue_attachment.save)(
            update_fields=["is_uploaded", "created_by", "attributes"]
        )

        return issue_attachment

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def delete_issue_attachment(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        attachment: strawberry.ID,
    ) -> bool:
        issue_attachment = await sync_to_async(FileAsset.objects.get)(
            workspace__slug=slug,
            project_id=project,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            issue=issue,
            id=attachment,
        )

        if not issue_attachment:
            message = "Attachment not found."
            error_extensions = {"code": "ATTACHMENT_NOT_FOUND", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        issue_attachment.is_deleted = True
        issue_attachment.deleted_at = timezone.now()

        # save the file asset
        await sync_to_async(issue_attachment.save)(
            update_fields=["is_deleted", "deleted_at"]
        )

        issue_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(info.context.user.id),
            issue_id=str(issue),
            project_id=str(project),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return True
