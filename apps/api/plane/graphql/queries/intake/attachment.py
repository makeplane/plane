# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension

# Strawberry Imports
from strawberry.types import Info

# Module Imports
from plane.db.models import FileAsset
from plane.graphql.helpers import (
    get_project,
    get_intake_work_item_async,
    get_workspace,
    is_project_intakes_enabled_async,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.asset import FileAssetType


def intake_work_item_attachment_base_query(
    workspace_id: str,
    project_id: str,
    intake_work_item_id: str,
    user_id: str,
    workspace_slug: str,
):
    project_teamspace_filter = project_member_filter_via_teamspaces(
        user_id=user_id,
        workspace_slug=workspace_slug,
    )
    return (
        FileAsset.objects.filter(workspace_id=workspace_id)
        .filter(project_id=project_id)
        .filter(issue_id=intake_work_item_id)
        .filter(entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT)
        .filter(is_uploaded=True)
        .filter(project_teamspace_filter.query)
        .distinct()
    )


@sync_to_async
def get_intake_work_item_attachments(
    workspace_id: str,
    project_id: str,
    intake_work_item_id: str,
    user_id: str,
    workspace_slug: str,
):
    base_query = intake_work_item_attachment_base_query(
        workspace_id=workspace_id,
        project_id=project_id,
        intake_work_item_id=intake_work_item_id,
        user_id=user_id,
        workspace_slug=workspace_slug,
    )

    base_query.order_by("-created_at")

    return list(base_query)


@sync_to_async
def get_intake_work_item_attachment(
    workspace_id: str,
    workspace_slug: str,
    project_id: str,
    intake_work_item_id: str,
    user_id: str,
    attachment_id: str,
):
    base_query = intake_work_item_attachment_base_query(
        workspace_id=workspace_id,
        project_id=project_id,
        intake_work_item_id=intake_work_item_id,
        user_id=user_id,
        workspace_slug=workspace_slug,
    )

    try:
        base_query = base_query.get(id=attachment_id)
    except FileAsset.DoesNotExist:
        message = "Intake work item attachment not found"
        error_extensions = {
            "code": "INTAKE_WORK_ITEM_ATTACHMENT_NOT_FOUND",
            "statusCode": 404,
        }
        raise GraphQLError(message, extensions=error_extensions)

    return base_query


@strawberry.type
class IntakeWorkItemAttachmentQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def intake_work_item_attachments(
        self, info: Info, slug: str, project: str, intake_work_item: str
    ) -> list[FileAssetType]:
        user = info.context.user
        user_id = str(user.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        # get the project
        project_details = await get_project(
            workspace_slug=workspace_slug, project_id=project
        )
        project_id = str(project_details.id)

        # get the intake work item
        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )
        intake_work_item_id = str(intake_work_item.issue_id)

        issue_attachments = await get_intake_work_item_attachments(
            workspace_id=workspace_id,
            project_id=project_id,
            intake_work_item_id=intake_work_item_id,
            user_id=user_id,
            workspace_slug=workspace_slug,
        )

        return issue_attachments

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def intake_work_item_attachment(
        self,
        info: Info,
        slug: str,
        project: str,
        intake_work_item: str,
        attachment: str,
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
        project_details = await get_project(
            workspace_slug=workspace_slug, project_id=project
        )
        project_id = str(project_details.id)

        # get the intake work item
        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )
        intake_work_item_id = str(intake_work_item.issue_id)

        issue_attachment = await get_intake_work_item_attachment(
            workspace_id=workspace_id,
            project_id=project,
            intake_work_item_id=intake_work_item_id,
            user_id=user_id,
            attachment_id=attachment,
            workspace_slug=workspace_slug,
        )

        return issue_attachment
