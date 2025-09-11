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
    get_intake_work_item_async,
    get_project,
    get_workspace,
    is_project_intakes_enabled_async,
)
from plane.graphql.helpers.project import get_project_member
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.asset import FileAssetEntityType, FileAssetType
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.types.intake.attachment import (
    IntakeWorkItemAttachmentCreateInputType,
    IntakeWorkItemAttachmentPresignedUrlResponseType,
    IntakeWorkItemAttachmentUpdateInputType,
)
from plane.graphql.utils.feature_flag import validate_feature_flag
from plane.graphql.utils.roles import Roles
from plane.settings.storage import S3Storage


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
def get_intake_work_item_attachment(
    workspace_id: str, project_id: str, work_item_id: str, attachment_id: str
):
    try:
        return FileAsset.objects.get(
            workspace_id=workspace_id,
            project_id=project_id,
            issue_id=work_item_id,
            id=attachment_id,
        )
    except FileAsset.DoesNotExist:
        message = "Intake work item attachment not found."
        error_extensions = {
            "code": "INTAKE_WORK_ITEM_ATTACHMENT_NOT_FOUND",
            "statusCode": 400,
        }
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def create_file_asset(
    workspace_id: str,
    project_id: str,
    work_item_id: str,
    attributes: JSON,
    asset_key: str,
    size: int,
    user_id: str,
):
    try:
        file_asset = FileAsset.objects.create(
            workspace_id=workspace_id,
            project_id=project_id,
            issue_id=work_item_id,
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
class IntakeWorkItemAttachmentMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[
                    ProjectPermission([Roles.ADMIN, Roles.MEMBER, Roles.GUEST])
                ]
            )
        ]
    )
    async def create_intake_work_item_attachment(
        self,
        info: Info,
        slug: str,
        project: str,
        intake_work_item: str,
        attachment_input: IntakeWorkItemAttachmentCreateInputType,
    ) -> IntakeWorkItemAttachmentPresignedUrlResponseType:
        user = info.context.user
        user_id = str(user.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        # get the intake work item
        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )
        work_item_id = str(intake_work_item.issue_id)
        work_item_creator_id = str(intake_work_item.created_by_id)

        current_user_role = None
        project_member = await get_project_member(
            workspace_slug=workspace_slug,
            project_id=project_id,
            user_id=user_id,
            raise_exception=False,
        )
        if not project_member:
            project_teamspace_filter = await project_member_filter_via_teamspaces_async(
                user_id=user_id,
                workspace_slug=workspace_slug,
            )
            teamspace_project_ids = project_teamspace_filter.teamspace_project_ids
            if project_id not in teamspace_project_ids:
                message = "You are not allowed to access this project"
                error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
                raise GraphQLError(message, extensions=error_extensions)
            current_user_role = Roles.MEMBER.value
        else:
            current_user_role = project_member.role

        if current_user_role == Roles.GUEST.value:
            if work_item_creator_id != user_id:
                message = "You are not allowed to access this intake work item"
                error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
                raise GraphQLError(message, extensions=error_extensions)

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
            work_item_id=work_item_id,
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
        return IntakeWorkItemAttachmentPresignedUrlResponseType(
            upload_data=presigned_url_data,
            attachment_id=str(attachment["id"]),
            asset_url=attachment["asset_url"],
        )

    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[
                    ProjectPermission([Roles.ADMIN, Roles.MEMBER, Roles.GUEST])
                ]
            )
        ]
    )
    async def update_intake_work_item_attachment(
        self,
        info: Info,
        slug: str,
        project: str,
        intake_work_item: str,
        attachment: str,
        attachment_input: IntakeWorkItemAttachmentUpdateInputType,
    ) -> FileAssetType:
        user = info.context.user
        user_id = str(user.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        # get the intake work item
        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )
        intake_work_item_id = str(intake_work_item.issue_id)
        work_item_creator_id = str(intake_work_item.created_by_id)

        current_user_role = None
        project_member = await get_project_member(
            workspace_slug=workspace_slug,
            project_id=project_id,
            user_id=user_id,
            raise_exception=False,
        )
        if not project_member:
            project_teamspace_filter = await project_member_filter_via_teamspaces_async(
                user_id=user_id,
                workspace_slug=workspace_slug,
            )
            teamspace_project_ids = project_teamspace_filter.teamspace_project_ids
            if project_id not in teamspace_project_ids:
                message = "You are not allowed to access this project"
                error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
                raise GraphQLError(message, extensions=error_extensions)
            current_user_role = Roles.MEMBER.value
        else:
            current_user_role = project_member.role

        if current_user_role == Roles.GUEST.value:
            if work_item_creator_id != user_id:
                message = "You are not allowed to access this intake work item"
                error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
                raise GraphQLError(message, extensions=error_extensions)

        intake_work_item_attachment = await get_intake_work_item_attachment(
            workspace_id=workspace_id,
            project_id=project_id,
            work_item_id=intake_work_item_id,
            attachment_id=attachment,
        )

        if not intake_work_item_attachment.is_uploaded:
            issue_activity.delay(
                type="attachment.activity.created",
                requested_data=None,
                actor_id=str(user_id),
                issue_id=str(intake_work_item_id),
                project_id=str(project_id),
                current_instance=json.dumps({"id": str(attachment)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

            intake_work_item_attachment.is_uploaded = True
            intake_work_item_attachment.created_by_id = user_id

        # get the storage metadata
        if not intake_work_item_attachment.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(attachment))

        # update the file asset attributes
        attributes = attachment_input.attributes or None
        if attributes is not None:
            intake_work_item_attachment.attributes = attributes
        else:
            intake_work_item_attachment.attributes = (
                intake_work_item_attachment.attributes
            )

        # save the file asset
        await sync_to_async(intake_work_item_attachment.save)(
            update_fields=["is_uploaded", "created_by", "attributes"]
        )

        return intake_work_item_attachment

    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def delete_intake_work_item_attachment(
        self,
        info: Info,
        slug: str,
        project: str,
        intake_work_item: str,
        attachment: str,
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        # get the intake work item
        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )
        intake_work_item_id = str(intake_work_item.issue_id)

        intake_work_item_attachment = await get_intake_work_item_attachment(
            workspace_id=workspace_id,
            project_id=project_id,
            work_item_id=intake_work_item_id,
            attachment_id=attachment,
        )

        if not intake_work_item_attachment:
            message = "Attachment not found."
            error_extensions = {"code": "ATTACHMENT_NOT_FOUND", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        intake_work_item_attachment.is_deleted = True
        intake_work_item_attachment.deleted_at = timezone.now()

        # save the file asset
        await sync_to_async(intake_work_item_attachment.save)(
            update_fields=["is_deleted", "deleted_at"]
        )

        issue_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(user_id),
            issue_id=str(intake_work_item_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

        return True
